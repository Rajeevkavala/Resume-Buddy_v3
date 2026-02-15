'use client';

/**
 * Browser Support Banner
 * Shows a subtle, non-blocking message about voice feature limitations.
 */

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { detectBrowserSupport, getVoiceSupportMessage } from '@/lib/speech/browser-support';

export function BrowserSupportBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const support = detectBrowserSupport();
    const msg = getVoiceSupportMessage(support);
    setMessage(msg);
  }, []);

  if (!message || dismissed) return null;

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <AlertCircle className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between text-sm">
        <span>{message}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
