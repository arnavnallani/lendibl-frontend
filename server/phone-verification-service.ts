import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const telesign = require('telesign');

interface PhoneIDResult {
  success: boolean;
  valid: boolean;
  message: string;
  phoneNumber?: string;
  carrierInfo?: {
    name: string;
    type: string;
  };
  riskScore?: number;
  location?: {
    country: string;
    region?: string;
  };
}

export class PhoneVerificationService {
  private telesign: any | null = null;
  private customerId: string;
  private apiKey: string;

  constructor() {
    this.customerId = process.env.TELESIGN_CUSTOMER_ID || '';
    this.apiKey = process.env.TELESIGN_API_KEY || '';
    
    console.log('🔍 TeleSign Debug - Customer ID exists:', !!this.customerId);
    console.log('🔍 TeleSign Debug - API Key exists:', !!this.apiKey);
    
    if (this.customerId && this.apiKey) {
      try {
        console.log('📱 Initializing TeleSign SDK...');
        this.telesign = telesign.setup({
          customerId: this.customerId,
          apiKey: this.apiKey
        });
        console.log('✅ TeleSign SDK initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize TeleSign SDK:', error);
        this.telesign = null;
      }
    } else {
      console.log('⚠️ TeleSign credentials not found - phone verification disabled');
      console.log('   Customer ID:', this.customerId ? '[SET]' : '[MISSING]');
      console.log('   API Key:', this.apiKey ? '[SET]' : '[MISSING]');
    }
  }

  isConfigured(): boolean {
    return !!(this.customerId && this.apiKey && this.telesign);
  }



  // Instant phone number verification using TeleSign PhoneID API
  async verifyPhoneInstant(phoneNumber: string): Promise<PhoneIDResult> {
    try {
      // Validate phone number format first
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return {
          success: false,
          valid: false,
          message: validation.message
        };
      }

      // Check TeleSign configuration
      console.log(`🔍 TeleSign Configuration Check - isConfigured: ${this.isConfigured()}`);
      console.log(`🔍 Customer ID: ${this.customerId ? '[SET]' : '[MISSING]'}`);
      console.log(`🔍 API Key: ${this.apiKey ? '[SET]' : '[MISSING]'}`);
      console.log(`🔍 TeleSign SDK: ${this.telesign ? '[INITIALIZED]' : '[NULL]'}`);
      
      // If TeleSign is not configured, return error
      if (!this.isConfigured()) {
        console.log('⚠️ TeleSign not configured - cannot verify phone numbers');
        return {
          success: false,
          valid: false,
          message: 'Phone verification service not available - TeleSign API credentials required'
        };
      }

      // Format phone number for TeleSign (add +1 for US numbers)
      let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      if (/^\d{10}$/.test(cleanPhone)) {
        cleanPhone = `+1${cleanPhone}`; // Add US country code
      } else if (/^1\d{10}$/.test(cleanPhone)) {
        cleanPhone = `+${cleanPhone}`; // Add + prefix
      }
      
      console.log(`📱 Calling TeleSign PhoneID API for: ${cleanPhone}`);
      
      // Call TeleSign PhoneID API for real verification
      return new Promise((resolve) => {
        this.telesign.phoneId.standard({
          phoneNumber: cleanPhone
        }, (error: any, response: any) => {
          if (error) {
            console.error('❌ TeleSign API error:', error);
            resolve({
              success: false,
              valid: false,
              message: 'Phone verification failed - invalid number or service unavailable'
            });
            return;
          }

          console.log('📱 TeleSign Response:', response);
          
          // Check TeleSign response status
          const status = response?.status;
          const phoneType = response?.phone_type;
          const carrierName = response?.carrier;
          const country = response?.country;
          
          // TeleSign status codes: 300 = valid, others indicate issues
          if (status?.code === 300) {
            resolve({
              success: true,
              valid: true,
              message: 'Phone number verified successfully via TeleSign',
              phoneNumber: cleanPhone,
              carrierInfo: {
                name: carrierName?.name || 'Unknown Carrier',
                type: phoneType?.description || 'Unknown'
              },
              riskScore: response?.risk?.score || 0,
              location: {
                country: country?.name || 'Unknown',
                region: country?.iso2 || undefined
              }
            });
          } else {
            resolve({
              success: false,
              valid: false,
              message: `Invalid phone number - ${status?.description || 'Phone verification failed'}`
            });
          }
        });
      });
    } catch (error) {
      console.error('Phone validation error:', error);
      return {
        success: false,
        valid: false,
        message: 'Failed to verify phone number instantly'
      };
    }
  }



  // Simple phone number validation
  validatePhoneNumber(phoneNumber: string): { valid: boolean; message: string } {
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Basic validation - at least 10 digits, optional country code
    if (cleanPhone.length < 10) {
      return {
        valid: false,
        message: 'Phone number must be at least 10 digits'
      };
    }

    if (cleanPhone.length > 15) {
      return {
        valid: false,
        message: 'Phone number cannot exceed 15 digits'
      };
    }

    // Check for valid format (starts with + or digit)
    if (!cleanPhone.match(/^[\+]?[1-9][\d]{9,14}$/)) {
      return {
        valid: false,
        message: 'Please enter a valid phone number'
      };
    }

    return {
      valid: true,
      message: 'Valid phone number'
    };
  }
}

export const phoneVerificationService = new PhoneVerificationService();