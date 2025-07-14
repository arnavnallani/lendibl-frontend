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

interface NameVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  firstNameScore?: number;
  lastNameScore?: number;
  overallMatch?: 'strong' | 'moderate' | 'weak' | 'no_match';
  phoneNumber?: string;
  carrierInfo?: {
    name: string;
    type: string;
  };
  riskLevel?: 'low' | 'medium' | 'high';
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
          
          // TeleSign status codes: 300 = API call successful, but check phone validity
          if (status?.code === 300) {
            // Check if phone type indicates valid phone number
            const phoneTypeCode = phoneType?.code;
            const phoneTypeDesc = phoneType?.description;
            
            // Valid phone types: 1=FIXED_LINE, 2=MOBILE, 3=FIXED_LINE_OR_MOBILE, 4=TOLL_FREE, 5=VOIP
            // Invalid types: 6=PERSONAL_NUMBER, 7=PAGER, 8=INVALID, 9=RESTRICTED_PREMIUM
            const validPhoneTypes = ['1', '2', '3', '4', '5'];
            
            if (validPhoneTypes.includes(phoneTypeCode)) {
              resolve({
                success: true,
                valid: true,
                message: 'Phone number verified successfully via TeleSign',
                phoneNumber: cleanPhone,
                carrierInfo: {
                  name: carrierName?.name || 'Unknown Carrier',
                  type: phoneTypeDesc || 'Unknown'
                },
                riskScore: response?.risk?.score || 0,
                location: {
                  country: country?.name || 'Unknown',
                  region: country?.iso2 || undefined
                }
              });
            } else {
              // Phone type indicates invalid/restricted number
              resolve({
                success: false,
                valid: false,
                message: `Invalid phone number type: ${phoneTypeDesc || 'Phone number not suitable for verification'}`
              });
            }
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

  // Verify if a phone number belongs to a specific person by name
  async verifyPhoneToName(phoneNumber: string, firstName: string, lastName: string): Promise<NameVerificationResult> {
    try {
      // Validate inputs
      const phoneValidation = this.validatePhoneNumber(phoneNumber);
      if (!phoneValidation.valid) {
        return {
          success: false,
          verified: false,
          message: phoneValidation.message
        };
      }

      if (!firstName?.trim() || !lastName?.trim()) {
        return {
          success: false,
          verified: false,
          message: 'First name and last name are required for verification'
        };
      }

      // Check TeleSign configuration
      if (!this.isConfigured()) {
        return {
          success: false,
          verified: false,
          message: 'Phone verification service is not properly configured'
        };
      }

      // Clean and format phone number (remove non-digits)
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanedPhone.startsWith('1') ? cleanedPhone : `1${cleanedPhone}`;

      console.log(`🔍 Verifying phone ${formattedPhone} belongs to ${firstName} ${lastName}`);

      // Make TeleSign PhoneID request with Contact Match addon
      const response = await new Promise((resolve, reject) => {
        this.telesign.phoneid.phoneID((error: any, response: any) => {
          if (error) {
            console.error('❌ TeleSign Contact Match error:', error);
            reject(error);
          } else {
            console.log('✅ TeleSign Contact Match response:', JSON.stringify(response, null, 2));
            resolve(response);
          }
        }, formattedPhone, {
          addons: {
            contact_match: {
              first_name: firstName.toUpperCase().trim(),
              last_name: lastName.toUpperCase().trim()
            }
          }
        });
      });

      const data = response as any;

      // Check if the main request was successful
      if (data.status?.code !== 300) {
        return {
          success: false,
          verified: false,
          message: `Phone verification failed: ${data.status?.description || 'Unknown error'}`
        };
      }

      // Check if Contact Match addon was successful
      const contactMatch = data.contact_match;
      if (!contactMatch || contactMatch.status?.code !== 2800) {
        return {
          success: false,
          verified: false,
          message: `Contact match failed: ${contactMatch?.status?.description || 'Contact match service unavailable'}`
        };
      }

      // Extract contact match scores
      const firstNameScore = contactMatch?.first_name_score || 0;
      const lastNameScore = contactMatch?.last_name_score || 0;
      
      // Calculate overall match confidence
      const averageScore = (firstNameScore + lastNameScore) / 2;
      let overallMatch: 'strong' | 'moderate' | 'weak' | 'no_match';
      let verified = false;

      if (averageScore >= 80) {
        overallMatch = 'strong';
        verified = true;
      } else if (averageScore >= 60) {
        overallMatch = 'moderate';
        verified = true; // Still consider it verified but with lower confidence
      } else if (averageScore >= 30) {
        overallMatch = 'weak';
        verified = false;
      } else {
        overallMatch = 'no_match';
        verified = false;
      }

      // Extract additional phone information
      const carrierInfo = data.carrier ? {
        name: data.carrier.name || 'Unknown',
        type: data.phone_type?.description || 'Unknown'
      } : undefined;

      const riskLevel = data.risk?.level || 'unknown';

      return {
        success: true,
        verified,
        message: verified 
          ? `Phone number verified as belonging to ${firstName} ${lastName} (${Math.round(averageScore)}% match confidence)`
          : `Phone number does not appear to belong to ${firstName} ${lastName} (${Math.round(averageScore)}% match confidence)`,
        firstNameScore,
        lastNameScore,
        overallMatch,
        phoneNumber: data.numbering?.original?.complete_phone_number,
        carrierInfo,
        riskLevel: riskLevel as 'low' | 'medium' | 'high'
      };

    } catch (error: any) {
      console.error('❌ Phone-to-name verification error:', error);
      
      // Check for specific TeleSign errors
      if (error.message?.includes('404')) {
        return {
          success: false,
          verified: false,
          message: 'Contact match service not available for this account'
        };
      }
      
      if (error.message?.includes('403') || error.message?.includes('access denied')) {
        return {
          success: false,
          verified: false,
          message: 'Contact match service access denied - enterprise account required'
        };
      }

      if (error.message?.includes('contact_match') || error.message?.includes('not enabled')) {
        return {
          success: false,
          verified: false,
          message: 'Contact match feature not enabled - requires enterprise account'
        };
      }

      return {
        success: false,
        verified: false,
        message: `Phone verification service error: ${error.message || 'Unknown error'}`
      };
    }
  }
}

export const phoneVerificationService = new PhoneVerificationService();