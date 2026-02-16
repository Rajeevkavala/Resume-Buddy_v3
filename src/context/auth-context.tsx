'use client';

import { createContext, useState, useEffect, useContext, ReactNode, startTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getUserData, clearUserData } from '@/lib/local-storage';
import { initializeSecureStorage, secureSessionStorage } from '@/lib/secure-storage';

// ============ Types ============

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: 'free' | 'pro';
  avatar: string | null;
  emailVerified: boolean;
  /** Backward-compat alias for Firebase `displayName` */
  displayName: string | null;
  /** Backward-compat alias for Firebase `photoURL` */
  photoURL: string | null;
  /** Backward-compat alias – same as `id` */
  uid: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => void;
  signInWithGoogle: () => void;
  forceReloadUser: () => Promise<void>;
  isAllowed: boolean;
  accessDeniedReason: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  signInWithGoogle: () => {},
  forceReloadUser: async () => {},
  isAllowed: true,
  accessDeniedReason: '',
});

// ============ Helpers ============

/** Map API response user → AppUser (with backward-compat aliases) */
function mapUser(apiUser: Record<string, unknown>): AppUser {
  return {
    id: apiUser.id as string,
    email: apiUser.email as string,
    name: (apiUser.name as string) || null,
    role: (apiUser.role as string) || 'USER',
    tier: (apiUser.tier as string) === 'pro' ? 'pro' : 'free',
    avatar: (apiUser.avatar as string) || null,
    emailVerified: (apiUser.emailVerified as boolean) ?? false,
    displayName: (apiUser.name as string) || null,
    photoURL: (apiUser.avatar as string) || null,
    uid: apiUser.id as string,
  };
}

// ============ Provider ============

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(true);
  const [accessDeniedReason, setAccessDeniedReason] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const getReturnUrl = (): string => {
    const returnTo = searchParams?.get('returnTo');
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return '/dashboard';
  };

  // ---------- Fetch current session from API ----------

  const fetchSession = useCallback(async (): Promise<AppUser | null> => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.user) return null;
      return mapUser(data.user);
    } catch {
      return null;
    }
  }, []);

  // ---------- Set user + fire data-loaded event ----------

  const setAuthenticatedUser = useCallback((appUser: AppUser) => {
    startTransition(() => {
      setUser(appUser);
      setIsAllowed(true);
      setAccessDeniedReason('');
      setLoading(false);
    });

    // Fire data-loaded event for other contexts
    Promise.resolve().then(() => {
      try {
        getUserData(appUser.id); // prime local-storage
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('user-data-loaded', { detail: { userId: appUser.id } }));
        }, 100);
      } catch {
        // Silently handle
      }
    });
  }, []);

  // ---------- Initial Load ----------

  useEffect(() => {
    initializeSecureStorage();

    // Session cookie is httpOnly (not readable in JS). Always validate with the server.
    let cancelled = false;
    fetchSession().then(sessionUser => {
      if (cancelled) return;
      if (sessionUser) {
        setAuthenticatedUser(sessionUser);
      } else {
        startTransition(() => {
          setLoading(false);
        });
      }
    });

    return () => { cancelled = true; };
  }, [fetchSession, setAuthenticatedUser]);

  // ---------- Reload user (after profile update) ----------

  const forceReloadUser = useCallback(async () => {
    const sessionUser = await fetchSession();
    if (sessionUser) {
      startTransition(() => {
        setUser(sessionUser);
      });
    }
  }, [fetchSession]);

  // ---------- Logout ----------

  const logout = useCallback(async () => {
    try {
      if (user) {
        clearUserData(user.id);
      }

      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });

      startTransition(() => {
        setUser(null);
        setIsAllowed(true);
        setAccessDeniedReason('');
      });

      secureSessionStorage.clear();
      window.dispatchEvent(new CustomEvent('user-logged-out'));

      window.dispatchEvent(new CustomEvent('routeChangeStart'));
      startTransition(() => {
        router.push('/login');
      });
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('routeChangeComplete'));
      }, 100);
    } catch {
      // Silently handle sign-out errors
    }
  }, [user, router]);

  // ---------- Google Sign-In ----------

  const signInWithGoogle = useCallback(async () => {
    try {
      const returnTo = getReturnUrl();
      const res = await fetch(`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`, { credentials: 'include' });
      if (!res.ok) {
        toast.error('Failed to initiate Google sign-in');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Google sign-in not configured');
      }
    } catch {
      toast.error('Failed to sign in with Google. Please try again.');
    }
  }, [getReturnUrl]);

  // ---------- Listen for auth-success events (from login/signup pages) ----------

  useEffect(() => {
    const handleAuthSuccess = async (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.user) {
        const appUser = mapUser(detail.user);
        setAuthenticatedUser(appUser);
      } else {
        const sessionUser = await fetchSession();
        if (sessionUser) {
          setAuthenticatedUser(sessionUser);
        }
      }
    };

    window.addEventListener('auth-success', handleAuthSuccess);
    return () => window.removeEventListener('auth-success', handleAuthSuccess);
  }, [fetchSession, setAuthenticatedUser]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, signInWithGoogle, forceReloadUser, isAllowed, accessDeniedReason }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
