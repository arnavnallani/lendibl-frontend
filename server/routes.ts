import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertItemSchema, insertBookingSchema, insertUserSchema, insertUserInteractionSchema } from "@shared/schema";
import { hashPassword, comparePassword, generateToken, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { recommendationEngine } from "./recommendation-engine";
import { z } from "zod";

// WebSocket connection management
const connectedClients = new Map<number, WebSocket[]>();

function addClientConnection(userId: number, ws: WebSocket) {
  if (!connectedClients.has(userId)) {
    connectedClients.set(userId, []);
  }
  connectedClients.get(userId)!.push(ws);
}

function removeClientConnection(userId: number, ws: WebSocket) {
  const clients = connectedClients.get(userId);
  if (clients) {
    const index = clients.indexOf(ws);
    if (index > -1) {
      clients.splice(index, 1);
    }
    if (clients.length === 0) {
      connectedClients.delete(userId);
    }
  }
}

function notifyUser(userId: number, notification: any) {
  const clients = connectedClients.get(userId);
  if (clients) {
    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(notification));
      }
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    // Since we're using JWT tokens, logout is handled client-side
    res.json({ message: "Logout successful" });
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Items
  app.get("/api/items", async (req, res) => {
    try {
      const { categoryId, search, minPrice, maxPrice, location } = req.query;
      
      const filters: any = {};
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (search) filters.search = search as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (location) filters.location = location as string;

      const items = await storage.getItems(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Track view interaction for recommendations
      if (req.user) {
        await recommendationEngine.trackInteraction(req.user.id, id, "view", 1.0);
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertItemSchema.parse({
        ...req.body,
        ownerId: req.user!.id, // Set owner to authenticated user
      });
      const item = await storage.createItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user owns the item
      const existingItem = await storage.getItem(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (existingItem.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this item" });
      }

      const updates = req.body;
      const item = await storage.updateItem(id, updates);

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user owns the item
      const existingItem = await storage.getItem(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (existingItem.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this item" });
      }

      const deleted = await storage.deleteItem(id);

      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const { userId } = req.query;
      const bookings = await storage.getBookings(userId ? parseInt(userId as string) : undefined);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertBookingSchema.parse({
        ...req.body,
        renterId: req.user!.id, // Set renter to authenticated user
      });
      const booking = await storage.createBooking(validatedData);
      
      // Track rental interaction for recommendations
      await recommendationEngine.trackInteraction(req.user!.id, validatedData.itemId, "rent", 3.0);
      
      // Get the item details to notify the owner
      const item = await storage.getItem(validatedData.itemId);
      if (item) {
        // Update user preferences based on rental
        await recommendationEngine.updateUserPreferences(
          req.user!.id,
          item.categoryId,
          { min: parseFloat(item.price) * 0.8, max: parseFloat(item.price) * 1.5 },
          item.location
        );
        
        // Send real-time notification to item owner
        const notification = {
          type: "booking_request",
          id: Date.now(),
          title: "New Rental Request",
          message: `${req.user!.firstName} wants to rent your ${item.title}`,
          itemId: item.id,
          bookingId: booking.id,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        notifyUser(item.ownerId, notification);
      }
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Recommendation endpoints
  app.get("/api/recommendations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const recommendations = await recommendationEngine.getRecommendations(req.user!.id, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  app.post("/api/interactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { itemId, interactionType, weight } = req.body;
      await recommendationEngine.trackInteraction(req.user!.id, itemId, interactionType, weight || 1.0);
      res.json({ message: "Interaction tracked" });
    } catch (error) {
      console.error("Error tracking interaction:", error);
      res.status(500).json({ message: "Failed to track interaction" });
    }
  });

  app.get("/api/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user!.id);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error getting preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  app.put("/api/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { categoryId, priceRange, location } = req.body;
      await recommendationEngine.updateUserPreferences(req.user!.id, categoryId, priceRange, location);
      res.json({ message: "Preferences updated" });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const booking = await storage.updateBooking(id, updates);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const { itemId, userId } = req.query;
      const reviews = await storage.getReviews(
        itemId ? parseInt(itemId as string) : undefined,
        userId ? parseInt(userId as string) : undefined
      );
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          // Associate this connection with a user
          addClientConnection(data.userId, ws);
          ws.send(JSON.stringify({ 
            type: 'auth_success', 
            message: 'Connected to notifications' 
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection from all users when closed
      connectedClients.forEach((clients, userId) => {
        removeClientConnection(userId, ws);
      });
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
