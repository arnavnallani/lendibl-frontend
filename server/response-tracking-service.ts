import { db } from "./db";
import { bookings, users, items } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ResponseTrackingService {
  /**
   * Calculate response rate and average response time for a user
   */
  async calculateUserResponseMetrics(userId: number): Promise<{
    responseRate: number;
    avgResponseTimeHours: number;
    avgResponseTimeText: string;
  }> {
    try {
      // Get all bookings where this user is the owner (received requests)
      const ownerBookings = await db
        .select()
        .from(bookings)
        .leftJoin(items, eq(bookings.itemId, items.id))
        .leftJoin(users, eq(bookings.renterId, users.id))
        .where(eq(items.ownerId, userId));

      if (ownerBookings.length === 0) {
        return {
          responseRate: 100,
          avgResponseTimeHours: 1,
          avgResponseTimeText: "Within 1 hour"
        };
      }

      // Calculate response rate
      const totalRequests = ownerBookings.length;
      const respondedRequests = ownerBookings.filter(
        row => row.bookings?.ownerRespondedAt !== null
      ).length;
      const responseRate = Math.round((respondedRequests / totalRequests) * 100);

      // Calculate average response time for responded requests
      const respondedBookings = ownerBookings.filter(
        row => row.bookings?.ownerRespondedAt && row.bookings?.requestSentAt
      );

      if (respondedBookings.length === 0) {
        return {
          responseRate,
          avgResponseTimeHours: 1,
          avgResponseTimeText: "Within 1 hour"
        };
      }

      const totalResponseTimeMs = respondedBookings.reduce((sum, row) => {
        const sentAt = new Date(row.bookings!.requestSentAt!).getTime();
        const respondedAt = new Date(row.bookings!.ownerRespondedAt!).getTime();
        return sum + (respondedAt - sentAt);
      }, 0);

      const avgResponseTimeMs = totalResponseTimeMs / respondedBookings.length;
      const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

      // Convert to human readable format
      let avgResponseTimeText: string;
      if (avgResponseTimeHours < 1) {
        const minutes = Math.round(avgResponseTimeMs / (1000 * 60));
        avgResponseTimeText = `Within ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else if (avgResponseTimeHours < 24) {
        const hours = Math.round(avgResponseTimeHours);
        avgResponseTimeText = `Within ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        const days = Math.round(avgResponseTimeHours / 24);
        avgResponseTimeText = `Within ${days} day${days > 1 ? 's' : ''}`;
      }

      return {
        responseRate,
        avgResponseTimeHours,
        avgResponseTimeText
      };
    } catch (error) {
      console.error('Error calculating response metrics:', error);
      return {
        responseRate: 100,
        avgResponseTimeHours: 1,
        avgResponseTimeText: "Within 1 hour"
      };
    }
  }

  /**
   * Update response metrics for a user in the database
   */
  async updateUserResponseMetrics(userId: number): Promise<void> {
    try {
      const metrics = await this.calculateUserResponseMetrics(userId);
      
      await db
        .update(users)
        .set({
          responseRate: metrics.responseRate,
          responseTime: metrics.avgResponseTimeText
        })
        .where(eq(users.id, userId));

      console.log(`Updated response metrics for user ${userId}: ${metrics.responseRate}% rate, ${metrics.avgResponseTimeText}`);
    } catch (error) {
      console.error('Error updating response metrics:', error);
    }
  }

  /**
   * Mark when owner responds to a booking request
   */
  async markOwnerResponse(bookingId: number): Promise<void> {
    try {
      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (booking.length === 0) return;

      const bookingData = booking[0];
      
      // Only set response time if not already set
      if (!bookingData.ownerRespondedAt) {
        await db
          .update(bookings)
          .set({
            ownerRespondedAt: new Date()
          })
          .where(eq(bookings.id, bookingId));

        // Get owner ID through item
        const itemResult = await db
          .select({ ownerId: items.ownerId })
          .from(items)
          .where(eq(items.id, bookingData.itemId))
          .limit(1);

        if (itemResult.length > 0) {
          // Update owner's response metrics
          await this.updateUserResponseMetrics(itemResult[0].ownerId);
        }
      }
    } catch (error) {
      console.error('Error marking owner response:', error);
    }
  }

  /**
   * Recalculate all user response metrics (can be run periodically)
   */
  async recalculateAllUserMetrics(): Promise<void> {
    try {
      const allUsers = await db.select({ id: users.id }).from(users);
      
      for (const user of allUsers) {
        await this.updateUserResponseMetrics(user.id);
      }

      console.log(`Recalculated response metrics for ${allUsers.length} users`);
    } catch (error) {
      console.error('Error recalculating all metrics:', error);
    }
  }
}

export const responseTrackingService = new ResponseTrackingService();