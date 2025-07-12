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

    // Check for obvious fake patterns
    if (this.isObviousFakeEmail(cleanEmail)) {
      return {
        valid: false,
        message: 'Please provide a valid email address'
      };
    }

    // Check if it's a disposable email domain
    if (this.isDisposableEmail(cleanEmail)) {
      return {
        valid: false,
        message: 'Disposable email addresses are not allowed. Please use a permanent email address.'
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

    // Check for obvious fake/nonsense domains
    const domain = cleanEmail.split('@')[1];
    const localPart = cleanEmail.split('@')[0];
    
    // Check for obviously fake domains or gibberish
    if (domain.length < 4 || localPart.length < 1) {
      return {
        valid: false,
        message: 'Please enter a valid email address'
      };
    }
    
    // Check for domains that are clearly nonsense (long random strings)
    if (domain.length > 30 || /^[a-z]{20,}\.com$/.test(domain)) {
      return {
        valid: false,
        message: 'Please enter a valid email address'
      };
    }
    
    // Check for domains with obvious typos or test patterns
    const invalidPatterns = [
      /test/i, /fake/i, /invalid/i, /example/i, /dummy/i, /temp/i,
      /^[a-z]{10,}\.com$/, // very long random strings
      /^[jklmnpqrstuvwxyz]+\.com$/ // random consonant strings
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(domain)) {
        return {
          valid: false,
          message: 'Please enter a valid email address'
        };
      }
    }

    // Check for common typos in popular domains (but not for valid domains)
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    
    // Only suggest corrections for actual typos, not for valid domains
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

  private isObviousFakeEmail(email: string): boolean {
    const localPart = email.split('@')[0];
    const domain = email.split('@')[1];
    
    // Check for obvious fake patterns in local part
    const fakePatterns = [
      /^[a-z]{15,}$/, // very long random strings
      /^(test|fake|invalid|dummy|example|temp|mail|email)$/i,
      /^[jklmnpqrstuvwxyz]{8,}$/, // random consonants
      /^[aeiou]{5,}$/, // all vowels
      /^(asdf|qwerty|zxcv|hjkl|mnop)/, // keyboard patterns
      /^[a-z]\1{4,}$/ // repeated characters (aaaaa, bbbbb)
    ];
    
    for (const pattern of fakePatterns) {
      if (pattern.test(localPart)) {
        return true;
      }
    }
    
    return false;
  }

  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1];
    
    // Common disposable email domains
    const disposableDomains = [
      '10minutemail.com', '10minutemail.net', '2prong.com', '33mail.com',
      'guerrillamail.com', 'guerrillamailblock.com', 'mailinator.com', 
      'mailinator.net', 'maildrop.cc', 'tempmail.org', 'temp-mail.org',
      'yopmail.com', 'throwaway.email', 'dispostable.com', 'trash-mail.com',
      'getnada.com', 'emailondeck.com', 'sharklasers.com', 'grr.la',
      'spamgourmet.com', 'mytrashmail.com', 'tempinbox.com'
    ];
    
    return disposableDomains.includes(domain);
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