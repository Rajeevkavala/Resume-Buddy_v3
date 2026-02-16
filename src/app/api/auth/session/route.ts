import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getSession,
  generateAccessToken,
  updateSessionActivity,
  type TokenUser,
} from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { getRedisClient } from '@/lib/redis';

function isAdminEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
  return adminEmails.includes(normalized);
}

// User profile cache TTL: 5 minutes (avoid DB hit every page load)
const USER_CACHE_TTL = 300;
const USER_CACHE_PREFIX = 'user_profile:';

// Session activity debounce: only update every 5 minutes
const ACTIVITY_DEBOUNCE_MS = 5 * 60 * 1000;

interface CachedUserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: string;
  avatar: string | null;
  emailVerified: boolean;
  status: string;
  cachedAt: number;
}

// ============ GET /api/auth/session ============

export async function GET() {
  try {
    // 1. Read session cookie
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // 2. Get session from Redis
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // 3. Try Redis cache first, fall back to DB
    let userProfile = await getCachedUserProfile(session.userId);
    
    if (!userProfile) {
      // Cache miss — query DB
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { subscription: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'User not found or account suspended' },
          { status: 403 }
        );
      }

      // Ensure admin role for configured admin emails
      let effectiveRole = user.role;
      if (isAdminEmail(user.email) && user.role !== 'ADMIN') {
        await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
        effectiveRole = 'ADMIN';
      }

      const tier = user.subscription?.tier === 'PRO' ? 'pro' : 'free';

      userProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: effectiveRole,
        tier,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        status: user.status,
        cachedAt: Date.now(),
      };

      // Cache in Redis (non-blocking)
      cacheUserProfile(session.userId, userProfile).catch(() => {});
    }

    // 4. Debounced session activity update (only update every 5 minutes)
    const timeSinceActivity = Date.now() - session.lastActivityAt;
    if (timeSinceActivity > ACTIVITY_DEBOUNCE_MS) {
      updateSessionActivity(sessionId).catch(() => {});
    }

    // 5. Generate access token
    const tokenUser: TokenUser = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role as 'USER' | 'ADMIN',
      tier: userProfile.tier as 'free' | 'pro',
    };

    const accessToken = await generateAccessToken(tokenUser);

    // 6. Return user + token
    return NextResponse.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        tier: userProfile.tier,
        avatar: await resolveAvatarUrl(userProfile.avatar),
        emailVerified: userProfile.emailVerified,
      },
      accessToken,
      expiresIn: 900,
    });

  } catch (error) {
    console.error('[Session] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============ Redis User Profile Cache ============

async function getCachedUserProfile(userId: string): Promise<CachedUserProfile | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(`${USER_CACHE_PREFIX}${userId}`);
    if (!data) return null;
    return JSON.parse(data) as CachedUserProfile;
  } catch {
    return null;
  }
}

async function cacheUserProfile(userId: string, profile: CachedUserProfile): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(
      `${USER_CACHE_PREFIX}${userId}`,
      JSON.stringify(profile),
      'EX',
      USER_CACHE_TTL
    );
  } catch {
    // Non-critical — DB query will work next time
  }
}

/**
 * Invalidate cached user profile (call after profile updates, subscription changes, etc.)
 */
export async function invalidateUserProfileCache(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(`${USER_CACHE_PREFIX}${userId}`);
  } catch {
    // Non-critical
  }
}
