import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, hashPassword, validatePassword, getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

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
    const validated = changePasswordSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validated.data;

    // 3. Validate new password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'New password too weak', details: passwordCheck.errors },
        { status: 400 }
      );
    }

    // 4. Fetch user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Password change not available for OAuth accounts' },
        { status: 400 }
      );
    }

    // 5. Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Incorrect current password' },
        { status: 401 }
      );
    }

    // 6. Hash and update new password
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('[PasswordChange] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
