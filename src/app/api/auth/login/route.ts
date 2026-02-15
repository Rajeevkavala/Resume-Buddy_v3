import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  verifyPassword,
  generateTokenPair,
  createSession,
  type TokenUser,
} from '@/lib/auth';
import { setAuthCookies } from '@/lib/auth-cookies';

// ============ Request Schema ============

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============ POST /api/auth/login ============

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    // 2. Find user by email (include subscription)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Check if user is ACTIVE
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // 4. Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6. Generate token pair
    const tier = user.subscription?.tier === 'PRO' ? 'pro' : 'free';
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      tier,
    };

    const tokenPair = await generateTokenPair(tokenUser);

    // 7. Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: tokenPair.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 8. Create Redis session
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

    const sessionId = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      tier,
      avatar: user.avatar || undefined,
      userAgent,
      ipAddress,
    });

    // 9. Set cookies
    await setAuthCookies(sessionId, tokenPair.refreshToken);

    // 10. Return response
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
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn,
    });

  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
