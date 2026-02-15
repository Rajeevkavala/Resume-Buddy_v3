'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';

interface EmptyStateProps {
  onGenerate: () => void;
  isLoading: boolean;
  hasDataChanged: boolean;
  hasExistingAnalysis: boolean;
}

export function EmptyState({ onGenerate, isLoading, hasDataChanged, hasExistingAnalysis }: EmptyStateProps) {
  const title = hasExistingAnalysis && hasDataChanged ? 'Content Updated' : 'Ready to Analyze';
  const description = hasExistingAnalysis && hasDataChanged 
    ? 'Your resume or job description has changed. Generate a fresh analysis to see updated insights.' 
    : 'Generate an AI-powered analysis to identify strengths, skill gaps, and optimization opportunities.';

  return (
    <Card className="border-border/60 border-dashed">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            {hasExistingAnalysis && hasDataChanged ? (
              <RefreshCw className="w-8 h-8 text-primary" />
            ) : (
              <Sparkles className="w-8 h-8 text-primary" />
            )}
          </div>
          
          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl font-headline font-semibold">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          </div>
          
          {/* CTA */}
          <Button onClick={onGenerate} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Analysis
              </>
            )}
          </Button>
          
          {/* Helper Text */}
          <p className="text-xs text-muted-foreground">
            This typically takes 10-15 seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
