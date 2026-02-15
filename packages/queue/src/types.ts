// ============ Queue Job Type Interfaces ============

export interface EmailJobData {
  type:
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
  to: string;
  subject?: string;
  data: Record<string, unknown>;
}

export interface WhatsAppJobData {
  type: 'otp' | 'welcome' | 'export-ready' | 'subscription-reminder';
  phone: string;
  message: string;
  templateId?: string;
  data?: Record<string, unknown>;
}

export interface SMSJobData {
  type: 'otp' | 'alert';
  phone: string;
  message: string;
}

export interface AITaskJobData {
  type: 'analyze' | 'interview' | 'improvements' | 'cover-letter';
  userId: string;
  input: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
}

export interface CleanupJobData {
  type: 'expired-sessions' | 'old-otps' | 'temp-files' | 'usage-records';
  olderThan: string; // ISO date string
}

export interface NotificationJobData {
  type: 'email' | 'whatsapp' | 'sms' | 'push';
  userId: string;
  channel: string;
  payload: Record<string, unknown>;
}

// ============ Email Template Data Types ============

export interface WelcomeEmailData {
  name: string;
  loginUrl: string;
}

export interface VerificationEmailData {
  name: string;
  code: string;
  verifyUrl?: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetCode: string;
  resetUrl: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SubscriptionConfirmationData {
  name: string;
  tier: string;
  features: string[];
  periodStart: string;
  periodEnd: string;
  amount: string;
  orderId?: string;
}

export interface SubscriptionExpiringData {
  name: string;
  expiryDate: string;
  renewUrl: string;
  daysRemaining: number;
}

export interface ExportReadyData {
  name: string;
  templateName: string;
  downloadUrl: string;
  expiresIn: string;
}

export interface AnalysisCompleteData {
  name: string;
  atsScore: number;
  improvements: string[];
  reportUrl: string;
}

export interface AccountActivityData {
  name: string;
  activityType: string;
  device: string;
  ipAddress: string;
  location?: string;
  timestamp: string;
  securityUrl: string;
}

export interface DailySummaryData {
  name: string;
  analysesRun: number;
  resumesExported: number;
  creditsRemaining: number;
  dashboardUrl: string;
}

export interface FeedbackRequestData {
  name: string;
  surveyUrl: string;
  daysSinceSignup: number;
}
