// Shared cookie configuration for auth
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'rb_session';
const REFRESH_COOKIE_NAME = 'rb_refresh';

const isProduction = process.env.NODE_ENV === 'production';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

function getSessionCookieOptions(maxAge: number = 604800): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge, // 7 days default
  };
}

function getRefreshCookieOptions(maxAge: number = 604800): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

/**
 * Set auth cookies (session + refresh)
 */
export async function setAuthCookies(sessionId: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions());
  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

/**
 * Clear auth cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', { ...getSessionCookieOptions(0), maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE_NAME, '', { ...getRefreshCookieOptions(0), maxAge: 0 });
}

/**
 * Get session cookie value
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Get refresh cookie value
 */
export async function getRefreshCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value;
}

export { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME };
