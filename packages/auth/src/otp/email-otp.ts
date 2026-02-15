// ============ Email OTP Provider ============
// Sends OTP codes via email using Resend API or Nodemailer fallback

interface EmailSendResult {
  success: boolean;
  messageId?: string;
}

/**
 * Send an OTP code via email.
 * Primary: Resend API. Fallback: SMTP via Nodemailer-compatible fetch.
 */
export async function sendEmailOTP(email: string, otp: string): Promise<EmailSendResult> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendWithResend(email, otp);
    } catch (error) {
      console.warn('[Email OTP] Resend failed, trying SMTP fallback:', error);
    }
  }

  // Fallback: SMTP via fetch-based POST (e.g., to a local SMTP relay or API)
  if (process.env.SMTP_HOST) {
    try {
      return await sendWithSMTP(email, otp);
    } catch (error) {
      console.error('[Email OTP] SMTP fallback also failed:', error);
    }
  }

  // Last resort: log to console for development
  console.log(`[Email OTP] DEV MODE — Code for ${email}: ${otp}`);
  return { success: true, messageId: 'dev-mode' };
}

// ============ Resend Provider ============

async function sendWithResend(email: string, otp: string): Promise<EmailSendResult> {
  const fromName = process.env.EMAIL_FROM_NAME || 'ResumeBuddy';
  const fromEmail = process.env.EMAIL_FROM || 'noreply@resumebuddy.com';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: 'Your ResumeBuddy Verification Code',
      html: generateOTPEmailHTML(otp),
      text: `Your ResumeBuddy verification code is: ${otp}. Valid for 5 minutes. If you didn't request this, please ignore this email.`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Email OTP/Resend] Send failed:', errorData);
    throw new Error(`Resend API error: ${response.statusText}`);
  }

  const data = await response.json();
  return { success: true, messageId: data.id };
}

// ============ SMTP Fallback ============

async function sendWithSMTP(email: string, otp: string): Promise<EmailSendResult> {
  // Use nodemailer-like approach via dynamic import to keep the package lightweight
  // In production, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'ResumeBuddy'}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your ResumeBuddy Verification Code',
    html: generateOTPEmailHTML(otp),
    text: `Your ResumeBuddy verification code is: ${otp}. Valid for 5 minutes. If you didn't request this, please ignore this email.`,
  });

  return { success: true, messageId: info.messageId };
}

// ============ HTML Template ============

function generateOTPEmailHTML(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px 40px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">ResumeBuddy</h1>
        <p style="color: #dbeafe; margin: 8px 0 0; font-size: 14px;">AI-Powered Resume Builder</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 20px;">Verification Code</h2>
        <p style="color: #475569; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
          Enter the following code to verify your identity:
        </p>
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 10px; background: #f0f9ff; 
                    padding: 24px; text-align: center; border-radius: 10px; margin: 0 0 24px;
                    border: 2px dashed #93c5fd; color: #1e40af; font-family: monospace;">
          ${otp}
        </div>
        <p style="color: #475569; margin: 0 0 8px; font-size: 14px;">
          ⏱ This code expires in <strong>5 minutes</strong>.
        </p>
        <p style="color: #94a3b8; margin: 24px 0 0; font-size: 13px; line-height: 1.5;">
          If you didn't request this code, you can safely ignore this email. 
          Someone may have entered your email address by mistake.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} ResumeBuddy. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
