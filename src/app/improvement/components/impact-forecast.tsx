'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImpactMetric {
  label: string;
  before: number;
  after: number;
  suffix: string;
}

interface ImpactForecastProps {
  atsScore: { before: number; after: number };
  skillsMatch: { before: number; after: number };
  quantifiedAchievements: { before: number; after: number };
}

export function ImpactForecast({ atsScore, skillsMatch, quantifiedAchievements }: ImpactForecastProps) {
  const metrics: ImpactMetric[] = [
    { label: 'ATS Score', before: atsScore.before, after: atsScore.after, suffix: '%' },
    { label: 'Skills Match', before: skillsMatch.before, after: skillsMatch.after, suffix: '%' },
    { label: 'Quantified Achievements', before: quantifiedAchievements.before, after: quantifiedAchievements.after, suffix: '' },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Impact Forecast</CardTitle>
            <CardDescription className="text-xs">
              Estimated improvements after optimization
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid gap-3">
          {metrics.map((metric) => {
            const delta = metric.after - metric.before;
            const isPositive = delta > 0;
            const isNeutral = delta === 0;
            
            return (
              <div 
                key={metric.label} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground">
                  {metric.label}
                </span>
                
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Before */}
                  <span className="text-sm text-muted-foreground font-mono tabular-nums">
                    {metric.before}{metric.suffix}
                  </span>
                  
                  {/* Arrow */}
                  <span className="text-muted-foreground">→</span>
                  
                  {/* After */}
                  <span className="text-sm font-medium font-mono tabular-nums text-foreground">
                    {metric.after}{metric.suffix}
                  </span>
                  
                  {/* Change Badge */}
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "min-w-[60px] justify-center font-mono tabular-nums text-xs",
                      isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      isNeutral && "bg-muted text-muted-foreground",
                      !isPositive && !isNeutral && "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}
                  >
                    {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                    {isNeutral && <Minus className="w-3 h-3 mr-1" />}
                    {!isPositive && !isNeutral && <TrendingDown className="w-3 h-3 mr-1" />}
                    {isPositive ? '+' : ''}{delta}{metric.suffix}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="mt-3 text-xs text-muted-foreground">
          These are AI-estimated improvements based on optimization analysis.
        </p>
      </CardContent>
    </Card>
  );
}
