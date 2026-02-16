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
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { enforceApiRateLimit } from '@/lib/api-rate-limiter';

function isAdminEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
  return adminEmails.includes(normalized);
}

// ============ Request Schema ============

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============ POST /api/auth/login ============

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const rateLimitResponse = await enforceApiRateLimit(request, 'auth-login');
    if (rateLimitResponse) return rateLimitResponse;

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

    // 6. Ensure admin role for configured admin emails
    let effectiveRole = user.role;
    if (isAdminEmail(user.email) && user.role !== 'ADMIN') {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
      effectiveRole = 'ADMIN';
    }

    // 7. Generate token pair
    const tier = user.subscription?.tier === 'PRO' ? 'pro' : 'free';
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: effectiveRole,
      tier,
    };

    const tokenPair = await generateTokenPair(tokenUser);

    // 8. Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: tokenPair.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 9. Create Redis session
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

    const sessionId = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      role: effectiveRole,
      tier,
      avatar: user.avatar || undefined,
      userAgent,
      ipAddress,
    });

    // 10. Set cookies
    await setAuthCookies(sessionId, tokenPair.refreshToken);

    // 11. Return response
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: effectiveRole,
        tier,
        avatar: await resolveAvatarUrl(user.avatar),
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
