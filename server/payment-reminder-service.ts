import { storage } from "./storage";
import { paymentScheduler } from "./payment-scheduler";
import type { User } from "@shared/schema";

export class PaymentReminderService {
  
  // 1. Check for blocked payouts and trigger payment setup
  async handleBlockedPayouts() {
    try {
      const usersWithPendingEarnings = await storage.getUsersWithPendingEarnings();
      
      for (const user of usersWithPendingEarnings) {
        await this.createPaymentSetupReminder(user.id, "payout_blocked", user.pendingEarnings);
      }
      
      console.log(`Checked ${usersWithPendingEarnings.length} users with pending earnings for payment setup`);
    } catch (error) {
      console.error("Error handling blocked payouts:", error);
    }
  }

  // 2. Require payment setup before rental approval
  async checkPaymentSetupForApproval(ownerId: number, bookingId: number): Promise<boolean> {
    try {
      const owner = await storage.getUser(ownerId);
      if (!owner) return false;

      if (!owner.paymentSetupComplete) {
        const booking = await storage.getBooking(bookingId);
        if (booking) {
          await this.createPaymentSetupReminder(
            ownerId, 
            "approval_required", 
            booking.ownerPayout
          );
        }
        return false; // Block approval until payment setup is complete
      }
      
      return true; // Allow approval
    } catch (error) {
      console.error("Error checking payment setup for approval:", error);
      return false;
    }
  }

  // 3. Send periodic reminders for users with pending earnings
  async sendPeriodicReminders() {
    try {
      const usersWithPendingEarnings = await storage.getUsersWithPendingEarnings();
      const now = new Date();
      
      for (const user of usersWithPendingEarnings) {
        // Check if enough time has passed since last reminder (7 days)
        if (user.lastPaymentReminder) {
          const daysSinceLastReminder = Math.floor(
            (now.getTime() - user.lastPaymentReminder.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastReminder < 7) {
            continue; // Skip if less than 7 days since last reminder
          }
        }

        // Limit to 3 reminders total
        if (user.paymentSetupReminders >= 3) {
          continue;
        }

        await this.createPaymentSetupReminder(user.id, "periodic", user.pendingEarnings);
        
        // Update user reminder count and timestamp
        await storage.updateUser(user.id, {
          paymentSetupReminders: user.paymentSetupReminders + 1,
          lastPaymentReminder: now
        });
      }
      
      console.log(`Sent periodic payment setup reminders to ${usersWithPendingEarnings.length} users`);
    } catch (error) {
      console.error("Error sending periodic reminders:", error);
    }
  }

  // Helper method to create payment setup reminders
  private async createPaymentSetupReminder(userId: number, type: string, amount: string) {
    const validTypes = ['credit_card_required', 'paypal_setup_required', 'stripe_connect_required', 'stripe_onboarding_required', 'payout_blocked'];
    if (!validTypes.includes(type)) {
      console.error(`Invalid reminder type: ${type}`);
      return;
    }
    
    try {
      // Check if there's already an unresolved reminder of this type
      const existingReminders = await storage.getPaymentReminders(userId);
      const existingReminder = existingReminders.find(r => r.reminderType === type && !r.resolved);
      
      if (existingReminder) {
        // Update existing reminder count and timestamp
        await storage.updatePaymentReminder(existingReminder.id, {
          reminderCount: existingReminder.reminderCount + 1,
          lastSent: new Date(),
          pendingAmount: amount
        });
      } else {
        // Create new reminder
        await storage.createPaymentReminder({
          userId,
          reminderType: type,
          pendingAmount: amount,
          reminderCount: 1,
          lastSent: new Date(),
          resolved: false
        });
      }
    } catch (error) {
      console.error("Error creating payment setup reminder:", error);
    }
  }

  // Mark reminder as resolved when payment setup is completed
  async resolvePaymentReminders(userId: number) {
    try {
      const reminders = await storage.getPaymentReminders(userId);
      
      for (const reminder of reminders) {
        await storage.updatePaymentReminder(reminder.id, { resolved: true });
      }
      
      console.log(`Resolved ${reminders.length} payment reminders for user ${userId}`);
    } catch (error) {
      console.error("Error resolving payment reminders:", error);
    }
  }

  // Update user's pending earnings when booking is completed
  async updatePendingEarnings(ownerId: number, amount: string) {
    try {
      const owner = await storage.getUser(ownerId);
      if (!owner) return;

      const currentPending = parseFloat(owner.pendingEarnings) || 0;
      const newAmount = parseFloat(amount);
      const newPending = currentPending + newAmount;

      await storage.updateUser(ownerId, {
        pendingEarnings: newPending.toString()
      });

      // If user doesn't have payment setup and now has pending earnings, create reminder
      if (!owner.paymentSetupComplete && newPending > 0) {
        await this.createPaymentSetupReminder(ownerId, "payout_blocked", newPending.toString());
      }
    } catch (error) {
      console.error("Error updating pending earnings:", error);
    }
  }

  // Clear pending earnings when payout is processed
  async clearPendingEarnings(ownerId: number, amount: string) {
    try {
      const owner = await storage.getUser(ownerId);
      if (!owner) return;

      const currentPending = parseFloat(owner.pendingEarnings) || 0;
      const payoutAmount = parseFloat(amount);
      const newPending = Math.max(0, currentPending - payoutAmount);

      await storage.updateUser(ownerId, {
        pendingEarnings: newPending.toString()
      });
    } catch (error) {
      console.error("Error clearing pending earnings:", error);
    }
  }

  // Start periodic reminder scheduler (runs every 24 hours)
  startPeriodicReminderScheduler() {
    // Run immediately
    this.sendPeriodicReminders();
    this.handleBlockedPayouts();
    
    // Then run every 24 hours
    setInterval(() => {
      this.sendPeriodicReminders();
      this.handleBlockedPayouts();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    console.log("Payment reminder scheduler started");
  }
}

export const paymentReminderService = new PaymentReminderService();