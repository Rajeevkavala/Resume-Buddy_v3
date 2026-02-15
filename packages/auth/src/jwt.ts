import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { nanoid } from 'nanoid';

// ============ Types ============

export interface TokenPayload extends JWTPayload {
  sub: string;        // User ID
  email: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;   // seconds
}

export interface TokenUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  tier: 'free' | 'pro';
}

// ============ Configuration ============

const ISSUER = 'resumebuddy';
const AUDIENCE = 'resumebuddy-web';
const ACCESS_TOKEN_EXPIRY = '15m';     // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';    // 7 days
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900 seconds

function getAccessTokenSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

function getRefreshTokenSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

// ============ Token Generation ============

/**
 * Generate an access token (15-minute expiry)
 */
export async function generateAccessToken(user: TokenUser): Promise<string> {
  const payload: Partial<TokenPayload> = {
    email: user.email,
    role: user.role,
    tier: user.tier,
    type: 'access',
  };

  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setJti(nanoid())
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getAccessTokenSecret());
}

/**
 * Generate a refresh token (7-day expiry, separate secret)
 */
export async function generateRefreshToken(user: TokenUser): Promise<string> {
  const payload: Partial<TokenPayload> = {
    email: user.email,
    role: user.role,
    tier: user.tier,
    type: 'refresh',
  };

  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setJti(nanoid())
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getRefreshTokenSecret());
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(user: TokenUser): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user),
    generateRefreshToken(user),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };
}

// ============ Token Verification ============

/**
 * Verify an access token and return payload or null
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessTokenSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    
    // Ensure it's an access token
    if ((payload as TokenPayload).type !== 'access') {
      return null;
    }

    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return payload or null
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshTokenSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    
    // Ensure it's a refresh token
    if ((payload as TokenPayload).type !== 'refresh') {
      return null;
    }

    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// ============ Utilities ============

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Get access token expiry in seconds
 */
export function getAccessTokenExpiry(): number {
  return ACCESS_TOKEN_EXPIRY_SECONDS;
}
