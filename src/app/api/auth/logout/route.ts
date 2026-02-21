import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { getSessionCookie, clearAuthCookies } from '@/lib/auth-cookies';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// ============ POST /api/auth/logout ============

export async function POST() {
  try {
    // 1. Read session cookie
    const sessionId = await getSessionCookie();

    // 2. Delete session from Redis (if exists)
    if (sessionId) {
      await deleteSession(sessionId);
    }

    // 3. Clear cookies
    await clearAuthCookies();

    // 4. Return success
    return NextResponse.json({ success: true, message: 'Logged out successfully' }, { headers: NO_STORE_HEADERS });

  } catch (error) {
    console.error('[Logout] Error:', error);
    // Still clear cookies even on error
    try {
      await clearAuthCookies();
    } catch {
      // Ignore cookie clear errors
    }
    return NextResponse.json({ success: true, message: 'Logged out' }, { headers: NO_STORE_HEADERS });
  }
}
