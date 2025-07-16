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
import { refundService } from "./refund-service";
import { responseTrackingService } from "./response-tracking-service";
import { sendPasswordResetEmail, sendEmail } from "./email-service";
import { phoneVerificationService } from "./phone-verification-service";
import { emailVerificationService } from "./email-verification-service";

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
import { registerPushRoutes } from "./routes/push";
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
      
      // Check if user already exists by email
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username is already taken. Please choose a different username." });
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

  app.put("/api/auth/update-avatar", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { avatar } = req.body;
      
      if (!avatar || typeof avatar !== 'string') {
        return res.status(400).json({ message: "Avatar data is required" });
      }

      // Basic validation for base64 image data
      if (!avatar.startsWith('data:image/')) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      const updatedUser = await storage.updateUser(req.user!.id, {
        avatar,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user: updatedUser, message: "Avatar updated successfully" });
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Failed to update avatar" });
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

  // Test endpoint to verify reset token validity
  app.get("/api/test/verify-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const userId = await storage.verifyPasswordResetToken(token);
      
      res.json({ 
        valid: !!userId,
        userId: userId || null,
        message: userId ? "Token is valid" : "Token is invalid or expired"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify token" });
    }
  });

  // Test endpoint to check domain configuration
  app.get("/api/test/domain-config", (req, res) => {
    let domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
    
    if (domain.includes(',')) {
      domain = domain.split(',')[0].trim();
    }
    
    const originalDomain = domain;
    if (domain.includes('.replit.dev')) {
      domain = domain.replace('.replit.dev', '.repl.co');
    }
    
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const testUrl = `${protocol}://${domain}/reset-password?reset-token=test123`;
    
    res.json({
      originalDomain,
      convertedDomain: domain,
      protocol,
      testUrl,
      isProduction: process.env.NODE_ENV === 'production',
      environment: {
        REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
        REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  });

  // Password reset functionality
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      console.log(`🔄 Password reset requested for: ${email}`);

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`⚠️ User not found for email: ${email}`);
        // Return success even if user doesn't exist for security
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }

      console.log(`👤 User found: ${user.username} (ID: ${user.id})`);

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      console.log(`🔑 Generated reset token: ${resetToken}`);
      
      // Store the reset token in database with expiration
      await storage.storePasswordResetToken(user.id, resetToken);
      console.log(`💾 Stored reset token in database`);

      // Send password reset email
      console.log(`📤 Attempting to send email to: ${email}`);
      console.log(`📧 From address: ${process.env.SENDGRID_FROM_EMAIL}`);
      console.log(`🔑 Reset token: ${resetToken}`);
      console.log(`🌐 REPLIT_DEV_DOMAIN: ${process.env.REPLIT_DEV_DOMAIN}`);
      const emailSent = await sendPasswordResetEmail(email, resetToken);
      
      if (!emailSent) {
        console.error(`❌ Failed to send password reset email to ${email}`);
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      console.log(`✅ Password reset email sent successfully to ${email}`);
      
      res.json({ 
        message: "Reset instructions sent to your email",
        // In development, include the token for testing
        ...(process.env.NODE_ENV !== 'production' && { resetToken }),
        debug: {
          userFound: true,
          emailSent: true,
          sentTo: email,
          fromEmail: process.env.SENDGRID_FROM_EMAIL,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("💥 Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Verify reset token
      const userId = await storage.verifyPasswordResetToken(token);
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update user password
      await storage.updateUserPassword(userId, hashedPassword);

      // Remove reset token
      await storage.deletePasswordResetToken(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Phone verification routes - only instant verification (no SMS/voice)

  // Instant phone verification (no SMS required)
  app.post("/api/auth/verify-instant", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          valid: false,
          message: "Phone number is required" 
        });
      }

      console.log(`📱 Instant verification for: ${phoneNumber}`);
      
      const result = await phoneVerificationService.verifyPhoneInstant(phoneNumber);
      
      console.log(`✅ Instant verification result: ${result.message}`);
      res.json(result);
    } catch (error) {
      console.error('💥 Instant phone verification error:', error);
      res.status(500).json({ 
        success: false, 
        valid: false,
        message: "Failed to verify phone number instantly" 
      });
    }
  });

  // Instant email verification (no email sending required)
  app.post("/api/auth/verify-email-instant", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          valid: false,
          message: "Email address is required" 
        });
      }

      console.log(`📧 Instant email verification for: ${email}`);
      
      const result = await emailVerificationService.verifyEmailInstant(email);
      
      console.log(`✅ Email verification result: ${result.message}`);
      res.json(result);
    } catch (error) {
      console.error('💥 Instant email verification error:', error);
      res.status(500).json({ 
        success: false, 
        valid: false,
        message: "Failed to verify email address instantly" 
      });
    }
  });



  // AI-powered search endpoint with 3-second timeout
  app.get("/api/ai-search", async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Set 3-second timeout for entire search operation
      const timeout = new Promise((_, reject) => {
        setTimeout(() => {
          console.log(`⏰ Search API timeout after 3 seconds for query: "${q}"`);
          reject(new Error('Search timeout'));
        }, 3000);
      });

      const searchOperation = async () => {
        const allItems = await storage.getItems();
        return await aiSearchService.enhancedSearch(q as string, allItems);
      };

      // Race between search operation and timeout
      const aiResults = await Promise.race([searchOperation(), timeout]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Search completed in ${duration}ms for query: "${q}"`);
      
      res.json(aiResults);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ AI search error after ${duration}ms:`, error.message);
      
      // Return empty results on timeout or error
      res.json([]);
    }
  });

  // Enhanced search suggestions endpoint with AI integration and timeout
  app.get("/api/search-suggestions", async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const query = q.toLowerCase().trim();
      
      // Set 2.5-second timeout for search suggestions
      const timeout = new Promise((_, reject) => {
        setTimeout(() => {
          console.log(`⏰ Search suggestions timeout after 2.5 seconds for query: "${q}"`);
          reject(new Error('Suggestions timeout'));
        }, 2500);
      });

      const suggestionsOperation = async () => {
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
        
        return { allItems, categories, aiAnalysis, suggestions };
      };

      // Race between suggestions operation and timeout
      const { allItems, categories, aiAnalysis, suggestions } = await Promise.race([suggestionsOperation(), timeout]);

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

      const duration = Date.now() - startTime;
      console.log(`✅ Search suggestions completed in ${duration}ms for query: "${q}"`);
      
      res.json(suggestions.slice(0, 8));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Search suggestions error after ${duration}ms:`, error.message);
      res.json([]); // Return empty array on timeout or error
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
      const { categoryId, search, minPrice, maxPrice, location, page, limit, ownerId } = req.query;
      
      const filters: any = {};
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (search) filters.search = search as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (location) filters.location = location as string;
      if (ownerId) filters.ownerId = parseInt(ownerId as string);

      // Pagination parameters
      const pageNumber = page ? parseInt(page as string) : 1;
      const pageSize = limit ? parseInt(limit as string) : 12; // Default 12 items per page
      const offset = (pageNumber - 1) * pageSize;

      const allItems = await storage.getItems(Object.keys(filters).length > 0 ? filters : undefined);
      
      // Apply pagination
      const paginatedItems = allItems.slice(offset, offset + pageSize);
      const totalItems = allItems.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const hasMore = pageNumber < totalPages;

      res.json({
        items: paginatedItems,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: totalItems,
          totalPages,
          hasMore
        }
      });
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

  app.get("/api/users/:id", async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove sensitive information
      const { password, stripeCustomerId, stripeConnectAccountId, paypalEmail, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
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

      const { 
        title, 
        description, 
        price, 
        categoryId,
        location, 
        address, 
        city, 
        state, 
        zipCode, 
        images, 
        included,
        availableFrom,
        availableTo 
      } = req.body;
      
      // Build clean update object with only valid fields
      const updates: any = {};
      
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (price) updates.price = price.toString();
      if (categoryId && typeof categoryId === 'number') updates.categoryId = categoryId;
      if (location) updates.location = location;
      if (address) updates.address = address;
      if (city) updates.city = city;
      if (state) updates.state = state;
      if (zipCode) updates.zipCode = zipCode;
      if (Array.isArray(images)) updates.images = images;
      if (Array.isArray(included)) updates.included = included;
      
      // Handle availability dates carefully
      if (availableFrom) {
        const fromDate = new Date(availableFrom);
        if (!isNaN(fromDate.getTime())) {
          updates.availableFrom = fromDate;
        }
      }
      
      if (availableTo) {
        const toDate = new Date(availableTo);
        if (!isNaN(toDate.getTime())) {
          updates.availableTo = toDate;
        }
      }
      
      console.log('Clean update data:', updates);
      
      const item = await storage.updateItem(id, updates);

      res.json(item);
    } catch (error) {
      console.error("Error updating item:", error);
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
        
        // If there's a message, create the initial rental message
        if (validatedData.message && validatedData.message.trim()) {
          await storage.createRentalMessage({
            bookingId: booking.id,
            senderId: req.user!.id,
            receiverId: item.ownerId,
            message: validatedData.message.trim()
          });
        }
        
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
      
      // Allow renters to cancel approved bookings but not other statuses
      if (isRenter && !['pending', 'approved'].includes(booking.status)) {
        return res.status(400).json({ message: "Cannot modify booking in current status" });
      }
      
      if (isOwner && !['pending', 'approved', 'in_progress'].includes(booking.status)) {
        return res.status(400).json({ message: "Cannot modify completed or cancelled booking" });
      }
      
      const updatedBooking = await storage.updateBooking(id, { status });
      
      // Track owner response for approved/declined bookings
      if (updatedBooking && isOwner && (status === 'approved' || status === 'declined')) {
        await responseTrackingService.markOwnerResponse(id);
      }
      
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
        // Process refund for declined bookings or pre-approval cancellations only
        try {
          if (status === 'cancelled') {
            // Only refund if the booking was cancelled before approval
            if (booking.status === 'pending') {
              const result = await refundService.processRefundForCancellation(id);
              console.log('Pre-approval cancellation result:', result);
            } else {
              console.log('Post-approval cancellation - no refund issued');
              // Notify user that no refund will be issued for post-approval cancellation
              await notificationService.createNotification({
                userId: booking.renterId,
                type: 'booking_request',
                title: 'Booking Cancelled',
                message: `Your booking for "${booking.item.title}" has been cancelled. Since this booking was already approved, no refund will be issued.`,
                relatedId: id
              });
            }
          } else {
            const result = await refundService.processRefundForTimeout(id);
            console.log('Decline result:', result);
          }
        } catch (error) {
          console.error('Refund processing error:', error);
          // Don't fail the booking status update if refund fails
        }
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

      // Store payment method information for refund processing
      if (paymentIntent.payment_method) {
        await refundService.storePaymentMethod(req.user!.id, paymentIntent.payment_method.toString());
      }
      
      // Create booking with payment confirmation
      const validatedData = insertBookingSchema.parse({
        ...bookingData,
        startDate: new Date(bookingData.startDate),
        endDate: new Date(bookingData.endDate),
        renterId: req.user!.id,
        paymentConfirmed: true,
        paymentIntentId: paymentIntentId,
        paymentCaptured: true, // Payment is automatically captured to Lendibl's account
        paymentMethodId: paymentIntent.payment_method?.toString(),
      });
      
      const booking = await storage.createBooking(validatedData);
      
      // Track rental interaction for recommendations
      await recommendationEngine.trackInteraction(req.user!.id, booking.itemId, "rental", 5.0);
      
      // Send notification to item owner
      const item = await storage.getItem(booking.itemId);
      if (item) {
        // If there's a message, create the initial rental message
        if (validatedData.message && validatedData.message.trim()) {
          await storage.createRentalMessage({
            bookingId: booking.id,
            senderId: req.user!.id,
            receiverId: item.ownerId,
            message: validatedData.message.trim()
          });
        }
        
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

      // Check debit card status
      const hasDebitCard = user?.debitCardPaymentMethodId ? true : false;
      const hasAnyPaymentMethod = hasValidSetup || hasDebitCard;

      res.json({
        hasPaymentMethod: hasAnyPaymentMethod,
        hasItems: userItems.length > 0,
        paymentSetupComplete: user?.paymentSetupComplete || false,
        pendingEarnings: user?.pendingEarnings || "0",
        paymentReminders: paymentReminders,
        stripeAccountStatus: stripeStatus,
        onboardingUrl: user?.stripeAccountId && stripeStatus && !stripeStatus.payoutsEnabled ? 
          await stripeService.createAccountOnboardingLink(user.stripeAccountId, userId) : null,
        needsPaymentMethod: userItems.length > 0 && !hasAnyPaymentMethod,
        debitCard: hasDebitCard ? {
          last4: user?.debitCardLast4,
          brand: user?.debitCardBrand,
          expMonth: user?.debitCardExpMonth,
          expYear: user?.debitCardExpYear,
        } : null,
        hasBankAccount: hasValidSetup,
        hasDebitCard: hasDebitCard,
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

  // Debit card management for payouts
  app.post("/api/add-debit-card", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { paymentMethodId } = req.body;
      const userId = req.user!.id;

      if (!paymentMethodId) {
        return res.status(400).json({ message: "Payment method ID is required" });
      }

      const result = await stripeService.addDebitCardFromPaymentMethod(userId, paymentMethodId);

      if (result.success) {
        res.json({ success: true, message: "Debit card added successfully" });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error: any) {
      console.error('Add debit card error:', error);
      res.status(500).json({ success: false, message: "Failed to add debit card" });
    }
  });

  app.delete("/api/remove-debit-card", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const result = await stripeService.removeDebitCard(userId);

      if (result.success) {
        res.json({ success: true, message: "Debit card removed successfully" });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error: any) {
      console.error('Remove debit card error:', error);
      res.status(500).json({ success: false, message: "Failed to remove debit card" });
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
      
      const prompts = await reviewPromptService.getPendingReviewPrompts(userId);
      console.log(`Found ${prompts.length} pending review prompts for user ${userId}`);
      
      res.json(prompts);
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

  // Register push notification routes
  registerPushRoutes(app);

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

  // Response tracking endpoint to recalculate metrics
  app.post("/api/recalculate-response-metrics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.body;
      
      // Only allow users to recalculate their own metrics or admin functionality
      if (userId && userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to recalculate other user's metrics" });
      }

      const targetUserId = userId || req.user!.id;
      await responseTrackingService.updateUserResponseMetrics(targetUserId);
      
      // Return updated user data
      const updatedUser = await storage.getUser(targetUserId);
      const { password, stripeCustomerId, stripeConnectAccountId, paypalEmail, ...publicUser } = updatedUser!;
      
      res.json({ 
        message: "Response metrics updated", 
        user: publicUser
      });
    } catch (error) {
      console.error("Recalculate response metrics error:", error);
      res.status(500).json({ message: "Failed to recalculate response metrics" });
    }
  });

  // Admin endpoint to recalculate all user metrics
  app.post("/api/recalculate-all-response-metrics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      await responseTrackingService.recalculateAllUserMetrics();
      res.json({ message: "All user response metrics recalculated" });
    } catch (error) {
      console.error("Recalculate all response metrics error:", error);
      res.status(500).json({ message: "Failed to recalculate all response metrics" });
    }
  });

  // Item Protection Workflow API endpoints
  
  // Save item scan before rental
  app.post("/api/item-scans", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { rentalId, images, notes, scannedAt } = req.body;
      
      if (!rentalId || !images || images.length === 0) {
        return res.status(400).json({ message: "Rental ID and at least one image are required" });
      }

      // Verify the user is the owner of the rental item
      const booking = await storage.getBooking(rentalId);
      if (!booking) {
        return res.status(404).json({ message: "Rental not found" });
      }

      const item = await storage.getItem(booking.itemId);
      if (!item || item.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to scan this item" });
      }

      // Store the scan data (in a real implementation, you'd have a dedicated table)
      // For now, we'll just return success as the component handles the UI
      console.log(`📷 Item scan saved for rental ${rentalId} by owner ${req.user!.id}`);
      console.log(`Images: ${images.length}, Notes: ${notes || 'None'}`);
      
      res.json({ 
        message: "Item scan saved successfully",
        scanId: `scan_${rentalId}_${Date.now()}`
      });
    } catch (error) {
      console.error("Save item scan error:", error);
      res.status(500).json({ message: "Failed to save item scan" });
    }
  });

  // Get item scan for viewing
  app.get("/api/item-scans/:rentalId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const rentalId = parseInt(req.params.rentalId);
      
      // Verify the user has access to this rental
      const booking = await storage.getBooking(rentalId);
      if (!booking) {
        return res.status(404).json({ message: "Rental not found" });
      }

      const item = await storage.getItem(booking.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Check if user is either the owner or renter
      if (item.ownerId !== req.user!.id && booking.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this scan" });
      }

      // Return mock scan data for demonstration
      res.json({
        images: ['/api/placeholder/400/300'],
        notes: 'Item appears to be in excellent condition. All parts present and functional.',
        scannedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Get item scan error:", error);
      res.status(500).json({ message: "Failed to get item scan" });
    }
  });

  // Submit misbehavior report
  app.post("/api/misbehavior-reports", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { 
        incidentType, 
        description, 
        contactEmail, 
        agreesToTerms, 
        rentalId, 
        itemTitle, 
        reporterRole, 
        submittedAt 
      } = req.body;
      
      if (!incidentType || !description || !contactEmail || !agreesToTerms) {
        return res.status(400).json({ message: "All required fields must be filled" });
      }

      if (!agreesToTerms) {
        return res.status(400).json({ message: "You must agree to the terms to submit a report" });
      }

      // Verify the user has access to this rental if rentalId provided
      if (rentalId) {
        const booking = await storage.getBooking(rentalId);
        if (!booking) {
          return res.status(404).json({ message: "Rental not found" });
        }

        const item = await storage.getItem(booking.itemId);
        if (!item) {
          return res.status(404).json({ message: "Item not found" });
        }

        // Check if user is either the owner or renter
        if (item.ownerId !== req.user!.id && booking.userId !== req.user!.id) {
          return res.status(403).json({ message: "Not authorized to report on this rental" });
        }
      }

      // Create report object
      const report = {
        reportId: `report_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        incidentType,
        description,
        contactEmail,
        reporterRole,
        reporterId: req.user!.id,
        reporterUsername: req.user!.username,
        rentalId: rentalId || null,
        itemTitle: itemTitle || 'Not specified',
        submittedAt,
        status: 'submitted'
      };

      // Log the report for disputes@lendibl.com
      console.log('\n🚨 MISBEHAVIOR REPORT SUBMITTED 🚨');
      console.log('====================================');
      console.log(`Report ID: ${report.reportId}`);
      console.log(`Incident Type: ${report.incidentType}`);
      console.log(`Reporter: ${report.reporterUsername} (${report.reporterRole})`);
      console.log(`Contact Email: ${report.contactEmail}`);
      console.log(`Rental ID: ${report.rentalId}`);
      console.log(`Item: ${report.itemTitle}`);
      console.log(`Description: ${report.description}`);
      console.log(`Submitted: ${report.submittedAt}`);
      console.log('====================================');
      
      // Send email to disputes@lendibl.com (and copy to user for testing)
      const emailSuccess = await sendEmail({
        to: req.user?.email || 'disputes@lendibl.com',
        subject: `Misbehavior Report #${report.reportId} - ${report.incidentType}`,
        type: 'misbehavior-report',
        html: `
          <h2>🚨 Misbehavior Report Submitted</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Report Details</h3>
            <p><strong>Report ID:</strong> ${report.reportId}</p>
            <p><strong>Incident Type:</strong> ${report.incidentType}</p>
            <p><strong>Reporter:</strong> ${report.reporterUsername} (${report.reporterRole})</p>
            <p><strong>Contact Email:</strong> ${report.contactEmail}</p>
            <p><strong>Rental ID:</strong> ${report.rentalId || 'N/A'}</p>
            <p><strong>Item:</strong> ${report.itemTitle || 'N/A'}</p>
            <p><strong>Submitted:</strong> ${new Date(report.submittedAt).toLocaleString()}</p>
          </div>
          
          <h3>Description</h3>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
            ${report.description.replace(/\n/g, '<br>')}
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #e7f3ff; border-radius: 6px;">
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review the incident details above</li>
              <li>Contact the reporter at ${report.contactEmail} if needed</li>
              <li>Take appropriate action based on lendibl's dispute policy</li>
              <li>Document resolution in internal system</li>
            </ul>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            This report was automatically generated by the lendibl platform dispute system.
          </p>
        `,
        text: `
MISBEHAVIOR REPORT #${report.reportId}

Report Details:
- Report ID: ${report.reportId}
- Incident Type: ${report.incidentType}
- Reporter: ${report.reporterUsername} (${report.reporterRole})
- Contact Email: ${report.contactEmail}
- Rental ID: ${report.rentalId || 'N/A'}
- Item: ${report.itemTitle || 'N/A'}
- Submitted: ${new Date(report.submittedAt).toLocaleString()}

Description:
${report.description}

Next Steps:
- Review the incident details above
- Contact the reporter at ${report.contactEmail} if needed
- Take appropriate action based on lendibl's dispute policy
- Document resolution in internal system

This report was automatically generated by the lendibl platform dispute system.
        `
      });
      
      if (emailSuccess) {
        console.log(`✅ Report email sent successfully to ${req.user?.email || 'disputes@lendibl.com'}`);
      } else {
        console.log(`❌ Failed to send report email to ${req.user?.email || 'disputes@lendibl.com'}`);
      }
      
      // Also send to disputes@lendibl.com if we sent to user email
      if (req.user?.email && req.user.email !== 'disputes@lendibl.com') {
        const disputesEmailSuccess = await sendEmail({
          to: 'disputes@lendibl.com',
          subject: `Misbehavior Report #${report.reportId} - ${report.incidentType}`,
          type: 'misbehavior-report',
          html: `
            <h2>🚨 Misbehavior Report Submitted</h2>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Report Details</h3>
              <p><strong>Report ID:</strong> ${report.reportId}</p>
              <p><strong>Incident Type:</strong> ${report.incidentType}</p>
              <p><strong>Reporter:</strong> ${report.reporterUsername} (${report.reporterRole})</p>
              <p><strong>Contact Email:</strong> ${report.contactEmail}</p>
              <p><strong>Rental ID:</strong> ${report.rentalId || 'N/A'}</p>
              <p><strong>Item:</strong> ${report.itemTitle || 'N/A'}</p>
              <p><strong>Submitted:</strong> ${new Date(report.submittedAt).toLocaleString()}</p>
            </div>
            
            <h3>Description</h3>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
              ${report.description.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #e7f3ff; border-radius: 6px;">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review the incident details above</li>
                <li>Contact the reporter at ${report.contactEmail} if needed</li>
                <li>Take appropriate action based on lendibl's dispute policy</li>
                <li>Document resolution in internal system</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              This report was automatically generated by the lendibl platform dispute system.
            </p>
          `,
          text: `
MISBEHAVIOR REPORT #${report.reportId}

Report Details:
- Report ID: ${report.reportId}
- Incident Type: ${report.incidentType}
- Reporter: ${report.reporterUsername} (${report.reporterRole})
- Contact Email: ${report.contactEmail}
- Rental ID: ${report.rentalId || 'N/A'}
- Item: ${report.itemTitle || 'N/A'}
- Submitted: ${new Date(report.submittedAt).toLocaleString()}

Description:
${report.description}

Next Steps:
- Review the incident details above
- Contact the reporter at ${report.contactEmail} if needed
- Take appropriate action based on lendibl's dispute policy
- Document resolution in internal system

This report was automatically generated by the lendibl platform dispute system.
          `
        });
        
        if (disputesEmailSuccess) {
          console.log('✅ Report also sent to disputes@lendibl.com');
        } else {
          console.log('❌ Failed to send copy to disputes@lendibl.com');
        }
      }
      
      res.json({ 
        message: "Report submitted successfully. Our disputes team will review your case.",
        reportId: report.reportId
      });
    } catch (error) {
      console.error("Submit misbehavior report error:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  return httpServer;
}
