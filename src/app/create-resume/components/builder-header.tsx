'use client';

import { Badge } from '@/components/ui/badge';
import { Sparkles, FileText } from 'lucide-react';

interface BuilderHeaderProps {
  hasImprovements?: boolean;
}

export function BuilderHeader({ hasImprovements }: BuilderHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-headline font-semibold text-foreground sm:text-3xl">
              Create Resume
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Build your professional resume with our visual editor and export to LaTeX PDF
          </p>
        </div>
        
        {hasImprovements && (
          <Badge 
            variant="secondary" 
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 shrink-0"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI Improvements Available
          </Badge>
        )}
      </div>
    </div>
  );
}
