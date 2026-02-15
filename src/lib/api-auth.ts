import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';

/**
 * Authenticate an API request using the session cookie.
 * Returns the session data or a 401 response.
 */
export async function authenticateRequest(): Promise<
  | { authenticated: true; userId: string; email: string; role: string; tier: string }
  | { authenticated: false; response: NextResponse }
> {
  const sessionId = await getSessionCookie();
  if (!sessionId) {
    return {
      authenticated: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const session = await getSession(sessionId);
  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json({ error: 'Session expired' }, { status: 401 }),
    };
  }

  return {
    authenticated: true,
    userId: session.userId,
    email: session.email,
    role: session.role || 'USER',
    tier: session.tier || 'free',
  };
}
