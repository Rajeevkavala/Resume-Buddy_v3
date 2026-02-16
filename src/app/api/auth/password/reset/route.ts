import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { storeOTP, sendEmailOTP } from '@/lib/auth';

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/auth/password/reset
 * Request a password reset OTP via email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resetRequestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    const { email } = validated.data;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      try {
        // Generate and store OTP
        const { code } = await storeOTP(email.toLowerCase(), 'email', 'password_reset');

        // Send OTP via email
        await sendEmailOTP(email.toLowerCase(), code);
      } catch (error) {
        console.error('[PasswordReset] OTP send error:', error);
        // Don't expose internal errors
      }
    }

    // Always succeed to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset code has been sent.',
    });
  } catch (error) {
    console.error('[PasswordReset] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
