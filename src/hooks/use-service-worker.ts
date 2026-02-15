'use client';

import { useEffect, useCallback } from 'react';

export function useServiceWorker() {
  const preloadRoutesViaServiceWorker = useCallback((routes: string[]) => {
    // Preloading via service worker has been disabled
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully:', registration);
          
          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          
          // Preloading has been disabled
          
        } catch (error) {
          console.log('Service Worker registration failed:', error);
        }
      };

      if (document.readyState === 'loading') {
        window.addEventListener('load', registerSW);
      } else {
        registerSW();
      }
    }
  }, [preloadRoutesViaServiceWorker]);

  return { preloadRoutesViaServiceWorker };
}

export default useServiceWorker;