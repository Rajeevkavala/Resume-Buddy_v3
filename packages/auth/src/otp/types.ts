// ============ OTP Types & Configuration ============

export type OTPChannel = 'whatsapp' | 'sms' | 'email';
export type OTPPurpose = 'login' | 'verify_phone' | 'verify_email' | 'password_reset';

export interface OTPRequest {
  destination: string;    // Phone number or email
  channel: OTPChannel;
  purpose: OTPPurpose;
  userId?: string;        // For logged-in users verifying phone/email
}

export interface OTPVerification {
  destination: string;
  code: string;
  channel: OTPChannel;
  purpose: OTPPurpose;
}

export interface OTPResult {
  success: boolean;
  message: string;
  expiresIn?: number;     // seconds
  attemptsRemaining?: number;
}

export interface OTPConfig {
  length: number;         // Default: 6
  expirySeconds: number;  // Default: 300 (5 minutes)
  maxAttempts: number;    // Default: 3
  cooldownSeconds: number; // Default: 60 (resend cooldown)
}

export const DEFAULT_OTP_CONFIG: OTPConfig = {
  length: 6,
  expirySeconds: 300,
  maxAttempts: 3,
  cooldownSeconds: 60,
};
