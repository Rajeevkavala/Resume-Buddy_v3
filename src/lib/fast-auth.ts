'use client';

/**
 * Fast Auth Checker
 * 
 * This utility provides faster authentication state detection
 * by checking cookies and localStorage before Firebase initializes
 */

export const fastAuthCheck = (): { isLikelyAuthenticated: boolean; userId?: string } => {
  if (typeof window === 'undefined') {
    return { isLikelyAuthenticated: false };
  }

  try {
    // Check authentication cookie first (fastest)
    // Check for both cookie names for migration compatibility
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('fast-auth-uid=') || row.startsWith('firebase-auth-token='));
    
    if (authCookie) {
      const userId = authCookie.split('=')[1];
      if (userId && userId !== '') {
        return { isLikelyAuthenticated: true, userId };
      }
    }

    // Fallback: Check localStorage for Firebase auth data
    const firebaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('firebase:authUser:') || key.includes('firebase')
    );
    
    if (firebaseKeys.length > 0) {
      // Try to extract user ID from Firebase localStorage
      const authKey = firebaseKeys.find(key => key.startsWith('firebase:authUser:'));
      if (authKey) {
        try {
          const authData = localStorage.getItem(authKey);
          if (authData && authData !== 'null') {
            const userData = JSON.parse(authData);
            if (userData?.uid) {
              return { isLikelyAuthenticated: true, userId: userData.uid };
            }
          }
        } catch (error) {
          console.warn('Error parsing auth data:', error);
        }
      }
      
      return { isLikelyAuthenticated: true };
    }

    return { isLikelyAuthenticated: false };
  } catch (error) {
    console.warn('Error in fast auth check:', error);
    return { isLikelyAuthenticated: false };
  }
};

/**
 * Sets up fast auth cookie for middleware
 * Uses 'fast-auth-uid' to match middleware cookie check
 */
export const setFastAuthCookie = (userId: string) => {
  if (typeof window === 'undefined') return;
  
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:';
  // Use SameSite=Lax for better redirect compatibility in production
  document.cookie = `fast-auth-uid=${userId}; path=/; max-age=86400; samesite=lax${isSecure ? '; secure' : ''}`;
};

/**
 * Clears fast auth cookie
 */
export const clearFastAuthCookie = () => {
  if (typeof window === 'undefined') return;
  
  // Clear both old and new cookie names for migration
  document.cookie = 'fast-auth-uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

/**
 * Sets access-denied cookie to block navigation to protected routes
 * This is used when a user is authenticated but not whitelisted/blocked
 */
export const setAccessDeniedCookie = () => {
  if (typeof window === 'undefined') return;
  
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:';
  // Cookie expires in 24 hours - will be cleared on logout or when access is granted
  document.cookie = `access-denied=true; path=/; max-age=86400; samesite=lax${isSecure ? '; secure' : ''}`;
};

/**
 * Clears access-denied cookie when user is granted access or logs out
 */
export const clearAccessDeniedCookie = () => {
  if (typeof window === 'undefined') return;
  
  document.cookie = 'access-denied=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};