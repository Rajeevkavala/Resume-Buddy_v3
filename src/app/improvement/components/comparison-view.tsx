'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';

interface ComparisonViewProps {
  originalResume: string;
  improvedResume: string;
}

export function ComparisonView({ originalResume, improvedResume }: ComparisonViewProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Before & After Comparison</CardTitle>
            <CardDescription className="text-xs">
              See the transformation side by side
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Original Resume
              </span>
            </div>
            <ScrollArea className="h-72 lg:h-80 rounded-lg border border-border p-4 bg-muted/30">
              <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed break-words">
                {originalResume}
              </p>
            </ScrollArea>
          </div>
          
          {/* Enhanced */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Enhanced Resume
              </span>
            </div>
            <ScrollArea className="h-72 lg:h-80 rounded-lg border border-border p-4 bg-emerald-500/5 dark:bg-emerald-500/10">
              <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed break-words">
                {improvedResume}
              </p>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
