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

    // 2b. Store returnTo URL so we can redirect after OAuth callback
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo');
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      cookieStore.set('oauth_return_to', returnTo, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 600,
      });
    }

    // 3. Generate Google OAuth URL
    const url = getGoogleAuthUrl(state);

    // 4. Return URL as JSON (so frontend can handle redirect)
    // This avoids CORS issues when fetch follows a redirect to Google
    return NextResponse.json({ url });

  } catch (error) {
    console.error('[Google OAuth] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google sign-in' },
      { status: 500 }
    );
  }
}
