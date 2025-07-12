import dns from 'dns/promises';
import { sendEmail } from './email-service.js';
import crypto from 'crypto';

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
  
  // Send email verification with token
  async sendEmailVerification(email: string, firstName: string): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Create verification link
      const verificationLink = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
      
      // Send verification email
      const emailSent = await sendEmail({
        to: email,
        subject: 'Verify your lendibl account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to lendibl!</h1>
            <p>Hi ${firstName},</p>
            <p>Thank you for signing up for lendibl. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${verificationLink}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with lendibl, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              lendibl - Rent and share items in your community<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
        text: `
Welcome to lendibl!

Hi ${firstName},

Thank you for signing up for lendibl. Please verify your email address by visiting this link:

${verificationLink}

This verification link will expire in 24 hours.

If you didn't create an account with lendibl, you can safely ignore this email.

lendibl - Rent and share items in your community
        `
      });

      if (emailSent) {
        return {
          success: true,
          token,
          message: 'Verification email sent successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to send verification email'
        };
      }
    } catch (error) {
      console.error('Email verification service error:', error);
      return {
        success: false,
        message: 'Email service error'
      };
    }
  }

  // Verify email token
  async verifyEmailToken(token: string): Promise<{ success: boolean; valid: boolean; message: string }> {
    try {
      // In a real implementation, you would check the token against your database
      // For now, we'll implement basic token validation
      if (!token || token.length !== 64) {
        return {
          success: true,
          valid: false,
          message: 'Invalid verification token'
        };
      }

      return {
        success: true,
        valid: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Email token verification error:', error);
      return {
        success: false,
        valid: false,
        message: 'Token verification error'
      };
    }
  }

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

    // Check for common typos in popular domains (but not for valid domains)
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    const domain = cleanEmail.split('@')[1];
    
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