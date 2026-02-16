import { Redis } from 'ioredis';
import { nanoid } from 'nanoid';

// ============ Types ============

export interface SessionData {
  userId: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
  avatar?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  lastActivityAt: number;
}

export interface SessionInfo {
  sessionId: string;
  data: SessionData;
}

// ============ Configuration ============

const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';
const DEFAULT_TTL = 604800; // 7 days in seconds

// ============ Redis Client ============
// Uses a singleton pattern. In production, prefer importing from a shared
// module (e.g., @/lib/redis) to avoid duplicate connections.

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 5,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      lazyConnect: true,
      enableAutoPipelining: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      reconnectOnError: (err: Error) => {
        return err.message.includes('READONLY');
      },
    });

    redisClient.on('error', (err: Error) => {
      console.error('[Redis:Auth] Connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis:Auth] Connected successfully');
    });
  }
  return redisClient;
}

/**
 * Get the raw Redis client (for health checks, etc.)
 */
export function getRedis(): Redis {
  return getRedisClient();
}

// ============ Session Management ============

/**
 * Create a new session, store in Redis with 7-day TTL.
 * Returns the sessionId (32-char nanoid).
 */
export async function createSession(data: Omit<SessionData, 'createdAt' | 'lastActivityAt'>): Promise<string> {
  const redis = getRedisClient();
  const sessionId = nanoid(32);
  const now = Date.now();

  const sessionData: SessionData = {
    ...data,
    createdAt: now,
    lastActivityAt: now,
  };

  const key = `${SESSION_PREFIX}${sessionId}`;
  const ttl = parseInt(process.env.SESSION_TTL || String(DEFAULT_TTL), 10);

  // Store session data
  await redis.set(key, JSON.stringify(sessionData), 'EX', ttl);

  // Track this session in the user's session set
  await redis.sadd(`${USER_SESSIONS_PREFIX}${data.userId}`, sessionId);

  return sessionId;
}

/**
 * Get session data by sessionId. Returns null if not found or expired.
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  const data = await redis.get(key);
  if (!data) return null;

  try {
    return JSON.parse(data) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Update the lastActivityAt timestamp for a session.
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  const data = await redis.get(key);
  if (!data) return;

  try {
    const session = JSON.parse(data) as SessionData;
    session.lastActivityAt = Date.now();

    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.set(key, JSON.stringify(session), 'EX', ttl);
    }
  } catch {
    // Silently fail - non-critical operation
  }
}

/**
 * Delete a single session and remove it from the user's session set.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `${SESSION_PREFIX}${sessionId}`;

  // Get the session to find the userId
  const data = await redis.get(key);
  if (data) {
    try {
      const session = JSON.parse(data) as SessionData;
      await redis.srem(`${USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
    } catch {
      // Continue with deletion even if parse fails
    }
  }

  await redis.del(key);
}

/**
 * Delete ALL sessions for a user (sign out from all devices).
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const redis = getRedisClient();
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

  // Get all session IDs for this user
  const sessionIds = await redis.smembers(userSessionsKey);

  if (sessionIds.length > 0) {
    // Delete all session data
    const keys = sessionIds.map((id) => `${SESSION_PREFIX}${id}`);
    await redis.del(...keys);
  }

  // Clear the user's session set
  await redis.del(userSessionsKey);
}

/**
 * List all active sessions for a user.
 */
export async function getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
  const redis = getRedisClient();
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

  const sessionIds = await redis.smembers(userSessionsKey);
  const sessions: SessionInfo[] = [];

  for (const sessionId of sessionIds) {
    const data = await getSession(sessionId);
    if (data) {
      sessions.push({ sessionId, data });
    } else {
      // Session expired, clean up the set
      await redis.srem(userSessionsKey, sessionId);
    }
  }

  return sessions;
}

/**
 * Disconnect Redis client (for cleanup)
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
