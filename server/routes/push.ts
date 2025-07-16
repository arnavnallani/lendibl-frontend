import type { Express } from "express";
import { pushNotificationService } from "../push-service";
import { authenticateToken, type AuthRequest } from "../auth";

export function registerPushRoutes(app: Express) {
  // Subscribe to push notifications
  app.post("/api/push-subscribe", authenticateToken, async (req: AuthRequest, res) => {
    console.log(`🔔 Push subscribe request from user ${req.user?.id}`);
    
    try {
      const subscription = req.body;
      console.log('📝 Subscription data received:', subscription);
      
      const success = await pushNotificationService.saveSubscription(req.user.id, subscription);
      
      if (success) {
        res.json({ success: true, message: "Push subscription saved" });
      } else {
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