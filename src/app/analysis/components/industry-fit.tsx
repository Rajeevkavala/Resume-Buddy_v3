'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyzeResumeContentOutput } from '@/ai/flows/analyze-resume-content';

interface IndustryFitProps {
  industryCompatibility: AnalyzeResumeContentOutput['industryCompatibility'];
}

export function IndustryFit({ industryCompatibility }: IndustryFitProps) {
  if (!industryCompatibility || industryCompatibility.length === 0) {
    return null;
  }

  const getScoreStyle = (score: number) => {
    if (score >= 80) return { text: 'text-success', bar: 'bg-success', badge: 'border-success/50 text-success' };
    if (score >= 60) return { text: 'text-primary', bar: 'bg-primary', badge: 'border-primary/50 text-primary' };
    if (score >= 40) return { text: 'text-chart-4', bar: 'bg-chart-4', badge: 'border-chart-4/50 text-chart-4' };
    return { text: 'text-destructive', bar: 'bg-destructive', badge: 'border-destructive/50 text-destructive' };
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Industry Fit</CardTitle>
            <CardDescription className="text-xs">
              How your profile matches different industries
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {industryCompatibility.map((industry) => {
            const score = typeof industry.score === 'number' ? industry.score : Number(industry.score);
            const styles = getScoreStyle(score);
            
            return (
              <div key={industry.industry} className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium">{industry.industry}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-accent font-semibold", styles.text)}>
                      {score}%
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", styles.badge)}
                    >
                      {industry.status}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className={cn("h-1.5 rounded-full transition-all duration-700", styles.bar)}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
