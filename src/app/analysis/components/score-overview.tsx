'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AnalyzeResumeContentOutput } from '@/ai/flows/analyze-resume-content';

interface ScoreOverviewProps {
  analysis: AnalyzeResumeContentOutput;
}

export function ScoreOverview({ analysis }: ScoreOverviewProps) {
  const atsScore = analysis.atsScore || 0;
  const presentKeywordsCount = analysis.keywordAnalysis?.presentKeywords?.length || 0;
  const missingKeywordsCount = analysis.keywordAnalysis?.missingKeywords?.length || 0;
  const totalKeywords = presentKeywordsCount + missingKeywordsCount;
  const skillsMatchPercentage = totalKeywords > 0 ? Math.round((presentKeywordsCount / totalKeywords) * 100) : 0;
  const wordCount = analysis.qualityMetrics?.wordCount || 0;

  const getAtsScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const getAtsScoreStyle = (score: number) => {
    if (score >= 80) return 'bg-success/10 text-success';
    if (score >= 60) return 'bg-primary/10 text-primary';
    if (score >= 40) return 'bg-chart-4/10 text-chart-4';
    return 'bg-destructive/10 text-destructive';
  };

  const getWordCountStatus = (count: number) => {
    if (count >= 300 && count <= 800) return { label: 'Optimal', style: 'border-success/50 text-success' };
    if (count < 300) return { label: 'Too Short', style: 'border-chart-4/50 text-chart-4' };
    return { label: 'Too Long', style: 'border-chart-4/50 text-chart-4' };
  };

  const wordCountStatus = getWordCountStatus(wordCount);

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          
          {/* ATS Score - Primary Focus */}
          <div className="p-6 flex flex-col items-center justify-center text-center bg-primary/5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              ATS Score
            </div>
            <div className="relative">
              <div className="text-5xl font-accent font-bold text-primary">
                {atsScore}
              </div>
              <div className="text-sm text-muted-foreground mt-1">out of 100</div>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("mt-3 text-xs border-0", getAtsScoreStyle(atsScore))}
            >
              {getAtsScoreLabel(atsScore)}
            </Badge>
          </div>
          
          {/* Skills Match */}
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Skills Match
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-accent font-bold text-foreground">
                {presentKeywordsCount}
              </span>
              <span className="text-lg text-muted-foreground">
                /{totalKeywords}
              </span>
            </div>
            <div className="w-full max-w-[120px] bg-muted rounded-full h-1.5 mt-3">
              <div 
                className="bg-success h-1.5 rounded-full transition-all duration-700" 
                style={{ width: `${skillsMatchPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {skillsMatchPercentage}% match rate
            </div>
          </div>
          
          {/* Content Coverage */}
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Coverage
            </div>
            <div className="text-3xl font-accent font-bold text-foreground">
              {analysis.contentCoveragePercentage || 0}%
            </div>
            <div className="w-full max-w-[120px] bg-muted rounded-full h-1.5 mt-3">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-700" 
                style={{ width: `${analysis.contentCoveragePercentage || 0}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              of job requirements
            </div>
          </div>
          
          {/* Word Count */}
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Word Count
            </div>
            <div className="text-3xl font-accent font-bold text-foreground">
              {wordCount || 'N/A'}
            </div>
            <Badge 
              variant="outline" 
              className={cn("mt-3 text-xs", wordCountStatus.style)}
            >
              {wordCountStatus.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
