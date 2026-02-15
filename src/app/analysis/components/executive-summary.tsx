'use client';

import { Card, CardContent } from '@/components/ui/card';

interface ExecutiveSummaryProps {
  summary: string;
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Quote Mark / Accent Line */}
          <div className="hidden sm:block shrink-0">
            <div className="w-1 h-full bg-primary rounded-full min-h-[40px]" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Executive Summary
              </h3>
            </div>
            <p className="text-base leading-relaxed text-foreground">
              {summary}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
