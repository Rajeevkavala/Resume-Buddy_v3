'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface ExplanationCardProps {
  explanation: string;
}

export function ExplanationCard({ explanation }: ExplanationCardProps) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <div className="bg-muted/50 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground">
              Explanation
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
