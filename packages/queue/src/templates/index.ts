// ============ Email Template Registry ============
import { welcomeTemplate } from './welcome';
import { verificationTemplate } from './verification';
import { passwordResetTemplate } from './password-reset';
import { subscriptionConfirmationTemplate } from './subscription-confirmation';
import { subscriptionExpiringTemplate } from './subscription-expiring';
import { exportReadyTemplate } from './export-ready';
import { analysisCompleteTemplate } from './analysis-complete';
import { accountActivityTemplate } from './account-activity';
import { dailySummaryTemplate } from './daily-summary';
import { feedbackRequestTemplate } from './feedback-request';

export {
  welcomeTemplate,
  verificationTemplate,
  passwordResetTemplate,
  subscriptionConfirmationTemplate,
  subscriptionExpiringTemplate,
  exportReadyTemplate,
  analysisCompleteTemplate,
  accountActivityTemplate,
  dailySummaryTemplate,
  feedbackRequestTemplate,
};

// ============ Template Resolver ============

export type EmailType =
  | 'welcome'
  | 'verification'
  | 'password-reset'
  | 'subscription-confirmation'
  | 'subscription-expiring'
  | 'export-ready'
  | 'analysis-complete'
  | 'account-activity'
  | 'daily-summary'
  | 'feedback-request';

/**
 * Resolve a template by type and data.
 * Returns { subject, html, text } ready for sending.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTemplate(type: EmailType, data: Record<string, any>): { subject: string; html: string; text: string } {
  // We cast through `any` because job data arrives as Record<string, unknown>
  // but each template function expects a specific shape.
  const d = data as any;
  switch (type) {
    case 'welcome':
      return welcomeTemplate(d);
    case 'verification':
      return verificationTemplate(d);
    case 'password-reset':
      return passwordResetTemplate(d);
    case 'subscription-confirmation':
      return subscriptionConfirmationTemplate(d);
    case 'subscription-expiring':
      return subscriptionExpiringTemplate(d);
    case 'export-ready':
      return exportReadyTemplate(d);
    case 'analysis-complete':
      return analysisCompleteTemplate(d);
    case 'account-activity':
      return accountActivityTemplate(d);
    case 'daily-summary':
      return dailySummaryTemplate(d);
    case 'feedback-request':
      return feedbackRequestTemplate(d);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}
