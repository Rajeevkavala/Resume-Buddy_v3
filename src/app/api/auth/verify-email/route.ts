import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, storeOTP, sendEmailOTP, verifyOTP } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';

/**
 * POST /api/auth/verify-email — Send verification code to user's email
 */
export async function POST() {
  try {
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Generate and store OTP
    const { code } = await storeOTP(user.email, 'email', 'verify_email');

    // Send OTP via email
    await sendEmailOTP(user.email, code);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    console.error('[VerifyEmail] Send error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}

/**
 * PUT /api/auth/verify-email — Verify email with OTP code
 */
export async function PUT(request: NextRequest) {
  try {
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify OTP
    const result = await verifyOTP(user.email, 'email', code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('[VerifyEmail] Verify error:', error);
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }
}
