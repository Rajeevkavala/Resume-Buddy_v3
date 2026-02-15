'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyzeResumeContentOutput } from '@/ai/flows/analyze-resume-content';

interface SkillsAnalysisProps {
  analysis: AnalyzeResumeContentOutput;
}

type CriticalityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
type SkillVariant = 'destructive' | 'warning' | 'moderate' | 'low';

interface MissingSkill {
  skill: string;
  criticality: CriticalityLevel;
}

interface SkillGroupProps {
  label: string;
  skills: MissingSkill[];
  variant: SkillVariant;
  icon: React.ReactNode;
}

const variantStyles: Record<SkillVariant, { badge: string; icon: string }> = {
  destructive: {
    badge: "bg-destructive/10 text-destructive border-0",
    icon: "text-destructive"
  },
  warning: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0",
    icon: "text-orange-500"
  },
  moderate: {
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0",
    icon: "text-yellow-500"
  },
  low: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
    icon: "text-blue-500"
  }
};

function SkillGroup({ label, skills, variant, icon }: SkillGroupProps) {
  const styles = variantStyles[variant];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={styles.icon}>{icon}</span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Badge variant="outline" className="text-xs ml-auto">
          {skills.length}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-5">
        {skills.map((skill, i) => (
          <Badge key={i} variant="secondary" className={styles.badge}>
            {skill.skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function SkillsAnalysis({ analysis }: SkillsAnalysisProps) {
  const [showLowPriority, setShowLowPriority] = useState(false);
  
  const presentKeywordsCount = analysis.keywordAnalysis?.presentKeywords?.length || 0;
  const missingKeywordsCount = analysis.keywordAnalysis?.missingKeywords?.length || 0;

  const skillsByPriority = useMemo(() => {
    const missingKeywords = analysis.keywordAnalysis?.missingKeywords || [];
    return {
      critical: missingKeywords.filter(s => s.criticality === 'Critical'),
      high: missingKeywords.filter(s => s.criticality === 'High'),
      medium: missingKeywords.filter(s => s.criticality === 'Medium'),
      low: missingKeywords.filter(s => s.criticality === 'Low'),
    };
  }, [analysis.keywordAnalysis?.missingKeywords]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Matched Skills */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <div>
                <CardTitle className="text-base">Matched Skills</CardTitle>
                <CardDescription className="text-xs">
                  Skills found in your resume
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-0">
              {presentKeywordsCount} found
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {presentKeywordsCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis?.presentKeywords?.map((skill, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="bg-success/10 text-success hover:bg-success/20 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                No matching skills detected
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Missing Skills */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-base">Missing Skills</CardTitle>
                <CardDescription className="text-xs">
                  Skills to consider adding
                </CardDescription>
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              {missingKeywordsCount} gaps
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingKeywordsCount > 0 ? (
            <>
              {/* Critical */}
              {skillsByPriority.critical.length > 0 && (
                <SkillGroup 
                  label="Critical" 
                  skills={skillsByPriority.critical} 
                  variant="destructive"
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                />
              )}
              
              {/* High Priority */}
              {skillsByPriority.high.length > 0 && (
                <SkillGroup 
                  label="High Priority" 
                  skills={skillsByPriority.high} 
                  variant="warning"
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                />
              )}
              
              {/* Medium Priority */}
              {skillsByPriority.medium.length > 0 && (
                <SkillGroup 
                  label="Medium" 
                  skills={skillsByPriority.medium} 
                  variant="moderate"
                  icon={<Info className="w-3.5 h-3.5" />}
                />
              )}
              
              {/* Low Priority - Collapsible */}
              {skillsByPriority.low.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLowPriority(!showLowPriority)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                  >
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      showLowPriority && "rotate-180"
                    )} />
                    <span>{showLowPriority ? 'Hide' : 'Show'} {skillsByPriority.low.length} low priority skills</span>
                  </Button>
                  {showLowPriority && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <SkillGroup 
                        label="Low Priority" 
                        skills={skillsByPriority.low} 
                        variant="low"
                        icon={<Info className="w-3.5 h-3.5" />}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center border border-dashed rounded-lg border-success/30 bg-success/5">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-success">All skills matched!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your resume covers all required skills
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
