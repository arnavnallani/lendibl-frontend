import type { Express } from "express";
import { pushNotificationService } from "../push-service";
import { authenticateToken, type AuthRequest } from "../auth";

export function registerPushRoutes(app: Express) {
  // Subscribe to push notifications
  app.post("/api/push-subscribe", authenticateToken, async (req: AuthRequest, res) => {
    console.log(`🔔 Push subscribe request from user ${req.user?.id}`);
    
    try {
      const subscription = req.body;
      console.log('📝 Subscription data received:', JSON.stringify(subscription, null, 2));
      
      // Validate subscription data
      if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        console.log('❌ Invalid subscription data format');
        return res.status(400).json({ error: "Invalid subscription data format" });
      }
      
      console.log(`💾 Attempting to save subscription for user ${req.user.id}...`);
      
      const success = await pushNotificationService.saveSubscription(req.user.id, subscription);
      
      if (success) {
        console.log(`✅ Push subscription saved successfully for user ${req.user.id}`);
        res.json({ success: true, message: "Push subscription saved" });
      } else {
        console.log(`❌ Failed to save push subscription for user ${req.user.id}`);
        res.status(500).json({ error: "Failed to save push subscription" });
      }
    } catch (error) {
      console.error("❌ Push subscribe error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test push notification (for development)
  app.post("/api/push-test", authenticateToken, async (req: AuthRequest, res) => {
    console.log(`🧪 Push test request from user ${req.user?.id}`);
    
    try {
      const success = await pushNotificationService.sendPushToUser(req.user.id, {
        title: "Test Notification",
        body: "This is a test push notification from lendibl!",
        actionUrl: "/"
      });

      res.json({ success, message: success ? "Test notification sent" : "Failed to send notification" });
    } catch (error) {
      console.error("❌ Push test error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get VAPID public key
  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ 
      publicKey: 'BEl62iUYgUivyIebhds3LIwzuAHAiQrNfVOfGyyqugUScaFMhBGqfVSzX6kA0xwexo1XLb2kON1x2LuOW0v2Gjo'
    });
  });
}