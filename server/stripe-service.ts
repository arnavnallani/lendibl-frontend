import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export class StripeService {
  
  // Validate payment method without storing
  async validatePaymentMethod(cardNumber: string, expiryDate: string, cvv: string) {
    try {
      const [month, year] = expiryDate.split('/');
      
      // Create a temporary payment method to validate
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(month),
          exp_year: parseInt(`20${year}`),
          cvc: cvv,
        },
      });

      // If we get here, the card is valid
      // Detach the payment method since this was just for validation
      await stripe.paymentMethods.detach(paymentMethod.id);
      
      return { valid: true, error: null };
    } catch (error: any) {
      return { 
        valid: false, 
        error: error.message || 'Invalid card details' 
      };
    }
  }

  // Get customer payment methods
  async getCustomerPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  // Update payment method
  async updatePaymentMethod(userId: number, cardNumber: string, expiryDate: string, cvv: string, cardholderName: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        throw new Error('User or Stripe customer not found');
      }

      // Create new payment method
      const [month, year] = expiryDate.split('/');
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(month),
          exp_year: parseInt(`20${year}`),
          cvc: cvv,
        },
        billing_details: {
          name: cardholderName,
          email: user.email,
        },
      });

      // Attach to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: user.stripeCustomerId,
      });

      // If there's an old payment method, detach it
      if (user.stripePaymentMethodId) {
        try {
          await stripe.paymentMethods.detach(user.stripePaymentMethodId);
        } catch (error) {
          console.warn('Could not detach old payment method:', error);
        }
      }

      // Set as default
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Update user record
      await storage.updateUser(userId, {
        stripePaymentMethodId: paymentMethod.id,
      });

      return { success: true, paymentMethodId: paymentMethod.id };
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  // Remove payment method
  async removePaymentMethod(userId: number) {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.stripePaymentMethodId) {
        return { success: true }; // Already removed
      }

      // Detach payment method
      await stripe.paymentMethods.detach(user.stripePaymentMethodId);

      // Update user record
      await storage.updateUser(userId, {
        stripePaymentMethodId: null,
        paymentSetupComplete: false,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }

  // Create Stripe Connect Express account  
  async createConnectedAccount(userId: number, email: string, firstName: string, lastName: string) {
    try {
      console.log(`Creating Stripe Express account for ${email}`);
      
      // Create Express account with standard onboarding flow
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        individual: {
          email: email,
          first_name: firstName,
          last_name: lastName
        }
      });
      
      console.log(`Stripe Express account created: ${account.id}`);
      return account.id;
    } catch (error) {
      console.error('Error creating Express account:', error);
      throw error;
    }
  }

  // Check if Stripe account is ready for payouts
  async checkAccountStatus(accountId: string) {
    try {
      // Skip mock accounts - they don't exist in real Stripe
      if (accountId.includes('mock')) {
        console.log('Skipping mock account status check:', accountId);
        return null;
      }

      // Check real Stripe account status
      const account = await stripe.accounts.retrieve(accountId);
      return {
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements?.currently_due || [],
        disabled: account.requirements?.disabled_reason || null,
        accountId: account.id
      };
    } catch (error) {
      console.error('Error checking account status:', error);
      return null;
    }
  }

  // Get account onboarding link for Express accounts
  async createAccountOnboardingLink(accountId: string, userId: number) {
    try {
      // Get the correct base URL with HTTPS for live mode
      let baseUrl = process.env.REPL_URL || process.env.REPLIT_DEV_DOMAIN;
      if (!baseUrl) {
        baseUrl = 'http://localhost:5000';
      } else if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://')) {
        baseUrl = `https://${baseUrl}`;
      } else if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
        // Convert HTTP to HTTPS for live mode (except localhost)
        baseUrl = baseUrl.replace('http://', 'https://');
      }

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/settings?refresh=true&user=${userId}`,
        return_url: `${baseUrl}/settings?success=true&user=${userId}`,
        type: 'account_onboarding',
        collect: 'eventually_due'
      });

      return accountLink.url;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw error;
    }
  }

  // Create payout to connected account
  async createConnectedAccountPayout(accountId: string, amount: number, description: string, metadata: any) {
    try {
      const amountInCents = Math.round(amount * 100);
      
      // Check Stripe balance first
      console.log(`Checking Stripe balance for payout of $${amount}...`);
      const balance = await stripe.balance.retrieve();
      const availableBalance = balance.available.find(b => b.currency === 'usd')?.amount || 0;
      const pendingBalance = balance.pending.find(b => b.currency === 'usd')?.amount || 0;
      const availableUSD = availableBalance / 100;
      const pendingUSD = pendingBalance / 100;
      
      console.log(`Stripe balance - Available: $${availableUSD}, Pending: $${pendingUSD}, Need: $${amount}`);
      
      if (availableBalance < amountInCents) {
        const message = `Insufficient funds in Stripe account. Available: $${availableUSD}, Pending: $${pendingUSD}, needed: $${amount}. Funds typically become available within 2-7 business days after payment.`;
        console.error(message);
        throw new Error(message);
      }
      
      console.log(`Creating transfer of $${amount} to account ${accountId}`);
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'usd',
        destination: accountId,
        description: description,
        metadata: metadata
      });
      
      console.log(`Transfer successful: ${transfer.id}`);
      return transfer;
    } catch (error: any) {
      console.error('Stripe payout error:', error.message);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
export { stripe };