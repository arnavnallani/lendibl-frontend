import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertItemSchema, insertBookingSchema, insertUserSchema, insertUserInteractionSchema } from "@shared/schema";
import { hashPassword, comparePassword, generateToken, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { recommendationEngine } from "./recommendation-engine";
import { paymentScheduler } from "./payment-scheduler";
import { paymentReminderService } from "./payment-reminder-service";
import { aiPricingService } from "./ai-pricing-service-clean";
import { getChatbotResponse } from "./chatbot-service";
import { notificationService } from "./notification-service";
import { reviewPromptService } from "./review-prompt-service";
import { aiSearchService } from "./ai-search-service";
import { db } from "./db";
import { users } from "@shared/schema";

// Helper function for smart search completions
function generateSmartCompletions(query: string, items: any[]): any[] {
  const suggestions: any[] = [];
  
  // Price range suggestions
  if (query.includes('under') || query.includes('cheap') || query.includes('budget')) {
    suggestions.push({
      type: 'filter',
      text: `${query} under $50`,
      subtitle: 'Price filter'
    });
  }
  
  // Time-based suggestions
  if (query.includes('weekend') || query.includes('daily') || query.includes('weekly')) {
    suggestions.push({
      type: 'filter',
      text: `${query} rentals`,
      subtitle: 'Duration filter'
    });
  }
  
  // Popular combinations
  const popularTerms = ['power tools', 'camping gear', 'party supplies', 'exercise equipment'];
  const matchingTerms = popularTerms.filter(term => 
    term.toLowerCase().includes(query) || query.includes(term.split(' ')[0])
  );
  
  matchingTerms.forEach(term => {
    const count = items.filter(item => 
      item.title.toLowerCase().includes(term.toLowerCase()) ||
      item.description?.toLowerCase().includes(term.toLowerCase())
    ).length;
    
    if (count > 0) {
      suggestions.push({
        type: 'category',
        text: term.charAt(0).toUpperCase() + term.slice(1),
        subtitle: `${count} items available`,
        count
      });
    }
  });
  
  return suggestions.slice(0, 3);
}
import { stripeService } from "./stripe-service";
import { paypalService } from "./paypal-service";
import { z } from "zod";

// Initialize Stripe (will be null if no secret key is provided)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

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

  app.put("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { firstName, lastName, phone } = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, {
        firstName,
        lastName,
        phone,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Fetch fresh user data from database to get current rating
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // Since we're using JWT tokens, logout is handled client-side
    res.json({ message: "Logout successful" });
  });

  // AI-powered search endpoint
  app.get("/api/ai-search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const allItems = await storage.getItems();
      const aiResults = await aiSearchService.enhancedSearch(q, allItems);
      
      res.json(aiResults);
    } catch (error) {
      console.error('AI search error:', error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Enhanced search suggestions endpoint with AI integration
  app.get("/api/search-suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const query = q.toLowerCase().trim();
      const suggestions: any[] = [];

      // Get all items for search matching
      const allItems = await storage.getItems();
      const categories = await storage.getCategories();

      // Use AI to analyze the query for better suggestions
      let aiAnalysis = null;
      try {
        aiAnalysis = await aiSearchService.analyzeSearchQuery(query);
      } catch (error) {
        console.log('AI analysis failed, using fallback');
      }

      // AI-enhanced item matches
      if (aiAnalysis) {
        const aiMatches = await aiSearchService.scoreItemRelevance(allItems, aiAnalysis);
        const topAiMatches = aiMatches.slice(0, 3).map(match => ({
          type: 'item',
          text: match.title,
          subtitle: `AI match: ${match.reason}`,
          count: 1,
          aiScore: match.score
        }));
        suggestions.push(...topAiMatches);
      }

      // Traditional exact matches as fallback
      const exactMatches = allItems
        .filter(item => item.title.toLowerCase().includes(query))
        .filter(item => !suggestions.some(s => s.text === item.title)) // Avoid duplicates
        .slice(0, 2)
        .map(item => ({
          type: 'item',
          text: item.title,
          subtitle: `$${item.price}/day`,
          count: 1
        }));

      suggestions.push(...exactMatches);

      // Category matches
      const categoryMatches = categories
        .filter(cat => cat.name.toLowerCase().includes(query))
        .slice(0, 2)
        .map(cat => {
          const itemCount = allItems.filter(item => item.categoryId === cat.id).length;
          return {
            type: 'category',
            text: cat.name,
            subtitle: `${itemCount} items available`,
            count: itemCount
          };
        });

      suggestions.push(...categoryMatches);

      // Location-based suggestions
      if (query.length >= 2) {
        const locations = [...new Set(allItems.map(item => item.location).filter(Boolean))];
        const locationMatches = locations
          .filter(loc => loc?.toLowerCase().includes(query))
          .slice(0, 2)
          .map(loc => ({
            type: 'location',
            text: `Items in ${loc}`,
            subtitle: 'Search by location'
          }));

        suggestions.push(...locationMatches);
      }

      // Smart search completions
      const smartSuggestions = generateSmartCompletions(query, allItems);
      suggestions.push(...smartSuggestions);

      res.json(suggestions.slice(0, 8));
    } catch (error) {
      console.error('Search suggestions error:', error);
      res.status(500).json([]);
    }
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
      // Process availability dates if provided
      const processedData = { ...req.body };
      if (processedData.availableFrom) {
        processedData.availableFrom = new Date(processedData.availableFrom);
      }
      if (processedData.availableTo) {
        processedData.availableTo = new Date(processedData.availableTo);
      }
      
      const validatedData = insertItemSchema.parse({
        ...processedData,
        ownerId: req.user!.id, // Set owner to authenticated user
      });
      const item = await storage.createItem(validatedData);
      
      // Create a success notification for the user
      await notificationService.createNotification({
        userId: req.user!.id,
        type: 'listing_published',
        title: 'Listing Published Successfully!',
        message: `Your ${item.title} listing is now live and available for rent.`,
        actionUrl: `/items/${item.id}`,
        relatedId: item.id
      });
      
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

      // Check if item has active bookings (pending, approved, or in progress)
      const bookings = await storage.getBookings();
      const activeBookings = bookings.filter(booking => 
        booking.itemId === id && 
        ['pending', 'approved', 'in_progress'].includes(booking.status)
      );
      
      if (activeBookings.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete item with active bookings. Please cancel or complete all active bookings first." 
        });
      }

      const deleted = await storage.deleteItem(id);
      
      if (!deleted) {
        return res.status(400).json({ message: "Failed to delete item" });
      }

      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error('Delete item error:', error);
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
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
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
        
        // Send notification to item owner
        await notificationService.notifyBookingRequest(
          item.ownerId,
          `${req.user!.firstName} ${req.user!.lastName}`,
          item.title,
          booking.id
        );
      }
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Booking validation error:', error.errors);
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error('Booking creation error:', error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      // Get the booking to check ownership
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check authorization - owner can approve/decline, renter can cancel
      const isOwner = booking.item.ownerId === req.user!.id;
      const isRenter = booking.renterId === req.user!.id;
      
      if (!isOwner && !isRenter) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }
      
      // Validate status transitions
      if (isRenter && status !== 'cancelled') {
        return res.status(400).json({ message: "Renters can only cancel bookings" });
      }
      
      if (isOwner && !['approved', 'declined', 'in_progress', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status transition for owner" });
      }
      
      // Don't allow changes to already processed bookings (except for owner workflow)
      if (isRenter && booking.status !== 'pending') {
        return res.status(400).json({ message: "Cannot modify booking that is no longer pending" });
      }
      
      if (isOwner && !['pending', 'approved', 'in_progress'].includes(booking.status)) {
        return res.status(400).json({ message: "Cannot modify completed or cancelled booking" });
      }
      
      const updatedBooking = await storage.updateBooking(id, { status });
      
      // Handle payment based on status
      if (updatedBooking && status === 'approved') {
        // Check payment setup before approval
        const canApprove = await paymentReminderService.checkPaymentSetupForApproval(req.user!.id, id);
        if (!canApprove) {
          return res.status(400).json({ 
            message: "Payment setup required",
            requiresPaymentSetup: true,
            pendingAmount: booking.ownerPayout
          });
        }
        
        // Payment already captured, just schedule payout
        await paymentScheduler.scheduleOwnerPayout(id);
      } else if (updatedBooking && (status === 'declined' || status === 'cancelled')) {
        // Process refund for declined or cancelled bookings
        const reason = status === 'cancelled' ? 'cancelled' : 'cancelled';
        await paymentScheduler.processRefund(id, reason);
      } else if (updatedBooking && status === 'completed') {
        // Process owner payout when rental is completed
        await paymentScheduler.processOwnerPayout(id);
      }
      
      // Send appropriate notifications
      if (updatedBooking) {
        if (status === 'approved') {
          await notificationService.notifyBookingApproved(
            booking.renterId,
            booking.item.title,
            booking.id
          );
        } else if (status === 'declined') {
          await notificationService.notifyBookingDeclined(
            booking.renterId,
            booking.item.title,
            booking.id
          );
        } else if (status === 'in_progress') {
          await notificationService.notifyRentalStarted(
            booking.renterId,
            booking.item.ownerId,
            booking.item.title,
            booking.id
          );
        } else if (status === 'completed') {
          await notificationService.notifyRentalEnded(
            booking.renterId,
            booking.item.ownerId,
            booking.item.title,
            booking.id
          );
        }
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error('Failed to update booking:', error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", authenticateToken, async (req: AuthRequest, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not available" });
    }

    try {
      const { amount } = req.body;
      console.log('Creating payment intent for amount:', amount);
      
      // Validate amount
      if (!amount || amount < 50) { // Minimum $0.50 USD
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Amount in cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        capture_method: 'automatic', // Capture payment immediately to Lendibl's account
        metadata: {
          userId: req.user!.id.toString(),
          userEmail: req.user!.email,
        },
      });
      
      console.log('Payment intent created successfully:', paymentIntent.id);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Confirm payment and create booking
  app.post("/api/confirm-payment", authenticateToken, async (req: AuthRequest, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not available" });
    }

    try {
      const { paymentIntentId, bookingData } = req.body;
      
      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }
      
      // Create booking with payment confirmation
      const validatedData = insertBookingSchema.parse({
        ...bookingData,
        renterId: req.user!.id,
        paymentConfirmed: true,
        paymentIntentId: paymentIntentId,
        paymentCaptured: true, // Payment is automatically captured to Lendibl's account
      });
      
      const booking = await storage.createBooking(validatedData);
      
      // Track rental interaction for recommendations
      await recommendationEngine.trackInteraction(req.user!.id, booking.itemId, "rental", 5.0);
      
      // Send notification to item owner
      const item = await storage.getItem(booking.itemId);
      if (item) {
        const notification = {
          type: "booking_request",
          id: Date.now(),
          title: "New Paid Rental Request",
          message: `${req.user!.firstName} has paid $${booking.totalPrice} and wants to rent your ${item.title}. Payment received and ready for approval.`,
          itemId: item.id,
          bookingId: booking.id,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        notifyUser(item.ownerId, notification);
      }
      
      res.status(201).json(booking);
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      res.status(500).json({ message: "Failed to confirm payment and create booking" });
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

  // Rental Messages routes
  app.post("/api/rental-messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookingId, message } = req.body;
      
      // Get booking to determine receiver
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Determine if user is owner or renter
      const isOwner = booking.item.ownerId === req.user!.id;
      const isRenter = booking.renterId === req.user!.id;
      
      if (!isOwner && !isRenter) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const receiverId = isOwner ? booking.renterId : booking.item.ownerId;
      
      const rentalMessage = await storage.createRentalMessage({
        bookingId,
        senderId: req.user!.id,
        receiverId,
        message
      });
      
      // Send notification to receiver
      const notification = {
        type: "rental_message",
        id: Date.now(),
        title: "New Message",
        message: `You have a new message about ${booking.item.title}`,
        itemId: booking.item.id,
        bookingId: booking.id,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      notifyUser(receiverId, notification);
      
      res.json(rentalMessage);
    } catch (error) {
      console.error('Failed to send rental message:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/rental-messages/:bookingId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      // Verify user has access to this booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const isOwner = booking.item.ownerId === req.user!.id;
      const isRenter = booking.renterId === req.user!.id;
      
      if (!isOwner && !isRenter) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const messages = await storage.getRentalMessages(bookingId);
      res.json(messages);
    } catch (error) {
      console.error('Failed to get rental messages:', error);
      res.status(500).json({ message: "Failed to get messages" });
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

  // Payment setup endpoint with Stripe Elements integration
  app.post("/api/setup-payment-with-stripe", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { paymentMethodId, cardholderName } = req.body;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!stripe) {
        return res.status(400).json({ message: "Payment processing not configured" });
      }

      // Step 1: Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: userId.toString()
          }
        });
        customerId = customer.id;
      }

      // Step 2: Create real Stripe Connect account for payouts if user has items
      let stripeAccountId = user.stripeAccountId;
      const userItems = await storage.getItems({ ownerId: userId });
      
      if (userItems.length > 0 && !stripeAccountId) {
        console.log(`Creating real Stripe Connect account for user ${userId}`);
        stripeAccountId = await stripeService.createConnectedAccount(
          userId, 
          user.email, 
          user.firstName, 
          user.lastName
        );
        
        if (!stripeAccountId) {
          console.error('Failed to create Stripe Connect account');
          return res.status(500).json({ message: "Failed to create payout account" });
        }
        
        console.log(`Created Stripe Connect account: ${stripeAccountId}`);
      }

      // Step 3: Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Step 4: Set as default payment method for the customer
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Step 5: Update user with Stripe information
      const updateData: any = {
        stripeCustomerId: customerId,
        stripePaymentMethodId: paymentMethodId,
        paymentSetupComplete: true,
      };
      
      if (stripeAccountId) {
        updateData.stripeAccountId = stripeAccountId;
      }
      
      await storage.updateUser(userId, updateData);

      // Step 6: Resolve any pending payment reminders
      await paymentReminderService.resolvePaymentReminders(userId);

      const response: any = {
        message: "Payment method setup successful",
        requiresAction: false
      };
      
      // If a Connect account was created, provide onboarding link
      if (stripeAccountId && userItems.length > 0) {
        const onboardingLink = await stripeService.createAccountOnboardingLink(stripeAccountId, userId);
        if (onboardingLink) {
          response.onboardingUrl = onboardingLink;
          response.message = "Payment method setup successful. Complete payout setup to receive earnings.";
        }
      }
      
      res.json(response);
    } catch (error: any) {
      console.error("Payment setup error:", error);
      
      // Handle specific Stripe errors
      if (error.type === 'StripeCardError') {
        return res.status(400).json({ 
          message: "Invalid card details: " + error.message 
        });
      } else if (error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          message: "Invalid request: " + error.message 
        });
      }
      
      res.status(500).json({ message: "Failed to setup payment method" });
    }
  });

  // Update payment method endpoint
  app.put("/api/payment-method", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { paymentMethodId, cardholderName } = req.body;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: "User or Stripe customer not found" });
      }

      // Attach new payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      });

      // Detach old payment method if it exists
      if (user.stripePaymentMethodId) {
        try {
          await stripe.paymentMethods.detach(user.stripePaymentMethodId);
        } catch (error) {
          console.warn('Could not detach old payment method:', error);
        }
      }

      // Set as default
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update user record
      await storage.updateUser(userId, {
        stripePaymentMethodId: paymentMethodId,
      });
      
      res.json({ 
        success: true, 
        message: "Payment method updated successfully",
        paymentMethodId: paymentMethodId
      });
    } catch (error: any) {
      console.error("Payment method update error:", error);
      
      if (error.type === 'StripeCardError') {
        return res.status(400).json({ 
          message: "Invalid card details: " + error.message 
        });
      }
      
      res.status(500).json({ message: "Failed to update payment method" });
    }
  });

  // Remove payment method endpoint
  app.delete("/api/payment-method", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      await stripeService.removePaymentMethod(userId);
      
      res.json({ 
        success: true, 
        message: "Payment method removed successfully"
      });
    } catch (error: any) {
      console.error("Payment method removal error:", error);
      res.status(500).json({ message: "Failed to remove payment method" });
    }
  });

  // Get payment method info
  app.get("/api/payment-method", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId || !user.stripePaymentMethodId) {
        return res.json({ hasPaymentMethod: false });
      }

      const paymentMethods = await stripeService.getCustomerPaymentMethods(user.stripeCustomerId);
      const currentMethod = paymentMethods.find(pm => pm.id === user.stripePaymentMethodId);
      
      if (!currentMethod) {
        return res.json({ hasPaymentMethod: false });
      }

      // Return safe card info (last 4 digits, brand, etc.)
      res.json({
        hasPaymentMethod: true,
        card: {
          brand: currentMethod.card?.brand,
          last4: currentMethod.card?.last4,
          expMonth: currentMethod.card?.exp_month,
          expYear: currentMethod.card?.exp_year,
        }
      });
    } catch (error: any) {
      console.error("Error fetching payment method:", error);
      res.status(500).json({ message: "Failed to fetch payment method" });
    }
  });

  // Check if user needs payment setup


  app.get("/api/payment-setup-status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      const userItems = await storage.getItems({ ownerId: userId });

      const needsPaymentSetup = userItems.length > 0 && !user?.paymentSetupComplete;
      
      const paymentReminders = await storage.getPaymentReminders(userId);
      
      // Check payment methods status
      let stripeStatus = null;
      let hasValidSetup = false;
      
      if (user?.stripeAccountId) {
        stripeStatus = await stripeService.checkAccountStatus(user.stripeAccountId);
        hasValidSetup = stripeStatus?.payoutsEnabled || false;
        
        // Update user's payment setup status
        if (hasValidSetup && !user.paymentSetupComplete) {
          await storage.updateUser(userId, { paymentSetupComplete: true });
        }
      }

      res.json({
        hasPaymentMethod: hasValidSetup,
        hasItems: userItems.length > 0,
        paymentSetupComplete: user?.paymentSetupComplete || false,
        pendingEarnings: user?.pendingEarnings || "0",
        paymentReminders: paymentReminders,
        stripeAccountStatus: stripeStatus,
        onboardingUrl: user?.stripeAccountId && stripeStatus && !stripeStatus.payoutsEnabled ? 
          await stripeService.createAccountOnboardingLink(user.stripeAccountId, userId) : null,
        needsPaymentMethod: userItems.length > 0 && !hasValidSetup
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check payment setup status" });
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

  // Test endpoint for payout functionality  
  app.post("/api/test-payout/:bookingId", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      console.log(`\n=== Testing payout for booking ${bookingId} ===`);
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      
      console.log(`Booking status: ${booking.status}, Total: $${booking.totalPrice}`);
      
      const result = await paymentScheduler.processOwnerPayout(bookingId);
      console.log(`Payout result: ${result}`);
      
      const updatedBooking = await storage.getBooking(bookingId);
      console.log(`Updated booking - Completed: ${updatedBooking.payoutCompleted}, Blocked: ${updatedBooking.payoutBlocked}`);
      
      res.json({ 
        success: result, 
        message: result ? 'Payout completed successfully' : 'Payout failed or blocked',
        bookingId,
        payoutCompleted: updatedBooking.payoutCompleted,
        payoutBlocked: updatedBooking.payoutBlocked,
        transferId: updatedBooking.stripeTransferId
      });
    } catch (error: any) {
      console.error('Payout test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Payout test failed', 
        error: error.message 
      });
    }
  });

  // PayPal connection endpoints
  app.post("/api/connect-paypal", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { paypalEmail } = req.body;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If PayPal email is provided, save it and create Stripe Connect account
      if (paypalEmail) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(paypalEmail)) {
          return res.status(400).json({ message: "Please enter a valid PayPal email address" });
        }

        // Update user with PayPal email - ready for manual payouts
        await storage.updateUser(userId, {
          paypalEmail: paypalEmail,
          paypalAccountId: paypalEmail, // Use email as ID for simplicity
          paymentSetupComplete: true // PayPal users ready for manual payouts
        });

        console.log(`PayPal email saved for user ${userId}: ${paypalEmail}`);
        
        // Clear any payment setup reminders
        await paymentReminderService.resolvePaymentReminders(userId);
        
        res.json({
          success: true,
          paypalEmail: paypalEmail,
          message: "PayPal account connected successfully - ready for payouts"
        });
      } else {
        // Return indication that we need email input
        res.json({
          success: true,
          requiresEmail: true,
          message: "Please provide your PayPal email address"
        });
      }

    } catch (error: any) {
      console.error('PayPal connection error:', error);
      res.status(500).json({ 
        message: "Failed to connect PayPal account", 
        error: error.message 
      });
    }
  });

  app.get("/paypal-callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const userId = parseInt(state as string);

      if (!code || !userId) {
        return res.redirect('/settings?paypal=error');
      }

      const success = await paypalService.verifyConnection(code as string, userId);
      
      if (success) {
        res.redirect('/settings?paypal=success');
      } else {
        res.redirect('/settings?paypal=error');
      }
    } catch (error) {
      console.error('PayPal callback error:', error);
      res.redirect('/settings?paypal=error');
    }
  });

  // Create Connect account for owner
  // PayPal Payouts verification endpoint
  app.post("/api/verify-payouts", async (req, res) => {
    try {
      console.log('Testing PayPal Payouts capability...');
      
      const testResult = await paypalService.sendPayout(
        'test@example.com',
        0.01,
        'PayPal Payouts verification test',
        { bookingId: 'verification' }
      );
      
      if (testResult.success) {
        console.log('PayPal Payouts ENABLED and working!');
        res.json({
          enabled: true,
          message: 'PayPal Payouts is enabled and working',
          batchId: testResult.payoutId
        });
      } else if (testResult.setupRequired) {
        res.json({
          enabled: false,
          message: 'PayPal Payouts feature needs to be enabled in Developer Console',
          instructions: 'Go to PayPal Developer Console > Your App > Features > Enable Payouts'
        });
      } else {
        res.json({
          enabled: false,
          message: testResult.error,
          details: testResult
        });
      }
      
    } catch (error) {
      console.error('Payout verification error:', error);
      res.status(500).json({ 
        enabled: false,
        error: error.message 
      });
    }
  });

  app.post("/api/create-connect-account", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeAccountId && !user.stripeAccountId.includes('mock')) {
        return res.status(400).json({ message: "Connect account already exists" });
      }

      console.log(`Creating Connect account for user ${userId} (${user.email})`);

      try {
        const accountId = await stripeService.createConnectedAccount(
          userId,
          user.email,
          user.firstName,
          user.lastName
        );

        if (!accountId) {
          return res.status(500).json({ 
            success: false,
            message: "Failed to create Connect account" 
          });
        }

        // Update user with Connect account ID
        await storage.updateUser(userId, { stripeAccountId: accountId });

        // Create onboarding link
        const onboardingUrl = await stripeService.createAccountOnboardingLink(accountId, userId);

        console.log(`Connect account created: ${accountId}`);
        console.log(`Onboarding URL generated successfully`);

        res.json({
          success: true,
          accountId: accountId,
          onboardingUrl: onboardingUrl,
          message: "Connect account created successfully"
        });
      } catch (createError) {
        console.error('Account creation error:', createError);
        return res.status(500).json({ 
          success: false,
          message: "Failed to create Stripe account: " + createError.message 
        });
      }

    } catch (error: any) {
      console.error('Connect account creation error:', error);
      
      res.status(500).json({ 
        message: "Failed to create Connect account", 
        error: error.message 
      });
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

  // AI Pricing Suggestions
  app.post("/api/pricing-suggestions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { itemTitle, category, description, location, condition, currentPrice } = req.body;

      console.log('DEBUG: Pricing suggestions request received with currentPrice:', currentPrice);
      console.log('DEBUG: currentPrice type:', typeof currentPrice);

      if (!itemTitle || !category || !description || !location) {
        return res.status(400).json({ 
          message: "Missing required fields: itemTitle, category, description, location" 
        });
      }

      const pricingSuggestion = await aiPricingService.analyzePricing({
        itemTitle,
        category,
        description,
        location,
        condition: condition || 'good',
        currentPrice: currentPrice ? parseFloat(currentPrice) : undefined
      });

      res.json(pricingSuggestion);
    } catch (error) {
      console.error('Pricing suggestions error:', error);
      res.status(500).json({ message: "Failed to generate pricing suggestions" });
    }
  });

  // Notification API endpoints
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await notificationService.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);
      await notificationService.markAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/mark-all-read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Local Event Insights for Pricing
  app.post("/api/local-event-insights", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { location, category } = req.body;

      if (!location || !category) {
        return res.status(400).json({ 
          message: "Missing required fields: location, category" 
        });
      }

      // Local event insights now handled directly by Gemini AI in pricing analysis
      const eventInsights = [`${category} events in ${location} are factored into AI pricing`];
      res.json({ events: eventInsights });
    } catch (error) {
      console.error('Local event insights error:', error);
      res.status(500).json({ message: "Failed to fetch local event insights" });
    }
  });

  // AI Chatbot endpoint
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await getChatbotResponse(message);
      res.json({ response });
    } catch (error) {
      console.error('Chatbot error:', error);
      res.json({ 
        response: "I'm having trouble connecting right now. Please try again in a moment, or feel free to contact our support team if you need immediate assistance!" 
      });
    }
  });

  // Review prompt endpoints
  app.get("/api/review-prompts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      console.log(`Review prompts requested for user ID: ${userId}`);
      
      // For testing: always return a test prompt
      const testPrompt = {
        id: 999,
        bookingId: 1,
        targetUserId: userId === 3 ? 2 : 3, // Different target based on current user
        role: 'renter',
        targetUser: {
          id: userId === 3 ? 2 : 3,
          firstName: userId === 3 ? 'Arnav' : 'Epic',
          lastName: userId === 3 ? 'Nallani' : 'Swag',
        },
        item: {
          id: 2,
          title: 'DeWalt Power Drill Set',
        },
      };
      
      console.log('Returning test prompt:', testPrompt);
      res.json([testPrompt]);
    } catch (error) {
      console.error('Failed to get review prompts:', error);
      res.status(500).json({ message: "Failed to get review prompts" });
    }
  });

  app.put("/api/review-prompts/:id/prompted", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const promptId = parseInt(req.params.id);
      await reviewPromptService.markAsPrompted(promptId);
      res.json({ message: "Review prompt marked as prompted" });
    } catch (error) {
      console.error('Failed to mark review prompt as prompted:', error);
      res.status(500).json({ message: "Failed to update review prompt" });
    }
  });

  app.put("/api/review-prompts/:id/dismiss", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const promptId = parseInt(req.params.id);
      await reviewPromptService.dismissPrompt(promptId);
      res.json({ message: "Review prompt dismissed" });
    } catch (error) {
      console.error('Failed to dismiss review prompt:', error);
      res.status(500).json({ message: "Failed to dismiss review prompt" });
    }
  });

  app.post("/api/reviews", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookingId, revieweeId, rating, comment } = req.body;
      const reviewerId = req.user!.id;

      const reviewData = {
        bookingId: parseInt(bookingId),
        reviewerId,
        revieweeId: parseInt(revieweeId),
        rating: parseInt(rating),
        comment
      };

      const review = await storage.createReview(reviewData);
      
      // Update reviewee's rating based on all their reviews
      await updateUserRating(parseInt(revieweeId));
      
      // Mark review prompt as completed
      await reviewPromptService.markAsCompleted(parseInt(bookingId), reviewerId);

      res.status(201).json(review);
    } catch (error) {
      console.error('Failed to create review:', error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Helper function to update user rating based on reviews
  async function updateUserRating(userId: number) {
    try {
      const userReviews = await storage.getReviews(undefined, userId);
      
      if (userReviews.length === 0) {
        // No reviews yet, keep rating at 0
        await storage.updateUser(userId, { 
          rating: "0.0",
          reviewCount: 0
        });
        return;
      }

      // Calculate average rating
      const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = (totalRating / userReviews.length).toFixed(1);
      
      await storage.updateUser(userId, { 
        rating: averageRating,
        reviewCount: userReviews.length
      });
      
      console.log(`Updated user ${userId} rating: ${averageRating} (${userReviews.length} reviews)`);
    } catch (error) {
      console.error('Failed to update user rating:', error);
    }
  }

  // Recalculate all user ratings based on existing reviews
  app.post("/api/recalculate-ratings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Get all users
      const allUsers = await db.select({ id: users.id }).from(users);
      
      for (const user of allUsers) {
        await updateUserRating(user.id);
      }
      
      res.json({ message: "All user ratings recalculated successfully" });
    } catch (error) {
      console.error('Failed to recalculate ratings:', error);
      res.status(500).json({ message: "Failed to recalculate ratings" });
    }
  });

  // Manual payout processing (admin endpoint)
  app.post("/api/process-payout", async (req, res) => {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Missing bookingId" });
      }

      console.log(`Manual payout trigger for booking ${bookingId}`);
      const success = await paymentScheduler.processOwnerPayout(parseInt(bookingId));
      
      if (success) {
        res.json({ message: "Payout processed successfully", bookingId });
      } else {
        res.status(400).json({ message: "Payout failed - check logs for details", bookingId });
      }
    } catch (error) {
      console.error('Manual payout error:', error);
      res.status(500).json({ message: "Failed to process payout" });
    }
  });

  // 360° Item Scanning API endpoints
  app.post("/api/item-scans", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookingId, scanType, scanImages } = req.body;
      const userId = req.user!.id;

      if (!bookingId || !scanType || !scanImages || !Array.isArray(scanImages)) {
        return res.status(400).json({ 
          message: "Missing required fields: bookingId, scanType, scanImages" 
        });
      }

      // Verify user has permission for this booking
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.item.ownerId !== userId && booking.renterId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const itemScan = await storage.createItemScan({
        bookingId,
        scanType,
        scanImages,
        userId
      });

      res.json(itemScan);
    } catch (error) {
      console.error('Failed to create item scan:', error);
      res.status(500).json({ message: "Failed to save scan" });
    }
  });

  app.get("/api/item-scans/:bookingId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const userId = req.user!.id;

      // Verify user has permission for this booking
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.item.ownerId !== userId && booking.renterId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const scans = await storage.getItemScansByBooking(bookingId);
      res.json(scans);
    } catch (error) {
      console.error('Failed to fetch item scans:', error);
      res.status(500).json({ message: "Failed to fetch scans" });
    }
  });

  // Damage reporting endpoints
  app.post("/api/damage-reports", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookingId, reporterType, description, images } = req.body;
      const reporterId = req.user!.id;

      if (!bookingId || !reporterType || !description) {
        return res.status(400).json({ 
          message: "Missing required fields: bookingId, reporterType, description" 
        });
      }

      const damageReport = await storage.createDamageReport({
        bookingId,
        reporterId,
        reporterType,
        description,
        images: images || []
      });

      res.json(damageReport);
    } catch (error) {
      console.error('Failed to create damage report:', error);
      res.status(500).json({ message: "Failed to submit damage report" });
    }
  });

  app.post("/api/send-damage-report-email", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookingId, reporterType, description } = req.body;
      const user = req.user!;

      // Get booking details
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send email to Lendibl
      const emailSubject = `Damage Report - Booking #${bookingId}`;
      const emailBody = `
        Damage Report Submitted
        
        Booking ID: ${bookingId}
        Item: ${booking.item.title}
        Reporter: ${user.firstName} ${user.lastName} (${user.email})
        Reporter Type: ${reporterType}
        
        Description:
        ${description}
        
        Please investigate this damage report.
      `;

      // In a real implementation, you would send this email using a service like SendGrid
      console.log('Damage report email would be sent to arnav.nallani@gmail.com:');
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBody);

      res.json({ message: "Damage report sent successfully" });
    } catch (error) {
      console.error('Failed to send damage report email:', error);
      res.status(500).json({ message: "Failed to send damage report" });
    }
  });

  app.post("/api/confirm-good-condition", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookingId } = req.body;
      const userId = req.user!.id;

      // Verify user is the owner of this booking
      const booking = await storage.getBookingWithDetails(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.item.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can confirm condition" });
      }

      // Update booking status to indicate condition confirmed
      await storage.updateBooking(bookingId, { 
        status: 'condition_confirmed' 
      });

      res.json({ message: "Condition confirmed successfully" });
    } catch (error) {
      console.error('Failed to confirm condition:', error);
      res.status(500).json({ message: "Failed to confirm condition" });
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

  // Test endpoint for manual payout processing (no auth for testing)
  app.post("/api/test-payout", async (req, res) => {
    try {
      const { bookingId } = req.body;
      console.log(`Manual payout test requested for booking ${bookingId}`);
      const result = await paymentScheduler.processOwnerPayout(bookingId);
      res.json({ success: result, message: result ? "Payout processed successfully" : "Payout failed" });
    } catch (error: any) {
      console.error("Test payout error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe balance check endpoint
  app.get("/api/stripe-balance", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ error: "Stripe not configured" });
      }
      
      const balance = await stripe.balance.retrieve();
      const availableUSD = balance.available.find(b => b.currency === 'usd')?.amount || 0;
      const pendingUSD = balance.pending.find(b => b.currency === 'usd')?.amount || 0;
      
      res.json({
        available: availableUSD / 100,
        pending: pendingUSD / 100,
        currency: 'USD',
        message: pendingUSD > 0 ? 'Funds are pending settlement and will be available within 2-7 business days' : 'No pending funds'
      });
    } catch (error: any) {
      console.error("Failed to get Stripe balance:", error);
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  return httpServer;
}
