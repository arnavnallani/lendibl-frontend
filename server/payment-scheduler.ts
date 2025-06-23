import { storage } from "./storage";
import { paymentReminderService } from "./payment-reminder-service";
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

      // Check if owner has payment setup completed
      const owner = await storage.getUser(booking.item.ownerId);
      if (!owner || !owner.paymentSetupComplete || !owner.stripeAccountId) {
        console.log(`Payout blocked for booking ${bookingId} - owner payment setup incomplete`);
        
        // Block payout and update pending earnings
        await storage.updateBooking(bookingId, {
          payoutBlocked: true,
          payoutBlockReason: 'Payment setup incomplete',
          updatedAt: new Date()
        });

        // Add to pending earnings and trigger reminder
        await paymentReminderService.updatePendingEarnings(
          booking.item.ownerId, 
          booking.ownerPayout
        );
        
        return false;
      }

      // Owner gets exactly the item's list price (daily rate × days)
      const dailyPrice = parseFloat(booking.item.price);
      const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const ownerPayout = dailyPrice * days;
      const totalPaid = parseFloat(booking.totalAmount);
      const platformCommission = totalPaid - ownerPayout;
      
      console.log(`Payout breakdown for booking ${bookingId}:`);
      console.log(`- Total paid by renter: $${totalPaid}`);
      console.log(`- Owner payout (list price): $${ownerPayout}`);
      console.log(`- Platform commission: $${platformCommission}`);
      
      const payoutAmountCents = Math.round(ownerPayout * 100);

      // Create transfer to owner's Stripe account
      const transfer = await stripe.transfers.create({
        amount: payoutAmountCents,
        currency: 'usd',
        destination: owner.stripeAccountId,
        description: `Payout for rental: ${booking.item.title}`,
        metadata: {
          bookingId: bookingId.toString(),
          ownerId: owner.id.toString(),
          itemId: booking.item.id.toString()
        }
      });

      // Update booking with payout completion
      await storage.updateBooking(bookingId, {
        payoutCompleted: new Date(),
        updatedAt: new Date()
      });

      // Clear pending earnings for this amount
      await paymentReminderService.clearPendingEarnings(
        booking.item.ownerId,
        booking.ownerPayout
      );

      console.log(`Payout processed for booking ${bookingId}, amount: $${booking.ownerPayout}, transfer ID: ${transfer.id}`);
      return true;
    } catch (error: any) {
      console.error('Failed to process payout:', error);
      
      // Block payout on error and add to pending earnings
      await storage.updateBooking(bookingId, {
        payoutBlocked: true,
        payoutBlockReason: `Transfer failed: ${error.message}`,
        updatedAt: new Date()
      });

      // Add to pending earnings since payout failed
      await paymentReminderService.updatePendingEarnings(
        booking.item.ownerId, 
        booking.ownerPayout
      );
      
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

      // Cancel the payment intent if not captured, or refund if captured
      if (!booking.paymentCaptured) {
        await stripe.paymentIntents.cancel(booking.paymentIntentId);
      } else {
        await stripe.refunds.create({
          payment_intent: booking.paymentIntentId,
        });
      }

      await storage.updateBooking(bookingId, {
        refundIssued: true,
        status: 'cancelled',
        updatedAt: new Date()
      });

      console.log(`Refund processed for booking ${bookingId}, reason: ${reason}`);
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