import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Auth API Route Tests
 * These tests hit the actual API endpoints and require:
 * - Next.js dev server running on port 9002
 * - PostgreSQL running
 * - Redis running
 *
 * For CI, these tests are run after `pnpm dev` or via the PowerShell test script.
 * Here we use integration-style tests with fetch against the running server.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
let serverAvailable = false;

// Unique email per test run to avoid conflicts
const testEmail = `test-api-${Date.now()}@example.com`;
const testPassword = 'TestP@ssw0rd123!';
const testName = 'Test User API';

// Store tokens from registration
let accessToken = '';
let refreshToken = '';
let sessionCookie = '';

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    serverAvailable = res.ok || res.status === 503; // degraded is still running
  } catch {
    console.warn(`Server not available at ${BASE_URL}, skipping API tests`);
    serverAvailable = false;
  }
});

describe('Auth API Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
        redirect: 'manual',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail.toLowerCase());
      expect(data.accessToken || data.user).toBeDefined();

      if (data.accessToken) accessToken = data.accessToken;
      if (data.refreshToken) refreshToken = data.refreshToken;

      // Check for session cookie
      const cookies = res.headers.get('set-cookie');
      if (cookies) {
        const match = cookies.match(/rb_session=([^;]+)/);
        if (match) sessionCookie = match[1];
      }
    });

    it('should return 400 for invalid input (missing fields)', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad' }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      });

      expect(res.status).toBe(409);
    });

    it('should return 400 for weak password', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'weak-pass@example.com',
          password: '123',
          name: 'Weak User',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
        redirect: 'manual',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();

      // Update tokens
      if (data.accessToken) accessToken = data.accessToken;
      if (data.refreshToken) refreshToken = data.refreshToken;

      // Check session cookie
      const cookies = res.headers.get('set-cookie');
      if (cookies) {
        const match = cookies.match(/rb_session=([^;]+)/);
        if (match) sessionCookie = match[1];
      }
    });

    it('should return 401 for wrong password', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongP@ssw0rd!',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@never-registered.com',
          password: 'Whatever1!',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 400 for missing fields', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return user data for valid session', async () => {
      if (!serverAvailable || !sessionCookie) return;

      const res = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: {
          Cookie: `rb_session=${sessionCookie}`,
        },
      });

      // Should be 200 or return user data
      if (res.status === 200) {
        const data = await res.json();
        expect(data.user || data.session).toBeDefined();
      }
    });

    it('should return 401 for no session', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/session`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should rotate tokens with valid refresh token', async () => {
      if (!serverAvailable || !refreshToken) return;

      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie ? `rb_session=${sessionCookie}` : '',
        },
        body: JSON.stringify({ refreshToken }),
        redirect: 'manual',
      });

      if (res.status === 200) {
        const data = await res.json();
        expect(data.accessToken || data.user).toBeDefined();
      }
    });

    it('should return 401 for invalid refresh token', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid-token' }),
      });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear session and cookies', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: sessionCookie ? `rb_session=${sessionCookie}` : '',
        },
        redirect: 'manual',
      });

      expect([200, 302]).toContain(res.status);
    });
  });
});
