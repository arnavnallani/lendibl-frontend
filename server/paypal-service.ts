import { storage } from "./storage";

// PayPal Partner API integration for owner payouts
export class PayPalService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('PayPal credentials not configured');
    }
  }

  // Get access token for PayPal API calls
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
  }

  // Create PayPal Connect URL for owners to link their accounts
  async createConnectUrl(userId: number): Promise<string> {
    try {
      const user = await storage.getUser(userId);
      if (!user) throw new Error('User not found');

      // For now, we'll use a simplified approach - prompt user for their PayPal email
      // In production, you'd use PayPal's Partner onboarding or proper OAuth
      console.log(`Creating simplified PayPal setup for user ${userId}`);
      
      // Return a special URL that triggers email collection
      return `paypal-email-setup://${userId}`;
    } catch (error) {
      console.error('Failed to create PayPal connect URL:', error);
      throw error;
    }
  }

  // Verify PayPal account connection
  async verifyConnection(authCode: string, userId: number): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Exchange auth code for user access token
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const redirectUri = `${process.env.REPL_URL || 'http://localhost:5000'}/paypal-callback`;
      
      const tokenResponse = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=authorization_code&code=${authCode}&redirect_uri=${encodeURIComponent(redirectUri)}`
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // Get user info to verify account
        const userResponse = await fetch(`${this.baseUrl}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          }
        });

        const userData = await userResponse.json();
        
        // Store PayPal account info
        await storage.updateUser(userId, {
          paypalEmail: userData.email,
          paypalAccountId: userData.user_id,
          paymentSetupComplete: true
        });

        console.log(`PayPal account connected for user ${userId}: ${userData.email}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PayPal connection verification failed:', error);
      return false;
    }
  }

  // Send payout to owner's PayPal account
  async sendPayout(ownerEmail: string, amount: number, description: string, metadata: any): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error('PayPal not configured - missing credentials');
      }

      const accessToken = await this.getAccessToken();
      const batchId = `lendibl_${Date.now()}`;
      
      const payoutData = {
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "Payment from Lendibl Rental Marketplace",
          email_message: `You've received a payment for your rental: ${description}`
        },
        items: [{
          recipient_type: "EMAIL",
          amount: {
            value: amount.toFixed(2),
            currency: "USD"
          },
          receiver: ownerEmail,
          note: `Lendibl rental payment: ${description}`,
          sender_item_id: `booking_${metadata.bookingId || Date.now()}`
        }]
      };

      console.log(`📤 SENDING REAL PAYPAL PAYOUT:`);
      console.log(`   Amount: $${amount.toFixed(2)} → ${ownerEmail}`);
      console.log(`   Batch ID: ${batchId}`);

      const response = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': batchId
        },
        body: JSON.stringify(payoutData)
      });

      const result = await response.json();
      
      if (response.ok && result.batch_header) {
        console.log(`✅ PAYPAL PAYOUT INITIATED:`);
        console.log(`   Batch ID: ${result.batch_header.payout_batch_id}`);
        console.log(`   Status: ${result.batch_header.batch_status}`);
        
        return {
          success: true,
          payoutId: result.batch_header.payout_batch_id,
          status: result.batch_header.batch_status
        };
      } else {
        console.error('PayPal API Error:', result);
        return {
          success: false,
          error: result.message || result.error_description || 'PayPal payout failed'
        };
      }
    } catch (error) {
      console.error('PayPal payout error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if PayPal is configured
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
}

export const paypalService = new PayPalService();