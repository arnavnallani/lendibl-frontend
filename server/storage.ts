import { users, items, categories, bookings, reviews, userInteractions, userPreferences, type User, type InsertUser, type Item, type InsertItem, type Category, type InsertCategory, type Booking, type InsertBooking, type Review, type InsertReview, type UserInteraction, type InsertUserInteraction, type UserPreferences, type InsertUserPreferences, type ItemWithDetails, type BookingWithDetails } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Items
  getItems(filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string }): Promise<ItemWithDetails[]>;
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
  getReviews(itemId?: number, userId?: number): Promise<Review[]>;
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
    };
    this.users.set(user.id, user);
    return user;
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
  async getItems(filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string }): Promise<ItemWithDetails[]> {
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

  async getItems(filters?: { categoryId?: number; search?: string; minPrice?: number; maxPrice?: number; location?: string }): Promise<ItemWithDetails[]> {
    const query = db
      .select()
      .from(items)
      .leftJoin(users, eq(items.ownerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id));

    let result = await query;

    if (filters) {
      result = result.filter(row => {
        const item = row.items;
        if (!item) return false;

        if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          if (!item.title.toLowerCase().includes(search) && 
              !item.description.toLowerCase().includes(search)) return false;
        }
        if (filters.minPrice && parseFloat(item.price) < filters.minPrice) return false;
        if (filters.maxPrice && parseFloat(item.price) > filters.maxPrice) return false;
        if (filters.location && !item.location.toLowerCase().includes(filters.location.toLowerCase())) return false;

        return true;
      });
    }

    return result
      .filter(row => row.items && row.users && row.categories)
      .map(row => ({
        ...row.items!,
        owner: row.users!,
        category: row.categories!,
      }));
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
      owner: result.users,
      category: result.categories,
    };
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
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

  async getReviews(itemId?: number, userId?: number): Promise<Review[]> {
    if (itemId) {
      const itemBookings = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.itemId, itemId));
      
      const bookingIds = itemBookings.map(b => b.id);
      if (bookingIds.length === 0) return [];
      
      return await db.select().from(reviews).where(eq(reviews.bookingId, bookingIds[0]));
    }
    
    if (userId) {
      return await db.select().from(reviews).where(eq(reviews.revieweeId, userId));
    }

    return await db.select().from(reviews);
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
}

export const storage = new DatabaseStorage();
