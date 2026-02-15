'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ClipboardList } from 'lucide-react';

interface GeneratingStateProps {
  numQuestions: number;
  interviewType: string;
}

export function GeneratingState({ numQuestions, interviewType }: GeneratingStateProps) {
  return (
    <Card className="border-border/60 border-dashed">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-headline font-semibold text-foreground">
              Generating Your Quiz
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Creating {numQuestions} personalized {interviewType.toLowerCase()} questions based on your resume...
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState() {
  return (
    <Card className="border-border/60 border-dashed">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-headline font-semibold text-foreground">
              Ready to Practice?
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Configure your quiz settings above and start your interview practice session.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
