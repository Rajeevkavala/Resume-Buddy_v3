import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  verifyOTP,
  generateTokenPair,
  createSession,
  type TokenUser,
  type OTPChannel,
  type OTPPurpose,
} from '@/lib/auth';
import { setAuthCookies } from '@/lib/auth-cookies';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import { sendWelcomeEmail } from '@/lib/email-notifications';
import { enforceApiRateLimit } from '@/lib/api-rate-limiter';

// ============ Request Schema ============

const verifyOTPSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  code: z.string().min(4).max(8),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  purpose: z.enum(['login', 'verify_phone', 'verify_email', 'password_reset']),
});

// ============ POST /api/auth/otp/verify ============

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 OTP verify attempts per 10 minutes per IP
    const rateLimitResponse = await enforceApiRateLimit(request, 'auth-otp-verify');
    if (rateLimitResponse) return rateLimitResponse;

    // 1. Parse and validate input
    const body = await request.json();
    const validated = verifyOTPSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { destination, code, channel, purpose } = validated.data;

    // 2. Verify OTP via store
    const result = await verifyOTP(destination, channel as OTPChannel, code);

    if (!result.success) {
      const statusCode = result.attemptsRemaining === 0 ? 429 : 400;
      return NextResponse.json(
        {
          error: result.message,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: statusCode }
      );
    }

    // 3. Handle purpose-specific logic
    switch (purpose as OTPPurpose) {
      case 'login': {
        // Find or create user
        const user = await findOrCreateUserByDestination(destination, channel as OTPChannel);

        if (!user) {
          return NextResponse.json(
            { error: 'Failed to create user account' },
            { status: 500 }
          );
        }

        // Check user status
        if (user.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'Account is suspended. Please contact support.' },
            { status: 403 }
          );
        }

        // Update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Generate tokens
        const tier = user.subscription?.tier === 'PRO' ? 'pro' : 'free';
        const tokenUser: TokenUser = {
          id: user.id,
          email: user.email,
          role: user.role,
          tier,
        };

        const tokenPair = await generateTokenPair(tokenUser);

        // Store refresh token in DB
        await prisma.refreshToken.create({
          data: {
            token: tokenPair.refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        // Create Redis session
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

        // Set cookies
        await setAuthCookies(sessionId, tokenPair.refreshToken);

        // Send welcome email to new users (non-blocking)
        const userIsNew = !user.name;
        if (userIsNew && channel === 'email') {
          sendWelcomeEmail(user.email, user.name || 'there').catch(() => {});
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tier,
            avatar: await resolveAvatarUrl(user.avatar),
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            isNewUser: !user.name,
          },
          accessToken: tokenPair.accessToken,
          expiresIn: tokenPair.expiresIn,
        });
      }

      case 'verify_phone': {
        // Update phone verified status
        const user = await prisma.user.findFirst({
          where: { phone: destination },
        });

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });

        return NextResponse.json({
          success: true,
          message: 'Phone number verified successfully.',
        });
      }

      case 'verify_email': {
        const user = await prisma.user.findFirst({
          where: { email: destination },
        });

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully.',
        });
      }

      case 'password_reset': {
        // Generate a short-lived password reset token
        const user = await prisma.user.findFirst({
          where: { email: destination },
        });

        if (!user) {
          // Don't reveal whether user exists
          return NextResponse.json({
            success: true,
            message: 'If an account exists, a password reset link has been sent.',
          });
        }

        // Create verification token for password reset
        const { randomBytes } = await import('crypto');
        const resetToken = randomBytes(32).toString('hex');

        await prisma.verificationToken.create({
          data: {
            identifier: destination,
            token: resetToken,
            type: 'PASSWORD_RESET',
            expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Password reset verified. You can now set a new password.',
          resetToken,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid purpose' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[OTP/Verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============ Helper: Find or Create User ============

async function findOrCreateUserByDestination(
  destination: string,
  channel: OTPChannel
) {
  if (channel === 'email') {
    // Find by email
    let user = await prisma.user.findUnique({
      where: { email: destination.toLowerCase() },
      include: { subscription: true },
    });

    if (!user) {
      // Create new user with email
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: destination.toLowerCase(),
            emailVerified: true, // Verified via OTP
            role: 'USER',
            status: 'ACTIVE',
          },
        });

        // Create credentials account (no password for OTP users)
        await tx.account.create({
          data: {
            userId: newUser.id,
            provider: 'credentials',
            providerAccountId: newUser.email,
          },
        });

        // Create free subscription
        await tx.subscription.create({
          data: {
            userId: newUser.id,
            tier: 'FREE',
            status: 'ACTIVE',
          },
        });

        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { subscription: true },
        });
      });
    }

    return user;
  } else {
    // WhatsApp or SMS — find by phone
    let user = await prisma.user.findFirst({
      where: { phone: destination },
      include: { subscription: true },
    });

    if (!user) {
      // Create new user with phone
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: `phone_${destination.replace(/\+/g, '')}@otp.resumebuddy.local`,
            phone: destination,
            phoneVerified: true, // Verified via OTP
            role: 'USER',
            status: 'ACTIVE',
          },
        });

        // Create account
        await tx.account.create({
          data: {
            userId: newUser.id,
            provider: 'phone',
            providerAccountId: destination,
          },
        });

        // Create free subscription
        await tx.subscription.create({
          data: {
            userId: newUser.id,
            tier: 'FREE',
            status: 'ACTIVE',
          },
        });

        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { subscription: true },
        });
      });
    }

    return user;
  }
}
