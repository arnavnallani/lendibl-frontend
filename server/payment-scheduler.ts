import { storage } from "./storage";
import { paymentReminderService } from "./payment-reminder-service";
import { stripeService } from "./stripe-service";
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

  // Schedule payout immediately when rental period ends
  async scheduleOwnerPayout(bookingId: number) {
    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking) return false;

      const payoutDate = new Date(booking.endDate);
      // No delay - process immediately when rental ends

      await storage.updateBooking(bookingId, {
        payoutScheduled: payoutDate,
        updatedAt: new Date()
      });

      console.log(`Payout scheduled for booking ${bookingId} at ${payoutDate} (immediate processing)`);
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

      // Get owner details and ensure Connect account setup
      const owner = await storage.getUser(booking.item.ownerId);
      if (!owner) {
        console.log(`Owner not found for booking ${bookingId}`);
        return false;
      }

      console.log(`Processing payout for owner ${owner.id} (${owner.email})`);
      console.log(`Owner has payment setup: ${owner.paymentSetupComplete}`);
      console.log(`Owner has Connect account: ${!!owner.stripeAccountId}`);

      // Owner gets exactly the item's list price (daily rate × days)
      const dailyPrice = parseFloat(booking.item.price);
      const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const ownerPayout = dailyPrice * days;
      const totalPaid = parseFloat(booking.totalPrice);
      const platformCommission = totalPaid - ownerPayout;
      
      console.log(`Payout breakdown for booking ${bookingId}:`);
      console.log(`- Total paid by renter: $${totalPaid}`);
      console.log(`- Owner payout (list price): $${ownerPayout}`);
      console.log(`- Platform commission: $${platformCommission}`);
      
      const payoutAmountCents = Math.round(ownerPayout * 100);

      // Process payout using Stripe Connect
      try {
        // Check if owner has completed Stripe Connect setup
        if (!owner.stripeAccountId) {
          console.log(`⚠️  Owner ${owner.id} doesn't have Stripe Connect account - cannot process payout`);
          
          // Add to pending earnings and send reminder
          await paymentReminderService.updatePendingEarnings(owner.id, ownerPayout.toString());
          await paymentReminderService.createPaymentSetupReminder(
            owner.id, 
            'payout_blocked', 
            ownerPayout.toString()
          );
          
          return false;
        }

        // Check if account is ready for payouts
        const accountStatus = await stripeService.checkAccountStatus(owner.stripeAccountId);
        if (!accountStatus || !accountStatus.payoutsEnabled) {
          console.log(`⚠️  Owner ${owner.id} Stripe account not ready for payouts`);
          
          // Add to pending earnings and send reminder
          await paymentReminderService.updatePendingEarnings(owner.id, ownerPayout.toString());
          await paymentReminderService.createPaymentSetupReminder(
            owner.id, 
            'payout_blocked', 
            ownerPayout.toString()
          );
          
          return false;
        }

        // Process real money transfer via Stripe Connect
        console.log(`PROCESSING REAL MONEY TRANSFER via Stripe Connect:`);
        console.log(`- From: Lendibl's Stripe account balance`);
        console.log(`- To: ${owner.email} (Account: ${owner.stripeAccountId})`);
        console.log(`- Amount: $${ownerPayout} (exact list price)`);
        console.log(`- Commission kept: $${platformCommission}`);
        
        const transfer = await stripeService.createConnectedAccountPayout(
          owner.stripeAccountId,
          ownerPayout,
          `Rental payout for ${booking.item.title}`,
          { bookingId: booking.id.toString(), userId: owner.id.toString() }
        );
        
        console.log(`✓ REAL MONEY TRANSFER COMPLETED for booking ${bookingId}:`);
        console.log(`  • Transfer ID: ${transfer.id}`);
        console.log(`  • Amount sent to owner: $${ownerPayout}`);
        console.log(`  • Stripe Connect Account: ${owner.stripeAccountId}`);
        console.log(`  • Owner: ${owner.email}`);
        console.log(`  • Lendibl commission: $${platformCommission}`);
        
        await storage.updateBooking(bookingId, {
          payoutCompleted: new Date(),
          stripeTransferId: transfer.id,
          payoutNote: `Real Stripe Connect transfer: $${ownerPayout}`,
          updatedAt: new Date()
        });

        await paymentReminderService.clearPendingEarnings(
          booking.item.ownerId,
          ownerPayout.toString()
        );

        return true;
        
      } catch (transferError: any) {
        console.error(`Stripe Connect transfer failed for booking ${bookingId}:`, transferError.message);
        
        // Add to pending earnings since payout failed
        await paymentReminderService.updatePendingEarnings(
          booking.item.ownerId,
          ownerPayout.toString()
        );
        
        // Update booking with transfer failure
        await storage.updateBooking(bookingId, {
          payoutBlocked: true,
          payoutBlockReason: `Connect transfer failed: ${transferError.message}`,
          updatedAt: new Date()
        });
        
        return false;
      }
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
        // Check for automatic refunds (24 hours without approval)
        if (booking.status === 'pending' && !booking.refundIssued) {
          const hoursElapsed = (now.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursElapsed >= 24) {
            await this.processRefund(booking.id, 'not_approved');
          }
        }
        
        // Check for immediate payouts when rental period ends
        if (booking.status === 'approved' && !booking.payoutCompleted && booking.payoutScheduled) {
          const payoutTime = new Date(booking.payoutScheduled);
          
          if (now >= payoutTime) {
            console.log(`Processing immediate payout for booking ${booking.id}`);
            await this.processOwnerPayout(booking.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking pending bookings:', error);
    }
  }
}

export const paymentScheduler = new PaymentScheduler();