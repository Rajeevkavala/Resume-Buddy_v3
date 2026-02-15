import bcrypt from 'bcryptjs';
import { z } from 'zod';

// ============ Constants ============

const SALT_ROUNDS = 12;

// ============ Zod Schema ============

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character');

// ============ Password Hashing ============

/**
 * Hash a password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============ Password Validation ============

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a password against the password policy.
 * Returns { valid: boolean, errors: string[] }
 */
export function validatePassword(password: string): PasswordValidationResult {
  const result = passwordSchema.safeParse(password);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.errors.map((e) => e.message),
  };
}

// ============ Password Strength ============

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Get the strength of a password.
 * - weak: < 3 criteria met
 * - fair: 3 criteria met
 * - good: 4 criteria met
 * - strong: 5+ criteria met
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  // Bonus for diversity
  if (/[A-Z].*[A-Z]/.test(password)) score++; // Multiple uppercase
  if (/[^A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) score++; // Multiple special

  if (score <= 3) return 'weak';
  if (score <= 5) return 'fair';
  if (score <= 7) return 'good';
  return 'strong';
}
