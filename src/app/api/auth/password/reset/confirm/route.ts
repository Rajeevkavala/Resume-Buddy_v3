import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyOTP, hashPassword, validatePassword } from '@/lib/auth';

const confirmResetSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/password/reset/confirm
 * Verify OTP and set new password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = confirmResetSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = validated.data;

    // Validate password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'Password too weak', details: passwordCheck.errors },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await verifyOTP(email.toLowerCase(), 'email', code);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.message || 'Invalid or expired code' },
        { status: 400 }
      );
    }

    // Find user and update password
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[PasswordReset/Confirm] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
