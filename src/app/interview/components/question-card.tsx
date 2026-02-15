'use client';

import { Card, CardContent } from '@/components/ui/card';

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
}

export function QuestionCard({ questionNumber, questionText }: QuestionCardProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-mono font-bold text-primary">
              Q{questionNumber}
            </span>
          </div>
          <p className="text-base sm:text-lg font-medium leading-relaxed pt-1.5">
            {questionText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
