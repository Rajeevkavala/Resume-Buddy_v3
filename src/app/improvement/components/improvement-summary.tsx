'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

interface ImprovementSummaryProps {
  summary: string;
}

export function ImprovementSummary({ summary }: ImprovementSummaryProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Improvement Summary</CardTitle>
            <CardDescription className="text-xs">
              Overview of enhancements applied to your resume
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm leading-relaxed text-foreground">
            {summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
