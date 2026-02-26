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
          // updateViaCache:'none' ensures the browser always fetches a fresh
          // sw.js from the network instead of serving a stale HTTP-cached copy.
          const registration = await navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none',
          });
          console.log('Service Worker registered successfully:', registration);

          // Immediately check for a newer service worker so version bumps
          // take effect without requiring a second page load.
          registration.update().catch(() => {});

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