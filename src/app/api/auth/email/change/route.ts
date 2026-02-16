import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';

const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

/**
 * POST /api/auth/email/change
 * Change a user's email address (requires re-authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via session
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // 2. Validate input
    const body = await request.json();
    const validated = changeEmailSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    const { newEmail, currentPassword } = validated.data;
    const normalizedEmail = newEmail.toLowerCase();

    // 3. Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already in use by another account' },
        { status: 409 }
      );
    }

    // 4. Verify current password
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Email change not available for OAuth accounts' },
        { status: 400 }
      );
    }

    const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect current password' },
        { status: 401 }
      );
    }

    // 5. Update email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: normalizedEmail,
        emailVerified: false, // Require re-verification
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully. Please verify your new email address.',
    });
  } catch (error) {
    console.error('[EmailChange] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
