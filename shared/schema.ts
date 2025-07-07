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

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "booking_request", "booking_approved", "rental_started", "rental_ended", "payment_received"
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"), // URL to navigate when clicked
  relatedId: integer("related_id"), // booking ID, item ID, etc.
  read: boolean("read").default(false),
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
  debitCardLast4: text("debit_card_last4"),
  debitCardBrand: text("debit_card_brand"),
  debitCardExpMonth: integer("debit_card_exp_month"),
  debitCardExpYear: integer("debit_card_exp_year"),
  debitCardPaymentMethodId: text("debit_card_payment_method_id"),
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
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }), // Current market value for AI pricing
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  images: text("images").array().default([]),
  location: text("location").notNull(), // Keep for backward compatibility
  address: text("address").default(""),
  city: text("city").default(""),
  state: text("state").default(""),
  zipCode: text("zip_code").default(""),
  available: boolean("available").default(true),
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
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
  refundId: text("refund_id"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"), // 'cancelled', 'not_approved', 'timeout'
  paymentMethodId: text("payment_method_id"), // Store the payment method used for refund
  requestSentAt: timestamp("request_sent_at").defaultNow(), // When request was sent to owner
  ownerRespondedAt: timestamp("owner_responded_at"), // When owner first responded (approve/decline)
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

export const insertRentalMessageSchema = createInsertSchema(rentalMessages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const reviewPrompts = pgTable("review_prompts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  targetUserId: integer("target_user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // 'renter' or 'owner'
  isPrompted: boolean("is_prompted").default(false),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewPromptSchema = createInsertSchema(reviewPrompts).omit({
  id: true,
  createdAt: true,
});

export const itemScans = pgTable("item_scans", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  scanType: text("scan_type").notNull(), // 'pre_rental', 'post_rental'
  scanImages: text("scan_images").array().notNull(), // Array of image URLs from 360 scan
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const insertItemScanSchema = createInsertSchema(itemScans).omit({
  id: true,
  createdAt: true,
});

export const damageReports = pgTable("damage_reports", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  reporterType: text("reporter_type").notNull(), // 'owner' or 'renter'
  description: text("description").notNull(),
  images: text("images").array(),
  status: text("status").default("pending"), // 'pending', 'investigating', 'resolved'
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment methods table for storing credit card information
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripePaymentMethodId: text("stripe_payment_method_id").notNull(),
  last4: text("last_4").notNull(),
  brand: text("brand").notNull(),
  expMonth: integer("exp_month").notNull(),
  expYear: integer("exp_year").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDamageReportSchema = createInsertSchema(damageReports).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
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

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ReviewPrompt = typeof reviewPrompts.$inferSelect;
export type InsertReviewPrompt = z.infer<typeof insertReviewPromptSchema>;

export type ItemScan = typeof itemScans.$inferSelect;
export type InsertItemScan = z.infer<typeof insertItemScanSchema>;

export type DamageReport = typeof damageReports.$inferSelect;
export type InsertDamageReport = z.infer<typeof insertDamageReportSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// Extended types for API responses
export type ItemWithDetails = Item & {
  owner: User;
  category: Category;
};

export type BookingWithDetails = Booking & {
  item: ItemWithDetails;
  renter: User;
};
