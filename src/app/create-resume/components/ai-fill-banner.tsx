'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIFillBannerProps {
  hasImprovements: boolean;
  onFill: () => void;
  isLoading: boolean;
}

export function AIFillBanner({ hasImprovements, onFill, isLoading }: AIFillBannerProps) {
  if (!hasImprovements) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">AI Improvements Ready</p>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Auto-fill with enhanced content
        </p>
      </div>
      <Button 
        size="sm" 
        onClick={onFill}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            <span className="hidden sm:inline">Applying...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 mr-1.5" />
            <span className="hidden sm:inline">Fill from AI</span>
            <span className="sm:hidden">Fill</span>
          </>
        )}
      </Button>
    </div>
  );
}
