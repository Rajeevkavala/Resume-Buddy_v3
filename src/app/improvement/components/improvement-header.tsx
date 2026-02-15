'use client';

import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { ProBadge } from '@/components/upgrade-prompt';

interface ImprovementHeaderProps {
  hasImprovements: boolean;
  isLoading: boolean;
  hasDataChanged?: boolean;
}

export function ImprovementHeader({ hasImprovements, isLoading, hasDataChanged }: ImprovementHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-headline font-semibold text-foreground sm:text-3xl">
              Resume Improvements
            </h1>
            <ProBadge />
            {isLoading ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Generating...
              </Badge>
            ) : hasImprovements && !hasDataChanged ? (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Enhanced
              </Badge>
            ) : hasDataChanged ? (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Update Available
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Transform your resume with AI-powered improvements and ATS optimization
          </p>
        </div>
      </div>
    </div>
  );
}
