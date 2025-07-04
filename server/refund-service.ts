import Stripe from "stripe";
import { db } from "./db";
import { bookings, paymentMethods, notifications } from "@shared/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { notificationService } from "./notification-service";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export class RefundService {
  // Process refunds for cancelled bookings
  async processRefundForCancellation(bookingId: number) {
    try {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      if (booking.refundIssued) {
        console.log(`Refund already processed for booking ${bookingId}`);
        return;
      }

      if (!booking.paymentIntentId) {
        throw new Error(`No payment intent found for booking ${bookingId}`);
      }

      // Create refund using Stripe
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          bookingId: bookingId.toString(),
          refundReason: 'cancelled'
        }
      });

      // Update booking with refund information
      await db
        .update(bookings)
        .set({
          refundIssued: true,
          refundId: refund.id,
          refundAmount: (parseFloat(booking.totalPrice)).toString(),
          refundReason: 'cancelled',
          paymentMethodId: booking.paymentIntentId,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));

      // Send notification to renter
      await notificationService.createNotification({
        userId: booking.renterId,
        type: 'booking_request',
        title: 'Refund Processed',
        message: `Your refund of $${booking.totalPrice} has been processed and will appear on your credit card in 5-10 business days.`,
        relatedId: bookingId
      });

      console.log(`Refund processed for booking ${bookingId}: ${refund.id}`);
      return refund;

    } catch (error) {
      console.error(`Error processing refund for booking ${bookingId}:`, error);
      throw error;
    }
  }

  // Process refunds for bookings not approved within 24 hours
  async processRefundForTimeout(bookingId: number) {
    try {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      if (booking.refundIssued) {
        console.log(`Refund already processed for booking ${bookingId}`);
        return;
      }

      if (!booking.paymentIntentId) {
        throw new Error(`No payment intent found for booking ${bookingId}`);
      }

      // Create refund using Stripe
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          bookingId: bookingId.toString(),
          refundReason: 'timeout'
        }
      });

      // Update booking with refund information and set status to declined
      await db
        .update(bookings)
        .set({
          status: 'declined',
          refundIssued: true,
          refundId: refund.id,
          refundAmount: (parseFloat(booking.totalPrice)).toString(),
          refundReason: 'timeout',
          paymentMethodId: booking.paymentIntentId,
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));

      // Send notification to renter
      await notificationService.createNotification({
        userId: booking.renterId,
        type: 'booking_request',
        title: 'Booking Expired - Refund Processed',
        message: `Your booking request expired after 24 hours. Your refund of $${booking.totalPrice} has been processed and will appear on your credit card in 5-10 business days.`,
        relatedId: bookingId
      });

      console.log(`Timeout refund processed for booking ${bookingId}: ${refund.id}`);
      return refund;

    } catch (error) {
      console.error(`Error processing timeout refund for booking ${bookingId}:`, error);
      throw error;
    }
  }

  // Check for bookings that need automatic refunds due to 24-hour timeout
  async checkPendingBookingsForTimeout() {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const pendingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.status, 'pending'),
            eq(bookings.paymentConfirmed, true),
            eq(bookings.refundIssued, false),
            lt(bookings.createdAt, oneDayAgo)
          )
        );

      console.log(`Found ${pendingBookings.length} bookings pending timeout refund`);

      for (const booking of pendingBookings) {
        await this.processRefundForTimeout(booking.id);
      }

    } catch (error) {
      console.error('Error checking pending bookings for timeout:', error);
    }
  }

  // Store payment method information when booking is created
  async storePaymentMethod(userId: number, paymentMethodId: string) {
    try {
      // Get payment method details from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (!paymentMethod.card) {
        throw new Error('Payment method is not a card');
      }

      // Store payment method in database
      await db
        .insert(paymentMethods)
        .values({
          userId: userId,
          stripePaymentMethodId: paymentMethodId,
          last4: paymentMethod.card.last4,
          brand: paymentMethod.card.brand,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
          isDefault: true
        });

      console.log(`Payment method stored for user ${userId}: ${paymentMethodId}`);

    } catch (error) {
      console.error(`Error storing payment method for user ${userId}:`, error);
      throw error;
    }
  }

  // Start automatic timeout checker
  startTimeoutChecker() {
    // Check every 30 minutes for bookings that need timeout refunds
    setInterval(() => {
      this.checkPendingBookingsForTimeout();
    }, 30 * 60 * 1000); // 30 minutes

    console.log('Automatic timeout refund checker started');
  }
}

export const refundService = new RefundService();