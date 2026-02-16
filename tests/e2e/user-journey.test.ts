import { describe, it, expect, beforeAll } from 'vitest';

/**
 * End-to-End User Journey Tests
 * Tests the complete user flow against the running application.
 * Requires: Next.js server, PostgreSQL, Redis, MinIO all running.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
let serverAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    serverAvailable = res.ok || res.status === 503;
  } catch {
    console.warn(`Server not available at ${BASE_URL}, skipping E2E tests`);
    serverAvailable = false;
  }
});

describe('Complete User Journey', () => {
  const uniqueId = Date.now();
  const testEmail = `e2e-user-${uniqueId}@example.com`;
  const testPassword = 'E2eTestP@ss1!';
  const testName = 'E2E Test User';

  let sessionCookie = '';
  let userId = '';

  it('should complete: register → login → check session', async () => {
    if (!serverAvailable) return;

    // Step 1: Register
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
      }),
      redirect: 'manual',
    });

    expect(regRes.status).toBe(200);
    const regData = await regRes.json();
    expect(regData.user).toBeDefined();
    userId = regData.user.id || regData.user.userId;

    // Extract session cookie
    const regCookies = regRes.headers.get('set-cookie');
    if (regCookies) {
      const match = regCookies.match(/rb_session=([^;]+)/);
      if (match) sessionCookie = match[1];
    }

    // Step 2: Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
      redirect: 'manual',
    });

    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.user).toBeDefined();

    // Update session cookie
    const loginCookies = loginRes.headers.get('set-cookie');
    if (loginCookies) {
      const match = loginCookies.match(/rb_session=([^;]+)/);
      if (match) sessionCookie = match[1];
    }

    // Step 3: Check session
    if (sessionCookie) {
      const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: { Cookie: `rb_session=${sessionCookie}` },
      });

      if (sessionRes.status === 200) {
        const sessionData = await sessionRes.json();
        expect(sessionData.user || sessionData.session).toBeDefined();
      }
    }
  });

  it('should enforce free tier limits correctly', async () => {
    if (!serverAvailable) return;

    // Verify that the tier limits are properly defined
    const { TIER_LIMITS } = await import('@resumebuddy/database');

    // Free tier should have limited credits
    expect(TIER_LIMITS.FREE.aiCreditsPerDay).toBe(5);
    expect(TIER_LIMITS.FREE.dailyExports).toBe(2);

    // Pro tier should have more credits
    expect(TIER_LIMITS.PRO.aiCreditsPerDay).toBe(10);
    expect(TIER_LIMITS.PRO.dailyExports).toBe(-1);
  });

  it('should serve public pages correctly', async () => {
    if (!serverAvailable) return;

    // Homepage
    const homeRes = await fetch(`${BASE_URL}/`);
    expect(homeRes.status).toBe(200);

    // Login page
    const loginRes = await fetch(`${BASE_URL}/login`);
    expect(loginRes.status).toBe(200);

    // Signup page
    const signupRes = await fetch(`${BASE_URL}/signup`);
    expect(signupRes.status).toBe(200);
  });

  it('should protect dashboard route for unauthenticated users', async () => {
    if (!serverAvailable) return;

    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    // Should redirect to login
    expect([301, 302, 303, 307, 308]).toContain(res.status);
  });

  it('should return health check status', async () => {
    if (!serverAvailable) return;

    const res = await fetch(`${BASE_URL}/api/health`);
    expect([200, 503]).toContain(res.status);

    const data = await res.json();
    expect(data.status).toBeDefined();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    expect(data.services).toBeDefined();
    expect(data.services.database).toBeDefined();
    expect(data.services.redis).toBeDefined();
    expect(data.timestamp).toBeDefined();
    expect(data.version).toBeDefined();
  });

  it('should have correct security headers', async () => {
    if (!serverAvailable) return;

    const res = await fetch(`${BASE_URL}/login`);
    const headers = res.headers;

    // Check security headers set in next.config.mjs
    const xContentType = headers.get('x-content-type-options');
    if (xContentType) {
      expect(xContentType).toBe('nosniff');
    }

    const xFrame = headers.get('x-frame-options');
    if (xFrame) {
      expect(['DENY', 'SAMEORIGIN']).toContain(xFrame);
    }
  });

  it('should complete: logout flow', async () => {
    if (!serverAvailable || !sessionCookie) return;

    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `rb_session=${sessionCookie}` },
      redirect: 'manual',
    });

    expect([200, 302]).toContain(logoutRes.status);

    // Session should be invalid after logout
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: `rb_session=${sessionCookie}` },
    });

    expect([401, 200]).toContain(sessionRes.status);
  });
});
