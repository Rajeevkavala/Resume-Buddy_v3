import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  getPasswordStrength,
} from '@resumebuddy/auth';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password with bcrypt', async () => {
      const hash = await hashPassword('TestPass123!');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('should produce different hashes for same password (salt)', async () => {
      const hash1 = await hashPassword('TestPass123!');
      const hash2 = await hashPassword('TestPass123!');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce hash of expected length', async () => {
      const hash = await hashPassword('TestPass123!');
      expect(hash.length).toBe(60); // bcrypt hash is always 60 chars
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'MySecureP@ss1';
      const hash = await hashPassword(password);
      const valid = await verifyPassword(password, hash);
      expect(valid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('CorrectP@ss1');
      const valid = await verifyPassword('WrongPassword1!', hash);
      expect(valid).toBe(false);
    });

    it('should reject empty password', async () => {
      const hash = await hashPassword('ValidP@ss123');
      const valid = await verifyPassword('', hash);
      expect(valid).toBe(false);
    });

    it('should handle special characters', async () => {
      const password = 'P@$$w0rd!#%^&*()';
      const hash = await hashPassword(password);
      const valid = await verifyPassword(password, hash);
      expect(valid).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should accept a strong password', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 chars', () => {
      const result = validatePassword('Sh!1');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('alllowercase1!');
      expect(result.valid).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('ALLUPPERCASE1!');
      expect(result.valid).toBe(false);
    });

    it('should reject password without numbers', () => {
      const result = validatePassword('NoNumbers!!Aa');
      expect(result.valid).toBe(false);
    });

    it('should reject password without special characters', () => {
      const result = validatePassword('NoSpecial123Aa');
      expect(result.valid).toBe(false);
    });

    it('should accept password with all requirements met', () => {
      const result = validatePassword('Valid1Pass!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getPasswordStrength', () => {
    it('should rate a short simple password as weak', () => {
      const strength = getPasswordStrength('abc');
      expect(strength).toBe('weak');
    });

    it('should rate a medium password as fair', () => {
      const strength = getPasswordStrength('Abcdef1!');
      expect(['weak', 'fair']).toContain(strength);
    });

    it('should rate a good password correctly', () => {
      const strength = getPasswordStrength('GoodP@ss12345');
      expect(['fair', 'good', 'strong']).toContain(strength);
    });

    it('should rate a very strong password as strong', () => {
      const strength = getPasswordStrength('V3ryStr0ng!!P@$$w0rD');
      expect(strength).toBe('strong');
    });

    it('should return a valid strength value', () => {
      const validStrengths = ['weak', 'fair', 'good', 'strong'];
      const strength = getPasswordStrength('test');
      expect(validStrengths).toContain(strength);
    });
  });
});
