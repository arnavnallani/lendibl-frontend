import { apiRequest } from "./queryClient";
import type { ItemWithDetails, Category, InsertItem, InsertBooking, BookingWithDetails } from "@shared/schema";

export const api = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    const res = await apiRequest("GET", "/api/categories");
    return res.json();
  },

  // Items
  getItems: async (filters?: {
    categoryId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    page?: number;
    limit?: number;
    ownerId?: number;
    sortBy?: string;
    minRating?: number;
    availability?: string;
  }): Promise<{
    items: ItemWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.set("categoryId", filters.categoryId.toString());
    if (filters?.search) params.set("search", filters.search);
    if (filters?.minPrice) params.set("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
    if (filters?.location) params.set("location", filters.location);
    if (filters?.page) params.set("page", filters.page.toString());
    if (filters?.limit) params.set("limit", filters.limit.toString());
    if (filters?.ownerId) params.set("ownerId", filters.ownerId.toString());
    if (filters?.sortBy) params.set("sortBy", filters.sortBy);
    if (filters?.minRating) params.set("minRating", filters.minRating.toString());
    if (filters?.availability) params.set("availability", filters.availability);

    const url = `/api/items${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiRequest("GET", url);
    return res.json();
  },

  // Get items without pagination (for backward compatibility)
  getItemsSimple: async (filters?: {
    categoryId?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    minRating?: number;
    availability?: string;
  }): Promise<ItemWithDetails[]> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.set("categoryId", filters.categoryId.toString());
    if (filters?.search) params.set("search", filters.search);
    if (filters?.minPrice) params.set("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
    if (filters?.location) params.set("location", filters.location);
    if (filters?.minRating) params.set("minRating", filters.minRating.toString());
    if (filters?.availability) params.set("availability", filters.availability);
    params.set("limit", "1000"); // Get all items

    const url = `/api/items${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiRequest("GET", url);
    const data = await res.json();
    return data.items || data; // Handle both old and new response formats
  },

  getItem: async (id: number): Promise<ItemWithDetails> => {
    const res = await apiRequest("GET", `/api/items/${id}`);
    return res.json();
  },

  getUser: async (id: number) => {
    const res = await apiRequest("GET", `/api/users/${id}`);
    return res.json();
  },

  createItem: async (item: InsertItem): Promise<ItemWithDetails> => {
    // Serialize dates to ISO strings for the API
    const serializedItem = {
      ...item,
      availableFrom: item.availableFrom instanceof Date ? item.availableFrom.toISOString() : item.availableFrom,
      availableTo: item.availableTo instanceof Date ? item.availableTo.toISOString() : item.availableTo,
    };
    const res = await apiRequest("POST", "/api/items", serializedItem);
    return res.json();
  },

  updateItem: async (id: number, item: Partial<InsertItem>): Promise<ItemWithDetails> => {
    const res = await apiRequest("PUT", `/api/items/${id}`, item);
    return res.json();
  },

  deleteItem: async (id: number): Promise<any> => {
    const res = await apiRequest("DELETE", `/api/items/${id}`);
    return res.json();
  },

  // Bookings
  getBookings: async (userId?: number): Promise<BookingWithDetails[]> => {
    const params = userId ? `?userId=${userId}` : "";
    const res = await apiRequest("GET", `/api/bookings${params}`);
    return res.json();
  },

  createBooking: async (booking: InsertBooking): Promise<BookingWithDetails> => {
    const res = await apiRequest("POST", "/api/bookings", booking);
    return res.json();
  },

  updateBooking: async (id: number, updates: { status: string }): Promise<BookingWithDetails> => {
    const res = await apiRequest("PUT", `/api/bookings/${id}`, updates);
    return res.json();
  },

  // Recommendations
  getRecommendations: async (limit?: number): Promise<any> => {
    const params = limit ? `?limit=${limit}` : "";
    const res = await apiRequest("GET", `/api/recommendations${params}`);
    return res.json();
  },

  trackInteraction: async (itemId: number, interactionType: string, weight?: number): Promise<void> => {
    await apiRequest("POST", "/api/interactions", { itemId, interactionType, weight });
  },

  getUserPreferences: async (): Promise<any> => {
    const res = await apiRequest("GET", "/api/preferences");
    return res.json();
  },

  updateUserPreferences: async (preferences: any): Promise<void> => {
    await apiRequest("PUT", "/api/preferences", preferences);
  },

  // Profile
  updateProfile: async (profile: { firstName: string; lastName: string; phone?: string }): Promise<any> => {
    const res = await apiRequest("PUT", "/api/auth/profile", profile);
    return res.json();
  },

  // Payments
  createPaymentIntent: async (amount: number): Promise<any> => {
    const res = await apiRequest("POST", "/api/create-payment-intent", { amount });
    return res.json();
  },

  // Rental Messages
  sendRentalMessage: async (bookingId: number, message: string): Promise<any> => {
    const res = await apiRequest("POST", "/api/rental-messages", { bookingId, message });
    return res.json();
  },

  getRentalMessages: async (bookingId: number): Promise<any[]> => {
    const res = await apiRequest("GET", `/api/rental-messages/${bookingId}`);
    return res.json();
  },

  // Reviews
  getReviews: async (filters?: { itemId?: number; userId?: number }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.itemId) params.set("itemId", filters.itemId.toString());
    if (filters?.userId) params.set("userId", filters.userId.toString());
    
    const url = `/api/reviews${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await apiRequest("GET", url);
    return res.json();
  },

  // Item Protection Workflow
  saveItemScan: async (scanData: {
    rentalId: number;
    images: string[];
    notes: string;
    scannedAt: string;
  }): Promise<any> => {
    const res = await apiRequest("POST", "/api/item-scans", scanData);
    return res.json();
  },

  getItemScan: async (rentalId: number): Promise<any> => {
    const res = await apiRequest("GET", `/api/item-scans/${rentalId}`);
    return res.json();
  },

  submitMisbehaviorReport: async (reportData: {
    incidentType: string;
    description: string;
    agreesToTerms: boolean;
    rentalId?: number;
    itemTitle?: string;
    reporterRole: 'owner' | 'renter';
    submittedAt: string;
  }): Promise<any> => {
    const res = await apiRequest("POST", "/api/misbehavior-reports", reportData);
    return res.json();
  },
};
