'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    reset();
    setIsRetrying(false);
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Simple animated icon */}
          <div className="mb-8">
            <div 
              className="w-24 h-24 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse"
            >
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Critical Error
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Something went seriously wrong. We&apos;re sorry about that. 
            Please try refreshing or return to the homepage.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              )}
            </button>
            
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </div>

          {error.digest && (
            <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
