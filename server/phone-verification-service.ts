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
    
    // Remove country code for US number validation
    const usPhone = cleanPhone.startsWith('+1') ? cleanPhone.slice(2) : 
                   cleanPhone.startsWith('1') ? cleanPhone.slice(1) : cleanPhone;
    
    // Reject obviously fake US phone numbers
    if (usPhone.length === 10) {
      // Check for invalid patterns like all same digits, sequential digits
      if (/^(\d)\1{9}$/.test(usPhone)) {
        return {
          valid: false,
          message: 'Please enter a valid phone number'
        };
      }
      
      // Check for invalid area codes (first digit can't be 0 or 1)
      if (usPhone[0] === '0' || usPhone[0] === '1') {
        return {
          valid: false,
          message: 'Invalid area code - please check your phone number'
        };
      }
      
      // Check for obviously fake numbers like 1234567890
      if (usPhone === '1234567890' || usPhone === '0123456789') {
        return {
          valid: false,
          message: 'Please enter your real phone number'
        };
      }
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