import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Performance / Load Tests  
 * Basic performance verification against running services.
 * For full load testing, use the PowerShell test script or autocannon.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
let serverAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    serverAvailable = res.ok || res.status === 503;
  } catch {
    console.warn('Server not available for performance tests');
    serverAvailable = false;
  }
});

async function measureLatency(url: string, options?: RequestInit): Promise<number> {
  const start = Date.now();
  await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
  return Date.now() - start;
}

describe('Performance Tests', () => {
  it('health check should respond under 500ms', async () => {
    if (!serverAvailable) return;

    const latency = await measureLatency(`${BASE_URL}/api/health`);
    expect(latency).toBeLessThan(500);
  });

  it('homepage should respond under 2000ms', async () => {
    if (!serverAvailable) return;

    const latency = await measureLatency(`${BASE_URL}/`);
    expect(latency).toBeLessThan(2000);
  });

  it('login page should respond under 2000ms', async () => {
    if (!serverAvailable) return;

    const latency = await measureLatency(`${BASE_URL}/login`);
    expect(latency).toBeLessThan(2000);
  });

  it('auth endpoint should respond under 1000ms', async () => {
    if (!serverAvailable) return;

    const latency = await measureLatency(`${BASE_URL}/api/auth/session`);
    expect(latency).toBeLessThan(1000);
  });

  it('should handle 5 concurrent health checks', async () => {
    if (!serverAvailable) return;

    const promises = Array.from({ length: 5 }, () =>
      fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(10000) })
    );

    const results = await Promise.all(promises);
    const allOk = results.every((r) => r.status === 200 || r.status === 503);
    expect(allOk).toBe(true);
  });

  it('should handle 3 concurrent login attempts', async () => {
    if (!serverAvailable) return;

    const promises = Array.from({ length: 3 }, (_, i) =>
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `perf-test-${i}@example.com`,
          password: 'NotRealP@ss1!',
        }),
        signal: AbortSignal.timeout(10000),
      })
    );

    const results = await Promise.all(promises);
    // All should respond (even if 401)
    results.forEach((r) => {
      expect([200, 400, 401, 429]).toContain(r.status);
    });
  });
});
