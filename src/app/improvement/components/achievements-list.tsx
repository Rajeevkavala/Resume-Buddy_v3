'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ArrowRight } from 'lucide-react';

interface Achievement {
  section: string;
  original?: string;
  improved: string;
}

interface AchievementsListProps {
  achievements: Achievement[];
}

export function AchievementsList({ achievements }: AchievementsListProps) {
  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Quantified Achievements</CardTitle>
            <CardDescription className="text-xs">
              Vague tasks transformed into measurable impact
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-80">
          <div className="space-y-3 pr-4">
            {achievements.map((item, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border border-border bg-card"
              >
                {/* Section Badge */}
                <Badge variant="outline" className="text-xs mb-3">
                  {item.section}
                </Badge>
                
                {/* Before/After */}
                <div className="space-y-3">
                  {/* Original */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground line-through break-words">
                      {item.original || 'General duty'}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex items-center gap-2 px-3">
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">Improved to</span>
                  </div>
                  
                  {/* Improved */}
                  <div className="p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10">
                    <p className="text-sm font-medium text-foreground break-words">
                      {item.improved}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
