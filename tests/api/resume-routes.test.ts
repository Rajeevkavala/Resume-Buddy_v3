import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Resume API Route Tests
 * Requires running server + auth
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
let serverAvailable = false;
let sessionCookie = '';

const testEmail = `test-resume-api-${Date.now()}@example.com`;
const testPassword = 'ResumeTest1!@';

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    serverAvailable = res.ok || res.status === 503;

    if (serverAvailable) {
      // Register and login to get session cookie
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword, name: 'Resume Test User' }),
        redirect: 'manual',
      });

      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
        redirect: 'manual',
      });

      const cookies = loginRes.headers.get('set-cookie');
      if (cookies) {
        const match = cookies.match(/rb_session=([^;]+)/);
        if (match) sessionCookie = match[1];
      }
    }
  } catch {
    console.warn(`Server not available at ${BASE_URL}, skipping resume API tests`);
    serverAvailable = false;
  }
});

describe('Resume API Routes', () => {
  describe('GET /api/resumes', () => {
    it('should return 401 for unauthenticated request', async () => {
      if (!serverAvailable) return;

      const res = await fetch(`${BASE_URL}/api/resumes`);
      expect([401, 403]).toContain(res.status);
    });

    it('should list user resumes with valid session', async () => {
      if (!serverAvailable || !sessionCookie) return;

      const res = await fetch(`${BASE_URL}/api/resumes`, {
        headers: { Cookie: `rb_session=${sessionCookie}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.resumes || data)).toBe(true);
    });
  });

  describe('POST /api/resumes/upload', () => {
    it('should return 401 for unauthenticated upload', async () => {
      if (!serverAvailable) return;

      const formData = new FormData();
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      formData.append('file', blob, 'test.pdf');

      const res = await fetch(`${BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        body: formData,
      });

      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/resumes/[id]', () => {
    it('should return 404 for non-existent resume', async () => {
      if (!serverAvailable || !sessionCookie) return;

      const res = await fetch(`${BASE_URL}/api/resumes/nonexistent-id`, {
        headers: { Cookie: `rb_session=${sessionCookie}` },
      });

      expect([404, 400]).toContain(res.status);
    });
  });
});
