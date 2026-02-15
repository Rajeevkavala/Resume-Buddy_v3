import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  hashPassword,
  validatePassword,
  generateTokenPair,
  createSession,
  type TokenUser,
} from '@/lib/auth';
import { setAuthCookies } from '@/lib/auth-cookies';

// ============ Request Schema ============

const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1, 'Name is required').max(255),
});

// ============ POST /api/auth/register ============

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { email, password, name } = validated.data;

    // 2. Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'Password too weak', details: passwordCheck.errors },
        { status: 400 }
      );
    }

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // 4. Hash password
    const passwordHash = await hashPassword(password);

    // 5. Create user + account + subscription in a transaction
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: false,
        accounts: {
          create: {
            provider: 'credentials',
            providerAccountId: email.toLowerCase(),
          },
        },
        subscription: {
          create: {
            tier: 'FREE',
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    // 6. Generate token pair
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      tier: user.subscription?.tier === 'PRO' ? 'pro' : 'free',
    };

    const tokenPair = await generateTokenPair(tokenUser);

    // 7. Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: tokenPair.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
      tier: tokenUser.tier,
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
        tier: tokenUser.tier,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn,
    }, { status: 201 });

  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
