import TeleSignSDK from 'telesign';

interface VerificationResult {
  success: boolean;
  transactionId?: string;
  message: string;
  phoneNumber?: string;
}

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

interface VerificationStatus {
  success: boolean;
  verified: boolean;
  message: string;
  phoneNumber?: string;
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

  async sendVerificationCode(phoneNumber: string, name: string): Promise<VerificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Phone verification service not configured'
      };
    }

    try {
      // Format phone number (remove any non-digit characters except +)
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // Send SMS verification code
      const response = await new Promise((resolve, reject) => {
        this.telesign!.sms.message((error: any, responseBody: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(responseBody);
          }
        }, cleanPhone, `Hello ${name}! Your lendibl verification code is: $$CODE$$. This code expires in 10 minutes.`, 'ARN');
      });

      console.log('TeleSign SMS response:', response);
      const responseData = response as any;

      if (responseData.status && responseData.status.code === 290) {
        return {
          success: true,
          transactionId: responseData.reference_id,
          message: 'Verification code sent successfully',
          phoneNumber: cleanPhone
        };
      } else {
        return {
          success: false,
          message: responseData.status?.description || 'Failed to send verification code'
        };
      }
    } catch (error) {
      console.error('TeleSign SMS error:', error);
      return {
        success: false,
        message: 'Failed to send verification code'
      };
    }
  }

  async verifyCode(transactionId: string, code: string): Promise<VerificationStatus> {
    if (!this.isConfigured()) {
      return {
        success: false,
        verified: false,
        message: 'Phone verification service not configured'
      };
    }

    try {
      const response = await new Promise((resolve, reject) => {
        this.telesign!.verify.status((error: any, responseBody: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(responseBody);
          }
        }, transactionId, code);
      });

      console.log('TeleSign verify response:', response);
      const responseData = response as any;

      if (responseData.status && responseData.status.code === 290) {
        return {
          success: true,
          verified: true,
          message: 'Phone number verified successfully',
          phoneNumber: responseData.phone_number
        };
      } else if (responseData.status && responseData.status.code === 291) {
        return {
          success: true,
          verified: false,
          message: 'Invalid verification code'
        };
      } else {
        return {
          success: false,
          verified: false,
          message: responseData.status?.description || 'Verification failed'
        };
      }
    } catch (error) {
      console.error('TeleSign verify error:', error);
      return {
        success: false,
        verified: false,
        message: 'Verification failed'
      };
    }
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

  // Voice call verification (alternative to SMS)
  async sendVerificationCall(phoneNumber: string, name: string): Promise<VerificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Phone verification service not configured'
      };
    }

    try {
      // Format phone number
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // Send voice call verification
      const response = await new Promise((resolve, reject) => {
        this.telesign!.voice.call((error: any, responseBody: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(responseBody);
          }
        }, cleanPhone, `Hello ${name}! Your lendibl verification code is $$CODE$$. Please enter this code to verify your phone number.`, 'ARN');
      });

      console.log('TeleSign Voice response:', response);
      const responseData = response as any;

      if (responseData.status && responseData.status.code === 290) {
        return {
          success: true,
          transactionId: responseData.reference_id,
          message: 'Verification call initiated successfully',
          phoneNumber: cleanPhone
        };
      } else {
        return {
          success: false,
          message: responseData.status?.description || 'Failed to initiate verification call'
        };
      }
    } catch (error) {
      console.error('TeleSign Voice error:', error);
      return {
        success: false,
        message: 'Failed to initiate verification call'
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