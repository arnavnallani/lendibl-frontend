import TeleSignSDK from 'telesign';

interface VerificationResult {
  success: boolean;
  transactionId?: string;
  message: string;
  phoneNumber?: string;
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