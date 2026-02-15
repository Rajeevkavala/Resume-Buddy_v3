// ============ Auth Package - Public API ============
// Re-export all auth utilities

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken,
  getAccessTokenExpiry,
  type TokenPayload,
  type TokenPair,
  type TokenUser,
} from './jwt';

export {
  createSession,
  getSession,
  updateSessionActivity,
  deleteSession,
  deleteAllUserSessions,
  getUserActiveSessions,
  disconnectRedis,
  getRedis,
  type SessionData,
  type SessionInfo,
} from './session';

export {
  hashPassword,
  verifyPassword,
  validatePassword,
  getPasswordStrength,
  passwordSchema,
  type PasswordValidationResult,
  type PasswordStrength,
} from './password';

export {
  getGoogleAuthUrl,
  getGoogleUser,
  refreshGoogleToken,
  type GoogleUser,
} from './oauth/google';

// ============ OTP Authentication ============
export {
  // Types
  type OTPChannel,
  type OTPPurpose,
  type OTPRequest,
  type OTPVerification,
  type OTPResult,
  type OTPConfig,
  DEFAULT_OTP_CONFIG,
  // Store
  generateOTP,
  storeOTP,
  verifyOTP,
  isOnCooldown,
  getCooldownRemaining,
  blockDestination,
  isBlocked,
  clearOTP,
} from './otp';

export { getWhatsAppProvider } from './otp/whatsapp';
export { getSMSProvider } from './otp/sms';
export { sendEmailOTP } from './otp/email-otp';
