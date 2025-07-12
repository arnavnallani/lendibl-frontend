import dns from 'dns/promises';

interface EmailVerificationResult {
  success: boolean;
  valid: boolean;
  message: string;
  email?: string;
  domainInfo?: {
    domain: string;
    hasMailServer: boolean;
    provider?: string;
  };
}

export class EmailVerificationService {
  
  async verifyEmailInstant(email: string): Promise<EmailVerificationResult> {
    try {
      // Step 1: Basic format validation
      const formatValidation = this.validateEmailFormat(email);
      if (!formatValidation.valid) {
        return {
          success: true,
          valid: false,
          message: formatValidation.message
        };
      }

      // Step 2: Domain verification
      const domainValidation = await this.verifyDomain(email);
      if (!domainValidation.valid) {
        return {
          success: true,
          valid: false,
          message: domainValidation.message,
          domainInfo: domainValidation.domainInfo
        };
      }

      // Success - email format and domain are valid
      return {
        success: true,
        valid: true,
        message: 'Email address verified successfully',
        email: email.toLowerCase().trim(),
        domainInfo: domainValidation.domainInfo
      };

    } catch (error) {
      console.error('❌ Email verification error:', error);
      
      // Fallback validation - basic format check only
      const formatValidation = this.validateEmailFormat(email);
      return {
        success: true,
        valid: formatValidation.valid,
        message: formatValidation.valid 
          ? 'Email format verified (domain check unavailable)'
          : formatValidation.message,
        email: formatValidation.valid ? email.toLowerCase().trim() : undefined
      };
    }
  }

  private validateEmailFormat(email: string): { valid: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    
    // Basic email regex pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!cleanEmail) {
      return {
        valid: false,
        message: 'Email address is required'
      };
    }

    if (cleanEmail.length > 254) {
      return {
        valid: false,
        message: 'Email address is too long'
      };
    }

    if (!emailRegex.test(cleanEmail)) {
      return {
        valid: false,
        message: 'Please enter a valid email address'
      };
    }

    // Extract username and domain parts
    const [username, domain] = cleanEmail.split('@');
    
    // Reject obviously fake emails
    if (username.length < 3) {
      return {
        valid: false,
        message: 'Email username must be at least 3 characters'
      };
    }
    
    // Check for random keyboard mashing patterns and fake emails
    if (/^[a-z]{15,}$/.test(username) || /(.)\1{4,}/.test(username)) {
      return {
        valid: false,
        message: 'Please enter a real email address'
      };
    }
    
    // Check for obvious keyboard mashing patterns
    const keyboardPatterns = [
      /^[qwertyuiop]+$/i,
      /^[asdfghjkl]+$/i,
      /^[zxcvbnm]+$/i,
      /^(abc|def|ghi|jkl|mno|pqr|stu|vwx|yz){3,}$/i,
      /^[a-z]*(lkdsjf|dsjflk|kldsj|sjflk|flkdsj){1,}[a-z]*$/i
    ];
    
    for (const pattern of keyboardPatterns) {
      if (pattern.test(username)) {
        return {
          valid: false,
          message: 'Please enter a real email address'
        };
      }
    }
    
    // Check for common typos in popular domains (but not for valid domains)
    if (domain !== 'gmail.com' && (domain.includes('gmial') || domain.includes('gmai') || domain === 'gmail.co' || domain === 'gmial.com')) {
      return {
        valid: false,
        message: 'Did you mean gmail.com?'
      };
    }
    
    if (domain !== 'yahoo.com' && (domain.includes('yahooo') || domain.includes('yaho') || domain === 'yahoo.co' || domain === 'yaho.com')) {
      return {
        valid: false,
        message: 'Did you mean yahoo.com?'
      };
    }

    return {
      valid: true,
      message: 'Valid email format'
    };
  }

  private async verifyDomain(email: string): Promise<{ valid: boolean; message: string; domainInfo?: any }> {
    const domain = email.split('@')[1];
    
    try {
      // Check if domain has MX (mail exchange) records
      const mxRecords = await dns.resolveMx(domain);
      
      if (mxRecords && mxRecords.length > 0) {
        // Detect common email providers
        const provider = this.detectEmailProvider(domain);
        
        return {
          valid: true,
          message: 'Domain has valid mail servers',
          domainInfo: {
            domain,
            hasMailServer: true,
            provider
          }
        };
      } else {
        return {
          valid: false,
          message: 'Domain does not accept email',
          domainInfo: {
            domain,
            hasMailServer: false
          }
        };
      }
    } catch (error) {
      // If MX lookup fails, try A record lookup as fallback
      try {
        await dns.resolve4(domain);
        return {
          valid: true,
          message: 'Domain exists (mail server verification unavailable)',
          domainInfo: {
            domain,
            hasMailServer: false // Unknown
          }
        };
      } catch (aError) {
        return {
          valid: false,
          message: 'Domain does not exist',
          domainInfo: {
            domain,
            hasMailServer: false
          }
        };
      }
    }
  }

  private detectEmailProvider(domain: string): string | undefined {
    const providers: { [key: string]: string } = {
      'gmail.com': 'Gmail',
      'googlemail.com': 'Gmail',
      'yahoo.com': 'Yahoo',
      'yahoo.co.uk': 'Yahoo',
      'hotmail.com': 'Hotmail',
      'outlook.com': 'Outlook',
      'live.com': 'Microsoft Live',
      'msn.com': 'MSN',
      'aol.com': 'AOL',
      'icloud.com': 'iCloud',
      'me.com': 'iCloud',
      'mac.com': 'iCloud'
    };
    
    return providers[domain.toLowerCase()];
  }

  isConfigured(): boolean {
    return true; // Email verification doesn't require external API keys
  }
}

export const emailVerificationService = new EmailVerificationService();