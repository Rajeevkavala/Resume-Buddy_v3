// ============ Queue Package - Phase 3 Communication Layer ============
// BullMQ queues, workers, services, and templates for notifications

// Queues & connection
export {
  emailQueue,
  whatsappQueue,
  smsQueue,
  aiTaskQueue,
  cleanupQueue,
  notificationQueue,
  queueConnection,
} from './queues';

// Job types
export type {
  EmailJobData,
  WhatsAppJobData,
  SMSJobData,
  AITaskJobData,
  CleanupJobData,
  NotificationJobData,
  WelcomeEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  SubscriptionConfirmationData,
  SubscriptionExpiringData,
  ExportReadyData,
  AnalysisCompleteData,
  AccountActivityData,
  DailySummaryData,
  FeedbackRequestData,
} from './types';

// Email service
export { sendEmail, type EmailMessage } from './services/email.service';

// Templates
export { getTemplate, type EmailType } from './templates';

// Workers
export {
  startAllWorkers,
  stopAllWorkers,
  startEmailWorker,
  stopEmailWorker,
  startWhatsAppWorker,
  stopWhatsAppWorker,
  startSMSWorker,
  stopSMSWorker,
} from './workers';

// ======= Convenience helpers for enqueuing common notifications =======
import { emailQueue } from './queues';
import type { EmailJobData } from './types';

/**
 * Queue a welcome email for a new user.
 */
export async function queueWelcomeEmail(to: string, name: string) {
  return emailQueue.add('welcome', {
    type: 'welcome',
    to,
    data: { name, loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/login` },
  } as EmailJobData);
}

/**
 * Queue an analysis-complete notification email.
 */
export async function queueAnalysisCompleteEmail(
  to: string,
  data: { userName: string; atsScore: number; improvements: string[]; resumeName: string; dashboardUrl: string }
) {
  return emailQueue.add('analysis-complete', {
    type: 'analysis-complete',
    to,
    data,
  } as EmailJobData);
}

/**
 * Queue a subscription confirmation email.
 */
export async function queueSubscriptionEmail(
  to: string,
  data: { userName: string; planName: string; amount: string; currency: string; startDate: string; endDate: string; features: string[] }
) {
  return emailQueue.add('subscription-confirmation', {
    type: 'subscription-confirmation',
    to,
    data,
  } as EmailJobData);
}

/**
 * Queue an export-ready notification email.
 */
export async function queueExportReadyEmail(
  to: string,
  data: { userName: string; templateName: string; downloadUrl: string; expiresIn: string }
) {
  return emailQueue.add('export-ready', {
    type: 'export-ready',
    to,
    data,
  } as EmailJobData);
}

/**
 * Queue a generic email by type.
 */
export async function queueEmail(type: string, to: string, data: Record<string, unknown>, subject?: string) {
  return emailQueue.add(type, {
    type,
    to,
    data,
    subject,
  } as EmailJobData);
}
