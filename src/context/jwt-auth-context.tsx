'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// ============ Types ============

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: 'free' | 'pro';
  avatar: string | null;
  emailVerified: boolean;
}

interface JwtAuthContextType {
  user: AuthUser | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => void;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

// ============ Context ============

const JwtAuthContext = createContext<JwtAuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  signInWithGoogle: () => {},
  refreshSession: async () => {},
  isAuthenticated: false,
});

// ============ Helpers ============

const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

// ============ Provider ============

export function JwtAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get return URL from query params
  const getReturnUrl = useCallback((): string => {
    const returnTo = searchParams?.get('returnTo');
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return '/dashboard';
  }, [searchParams]);

  // Schedule token refresh before expiry
  const scheduleRefresh = useCallback((expiresIn: number) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Refresh 60 seconds before expiry (or at half-life if < 2 min)
    const refreshIn = expiresIn > 120 ? (expiresIn - 60) * 1000 : (expiresIn / 2) * 1000;

    refreshTimerRef.current = setTimeout(async () => {
      if (!isRefreshingRef.current) {
        try {
          await refreshTokens();
        } catch {
          // If refresh fails, session is expired
          handleSessionExpired();
        }
      }
    }, refreshIn);
  }, []);

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    window.dispatchEvent(new CustomEvent('user-logged-out'));
  }, []);

  // Refresh tokens via /api/auth/refresh
  const refreshTokens = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await res.json();
      setUser(data.user);
      setAccessToken(data.accessToken);
      scheduleRefresh(data.expiresIn);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [scheduleRefresh]);

  // Restore session on mount
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok && mounted) {
          const data = await res.json();
          setUser(data.user);
          setAccessToken(data.accessToken);
          scheduleRefresh(data.expiresIn);
        }
      } catch {
        // No session - user not logged in
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleRefresh]);

  // ============ Auth Actions ============

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.user);
    setAccessToken(data.accessToken);
    scheduleRefresh(data.expiresIn);

    window.dispatchEvent(
      new CustomEvent('user-data-loaded', { detail: { userId: data.user.id } })
    );
    toast.success('Signed in successfully!');
    router.push(getReturnUrl());
  }, [scheduleRefresh, router, getReturnUrl]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.user);
    setAccessToken(data.accessToken);
    scheduleRefresh(data.expiresIn);

    window.dispatchEvent(
      new CustomEvent('user-data-loaded', { detail: { userId: data.user.id } })
    );
    toast.success('Account created! Welcome to ResumeBuddy.');
    router.push('/dashboard');
  }, [scheduleRefresh, router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Continue even if API call fails
    }

    setUser(null);
    setAccessToken(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    window.dispatchEvent(new CustomEvent('user-logged-out'));
    toast.success('Signed out successfully');
    router.push('/login');
  }, [router]);

  const signInWithGoogle = useCallback(() => {
    // Redirect to Google OAuth flow
    window.location.href = '/api/auth/google';
  }, []);

  const refreshSession = useCallback(async () => {
    await refreshTokens();
  }, [refreshTokens]);

  // ============ Render ============

  return (
    <JwtAuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        login,
        register,
        logout,
        signInWithGoogle,
        refreshSession,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </JwtAuthContext.Provider>
  );
}

// ============ Hook ============

export function useJwtAuth() {
  const context = useContext(JwtAuthContext);
  if (!context) {
    throw new Error('useJwtAuth must be used within a JwtAuthProvider');
  }
  return context;
}
