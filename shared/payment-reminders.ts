import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./schema";

// Payment setup reminders table
export const paymentReminders = pgTable("payment_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reminderType: text("reminder_type").notNull(), // "payout_blocked", "approval_required", "periodic"
  pendingAmount: text("pending_amount").notNull(), // Store as string to avoid decimal issues
  reminderCount: integer("reminder_count").default(1),
  lastSent: timestamp("last_sent").defaultNow(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PaymentReminder = typeof paymentReminders.$inferSelect;
export type InsertPaymentReminder = typeof paymentReminders.$inferInsert;