'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import type { AnalyzeResumeContentOutput } from '@/ai/flows/analyze-resume-content';

interface AnalysisHeaderProps {
  analysis: AnalyzeResumeContentOutput | null;
  onGenerate: () => void;
  isLoading: boolean;
}

export function AnalysisHeader({ analysis, onGenerate, isLoading }: AnalysisHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-headline font-semibold text-foreground sm:text-3xl">
              Resume Analysis
            </h1>
            {analysis && (
              <Badge 
                variant="secondary" 
                className="bg-success/10 text-success border-0"
              >
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Complete
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            AI-powered analysis of your resume against the job description
          </p>
        </div>
        
        {/* Regenerate Button */}
        {analysis && (
          <Button 
            onClick={onGenerate} 
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
