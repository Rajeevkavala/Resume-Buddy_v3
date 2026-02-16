/**
 * Email Notification Service
 * Sends transactional emails for key user events.
 * Uses the queue email service directly (SMTP/Resend) without requiring BullMQ workers.
 */

import { sendEmail } from '../../packages/queue/src/services/email.service';
import { getTemplate } from '../../packages/queue/src/templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

// ============ Welcome Email ============

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    const { subject, html, text } = getTemplate('welcome', {
      name: name || 'there',
      loginUrl: `${APP_URL}/dashboard`,
    });
    await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    // Non-critical — don't block registration
  }
}

// ============ Email Verification Code ============

export async function sendVerificationEmail(to: string, name: string, code: string): Promise<void> {
  try {
    const { subject, html, text } = getTemplate('verification', {
      name: name || 'there',
      code,
      expiresInMinutes: 10,
    });
    await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error);
  }
}

// ============ Analysis Complete Email ============

export async function sendAnalysisCompleteEmail(
  to: string,
  data: {
    userName: string;
    atsScore: number;
    improvements: string[];
    resumeName: string;
  }
): Promise<void> {
  try {
    const { subject, html, text } = getTemplate('analysis-complete', {
      ...data,
      dashboardUrl: `${APP_URL}/analysis`,
    });
    await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('[Email] Failed to send analysis email:', error);
  }
}

// ============ Subscription Confirmation Email ============

export async function sendSubscriptionEmail(
  to: string,
  data: {
    userName: string;
    planName: string;
    amount: string;
    currency: string;
    startDate: string;
    endDate: string;
    features: string[];
  }
): Promise<void> {
  try {
    const { subject, html, text } = getTemplate('subscription-confirmation', data);
    await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('[Email] Failed to send subscription email:', error);
  }
}

// ============ Export Ready Email ============

export async function sendExportReadyEmail(
  to: string,
  data: {
    userName: string;
    templateName: string;
    downloadUrl: string;
    expiresIn: string;
  }
): Promise<void> {
  try {
    const { subject, html, text } = getTemplate('export-ready', data);
    await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('[Email] Failed to send export ready email:', error);
  }
}

// ============ Password Reset Email ============

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  try {
    const { subject, html, text } = getTemplate('password-reset', {
      name: name || 'there',
      resetUrl,
    });
    await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
  }
}

// ============ Account Activity Alert Email ============

export async function sendAccountActivityEmail(
  to: string,
  data: {
    userName: string;
    activityType: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
  }
): Promise<void> {
  try {
    const { subject, html, text } = getTemplate('account-activity', data);
    await sendEmail({ to, subject, html, text });
  } catch (error) {
    console.error('[Email] Failed to send account activity email:', error);
  }
}
