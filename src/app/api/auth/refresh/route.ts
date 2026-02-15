import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyRefreshToken,
  generateTokenPair,
  createSession,
  deleteSession,
  type TokenUser,
} from '@/lib/auth';
import { getSessionCookie, getRefreshCookie, setAuthCookies } from '@/lib/auth-cookies';

// ============ POST /api/auth/refresh ============

export async function POST() {
  try {
    // 1. Read refresh cookie
    const refreshTokenValue = await getRefreshCookie();
    if (!refreshTokenValue) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // 2. Verify refresh token
    const payload = await verifyRefreshToken(refreshTokenValue);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // 3. Check it's not revoked in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
    });

    if (!storedToken || storedToken.revoked) {
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // 4. Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { subscription: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User not found or account suspended' },
        { status: 403 }
      );
    }

    // 5. Generate new token pair (token rotation)
    const tier = user.subscription?.tier === 'PRO' ? 'pro' : 'free';
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      tier,
    };

    const newTokenPair = await generateTokenPair(tokenUser);

    // 6. Revoke old refresh token, store new one (transaction)
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { token: refreshTokenValue },
        data: { revoked: true, revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          token: newTokenPair.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // 7. Delete old session, create new one
    const oldSessionId = await getSessionCookie();
    if (oldSessionId) {
      await deleteSession(oldSessionId);
    }

    const newSessionId = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      tier,
      avatar: user.avatar || undefined,
    });

    // 8. Update cookies
    await setAuthCookies(newSessionId, newTokenPair.refreshToken);

    // 9. Return response
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
      accessToken: newTokenPair.accessToken,
      expiresIn: newTokenPair.expiresIn,
    });

  } catch (error) {
    console.error('[Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
