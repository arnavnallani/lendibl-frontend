import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Payment setup reminders table
export const paymentReminders = pgTable("payment_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reminderType: text("reminder_type").notNull(), // "payout_blocked", "approval_required", "periodic"
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).notNull(),
  reminderCount: integer("reminder_count").default(1),
  lastSent: timestamp("last_sent").defaultNow(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  responseRate: integer("response_rate").default(100),
  responseTime: text("response_time").default("Within 1 hour"),
  stripeAccountId: text("stripe_account_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  paymentSetupComplete: boolean("payment_setup_complete").default(false),
  pendingEarnings: decimal("pending_earnings", { precision: 10, scale: 2 }).default("0"),
  paymentSetupReminders: integer("payment_setup_reminders").default(0),
  lastPaymentReminder: timestamp("last_payment_reminder"),
  paypalEmail: text("paypal_email"),
  paypalAccountId: text("paypal_account_id"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  slug: text("slug").notNull().unique(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  images: text("images").array().default([]),
  location: text("location").notNull(),
  available: boolean("available").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  included: text("included").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  renterId: integer("renter_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).default("0"),
  ownerPayout: decimal("owner_payout", { precision: 10, scale: 2 }).default("0"),
  status: text("status").notNull().default("pending"), // pending, approved, declined, in_progress, completed, cancelled
  message: text("message"),
  paymentConfirmed: boolean("payment_confirmed").default(false),
  paymentIntentId: text("payment_intent_id"),
  paymentCaptured: boolean("payment_captured").default(false),
  payoutScheduled: timestamp("payout_scheduled"),
  payoutCompleted: timestamp("payout_completed"),
  payoutBlocked: boolean("payout_blocked").default(false),
  payoutBlockReason: text("payout_block_reason"),
  stripeTransferId: text("stripe_transfer_id"),
  payoutNote: text("payout_note"),
  refundIssued: boolean("refund_issued").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rentalMessages = pgTable("rental_messages", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  revieweeId: integer("reviewee_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User interaction tracking for recommendations
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  interactionType: text("interaction_type").notNull(), // view, search, bookmark, rent
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences for better recommendations
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  preferredCategories: integer("preferred_categories").array().default([]),
  priceRangeMin: decimal("price_range_min", { precision: 10, scale: 2 }),
  priceRangeMax: decimal("price_range_max", { precision: 10, scale: 2 }),
  preferredLocations: text("preferred_locations").array().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  rating: true,
  reviewCount: true,
  responseRate: true,
  responseTime: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentReminderSchema = createInsertSchema(paymentReminders).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type RentalMessage = typeof rentalMessages.$inferSelect;
export type InsertRentalMessage = z.infer<typeof insertRentalMessageSchema>;

export type PaymentReminder = typeof paymentReminders.$inferSelect;
export type InsertPaymentReminder = z.infer<typeof insertPaymentReminderSchema>;

// Extended types for API responses
export type ItemWithDetails = Item & {
  owner: User;
  category: Category;
};

export type BookingWithDetails = Booking & {
  item: ItemWithDetails;
  renter: User;
};
