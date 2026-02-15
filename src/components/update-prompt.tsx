'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates immediately
        registration.update();

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Auto-reload when new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Show again after 5 minutes if still not updated
    setTimeout(() => setDismissed(false), 5 * 60 * 1000);
  };

  if (!showUpdate || dismissed) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 bg-card border border-border rounded-lg shadow-xl p-4 max-w-sm",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-4">
        <div className="p-2 rounded-full bg-primary/10">
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">New version available!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Update now to get the latest features and improvements.
          </p>
          <Button size="sm" className="mt-3 gap-2" onClick={handleUpdate}>
            <RefreshCw className="w-3.5 h-3.5" />
            Update Now
          </Button>
        </div>
      </div>
    </div>
  );
}
