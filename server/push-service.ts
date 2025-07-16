import webpush from 'web-push';
import { db } from './db';
import { users, pushSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// VAPID keys for web push (you'll need to generate these)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivyIebhds3LIwzuAHAiQrNfVOfGyyqugUScaFMhBGqfVSzX6kA0xwexo1XLb2kON1x2LuOW0v2Gjo';
const VAPID_PRIVATE_KEY = 'YJTpDwq2ItjJJ7nWpE1hfMgZ0Q8rQ1c5vL8dF4gHkWo';

// Configure web-push
webpush.setVapidDetails(
  'mailto:support@lendibl.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actionUrl?: string;
}

export class PushNotificationService {
  
  async saveSubscription(userId: number, subscription: any) {
    try {
      console.log(`💾 Saving push subscription for user ${userId}:`, subscription);
      
      // Save or update push subscription for user
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        subscriptionData: JSON.stringify(subscription)
      }).onConflictDoUpdate({
        target: pushSubscriptions.userId,
        set: {
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          subscriptionData: JSON.stringify(subscription),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Push subscription saved successfully for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save push subscription:', error);
      return false;
    }
  }

  async sendPushToUser(userId: number, notificationData: PushNotificationData) {
    try {
      console.log(`🔍 Looking for push subscription for user ${userId}...`);
      
      // Get user's push subscription
      const [subscription] = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      if (!subscription) {
        console.log(`❌ No push subscription found for user ${userId}`);
        
        // Debug: Check what subscriptions exist
        const allSubscriptions = await db.select().from(pushSubscriptions);
        console.log(`📊 Total subscriptions in database: ${allSubscriptions.length}`);
        
        return false;
      }
      
      console.log(`✅ Found push subscription for user ${userId}`);

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey
        }
      };

      const payload = JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon || '/icon-192.svg',
        badge: notificationData.badge || '/favicon.ico',
        data: {
          url: notificationData.actionUrl || '/',
          ...notificationData.data
        }
      });

      await webpush.sendNotification(pushSubscription, payload);
      console.log(`Push notification sent to user ${userId}: ${notificationData.title}`);
      return true;
    } catch (error) {
      console.error(`Failed to send push notification to user ${userId}:`, error);
      
      // If subscription is invalid, remove it
      if (error.statusCode === 410) {
        await this.removeSubscription(userId);
      }
      return false;
    }
  }

  async removeSubscription(userId: number) {
    try {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
      console.log(`Removed invalid push subscription for user ${userId}`);
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
    }
  }

  async sendToMultipleUsers(userIds: number[], notificationData: PushNotificationData) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendPushToUser(userId, notificationData))
    );
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    console.log(`Push notifications sent: ${successful}/${userIds.length} successful`);
    
    return successful;
  }

  // Generate new VAPID keys (run once to get your keys)
  static generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }
}

export const pushNotificationService = new PushNotificationService();