import { db } from "./db";
import { notifications, users } from "@shared/schema";
import type { InsertNotification } from "@shared/schema";
import { eq } from "drizzle-orm";
import { pushNotificationService } from './push-service';

export interface NotificationData {
  userId: number;
  type: 'booking_request' | 'booking_approved' | 'booking_declined' | 'rental_started' | 'rental_ended' | 'payment_received' | 'listing_published';
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: number;
}

export class NotificationService {
  async createNotification(data: NotificationData) {
    try {
      // Insert notification into database
      const [notification] = await db.insert(notifications).values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        relatedId: data.relatedId,
        read: false,
      }).returning();

      // Send real-time notification via WebSocket if connected
      this.sendRealTimeNotification(data.userId, {
        id: notification.id,
        ...data,
        read: false,
        createdAt: notification.createdAt,
      });

      // Send push notification to device
      await pushNotificationService.sendPushToUser(data.userId, {
        title: data.title,
        body: data.message,
        actionUrl: data.actionUrl,
        data: {
          notificationId: notification.id,
          type: data.type,
          relatedId: data.relatedId,
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: number, userId: number) {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: number) {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: number, limit: number = 50) {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(notifications.createdAt)
        .limit(limit);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      const result = await db
        .select({ count: notifications.id })
        .from(notifications)
        .where(eq(notifications.userId, userId));
      
      return result.filter(n => !n.count).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  private sendRealTimeNotification(userId: number, notification: any) {
    // This integrates with the existing WebSocket system in routes.ts
    if (global.clientConnections && global.clientConnections.has(userId)) {
      const connections = global.clientConnections.get(userId);
      connections?.forEach((ws: any) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(JSON.stringify({
            type: 'notification',
            data: notification
          }));
        }
      });
    }
  }

  // Push notifications are now handled by pushNotificationService

  // Helper methods for specific notification types
  async notifyBookingRequest(ownerId: number, renterName: string, itemTitle: string, bookingId: number) {
    return this.createNotification({
      userId: ownerId,
      type: 'booking_request',
      title: 'New Rental Request',
      message: `${renterName} wants to rent your ${itemTitle}`,
      actionUrl: '/action-dashboard',
      relatedId: bookingId,
    });
  }

  async notifyBookingApproved(renterId: number, itemTitle: string, bookingId: number) {
    return this.createNotification({
      userId: renterId,
      type: 'booking_approved',
      title: 'Rental Request Approved',
      message: `Your request to rent ${itemTitle} has been approved!`,
      actionUrl: '/action-dashboard',
      relatedId: bookingId,
    });
  }

  async notifyBookingDeclined(renterId: number, itemTitle: string, bookingId: number) {
    return this.createNotification({
      userId: renterId,
      type: 'booking_declined',
      title: 'Rental Request Declined',
      message: `Your request to rent ${itemTitle} was declined`,
      actionUrl: '/',
      relatedId: bookingId,
    });
  }

  async notifyRentalStarted(renterId: number, ownerId: number, itemTitle: string, bookingId: number) {
    await Promise.all([
      this.createNotification({
        userId: renterId,
        type: 'rental_started',
        title: 'Rental Period Started',
        message: `Your rental of ${itemTitle} has begun`,
        actionUrl: '/action-dashboard',
        relatedId: bookingId,
      }),
      this.createNotification({
        userId: ownerId,
        type: 'rental_started',
        title: 'Rental Period Started',
        message: `Rental of your ${itemTitle} has begun`,
        actionUrl: '/action-dashboard',
        relatedId: bookingId,
      })
    ]);
  }

  async notifyRentalEnded(renterId: number, ownerId: number, itemTitle: string, bookingId: number) {
    await Promise.all([
      this.createNotification({
        userId: renterId,
        type: 'rental_ended',
        title: 'Rental Completed',
        message: `Your rental of ${itemTitle} has ended`,
        actionUrl: '/action-dashboard',
        relatedId: bookingId,
      }),
      this.createNotification({
        userId: ownerId,
        type: 'rental_ended',
        title: 'Rental Completed',
        message: `Rental of your ${itemTitle} has ended`,
        actionUrl: '/action-dashboard',
        relatedId: bookingId,
      })
    ]);
  }

  async notifyPaymentReceived(ownerId: number, amount: string, itemTitle: string, bookingId: number) {
    return this.createNotification({
      userId: ownerId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `You received $${amount} for renting your ${itemTitle}`,
      actionUrl: '/my-profile',
      relatedId: bookingId,
    });
  }
}

export const notificationService = new NotificationService();

// Global type declarations
declare global {
  var clientConnections: Map<number, Set<any>> | undefined;
  var pendingPushNotifications: Map<number, any[]> | undefined;
}