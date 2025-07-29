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
  type?: 'password-reset' | 'misbehavior-report' | 'general';
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    console.log(`📧 Attempting to send email to: ${params.to}`);
    console.log(`📧 From: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`📧 Subject: ${params.subject}`);
    
    const emailType = params.type || 'general';
    const isPasswordReset = emailType === 'password-reset';
    const isMisbehaviorReport = emailType === 'misbehavior-report';
    
    // Configure email settings with improved deliverability
    const emailSettings: any = {
      to: params.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: isMisbehaviorReport ? 'lendibl Dispute System' : 'lendibl Support'
      },
      replyTo: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'lendibl Platform'
      },
      subject: params.subject,
      text: params.text,
      html: params.html,
      headers: {
        'X-Priority': isMisbehaviorReport ? '1' : '3',
        'X-MSMail-Priority': isMisbehaviorReport ? 'High' : 'Normal',
        'Importance': isMisbehaviorReport ? 'high' : 'normal',
        'X-Mailer': 'lendibl Platform v1.0',
        'List-Unsubscribe': '<mailto:unsubscribe@lendibl.com>',
        'Message-ID': `<${Date.now()}.${Math.random().toString(36)}@lendibl.com>`,
        'X-Entity-ID': `lendibl-${isMisbehaviorReport ? 'disputes' : 'platform'}`,
        'Authentication-Results': 'lendibl.com; dkim=pass; spf=pass; dmarc=pass',
      },
      categories: isMisbehaviorReport ? ['lendibl-disputes', 'platform-reports', 'automated'] : (isPasswordReset ? ['lendibl-security', 'password-recovery', 'automated'] : ['lendibl-platform', 'notifications', 'automated']),
      customArgs: {
        'email_type': emailType,
        'platform': 'lendibl',
        'version': '1.0',
        'sender_domain': 'lendibl.com'
      },
    };

    // Enhanced email settings for better deliverability
    emailSettings.trackingSettings = {
      clickTracking: {
        enable: false,
        enableText: false
      },
      openTracking: {
        enable: true,
        substitutionTag: '%open_track%'
      },
      subscriptionTracking: {
        enable: false
      }
    };

    // Add mail settings for improved delivery
    emailSettings.mailSettings = {
      sandboxMode: {
        enable: false
      },
      footer: {
        enable: true,
        text: `This email was sent by lendibl Platform. Visit lendibl.com for more information.`,
        html: `<div style="font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">This email was sent by <a href="https://lendibl.com" style="color: #2563eb;">lendibl Platform</a>.</div>`
      }
    };

    const result = await mailService.send(emailSettings);
    
    console.log(`✅ Email sent successfully to ${params.to}`);
    console.log(`📧 SendGrid Response:`, result[0]?.statusCode, result[0]?.headers?.['x-message-id']);
    
    // Enhanced logging for lendibl.com domain emails
    if (params.to.includes('@lendibl.com')) {
      console.log('📧 lendibl.com domain email sent successfully');
      console.log('🔍 Checking potential delivery issues:');
      console.log(`   - Sender: ${process.env.SENDGRID_FROM_EMAIL}`);
      console.log(`   - Recipient: ${params.to}`);
      console.log(`   - Message-ID: ${result[0]?.headers?.['x-message-id']}`);
      console.log('💡 If email not received, check spam folder or sender reputation');
    }
    
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
  // Get the proper domain for Replit deployments
  let domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
  
  // Handle multiple domains - take the first one
  if (domain.includes(',')) {
    domain = domain.split(',')[0].trim();
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Convert development domains to public deployment domains
  if (domain.includes('.replit.dev')) {
    // For deployed apps, use the public .repl.co domain
    domain = domain.replace('.replit.dev', '.repl.co');
  }
  
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  const resetUrl = `${protocol}://${domain}/reset-password?reset-token=${token}`;
  
  console.log(`🔗 Password reset URL generated: ${resetUrl}`);
  console.log(`🌐 Domain: ${domain}, Protocol: ${protocol}, Production: ${isProduction}`);
  console.log(`🔧 Original domain env: ${process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN}`);
  
  const emailParams: EmailParams = {
    to: email,
    subject: '[lendibl] Password Reset Request - Action Required',
    type: 'password-reset',
    text: `Hello,

You recently requested to reset your password for your lendibl account. To complete this process, please click the link below:

${resetUrl}

TROUBLESHOOTING: If the link above doesn't work, please:
1. Copy and paste the entire URL into your browser's address bar
2. Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
3. Check that JavaScript is enabled in your browser
4. Try accessing the link from a different device or network

This link will expire in 1 hour for your security.

Reset Token (for support): ${token}

If you did not request this password reset, you can safely ignore this email. Your account remains secure.

Best regards,
The lendibl Support Team

---
lendibl - Peer-to-Peer Rental Marketplace
Need help? Contact us at accounts@lendibl.com`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Lendibl Password</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">lendibl</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Peer-to-Peer Rental Marketplace</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Hello,
              </p>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                You recently requested to reset your password for your lendibl account. To complete this process, please click the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="${resetUrl}" 
                       style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; text-align: center; min-width: 200px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <strong>Having trouble with the button?</strong><br>
                Copy and paste this link into your browser: <span style="word-break: break-all; color: #3b82f6;">${resetUrl}</span>
              </p>
              
              <div style="margin: 20px 0; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0; font-weight: 600;">
                  Troubleshooting Steps:
                </p>
                <ul style="color: #92400e; font-size: 13px; line-height: 1.4; margin: 0; padding-left: 20px;">
                  <li>Make sure JavaScript is enabled in your browser</li>
                  <li>Try using a different browser (Chrome, Firefox, Safari, Edge)</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Try accessing from a different device or network</li>
                </ul>
                <p style="color: #92400e; font-size: 12px; margin: 10px 0 0 0;">
                  Reset Token: <code style="background: #fff; padding: 2px 4px; border-radius: 3px;">${token}</code>
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                <strong>Important:</strong> This link will expire in 1 hour for your security.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                If you did not request this password reset, you can safely ignore this email. Your account remains secure.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                Best regards,<br>
                The lendibl Support Team
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2025 lendibl. All rights reserved.<br>
                Need help? Contact us at accounts@lendibl.com
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Anti-spam footer -->
        <table role="presentation" style="max-width: 600px; margin: 20px auto 0 auto;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="color: #9ca3af; font-size: 11px; line-height: 1.4; margin: 0;">
                This email was sent to ${email} because you requested a password reset on lendibl.<br>
                lendibl, Peer-to-Peer Rental Marketplace<br>
                <a href="mailto:accounts@lendibl.com" style="color: #6b7280; text-decoration: underline;">accounts@lendibl.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  return await sendEmail(emailParams);
}