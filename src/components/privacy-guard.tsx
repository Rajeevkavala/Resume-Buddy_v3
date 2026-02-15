'use client';

import { useEffect } from 'react';
import { initializeSecureStorage, secureSessionStorage } from '@/lib/secure-storage';

/**
 * Privacy Guard Component
 * 
 * This component initializes privacy protections and handles
 * sensitive data management across the application.
 */
export const PrivacyGuard = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Initialize secure storage when app loads
    initializeSecureStorage();
    
    // Set up periodic cleanup of session data only (not auth data)
    const cleanupInterval = setInterval(() => {
      // Clear only session data every hour for security
      secureSessionStorage.clear();
    }, 60 * 60 * 1000);
    
    // Clean up session data when app is about to close
    const handleBeforeUnload = () => {
      secureSessionStorage.clear();
    };
    
    // Set up event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup function
    return () => {
      clearInterval(cleanupInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      secureSessionStorage.clear();
    };
  }, []);
  
  return <>{children}</>;
};

/**
 * Hook to manually trigger sensitive data cleanup
 */
export const usePrivacyGuard = () => {
  return {
    clearSessionData: () => {
      secureSessionStorage.clear();
    },
    initializeSecureStorage: () => {
      initializeSecureStorage();
    }
  };
};