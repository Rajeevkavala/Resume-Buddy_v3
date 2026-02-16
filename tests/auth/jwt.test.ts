import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  verifyAccessToken,
  generateTokenPair,
  verifyRefreshToken,
  generateRefreshToken,
  extractBearerToken,
  getAccessTokenExpiry,
} from '@resumebuddy/auth';

const mockUser = {
  id: 'user-test-123',
  email: 'test@example.com',
  role: 'USER' as const,
  tier: 'free' as const,
};

const mockAdminUser = {
  id: 'admin-test-456',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
  tier: 'pro' as const,
};

describe('JWT Token System', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid access token string', async () => {
      const token = await generateAccessToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', async () => {
      const token1 = await generateAccessToken(mockUser);
      const token2 = await generateAccessToken(mockAdminUser);
      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens on each call (unique JTI)', async () => {
      const token1 = await generateAccessToken(mockUser);
      const token2 = await generateAccessToken(mockUser);
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', async () => {
      const token = await generateAccessToken(mockUser);
      const payload = await verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-test-123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.role).toBe('USER');
      expect(payload?.tier).toBe('free');
      expect(payload?.type).toBe('access');
    });

    it('should return null for a tampered token', async () => {
      const token = await generateAccessToken(mockUser);
      const tampered = token.slice(0, -5) + 'xxxxx';
      const payload = await verifyAccessToken(tampered);
      expect(payload).toBeNull();
    });

    it('should return null for an empty string', async () => {
      const payload = await verifyAccessToken('');
      expect(payload).toBeNull();
    });

    it('should return null for a random string', async () => {
      const payload = await verifyAccessToken('not.a.jwt');
      expect(payload).toBeNull();
    });

    it('should reject a refresh token used as access token', async () => {
      const refreshToken = await generateRefreshToken(mockUser);
      const payload = await verifyAccessToken(refreshToken);
      expect(payload).toBeNull();
    });

    it('should verify admin user token correctly', async () => {
      const token = await generateAccessToken(mockAdminUser);
      const payload = await verifyAccessToken(token);
      expect(payload?.role).toBe('ADMIN');
      expect(payload?.tier).toBe('pro');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', async () => {
      const token = await generateRefreshToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const token = await generateRefreshToken(mockUser);
      const payload = await verifyRefreshToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-test-123');
      expect(payload?.type).toBe('refresh');
    });

    it('should reject an access token used as refresh token', async () => {
      const accessToken = await generateAccessToken(mockUser);
      const payload = await verifyRefreshToken(accessToken);
      expect(payload).toBeNull();
    });

    it('should reject a tampered refresh token', async () => {
      const token = await generateRefreshToken(mockUser);
      const tampered = token.slice(0, -5) + 'abcde';
      const payload = await verifyRefreshToken(tampered);
      expect(payload).toBeNull();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      const pair = await generateTokenPair(mockUser);
      expect(pair.accessToken).toBeDefined();
      expect(pair.refreshToken).toBeDefined();
      expect(pair.expiresIn).toBe(900); // 15 minutes = 900 seconds
    });

    it('should generate verifiable tokens', async () => {
      const pair = await generateTokenPair(mockUser);
      const accessPayload = await verifyAccessToken(pair.accessToken);
      const refreshPayload = await verifyRefreshToken(pair.refreshToken);
      expect(accessPayload?.sub).toBe('user-test-123');
      expect(refreshPayload?.sub).toBe('user-test-123');
    });

    it('should have different token types', async () => {
      const pair = await generateTokenPair(mockUser);
      const accessPayload = await verifyAccessToken(pair.accessToken);
      const refreshPayload = await verifyRefreshToken(pair.refreshToken);
      expect(accessPayload?.type).toBe('access');
      expect(refreshPayload?.type).toBe('refresh');
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractBearerToken('Bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should return null for null header', () => {
      const token = extractBearerToken(null);
      expect(token).toBeNull();
    });

    it('should return null for empty string', () => {
      const token = extractBearerToken('');
      expect(token).toBeNull();
    });

    it('should return null for non-Bearer scheme', () => {
      const token = extractBearerToken('Basic abc123');
      expect(token).toBeNull();
    });

    it('should be case-insensitive for bearer keyword', () => {
      const token = extractBearerToken('bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should return null for malformed header', () => {
      const token = extractBearerToken('Bearer');
      expect(token).toBeNull();
    });
  });

  describe('getAccessTokenExpiry', () => {
    it('should return 900 seconds (15 minutes)', () => {
      expect(getAccessTokenExpiry()).toBe(900);
    });
  });
});
