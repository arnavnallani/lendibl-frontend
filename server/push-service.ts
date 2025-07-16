import webpush from 'web-push';
import { db } from './db';
import { users, pushSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// VAPID keys for web push (generated using web-push)
const VAPID_PUBLIC_KEY = 'BL3rHN5Zb_fIiGqdZz-DZvbDaSvsPw0sD0pFnBNhRf5Y82Yfb4MxOcAtvneR4o4m-EU3Kxa_of1w4gVCrpG6RE8';
const VAPID_PRIVATE_KEY = 'hJ3KLrBtPNHX3FCvRcHt6giAv8zl2BG-zUYrz_o7cDY';

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
        
        return { success: false, message: "No push subscription found for this user" };
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
      console.log(`✅ Push notification sent successfully to user ${userId}: ${notificationData.title}`);
      return { success: true, message: "Push notification sent successfully" };
    } catch (error) {
      console.error(`❌ Error sending push notification to user ${userId}:`, error);
      console.error(`❌ Error details:`, error.body || error.message);
      
      // If subscription is invalid, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`🗑️ Removing invalid subscription for user ${userId}`);
        await this.removeSubscription(userId);
        return { success: false, message: "Push subscription expired. Please re-enable notifications." };
      }
      
      return { success: false, message: `Failed to send push notification: ${error.message}` };
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