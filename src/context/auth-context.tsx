'use client';

import { createContext, useState, useEffect, useContext, ReactNode, startTransition } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserProfile, loadData } from '@/lib/firestore';
import { toast } from 'sonner';
import { getUserData, saveUserData, clearUserData } from '@/lib/local-storage';
import { initializeSecureStorage, secureSessionStorage } from '@/lib/secure-storage';
import { fastAuthCheck, setFastAuthCookie, clearFastAuthCookie, clearAccessDeniedCookie } from '@/lib/fast-auth';
import { uploadProfilePhotoFromURL } from '@/lib/supabase';
// REMOVED: Whitelist-based access control - now using open registration with subscription tiers
// import { checkEmailAccess } from '@/lib/access-control';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  signInWithGoogle: () => void;
  forceReloadUser?: () => Promise<void>;
  isAllowed: boolean;
  accessDeniedReason: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  signInWithGoogle: () => {},
  isAllowed: true,
  accessDeniedReason: '',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isAllowed, setIsAllowed] = useState<boolean>(true);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the return URL from query params
  const getReturnUrl = (): string => {
    const returnTo = searchParams?.get('returnTo');
    // Validate returnTo to prevent open redirect vulnerabilities
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return '/dashboard';
  };

  const forceReloadUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        await currentUser.reload();
        setUser({ ...currentUser });
    }
  };

  // ========== OPEN REGISTRATION ==========
  // Function to grant access to authenticated users (no whitelist check)
  // All authenticated users get Free tier access immediately
  async function verifyUserAccess(firebaseUser: User): Promise<boolean> {
    try {
      if (!firebaseUser.email) {
        console.log('⚠️ No email associated with account - still allowing access');
        // Still allow access, but some features may be limited
      }

      // OPEN REGISTRATION: All authenticated users are allowed
      console.log('✅ Access granted for:', firebaseUser.email || firebaseUser.uid);
      clearAccessDeniedCookie();
      setFastAuthCookie(firebaseUser.uid);
      
      startTransition(() => {
        if (user && firebaseUser.uid !== user.uid) {
          clearUserData(user.uid);
        }
        setUser(firebaseUser);
        setIsAllowed(true); // Always allowed - tier-based limits handled by subscription system
        setAccessDeniedReason('');
        setLoading(false);
        setInitialLoad(false);
      });

      // Load user data in background
      Promise.resolve().then(async () => {
        try {
          await createUserProfile(firebaseUser);
          const localData = getUserData(firebaseUser.uid);
          if (!localData || Object.keys(localData).length === 0) {
            const dbData = await loadData(firebaseUser.uid);
            if (dbData && Object.keys(dbData).length > 0) {
              saveUserData(firebaseUser.uid, dbData);
            }
          }
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('user-data-loaded', { detail: { userId: firebaseUser.uid } }));
          }, 100);
        } catch (error) {
          // Silently handle profile loading errors
        }
      });

      return true;
    } catch (error) {
      console.error('Error during user access:', error);
      // On error, still allow access - graceful degradation
      startTransition(() => {
        setUser(firebaseUser);
        setIsAllowed(true);
        setAccessDeniedReason('');
        setLoading(false);
        setInitialLoad(false);
      });
      return true;
    }
  }

  useEffect(() => {
    // Initialize secure storage on component mount
    initializeSecureStorage();
    
    // Fast auth check for immediate UI state
    const { isLikelyAuthenticated } = fastAuthCheck();
    
    // Check for existing user immediately on mount
    const currentUser = auth.currentUser;
    if (currentUser && initialLoad) {
      // Verify whitelist for existing sessions
      verifyUserAccess(currentUser);
      return;
    }

    // If fast auth check suggests user is authenticated, give Firebase more time
    const timeoutDuration = isLikelyAuthenticated ? 1000 : 200;
    
    const timeoutId = setTimeout(() => {
      if (initialLoad && !auth.currentUser) {
        startTransition(() => {
          setLoading(false);
          setInitialLoad(false);
        });
      }
    }, timeoutDuration);

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (newUser) {
        // ========== WHITELIST CHECK ON EVERY AUTH STATE CHANGE ==========
        await verifyUserAccess(newUser);
      } else {
        // User signed out - clear all cookies
        clearFastAuthCookie();
        clearAccessDeniedCookie();
        startTransition(() => {
          if (user) {
            clearUserData(user.uid);
          }
          setUser(null);
          setIsAllowed(true);
          setAccessDeniedReason('');
          setLoading(false);
          setInitialLoad(false);
        });
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const logout = async () => {
    try {
      if (user) {
        clearUserData(user.uid);
      }
      
      // Clear authentication cookies
      clearFastAuthCookie();
      clearAccessDeniedCookie(); // Clear access-denied cookie on logout
      
      await auth.signOut();
      setUser(null); // Explicitly set user to null
      
      // Clear only session data, not auth persistence data
      secureSessionStorage.clear();
      
      // Fire event to tell contexts to clear their state
      window.dispatchEvent(new CustomEvent('user-logged-out'));
      
      // Trigger loading animation for navigation
      window.dispatchEvent(new CustomEvent('routeChangeStart'));
      startTransition(() => {
        router.push('/login');
      });
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('routeChangeComplete'));
      }, 100);
    } catch (error) {
      // Silently handle sign out errors
    }
  };

  // Function to sync Google profile photo to Supabase
  const syncGoogleProfilePhoto = async (user: User) => {
    if (user.photoURL && user.providerData.some(provider => provider.providerId === 'google.com')) {
      try {
        // Only sync if the photo URL is from Google (starts with https://lh3.googleusercontent.com)
        if (user.photoURL.includes('googleusercontent.com')) {
          const supabasePhotoUrl = await uploadProfilePhotoFromURL(user.uid, user.photoURL);
          
          // You could store this URL in the user's profile or update Firebase Auth
          // For now, we'll let the profile page handle the display logic
        }
      } catch (error) {
        // Non-blocking error - user can still continue
      }
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // Add additional scopes for better user profile data
    provider.addScope('profile');
    provider.addScope('email');
    
    // Set custom parameters for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Set cookie immediately for faster middleware recognition
      setFastAuthCookie(result.user.uid);
      
      // Load user data immediately after successful authentication
      try {
        await createUserProfile(result.user);
        // Check if data is in local storage first, then fallback to server
        const localData = getUserData(result.user.uid);
        if (!localData || Object.keys(localData).length === 0) {
          // No local data, fetch from server
          const dbData = await loadData(result.user.uid);
          if (dbData && Object.keys(dbData).length > 0) {
            saveUserData(result.user.uid, dbData);
          }
        }
        // Fire event to notify components that user data is ready
        window.dispatchEvent(new CustomEvent('user-data-loaded', { detail: { userId: result.user.uid } }));
      } catch (dataError) {
        // Continue with redirect even if data loading fails
      }
      
      // Sync Google profile photo to Supabase in the background
      if (result.user.photoURL) {
        syncGoogleProfilePhoto(result.user).catch(() => {});
      }
      
      toast.success('Signed in successfully!');
      
      // Note: Redirect is handled by the calling page (login/signup)
      // to avoid race conditions with middleware and auth state changes
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in was cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Pop-up was blocked. Please allow pop-ups and try again.');
      } else {
        toast.error('Failed to sign in with Google. Please try again.');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, signInWithGoogle, forceReloadUser, isAllowed, accessDeniedReason }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
