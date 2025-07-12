import TeleSignSDK from 'telesign';

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
  private telesign: TeleSignSDK | null = null;
  private customerId: string;
  private apiKey: string;

  constructor() {
    this.customerId = process.env.TELESIGN_CUSTOMER_ID || '';
    this.apiKey = process.env.TELESIGN_API_KEY || '';
    
    if (this.customerId && this.apiKey) {
      this.telesign = new TeleSignSDK(this.customerId, this.apiKey);
    }
  }

  isConfigured(): boolean {
    return !!(this.customerId && this.apiKey && this.telesign);
  }



  // Instant phone number verification using PhoneID API (no SMS required)
  async verifyPhoneInstant(phoneNumber: string): Promise<PhoneIDResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        valid: false,
        message: 'Phone verification service not configured'
      };
    }

    try {
      // Format phone number
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // Use TeleSign PhoneID API for instant verification
      const response = await new Promise((resolve, reject) => {
        this.telesign!.phoneid.standard((error: any, responseBody: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(responseBody);
          }
        }, cleanPhone);
      });

      console.log('TeleSign PhoneID response:', response);
      const responseData = response as any;

      if (responseData.status && responseData.status.code === 300) {
        // Extract relevant information
        const numbering = responseData.numbering || {};
        const carrier = responseData.carrier || {};
        const risk = responseData.risk || {};
        
        return {
          success: true,
          valid: true,
          message: 'Phone number verified instantly',
          phoneNumber: cleanPhone,
          carrierInfo: {
            name: carrier.name || 'Unknown',
            type: numbering.original?.phone_type || 'Unknown'
          },
          riskScore: risk.score || 0,
          location: {
            country: numbering.original?.country_iso2 || 'Unknown',
            region: carrier.country_iso2 || undefined
          }
        };
      } else {
        return {
          success: false,
          valid: false,
          message: responseData.status?.description || 'Phone number validation failed'
        };
      }
    } catch (error) {
      console.error('TeleSign PhoneID error:', error);
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