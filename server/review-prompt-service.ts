import { db } from "./db";
import { reviewPrompts, bookings, reviews, users, items, type InsertReviewPrompt } from "../shared/schema";
import { eq, and, not, exists } from "drizzle-orm";

export class ReviewPromptService {
  // Create review prompts when a booking is completed
  async createReviewPrompts(bookingId: number) {
    try {
      // Get booking details
      const booking = await db
        .select({
          id: bookings.id,
          renterId: bookings.renterId,
          itemId: bookings.itemId,
          ownerId: items.ownerId,
        })
        .from(bookings)
        .innerJoin(items, eq(bookings.itemId, items.id))
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking[0]) {
        console.log(`Booking ${bookingId} not found for review prompt creation`);
        return;
      }

      const { renterId, ownerId } = booking[0];

      // Create review prompt for renter to review owner
      await db.insert(reviewPrompts).values({
        userId: renterId,
        bookingId: bookingId,
        targetUserId: ownerId,
        role: 'renter',
      });

      // Create review prompt for owner to review renter
      await db.insert(reviewPrompts).values({
        userId: ownerId,
        bookingId: bookingId,
        targetUserId: renterId,
        role: 'owner',
      });

      console.log(`Created review prompts for booking ${bookingId}`);
    } catch (error) {
      console.error('Failed to create review prompts:', error);
    }
  }

  // Get pending review prompts for a user (not yet prompted)
  async getPendingReviewPrompts(userId: number) {
    try {
      // TESTING MODE: Always return a test review prompt for user 2
      if (userId === 2) {
        return [{
          id: 999,
          bookingId: 999,
          targetUserId: 3,
          role: 'renter',
          targetUser: {
            id: 3,
            firstName: 'Epic',
            lastName: 'Swag',
          },
          item: {
            id: 89,
            title: 'Electric Drill Set',
          },
        }];
      }

      const prompts = await db
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
            eq(reviewPrompts.isCompleted, false),
            // Don't prompt if user already left a review for this booking
            not(
              exists(
                db.select()
                  .from(reviews)
                  .where(
                    and(
                      eq(reviews.bookingId, reviewPrompts.bookingId),
                      eq(reviews.reviewerId, userId)
                    )
                  )
              )
            )
          )
        );

      return prompts;
    } catch (error) {
      console.error('Failed to get pending review prompts:', error);
      return [];
    }
  }

  // Mark review prompt as prompted (shown to user)
  async markAsPrompted(promptId: number) {
    try {
      await db
        .update(reviewPrompts)
        .set({ isPrompted: true })
        .where(eq(reviewPrompts.id, promptId));
    } catch (error) {
      console.error('Failed to mark review prompt as prompted:', error);
    }
  }

  // Mark review prompt as completed (user left review)
  async markAsCompleted(bookingId: number, reviewerId: number) {
    try {
      await db
        .update(reviewPrompts)
        .set({ isCompleted: true })
        .where(
          and(
            eq(reviewPrompts.bookingId, bookingId),
            eq(reviewPrompts.userId, reviewerId)
          )
        );
    } catch (error) {
      console.error('Failed to mark review prompt as completed:', error);
    }
  }

  // Dismiss review prompt (user declined to review)
  async dismissPrompt(promptId: number) {
    try {
      await db
        .update(reviewPrompts)
        .set({ isPrompted: true, isCompleted: true })
        .where(eq(reviewPrompts.id, promptId));
    } catch (error) {
      console.error('Failed to dismiss review prompt:', error);
    }
  }
}

export const reviewPromptService = new ReviewPromptService();