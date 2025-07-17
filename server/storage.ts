import { users, items, categories, bookings, reviews, userInteractions, userPreferences, rentalMessages, paymentReminders, reviewPrompts, itemScans, damageReports, passwordResetTokens, phoneVerifications, earlyAccessSignups, type User, type InsertUser, type Item, type InsertItem, type Category, type InsertCategory, type Booking, type InsertBooking, type Review, type InsertReview, type UserInteraction, type InsertUserInteraction, type UserPreferences, type InsertUserPreferences, type RentalMessage, type InsertRentalMessage, type PaymentReminder, type InsertPaymentReminder, type ReviewPrompt, type InsertReviewPrompt, type ItemScan, type InsertItemScan, type DamageReport, type InsertDamageReport, type PasswordResetToken, type InsertPasswordResetToken, type PhoneVerification, type InsertPhoneVerification, type EarlyAccessSignup, type InsertEarlyAccessSignup, type ItemWithDetails, type BookingWithDetails } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt, notInArray, sql, or, ilike, gte, lte } from "drizzle-orm";
import { calculateAvailabilityStatus } from "@shared/availability-utils";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Items
  getItems(filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string; ownerId?: number; minRating?: number; availability?: string }): Promise<ItemWithDetails[]>;
  getItemsPaginated(options: { filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string; ownerId?: number; minRating?: number; availability?: string }; sortBy?: string; page: number; limit: number }): Promise<{ items: ItemWithDetails[]; total: number }>;
  getItem(id: number): Promise<ItemWithDetails | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  
  // Bookings
  getBookings(userId?: number): Promise<BookingWithDetails[]>;
  getBooking(id: number): Promise<BookingWithDetails | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  // Reviews
  getReviews(itemId?: number, revieweeId?: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // User Interactions (for recommendations)
  getUserInteractions(userId: number): Promise<UserInteraction[]>;
  createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;
  
  // User Preferences (for recommendations)
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Rental Messages
  getRentalMessages(bookingId: number): Promise<RentalMessage[]>;
  createRentalMessage(message: InsertRentalMessage): Promise<RentalMessage>;
  
  // Payment Reminders
  getPaymentReminders(userId: number): Promise<PaymentReminder[]>;
  createPaymentReminder(reminder: InsertPaymentReminder): Promise<PaymentReminder>;
  updatePaymentReminder(id: number, updates: Partial<PaymentReminder>): Promise<PaymentReminder | undefined>;
  getUsersWithPendingEarnings(): Promise<User[]>;

  // Review Prompts
  getReviewPrompts(userId: number): Promise<any[]>;
  createReviewPrompt(prompt: InsertReviewPrompt): Promise<ReviewPrompt>;
  updateReviewPrompt(id: number, updates: Partial<ReviewPrompt>): Promise<ReviewPrompt | undefined>;
  deleteReviewPrompt(id: number): Promise<boolean>;

  // Item Scans (360° documentation)
  getItemScansByBooking(bookingId: number): Promise<any[]>;
  createItemScan(scan: any): Promise<any>;

  // Damage Reports
  createDamageReport(report: any): Promise<any>;

  // Password reset methods
  storePasswordResetToken(userId: number, token: string): Promise<void>;
  verifyPasswordResetToken(token: string): Promise<number | null>;
  deletePasswordResetToken(token: string): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;

  // Phone verification methods
  createPhoneVerification(verification: InsertPhoneVerification): Promise<PhoneVerification>;
  getPhoneVerification(transactionId: string): Promise<PhoneVerification | undefined>;
  updatePhoneVerification(transactionId: string, updates: Partial<PhoneVerification>): Promise<PhoneVerification | undefined>;
  deletePhoneVerification(transactionId: string): Promise<void>;
  updateUserPhoneVerified(userId: number, phoneVerified: boolean): Promise<User | undefined>;

  // Additional methods
  getAllUsers(): Promise<User[]>;
  getBookingWithDetails(id: number): Promise<any | undefined>;

  // Early access signup methods
  createEarlyAccessSignup(signup: InsertEarlyAccessSignup): Promise<EarlyAccessSignup>;
  getEarlyAccessSignups(): Promise<EarlyAccessSignup[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private items: Map<number, Item> = new Map();
  private categories: Map<number, Category> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private reviews: Map<number, Review> = new Map();
  
  private currentUserId = 1;
  private currentItemId = 1;
  private currentCategoryId = 1;
  private currentBookingId = 1;
  private currentReviewId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create default categories
    const defaultCategories = [
      { name: "Tools & Equipment", icon: "fas fa-tools", slug: "tools" },
      { name: "Vehicles", icon: "fas fa-car", slug: "vehicles" },
      { name: "Electronics", icon: "fas fa-camera", slug: "electronics" },
      { name: "Home & Garden", icon: "fas fa-home", slug: "home-garden" },
      { name: "Sports & Recreation", icon: "fas fa-bicycle", slug: "sports" },
      { name: "Kitchen", icon: "fas fa-utensils", slug: "kitchen" },
      { name: "Gaming", icon: "fas fa-gamepad", slug: "gaming" },
      { name: "Outdoor", icon: "fas fa-tree", slug: "outdoor" },
      { name: "Cleaning", icon: "fas fa-broom", slug: "cleaning" },
    ];

    // Create some sample items
    const sampleItems = [
      {
        title: "Canon EOS 5D Mark IV Camera",
        description: "Professional DSLR camera perfect for photography enthusiasts. Excellent condition with low shutter count.",
        price: "45.00",
        categoryId: 3, // Electronics
        ownerId: 1,
        images: ["https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=600&fit=crop"],
        location: "San Francisco, CA",
        available: true,
        included: ["Extra battery", "Memory card", "Carrying case", "Lens cap"],
      },
      {
        title: "DeWalt Power Drill Set",
        description: "Complete cordless drill set with multiple bits and charger. Perfect for home improvement projects.",
        price: "25.00",
        categoryId: 1, // Tools
        ownerId: 1,
        images: ["https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&h=600&fit=crop"],
        location: "San Francisco, CA",
        available: true,
        included: ["Drill bits set", "Charger", "Carrying case"],
      },
      {
        title: "Mountain Bike - Trek X-Caliber",
        description: "High-quality mountain bike perfect for trails and city riding. Well-maintained and ready to ride.",
        price: "35.00",
        categoryId: 5, // Sports
        ownerId: 1,
        images: ["https://images.unsplash.com/photo-1544191696-15693072204c?w=800&h=600&fit=crop"],
        location: "San Francisco, CA",
        available: true,
        included: ["Helmet", "Water bottle", "Bike lock"],
      },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = { ...cat, id: this.currentCategoryId++ };
      this.categories.set(category.id, category);
    });

    // Create default user
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "johndoe",
      email: "john@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567890",
      avatar: null,
      rating: "4.9",
      reviewCount: 23,
      responseRate: 100,
      responseTime: "Within 1 hour",
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create sample items
    sampleItems.forEach(itemData => {
      const item: Item = {
        ...itemData,
        id: this.currentItemId++,
        rating: "4.8",
        reviewCount: Math.floor(Math.random() * 20) + 5,
        createdAt: new Date(),
        images: itemData.images || null,
        included: itemData.included || null,
      };
      this.items.set(item.id, item);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      rating: "0",
      reviewCount: 0,
      responseRate: 100,
      responseTime: "Within 1 hour",
      phone: insertUser.phone || null,
      avatar: insertUser.avatar || null,
      stripeAccountId: null,
      paymentSetupComplete: false,
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      ...insertCategory,
      id: this.currentCategoryId++,
    };
    this.categories.set(category.id, category);
    return category;
  }

  // Items
  async getItems(filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string; ownerId?: number; minRating?: number; availability?: string }): Promise<ItemWithDetails[]> {
    let items = Array.from(this.items.values());

    if (filters) {
      if (filters.categoryId) {
        items = items.filter(item => item.categoryId === filters.categoryId);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        items = items.filter(item => 
          item.title.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search)
        );
      }
      if (filters.minPrice) {
        items = items.filter(item => parseFloat(item.price) >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        items = items.filter(item => parseFloat(item.price) <= filters.maxPrice!);
      }
      if (filters.location) {
        items = items.filter(item => 
          item.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      if (filters.ownerId) {
        items = items.filter(item => item.ownerId === filters.ownerId);
      }
      if (filters.minRating) {
        items = items.filter(item => (item.rating || 0) >= filters.minRating!);
      }
      if (filters.availability) {
        items = items.filter(item => item.availabilityStatus === filters.availability);
      }
    }

    const itemsWithDetails: ItemWithDetails[] = [];
    for (const item of items) {
      const owner = await this.getUser(item.ownerId);
      const category = await this.getCategory(item.categoryId);
      if (owner && category) {
        itemsWithDetails.push({ ...item, owner, category });
      }
    }

    return itemsWithDetails;
  }

  async getItemsPaginated(options: { filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string; ownerId?: number }; sortBy?: string; page: number; limit: number }): Promise<{ items: ItemWithDetails[]; total: number }> {
    // For MemStorage, use the existing getItems method and add pagination/sorting in memory
    const allItems = await this.getItems(options.filters);
    
    // Apply sorting
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'price-low':
          allItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price-high':
          allItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'rating':
          allItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'newest':
          allItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          break;
      }
    }

    const total = allItems.length;
    const offset = (options.page - 1) * options.limit;
    const items = allItems.slice(offset, offset + options.limit);

    return { items, total };
  }

  async getItem(id: number): Promise<ItemWithDetails | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const owner = await this.getUser(item.ownerId);
    const category = await this.getCategory(item.categoryId);
    
    if (!owner || !category) return undefined;

    return { ...item, owner, category };
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const item: Item = {
      ...insertItem,
      id: this.currentItemId++,
      rating: "0",
      reviewCount: 0,
      createdAt: new Date(),
      images: insertItem.images || null,
      available: insertItem.available !== undefined ? insertItem.available : true,
      included: insertItem.included || null,
    };
    this.items.set(item.id, item);
    return item;
  }

  async updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  // Bookings
  async getBookings(userId?: number): Promise<BookingWithDetails[]> {
    let bookings = Array.from(this.bookings.values());

    if (userId) {
      bookings = bookings.filter(booking => booking.renterId === userId);
    }

    const bookingsWithDetails: BookingWithDetails[] = [];
    for (const booking of bookings) {
      const item = await this.getItem(booking.itemId);
      const renter = await this.getUser(booking.renterId);
      if (item && renter) {
        bookingsWithDetails.push({ ...booking, item, renter });
      }
    }

    return bookingsWithDetails;
  }

  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const item = await this.getItem(booking.itemId);
    const renter = await this.getUser(booking.renterId);
    
    if (!item || !renter) return undefined;

    return { ...booking, item, renter };
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: this.currentBookingId++,
      status: "pending",
      createdAt: new Date(),
      message: insertBooking.message || null,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Reviews
  async getReviews(itemId?: number, userId?: number): Promise<Review[]> {
    let reviews = Array.from(this.reviews.values());

    if (itemId) {
      const bookings = Array.from(this.bookings.values()).filter(b => b.itemId === itemId);
      const bookingIds = bookings.map(b => b.id);
      reviews = reviews.filter(review => bookingIds.includes(review.bookingId));
    }

    if (userId) {
      reviews = reviews.filter(review => review.revieweeId === userId);
    }

    return reviews;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      ...insertReview,
      id: this.currentReviewId++,
      createdAt: new Date(),
      comment: insertReview.comment || null,
    };
    this.reviews.set(review.id, review);
    return review;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getItems(filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string; ownerId?: number; minRating?: number; availability?: string }): Promise<ItemWithDetails[]> {
    // Get items that don't have approved bookings (simpler approach)
    const approvedBookings = await db
      .select({ itemId: bookings.itemId })
      .from(bookings)
      .where(eq(bookings.status, 'approved'));
    
    const approvedItemIds = approvedBookings.map(b => b.itemId);

    let query = db
      .select()
      .from(items)
      .innerJoin(users, eq(items.ownerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id));
    
    // Apply where conditions
    const conditions = [];
    
    // Exclude approved items
    if (approvedItemIds.length > 0) {
      conditions.push(notInArray(items.id, approvedItemIds));
    }

    // Apply filters
    if (filters) {
      if (filters.categoryId) {
        conditions.push(eq(items.categoryId, filters.categoryId));
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        conditions.push(
          or(
            ilike(items.title, `%${search}%`),
            ilike(items.description, `%${search}%`)
          )
        );
      }
      if (filters.minPrice) {
        conditions.push(gte(items.price, filters.minPrice.toString()));
      }
      if (filters.maxPrice) {
        conditions.push(lte(items.price, filters.maxPrice.toString()));
      }
      if (filters.location) {
        conditions.push(ilike(items.location, `%${filters.location}%`));
      }
      if (filters.ownerId) {
        conditions.push(eq(items.ownerId, filters.ownerId));
      }
      if (filters.minRating) {
        conditions.push(gte(users.rating, filters.minRating));
      }
      if (filters.availability) {
        conditions.push(eq(items.availabilityStatus, filters.availability));
      }
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;

    return result
      .filter(row => row.items && row.users && row.categories)
      .map(row => ({
        ...row.items!,
        rating: row.users!.rating, // Use owner's current rating instead of cached item rating
        reviewCount: row.users!.reviewCount, // Use owner's current review count
        owner: row.users!,
        category: row.categories!,
      }));
  }

  // Simplified pagination method that works reliably
  async getItemsPaginated(options: { filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string; ownerId?: number; minRating?: number; availability?: string }; sortBy?: string; page: number; limit: number }): Promise<{ items: ItemWithDetails[]; total: number }> {
    // Use the existing working getItems method and handle pagination in JavaScript
    const allItems = await this.getItems(options.filters);
    
    // Apply sorting if needed
    let sortedItems = [...allItems];
    if (options.sortBy) {
      switch (options.sortBy) {
        case 'price-low':
          sortedItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price-high':
          sortedItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'rating':
          sortedItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'newest':
          sortedItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          break;
        default:
          break;
      }
    }
    
    // Apply pagination
    const offset = (options.page - 1) * options.limit;
    const paginatedItems = sortedItems.slice(offset, offset + options.limit);
    
    return {
      items: paginatedItems,
      total: sortedItems.length
    };
  }

  async getItem(id: number): Promise<ItemWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(items)
      .leftJoin(users, eq(items.ownerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.id, id));

    if (!result?.items || !result?.users || !result?.categories) return undefined;

    return {
      ...result.items,
      rating: result.users.rating,
      reviewCount: result.users.reviewCount,
      owner: result.users,
      category: result.categories,
    };
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    // Calculate availability status based on available from date
    const availabilityStatus = calculateAvailabilityStatus(insertItem.availableFrom);
    
    const [item] = await db
      .insert(items)
      .values({
        ...insertItem,
        availabilityStatus
      })
      .returning();
    return item;
  }

  async updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
    // If availableFrom is being updated, recalculate availability status
    if (updates.availableFrom !== undefined) {
      updates.availabilityStatus = calculateAvailabilityStatus(updates.availableFrom);
    }
    
    const [item] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    return item || undefined;
  }

  async deleteItem(id: number): Promise<boolean> {
    try {
      // First delete all related records that reference this item
      await db.delete(userInteractions).where(eq(userInteractions.itemId, id));
      
      // Delete all bookings for this item (including historical ones)
      await db.delete(bookings).where(eq(bookings.itemId, id));
      
      // Then delete the item itself
      const result = await db.delete(items).where(eq(items.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  async getBookings(userId?: number): Promise<BookingWithDetails[]> {
    const query = db
      .select()
      .from(bookings)
      .leftJoin(items, eq(bookings.itemId, items.id))
      .leftJoin(users, eq(bookings.renterId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id));

    let result = await query;

    if (userId) {
      result = result.filter(row => row.bookings?.renterId === userId);
    }

    return result
      .filter(row => row.bookings && row.items && row.users && row.categories)
      .map(row => ({
        ...row.bookings!,
        item: {
          ...row.items!,
          owner: row.users!,
          category: row.categories!,
        },
        renter: row.users!,
      }));
  }

  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(items, eq(bookings.itemId, items.id))
      .leftJoin(users, eq(bookings.renterId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(bookings.id, id));

    if (!result?.bookings || !result?.items || !result?.users || !result?.categories) return undefined;

    return {
      ...result.bookings,
      item: {
        ...result.items,
        owner: result.users,
        category: result.categories,
      },
      renter: result.users,
    };
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async getReviews(itemId?: number, userId?: number): Promise<any[]> {
    if (itemId) {
      const itemBookings = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.itemId, itemId));
      
      const bookingIds = itemBookings.map(b => b.id);
      if (bookingIds.length === 0) return [];
      
      const reviewsWithReviewers = await db
        .select({
          review: reviews,
          reviewer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.bookingId, bookingIds[0]));

      return reviewsWithReviewers.map(r => ({
        ...r.review,
        reviewer: r.reviewer
      }));
    }
    
    if (userId) {
      const reviewsWithReviewers = await db
        .select({
          review: reviews,
          reviewer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.revieweeId, userId));

      return reviewsWithReviewers.map(r => ({
        ...r.review,
        reviewer: r.reviewer
      }));
    }

    const reviewsWithReviewers = await db
      .select({
        review: reviews,
        reviewer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id));

    return reviewsWithReviewers.map(r => ({
      ...r.review,
      reviewer: r.reviewer
    }));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  // User Interactions (for recommendations)
  async getUserInteractions(userId: number): Promise<UserInteraction[]> {
    return await db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.createdAt));
  }

  async createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction> {
    const [result] = await db
      .insert(userInteractions)
      .values(interaction)
      .returning();
    return result;
  }

  // User Preferences (for recommendations)
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [result] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return result || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [result] = await db
      .insert(userPreferences)
      .values(preferences)
      .returning();
    return result;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const [result] = await db
      .update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return result || undefined;
  }

  async getRentalMessages(bookingId: number): Promise<RentalMessage[]> {
    return await db
      .select()
      .from(rentalMessages)
      .where(eq(rentalMessages.bookingId, bookingId))
      .orderBy(rentalMessages.createdAt);
  }

  async createRentalMessage(message: InsertRentalMessage): Promise<RentalMessage> {
    const [newMessage] = await db
      .insert(rentalMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getPaymentReminders(userId: number): Promise<PaymentReminder[]> {
    return await db
      .select()
      .from(paymentReminders)
      .where(and(eq(paymentReminders.userId, userId), eq(paymentReminders.resolved, false)))
      .orderBy(desc(paymentReminders.createdAt));
  }

  async createPaymentReminder(reminder: InsertPaymentReminder): Promise<PaymentReminder> {
    const [paymentReminder] = await db
      .insert(paymentReminders)
      .values(reminder)
      .returning();
    return paymentReminder;
  }

  async updatePaymentReminder(id: number, updates: Partial<PaymentReminder>): Promise<PaymentReminder | undefined> {
    const [reminder] = await db
      .update(paymentReminders)
      .set(updates)
      .where(eq(paymentReminders.id, id))
      .returning();
    return reminder || undefined;
  }

  async getUsersWithPendingEarnings(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(gt(users.pendingEarnings, "0"), eq(users.paymentSetupComplete, false)));
  }

  // Review Prompts
  async getReviewPrompts(userId: number): Promise<any[]> {
    return await db
      .select({
        id: reviewPrompts.id,
        bookingId: reviewPrompts.bookingId,
        targetUserId: reviewPrompts.targetUserId,
        role: reviewPrompts.role,
        targetUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        item: {
          id: items.id,
          title: items.title,
        },
      })
      .from(reviewPrompts)
      .innerJoin(users, eq(reviewPrompts.targetUserId, users.id))
      .innerJoin(bookings, eq(reviewPrompts.bookingId, bookings.id))
      .innerJoin(items, eq(bookings.itemId, items.id))
      .where(
        and(
          eq(reviewPrompts.userId, userId),
          eq(reviewPrompts.isPrompted, false),
          eq(reviewPrompts.isCompleted, false)
        )
      )
      .orderBy(desc(reviewPrompts.createdAt));
  }

  async createReviewPrompt(prompt: InsertReviewPrompt): Promise<ReviewPrompt> {
    const [result] = await db
      .insert(reviewPrompts)
      .values(prompt)
      .returning();
    return result;
  }

  async updateReviewPrompt(id: number, updates: Partial<ReviewPrompt>): Promise<ReviewPrompt | undefined> {
    const [result] = await db
      .update(reviewPrompts)
      .set(updates)
      .where(eq(reviewPrompts.id, id))
      .returning();
    return result || undefined;
  }

  async deleteReviewPrompt(id: number): Promise<boolean> {
    const result = await db
      .delete(reviewPrompts)
      .where(eq(reviewPrompts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Item Scans (360° documentation)
  async getItemScansByBooking(bookingId: number): Promise<any[]> {
    const scans = await db
      .select({
        id: itemScans.id,
        bookingId: itemScans.bookingId,
        scanType: itemScans.scanType,
        scanImages: itemScans.scanImages,
        createdAt: itemScans.createdAt,
        userId: itemScans.userId,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(itemScans)
      .leftJoin(users, eq(itemScans.userId, users.id))
      .where(eq(itemScans.bookingId, bookingId))
      .orderBy(desc(itemScans.createdAt));
    
    return scans;
  }

  async createItemScan(scan: InsertItemScan): Promise<ItemScan> {
    const [result] = await db
      .insert(itemScans)
      .values(scan)
      .returning();
    return result;
  }

  // Damage Reports
  async createDamageReport(report: InsertDamageReport): Promise<DamageReport> {
    const [result] = await db
      .insert(damageReports)
      .values(report)
      .returning();
    return result;
  }

  // Additional methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getBookingWithDetails(id: number): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select({
        booking: bookings,
        item: items,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          rating: users.rating,
          reviewCount: users.reviewCount,
          responseRate: users.responseRate,
          responseTime: users.responseTime,
        },
      })
      .from(bookings)
      .leftJoin(items, eq(bookings.itemId, items.id))
      .leftJoin(users, eq(items.ownerId, users.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    return {
      ...result.booking,
      item: result.item!,
      owner: result.owner!,
    };
  }

  // Password reset methods
  async storePasswordResetToken(userId: number, token: string): Promise<void> {
    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
      });
  }

  async verifyPasswordResetToken(token: string): Promise<number | null> {
    const [result] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    if (!result) return null;

    // Check if token is expired
    if (new Date() > result.expiresAt) {
      // Clean up expired token
      await this.deletePasswordResetToken(token);
      return null;
    }

    return result.userId;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Phone verification methods
  async createPhoneVerification(verification: InsertPhoneVerification): Promise<PhoneVerification> {
    const [result] = await db
      .insert(phoneVerifications)
      .values(verification)
      .returning();
    return result;
  }

  async getPhoneVerification(transactionId: string): Promise<PhoneVerification | undefined> {
    const [result] = await db
      .select()
      .from(phoneVerifications)
      .where(eq(phoneVerifications.transactionId, transactionId));
    return result || undefined;
  }

  async updatePhoneVerification(transactionId: string, updates: Partial<PhoneVerification>): Promise<PhoneVerification | undefined> {
    const [result] = await db
      .update(phoneVerifications)
      .set(updates)
      .where(eq(phoneVerifications.transactionId, transactionId))
      .returning();
    return result || undefined;
  }

  async deletePhoneVerification(transactionId: string): Promise<void> {
    await db
      .delete(phoneVerifications)
      .where(eq(phoneVerifications.transactionId, transactionId));
  }

  async updateUserPhoneVerified(userId: number, phoneVerified: boolean): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set({ phoneVerified })
      .where(eq(users.id, userId))
      .returning();
    return result || undefined;
  }

  // Early access signup methods
  async createEarlyAccessSignup(signup: InsertEarlyAccessSignup): Promise<EarlyAccessSignup> {
    const [result] = await db
      .insert(earlyAccessSignups)
      .values(signup)
      .returning();
    return result;
  }

  async getEarlyAccessSignups(): Promise<EarlyAccessSignup[]> {
    return await db
      .select()
      .from(earlyAccessSignups)
      .orderBy(desc(earlyAccessSignups.createdAt));
  }
}

export const storage = new DatabaseStorage();
