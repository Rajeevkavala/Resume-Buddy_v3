// ============ Email Service ============
// Dual-provider: Resend (primary) + Nodemailer SMTP (fallback)

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'nodemailer' | 'console';
}

// ============ Main Send Function ============

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await sendWithResend(message);
      return { ...result, provider: 'resend' };
    } catch (error) {
      console.warn('[Email] Resend failed, trying Nodemailer fallback:', error);
    }
  }

  // Fallback to Nodemailer/SMTP
  if (process.env.SMTP_HOST) {
    try {
      const result = await sendWithNodemailer(message);
      return { ...result, provider: 'nodemailer' };
    } catch (error) {
      console.error('[Email] Nodemailer fallback also failed:', error);
    }
  }

  // Development fallback: log to console
  console.log('[Email] DEV MODE — Would send email:');
  console.log(`  To: ${message.to}`);
  console.log(`  Subject: ${message.subject}`);
  console.log(`  Text: ${message.text?.substring(0, 200)}...`);
  return { success: true, messageId: 'dev-console', provider: 'console' };
}

// ============ Resend Provider ============

async function sendWithResend(message: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
  const fromName = process.env.EMAIL_FROM_NAME || 'ResumeBuddy';
  const fromEmail = process.env.EMAIL_FROM || 'noreply@resumebuddy.com';

  const body: Record<string, unknown> = {
    from: `${fromName} <${fromEmail}>`,
    to: [message.to],
    subject: message.subject,
    html: message.html,
  };

  if (message.text) body.text = message.text;
  if (message.replyTo) body.reply_to = message.replyTo;
  if (message.tags) body.tags = message.tags;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return { success: true, messageId: data.id };
}

// ============ Nodemailer Provider ============

async function sendWithNodemailer(message: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
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

  const fromName = process.env.EMAIL_FROM_NAME || 'ResumeBuddy';
  const fromEmail = process.env.SMTP_USER || process.env.EMAIL_FROM || 'noreply@resumebuddy.com';

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
  });

  return { success: true, messageId: info.messageId };
}
