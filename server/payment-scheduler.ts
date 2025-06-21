import { storage } from "./storage.js";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

// Payment scheduler for escrow functionality
export class PaymentScheduler {
  
  // Capture payment when booking is approved
  async capturePaymentOnApproval(bookingId: number) {
    if (!stripe) {
      console.error('Stripe not configured');
      return false;
    }

    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking || !booking.paymentIntentId) {
        console.error('Booking or payment intent not found');
        return false;
      }

      // Capture the payment
      await stripe.paymentIntents.capture(booking.paymentIntentId);
      
      // Update booking status
      await storage.updateBooking(bookingId, {
        paymentCaptured: true,
        updatedAt: new Date()
      });

      console.log(`Payment captured for booking ${bookingId}`);
      return true;
    } catch (error) {
      console.error('Failed to capture payment:', error);
      return false;
    }
  }

  // Schedule payout 24 hours after rental period ends
  async scheduleOwnerPayout(bookingId: number) {
    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking) return false;

      const payoutDate = new Date(booking.endDate);
      payoutDate.setHours(payoutDate.getHours() + 24);

      await storage.updateBooking(bookingId, {
        payoutScheduled: payoutDate,
        updatedAt: new Date()
      });

      console.log(`Payout scheduled for booking ${bookingId} at ${payoutDate}`);
      return true;
    } catch (error) {
      console.error('Failed to schedule payout:', error);
      return false;
    }
  }

  // Process payout to owner (would be called by a cron job)
  async processOwnerPayout(bookingId: number) {
    if (!stripe) {
      console.error('Stripe not configured');
      return false;
    }

    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking || booking.payoutCompleted) {
        return false;
      }

      // In a real implementation, you would:
      // 1. Create a Stripe transfer to the owner's connected account
      // 2. Or use Stripe Connect for marketplace payments
      // For now, we'll just mark it as completed

      await storage.updateBooking(bookingId, {
        payoutCompleted: new Date(),
        updatedAt: new Date()
      });

      console.log(`Payout processed for booking ${bookingId}, amount: $${booking.ownerPayout}`);
      return true;
    } catch (error) {
      console.error('Failed to process payout:', error);
      return false;
    }
  }

  // Refund payment if booking is cancelled or not approved within 24 hours
  async processRefund(bookingId: number, reason: 'cancelled' | 'not_approved') {
    if (!stripe) {
      console.error('Stripe not configured');
      return false;
    }

    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking || !booking.paymentIntentId || booking.refundIssued) {
        return false;
      }

      // Check if this was a free item (original amount was 0)
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
      const isFreeItem = paymentIntent.metadata?.isFreeItem === 'true';

      if (isFreeItem) {
        // For free items, just cancel the payment intent without processing refund
        if (!booking.paymentCaptured) {
          await stripe.paymentIntents.cancel(booking.paymentIntentId);
        }
      } else {
        // For paid items, process normal refund
        if (!booking.paymentCaptured) {
          await stripe.paymentIntents.cancel(booking.paymentIntentId);
        } else {
          await stripe.refunds.create({
            payment_intent: booking.paymentIntentId,
          });
        }
      }

      await storage.updateBooking(bookingId, {
        refundIssued: true,
        status: 'cancelled',
        updatedAt: new Date()
      });

      console.log(`Refund processed for booking ${bookingId}, reason: ${reason}, isFreeItem: ${isFreeItem}`);
      return true;
    } catch (error) {
      console.error('Failed to process refund:', error);
      return false;
    }
  }

  // Check for bookings that need automatic refunds (24 hours without approval)
  async checkPendingBookings() {
    try {
      const allBookings = await storage.getBookings();
      const now = new Date();

      for (const booking of allBookings) {
        if (booking.status === 'pending' && !booking.refundIssued) {
          const hoursElapsed = (now.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursElapsed >= 24) {
            await this.processRefund(booking.id, 'not_approved');
          }
        }
      }
    } catch (error) {
      console.error('Error checking pending bookings:', error);
    }
  }
}

export const paymentScheduler = new PaymentScheduler();