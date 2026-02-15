import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { getGoogleAuthUrl } from '@/lib/auth';

// ============ GET /api/auth/google ============

export async function GET(request: NextRequest) {
  try {
    // 1. Generate random state for CSRF protection
    const state = nanoid(32);

    // 2. Store state in a cookie (short-lived, 10 min)
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    // 3. Generate Google OAuth URL
    const url = getGoogleAuthUrl(state);

    // 4. Redirect to Google
    return NextResponse.redirect(url);

  } catch (error) {
    console.error('[Google OAuth] Error:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
  }
}
