'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle } from 'lucide-react';

interface IntegratedSkill {
  skill: string;
  integrationPoint: string;
}

interface SkillsListProps {
  skills: IntegratedSkill[];
}

export function SkillsList({ skills }: SkillsListProps) {
  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Integrated Skills</CardTitle>
            <CardDescription className="text-xs">
              Missing keywords naturally woven into your content
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-80">
          <div className="space-y-3 pr-4">
            {skills.map((item, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border border-border bg-card"
              >
                {/* Skill Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary/10 text-primary border-0">
                    {item.skill}
                  </Badge>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                
                {/* Integration Context */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-foreground italic break-words">
                    "...{item.integrationPoint}..."
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
