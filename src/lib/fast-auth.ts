'use client';

/**
 * Fast Auth Checker
 * 
 * This utility provides faster authentication state detection
 * by checking the session cookie before the full session API call completes.
 */

export const fastAuthCheck = (): { isLikelyAuthenticated: boolean; userId?: string } => {
  if (typeof window === 'undefined') {
    return { isLikelyAuthenticated: false };
  }

  try {
    // Check for rb_session cookie (set by the auth API on login/register)
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('rb_session='));
    
    if (sessionCookie) {
      // The cookie exists — user is likely authenticated.
      // We don't parse the JWT here; the server validates on /api/auth/session.
      return { isLikelyAuthenticated: true };
    }

    return { isLikelyAuthenticated: false };
  } catch (error) {
    console.warn('Error in fast auth check:', error);
    return { isLikelyAuthenticated: false };
  }
};

/**
 * Sets up fast auth cookie for middleware.
 * Note: In the new auth system the rb_session cookie is set server-side
 * by the login/register API routes. This function is kept for backward
 * compatibility but is largely a no-op — use clearFastAuthCookie for logout.
 */
export const setFastAuthCookie = (_userId: string) => {
  // rb_session is an httpOnly cookie set by the server.
  // Client-side code cannot set it, so this is intentionally a no-op.
};

/**
 * Clears fast auth cookie on logout.
 * The actual rb_session cookie is httpOnly and cleared server-side
 * via POST /api/auth/logout — this clears any legacy cookies.
 */
export const clearFastAuthCookie = () => {
  if (typeof window === 'undefined') return;
  
  // Clear legacy cookies from old auth system
  document.cookie = 'fast-auth-uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

/**
 * Sets access-denied cookie to block navigation to protected routes
 */
export const setAccessDeniedCookie = () => {
  if (typeof window === 'undefined') return;
  
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:';
  document.cookie = `access-denied=true; path=/; max-age=86400; samesite=lax${isSecure ? '; secure' : ''}`;
};

/**
 * Clears access-denied cookie when user is granted access or logs out
 */
export const clearAccessDeniedCookie = () => {
  if (typeof window === 'undefined') return;
  
  document.cookie = 'access-denied=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};