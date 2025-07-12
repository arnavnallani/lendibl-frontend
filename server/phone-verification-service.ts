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

  // Send SMS verification code using TeleSign
  async sendSMSVerificationCode(phoneNumber: string, message?: string): Promise<{ success: boolean; transactionId?: string; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "TeleSign SMS service not configured"
      };
    }

    try {
      // Format phone number - ensure it has country code
      let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
      if (!formattedPhone.startsWith('+')) {
        // Add +1 for US numbers that don't have country code
        if (formattedPhone.length === 10) {
          formattedPhone = '+1' + formattedPhone;
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+' + formattedPhone;
        }
      }

      const verificationMessage = message || "Your lendibl verification code is: $$CODE$$";

      return new Promise((resolve) => {
        this.telesign.sms.message((err: any, reply: any) => {
          if (err) {
            console.error('TeleSign SMS Error:', err);
            resolve({
              success: false,
              message: "Failed to send SMS verification code"
            });
          } else {
            console.log('✅ SMS sent successfully:', reply);
            resolve({
              success: true,
              transactionId: reply.reference_id,
              message: "SMS verification code sent successfully"
            });
          }
        }, formattedPhone, verificationMessage, 'ARN');
      });
    } catch (error) {
      console.error('TeleSign SMS Service Error:', error);
      return {
        success: false,
        message: "SMS service error"
      };
    }
  }

  // Verify SMS code using TeleSign
  async verifySMSCode(transactionId: string, verificationCode: string): Promise<{ success: boolean; valid: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        valid: false,
        message: "TeleSign verification service not configured"
      };
    }

    try {
      return new Promise((resolve) => {
        this.telesign.verify.sms((err: any, reply: any) => {
          if (err) {
            console.error('TeleSign Verification Error:', err);
            resolve({
              success: false,
              valid: false,
              message: "Failed to verify SMS code"
            });
          } else {
            console.log('📱 SMS verification result:', reply);
            const isValid = reply.verify && reply.verify.code_state === "VALID";
            resolve({
              success: true,
              valid: isValid,
              message: isValid ? "Phone number verified successfully" : "Invalid verification code"
            });
          }
        }, transactionId, verificationCode);
      });
    } catch (error) {
      console.error('TeleSign Verification Service Error:', error);
      return {
        success: false,
        valid: false,
        message: "Verification service error"
      };
    }
  }

  // Instant phone number verification using built-in validation
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

      // Format phone number
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      
      // Simplified phone number validation - accept most reasonable formats
      let isValid = false;
      let country = 'Unknown';
      let phoneType = 'Mobile';
      
      // Accept 10-digit US phone numbers in format like 1234567890
      if (/^\d{10}$/.test(cleanPhone)) {
        isValid = true;
        country = 'US';
      }
      // US phone numbers with +1 prefix
      else if (/^(\+?1)\d{10}$/.test(cleanPhone)) {
        isValid = true;
        country = 'US';
      }
      // International phone numbers: + followed by 7-15 digits
      else if (/^\+\d{7,15}$/.test(cleanPhone)) {
        isValid = true;
        country = 'International';
      }
      // Accept 11-digit numbers starting with 1 (US format)
      else if (/^1\d{10}$/.test(cleanPhone)) {
        isValid = true;
        country = 'US';
      }
      
      if (isValid) {
        console.log(`📱 Phone verification successful: ${cleanPhone}`);
        return {
          success: true,
          valid: true,
          message: 'Phone number format validated successfully',
          phoneNumber: cleanPhone,
          carrierInfo: {
            name: 'Format validation passed',
            type: phoneType
          },
          riskScore: 0.1, // Low risk for format validation
          location: {
            country: country,
            region: country === 'US' ? cleanPhone.substring(cleanPhone.length - 10, cleanPhone.length - 7) : undefined
          }
        };
      } else {
        return {
          success: false,
          valid: false,
          message: 'Invalid phone number format - please check and try again'
        };
      }
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