import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createSession,
  getSession,
  updateSessionActivity,
  deleteSession,
  deleteAllUserSessions,
  getUserActiveSessions,
  getRedis,
} from '@resumebuddy/auth';

// Session tests require a running Redis instance
// Skip if Redis is not available
let redisAvailable = false;

beforeAll(async () => {
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    redisAvailable = pong === 'PONG';
  } catch {
    console.warn('Redis not available, skipping session tests');
    redisAvailable = false;
  }
});

// Cleanup test sessions after each test
const testSessionIds: string[] = [];
const testUserIds: string[] = [];

afterAll(async () => {
  if (!redisAvailable) return;
  try {
    // Cleanup test user sessions
    for (const userId of testUserIds) {
      await deleteAllUserSessions(userId);
    }
  } catch {
    // Ignore cleanup errors
  }
});

describe('Redis Session Management', () => {
  const testSessionData = {
    userId: 'test-session-user-001',
    email: 'session-test@example.com',
    role: 'USER' as const,
    tier: 'free' as const,
    userAgent: 'vitest/1.0',
    ipAddress: '127.0.0.1',
  };

  beforeEach(() => {
    if (!testUserIds.includes(testSessionData.userId)) {
      testUserIds.push(testSessionData.userId);
    }
  });

  it('should create a session and return sessionId', async () => {
    if (!redisAvailable) return;
    
    const sessionId = await createSession(testSessionData);
    testSessionIds.push(sessionId);
    
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBe(32); // nanoid(32)
  });

  it('should retrieve a session by sessionId', async () => {
    if (!redisAvailable) return;
    
    const sessionId = await createSession(testSessionData);
    testSessionIds.push(sessionId);
    
    const session = await getSession(sessionId);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(testSessionData.userId);
    expect(session?.email).toBe(testSessionData.email);
    expect(session?.role).toBe('USER');
    expect(session?.tier).toBe('free');
    expect(session?.createdAt).toBeDefined();
    expect(session?.lastActivityAt).toBeDefined();
  });

  it('should return null for non-existent session', async () => {
    if (!redisAvailable) return;
    
    const session = await getSession('non-existent-session-id-12345678');
    expect(session).toBeNull();
  });

  it('should update session activity timestamp', async () => {
    if (!redisAvailable) return;
    
    const sessionId = await createSession(testSessionData);
    testSessionIds.push(sessionId);
    
    const sessionBefore = await getSession(sessionId);
    // Wait a small amount to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    await updateSessionActivity(sessionId);
    
    const sessionAfter = await getSession(sessionId);
    expect(sessionAfter?.lastActivityAt).toBeGreaterThanOrEqual(
      sessionBefore?.lastActivityAt || 0
    );
  });

  it('should delete a session', async () => {
    if (!redisAvailable) return;
    
    const sessionId = await createSession(testSessionData);
    
    // Session exists before delete
    const sessionBefore = await getSession(sessionId);
    expect(sessionBefore).not.toBeNull();
    
    await deleteSession(sessionId);
    
    // Session is gone after delete
    const sessionAfter = await getSession(sessionId);
    expect(sessionAfter).toBeNull();
  });

  it('should delete all sessions for a user', async () => {
    if (!redisAvailable) return;
    
    const userId = 'test-delete-all-user-002';
    testUserIds.push(userId);
    
    // Create multiple sessions
    await createSession({ ...testSessionData, userId });
    await createSession({ ...testSessionData, userId });
    await createSession({ ...testSessionData, userId });
    
    // All sessions should exist
    const sessionsBefore = await getUserActiveSessions(userId);
    expect(sessionsBefore.length).toBeGreaterThanOrEqual(3);
    
    // Delete all sessions
    await deleteAllUserSessions(userId);
    
    // No sessions should remain
    const sessionsAfter = await getUserActiveSessions(userId);
    expect(sessionsAfter).toHaveLength(0);
  });

  it('should list all active sessions for a user', async () => {
    if (!redisAvailable) return;
    
    const userId = 'test-list-sessions-user-003';
    testUserIds.push(userId);
    
    // Cleanup first
    await deleteAllUserSessions(userId);
    
    // Create a couple of sessions
    const id1 = await createSession({ ...testSessionData, userId, userAgent: 'Chrome' });
    const id2 = await createSession({ ...testSessionData, userId, userAgent: 'Firefox' });
    
    const sessions = await getUserActiveSessions(userId);
    expect(sessions.length).toBe(2);
    
    const sessionIds = sessions.map((s) => s.sessionId);
    expect(sessionIds).toContain(id1);
    expect(sessionIds).toContain(id2);
    
    // Cleanup
    await deleteAllUserSessions(userId);
  });

  it('should handle deleting non-existent session gracefully', async () => {
    if (!redisAvailable) return;
    
    // Should not throw
    await expect(deleteSession('nonexistent-session-id-abc12345')).resolves.not.toThrow();
  });
});
