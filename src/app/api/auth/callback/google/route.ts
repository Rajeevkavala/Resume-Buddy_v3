import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  getGoogleUser,
  generateTokenPair,
  createSession,
  type TokenUser,
} from '@/lib/auth';
import { setAuthCookies } from '@/lib/auth-cookies';
import { sendWelcomeEmail } from '@/lib/email-notifications';

function isAdminEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
  return adminEmails.includes(normalized);
}

// ============ GET /api/auth/callback/google ============

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('[Google Callback] OAuth error:', error);
      return NextResponse.redirect(`${appUrl}/login?error=oauth_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${appUrl}/login?error=missing_params`);
    }

    // 1. Verify state matches cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
    }

    // Clear state cookie
    cookieStore.set('oauth_state', '', { maxAge: 0, path: '/' });

    // 2. Exchange code for Google user info
    const googleUser = await getGoogleUser(code);

    if (!googleUser.email) {
      return NextResponse.redirect(`${appUrl}/login?error=no_email`);
    }

    // 3. Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email.toLowerCase() },
      include: {
        accounts: true,
        subscription: true,
      },
    });

    const shouldPromoteToAdmin = isAdminEmail(googleUser.email);
    let isNewUser = false;

    if (user) {
      // Check if Google account is linked
      const hasGoogleAccount = user.accounts.some(
        (acc: { provider: string; providerAccountId: string }) =>
          acc.provider === 'google' && acc.providerAccountId === googleUser.id
      );

      if (!hasGoogleAccount) {
        // Link Google account to existing user
        await prisma.account.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: googleUser.id,
          },
        });
      }

      // Update user info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          emailVerified: true,
          avatar: user.avatar || googleUser.picture || undefined,
          name: user.name || googleUser.name,
          ...(shouldPromoteToAdmin && user.role !== 'ADMIN' ? { role: 'ADMIN' } : {}),
        },
      });
    } else {
      isNewUser = true;
      // Create new user with Google account + subscription
      user = await prisma.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name,
          avatar: googleUser.picture || undefined,
          role: shouldPromoteToAdmin ? 'ADMIN' : 'USER',
          status: 'ACTIVE',
          emailVerified: googleUser.emailVerified,
          lastLoginAt: new Date(),
          accounts: {
            create: {
              provider: 'google',
              providerAccountId: googleUser.id,
            },
          },
          subscription: {
            create: {
              tier: 'FREE',
            },
          },
        },
        include: {
          accounts: true,
          subscription: true,
        },
      });
    }

    // Refresh user object if we promoted role
    if (user && shouldPromoteToAdmin && user.role !== 'ADMIN') {
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { accounts: true, subscription: true },
      });
      if (!user) {
        return NextResponse.redirect(`${appUrl}/login?error=user_not_found`);
      }
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      return NextResponse.redirect(`${appUrl}/login?error=account_suspended`);
    }

    // 4. Generate token pair
    const tier = user.subscription?.tier === 'PRO' ? 'pro' : 'free';
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      tier,
    };

    const tokenPair = await generateTokenPair(tokenUser);

    // 5. Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: tokenPair.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 6. Create Redis session
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

    // 7. Set cookies
    await setAuthCookies(sessionId, tokenPair.refreshToken);

    // 7b. Send welcome email for new users (non-blocking)
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name || 'there').catch(() => {});
    }

    // 8. Redirect to returnTo URL (from cookie) or default to dashboard
    const returnTo = cookieStore.get('oauth_return_to')?.value;
    cookieStore.set('oauth_return_to', '', { maxAge: 0, path: '/' });
    const redirectPath = (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) ? returnTo : '/dashboard';
    return NextResponse.redirect(`${appUrl}${redirectPath}`);

  } catch (error) {
    console.error('[Google Callback] Error:', error);
    return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
  }
}
