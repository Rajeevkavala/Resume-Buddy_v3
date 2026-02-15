import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getSession,
  generateAccessToken,
  updateSessionActivity,
  type TokenUser,
} from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';

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

    // 3. Get fresh user data from DB
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

    // 4. Update session activity
    await updateSessionActivity(sessionId);

    // 5. Generate a new access token
    const tier = user.subscription?.tier === 'PRO' ? 'pro' : 'free';
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      tier,
    };

    const accessToken = await generateAccessToken(tokenUser);

    // 6. Return user + token
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      accessToken,
      expiresIn: 900, // 15 minutes
    });

  } catch (error) {
    console.error('[Session] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
