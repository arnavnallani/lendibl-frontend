import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

if (!process.env.SENDGRID_FROM_EMAIL) {
  throw new Error("SENDGRID_FROM_EMAIL environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    
    // Log detailed error information
    if (error.response && error.response.body && error.response.body.errors) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
      
      // Check for specific verification error
      const errors = error.response.body.errors;
      const hasVerificationError = errors.some((err: any) => 
        err.message && err.message.includes('verified')
      );
      
      if (hasVerificationError) {
        console.error(`❌ SENDGRID VERIFICATION ERROR: The sender email "${process.env.SENDGRID_FROM_EMAIL}" is not verified.`);
        console.error('📧 Please verify this email in SendGrid dashboard: Settings → Sender Authentication');
        console.error('💡 Alternative: Update SENDGRID_FROM_EMAIL to a verified email address');
      }
    }
    
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/?reset-token=${token}`;
  
  const emailParams: EmailParams = {
    to: email,
    subject: 'Reset Your Lendibl Password',
    text: `You requested a password reset for your Lendibl account. 

Click this link to reset your password: ${resetUrl}

If you didn't request this, please ignore this email. This link will expire in 1 hour.

- The Lendibl Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Lendibl</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Reset Your Password</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
            You requested a password reset for your Lendibl account. Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
            If you didn't request this password reset, please ignore this email. This link will expire in 1 hour for security.
          </p>
        </div>
        
        <div style="background: #e5e7eb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          © 2025 Lendibl. All rights reserved.
        </div>
      </div>
    `,
  };

  return await sendEmail(emailParams);
}