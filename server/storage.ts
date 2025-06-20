import { users, items, categories, bookings, reviews, type User, type InsertUser, type Item, type InsertItem, type Category, type InsertCategory, type Booking, type InsertBooking, type Review, type InsertReview, type ItemWithDetails, type BookingWithDetails } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

export const storage = new MemStorage();
