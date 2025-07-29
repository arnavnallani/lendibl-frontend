import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./schema.js";
import { bookings } from "./schema.js";

export const rentalMessages = pgTable("rental_messages", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RentalMessage = typeof rentalMessages.$inferSelect;
export type InsertRentalMessage = typeof rentalMessages.$inferInsert;