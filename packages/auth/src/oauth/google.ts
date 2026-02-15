import { OAuth2Client } from 'google-auth-library';

// ============ Types ============

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

// ============ Configuration ============

function getGoogleClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

// ============ OAuth Functions ============

/**
 * Generate Google OAuth URL with consent prompt.
 * @param state - CSRF state token to verify on callback
 */
export function getGoogleAuthUrl(state: string): string {
  const client = getGoogleClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    prompt: 'consent',
    state,
    redirect_uri: redirectUri,
  });
}

/**
 * Exchange authorization code for Google user info.
 * @param code - Authorization code from callback
 */
export async function getGoogleUser(code: string): Promise<GoogleUser> {
  const client = getGoogleClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  // Exchange code for tokens
  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
  client.setCredentials(tokens);

  // Get user info
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const data = await response.json();

  return {
    id: data.id,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    picture: data.picture || '',
    emailVerified: data.verified_email ?? false,
  };
}

/**
 * Refresh an expired Google OAuth token.
 * @param refreshToken - Google refresh token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const client = getGoogleClient();
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh Google token');
  }

  return {
    accessToken: credentials.access_token,
    expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
  };
}
