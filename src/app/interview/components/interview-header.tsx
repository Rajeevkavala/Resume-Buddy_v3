'use client';

import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, Loader2, ClipboardList } from 'lucide-react';
import { ProBadge } from '@/components/upgrade-prompt';

type QuizPhase = 'configuration' | 'in-progress' | 'completed';

interface InterviewHeaderProps {
  phase: QuizPhase;
  isLoading?: boolean;
  totalQuestions?: number;
}

export function InterviewHeader({ phase, isLoading = false, totalQuestions }: InterviewHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-headline font-semibold text-foreground sm:text-3xl">
              Interview Quiz
            </h1>
            <ProBadge />
            {isLoading ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Generating...
              </Badge>
            ) : phase === 'in-progress' ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <PlayCircle className="w-3 h-3 mr-1.5" />
                Quiz in Progress
              </Badge>
            ) : phase === 'completed' ? (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Completed
              </Badge>
            ) : totalQuestions ? (
              <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
                <ClipboardList className="w-3 h-3 mr-1.5" />
                Ready
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Practice interview questions tailored to your resume and career goals
          </p>
        </div>
      </div>
    </div>
  );
}
