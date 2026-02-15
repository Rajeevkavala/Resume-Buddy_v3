'use client';

import { Badge } from '@/components/ui/badge';
import { FileQuestion, Loader2 } from 'lucide-react';
import { ProBadge } from '@/components/upgrade-prompt';
import type { GenerateResumeQAOutput, QATopic } from '@/lib/types';

interface QAHeaderProps {
  qa: Record<QATopic, GenerateResumeQAOutput | null> | null;
  isLoading: boolean;
}

export function QAHeader({ qa, isLoading }: QAHeaderProps) {
  const topicsWithData = qa 
    ? Object.values(qa).filter(v => v !== null).length 
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-headline font-semibold text-foreground sm:text-3xl">
              Resume Q&A
            </h1>
            <ProBadge />
            {isLoading ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Generating...
              </Badge>
            ) : topicsWithData > 0 ? (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                <FileQuestion className="w-3 h-3 mr-1.5" />
                {topicsWithData} {topicsWithData === 1 ? 'topic' : 'topics'} ready
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Generate intelligent Q&A pairs tailored to your resume and target role
          </p>
        </div>
      </div>
    </div>
  );
}
