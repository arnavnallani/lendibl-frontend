import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertItemSchema, insertBookingSchema, insertUserSchema, insertUserInteractionSchema } from "@shared/schema";
import { hashPassword, comparePassword, generateToken, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { recommendationEngine } from "./recommendation-engine";
import { paymentScheduler } from "./payment-scheduler";
import { paymentReminderService } from "./payment-reminder-service";
import { stripeService } from "./stripe-service";
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
        
        // Capture payment and schedule payout
        await paymentScheduler.capturePaymentOnApproval(id);
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
        if (status === 'cancelled') {
          // Notify owner that renter cancelled
          const ownerNotification = {
            type: "booking_update",
            id: Date.now(),
            title: "Booking Cancelled",
            message: `${booking.renter.firstName} cancelled their booking for ${booking.item.title}. Refund processed automatically.`,
            itemId: booking.item.id,
            bookingId: booking.id,
            timestamp: new Date().toISOString(),
            read: false
          };
          notifyUser(booking.item.ownerId, ownerNotification);
          
          // Notify renter of cancellation confirmation
          const renterNotification = {
            type: "booking_update",
            id: Date.now(),
            title: "Booking Cancelled",
            message: `Your booking for ${booking.item.title} has been cancelled. Full refund processed.`,
            itemId: booking.item.id,
            bookingId: booking.id,
            timestamp: new Date().toISOString(),
            read: false
          };
          notifyUser(booking.renterId, renterNotification);
        } else {
          // Notify renter of owner's decision
          const statusMessage = status === 'approved' ? 'approved! Payment captured. Check your notifications for next steps.' : 'declined. Full refund processed.';
          const notification = {
            type: "booking_update",
            id: Date.now(),
            title: `Booking ${status}`,
            message: `Your booking for ${booking.item.title} has been ${statusMessage}`,
            itemId: booking.item.id,
            bookingId: booking.id,
            timestamp: new Date().toISOString(),
            read: false
          };
          notifyUser(booking.renterId, notification);

          // If approved, also send notification to owner to coordinate
          if (status === 'approved') {
            const ownerNotification = {
              type: "booking_approved",
              id: Date.now(),
              title: "Rental Approved - Coordinate Pickup",
              message: `You approved ${booking.renter.firstName}'s rental of ${booking.item.title}. Go to Action Dashboard to coordinate pickup details.`,
              itemId: booking.item.id,
              bookingId: booking.id,
              timestamp: new Date().toISOString(),
              read: false
            };
            notifyUser(booking.item.ownerId, ownerNotification);
          }
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
        capture_method: 'manual', // Hold payment for manual capture later
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
        paymentCaptured: false, // Payment is authorized but not captured yet
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
          message: `${req.user!.firstName} has paid $${booking.totalPrice} and wants to rent your ${item.title}. Payment is held in escrow until approved.`,
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

  // Payment setup endpoint with real Stripe integration
  app.post("/api/setup-payment", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { cardNumber, expiryDate, cvv, cardholderName } = req.body;
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

      // Step 2: Create payment method from card details
      const [month, year] = expiryDate.split('/');
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(month),
          exp_year: parseInt(`20${year}`),
          cvc: cvv,
        },
        billing_details: {
          name: cardholderName,
          email: user.email,
        },
      });

      // Step 3: Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      // Step 4: Set as default payment method for the customer
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Step 5: Create Express account for payouts (Stripe Connect)
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        metadata: {
          userId: userId.toString()
        }
      });

      // Step 6: Update user with Stripe IDs
      const updatedUser = await storage.updateUser(userId, {
        stripeCustomerId: customerId,
        stripePaymentMethodId: paymentMethod.id,
        stripeAccountId: account.id,
        paymentSetupComplete: true,
      });

      // Step 7: Resolve any pending payment reminders
      await paymentReminderService.resolvePaymentReminders(userId);

      res.json({ 
        success: true, 
        message: "Payment setup completed successfully",
        user: updatedUser,
        stripeAccountId: account.id
      });
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
      const { cardNumber, expiryDate, cvv, cardholderName } = req.body;

      const result = await stripeService.updatePaymentMethod(userId, cardNumber, expiryDate, cvv, cardholderName);
      
      res.json({ 
        success: true, 
        message: "Payment method updated successfully",
        paymentMethodId: result.paymentMethodId
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
      
      // Check Stripe account status if available
      let accountStatus = null;
      if (user?.stripeAccountId) {
        accountStatus = await stripeService.checkAccountStatus(user.stripeAccountId);
      }

      res.json({ 
        needsPaymentSetup,
        hasItems: userItems.length > 0,
        paymentSetupComplete: user?.paymentSetupComplete || false,
        estimatedEarnings: userItems.length * 50, // Rough estimate based on number of items
        pendingEarnings: user?.pendingEarnings || "0",
        paymentReminders: paymentReminders,
        stripeAccountStatus: accountStatus
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
