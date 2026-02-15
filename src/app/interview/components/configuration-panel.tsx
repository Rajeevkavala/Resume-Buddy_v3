'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Settings, Sparkles, Loader2, Minus, Plus, Code, Users, Award, Brain, Star, Zap, Trophy, Crown } from 'lucide-react';
import type { InterviewType, DifficultyLevel } from '@/app/interview/page';

interface ConfigurationPanelProps {
  onGenerate: (config: { interviewType: InterviewType; difficultyLevel: DifficultyLevel; numQuestions: number }) => void;
  isLoading: boolean;
  isCompact?: boolean;
}

const interviewTypes: { id: InterviewType; title: string; description: string; icon: typeof Code }[] = [
  { id: 'Technical', title: 'Technical', description: 'System design, coding, architecture', icon: Code },
  { id: 'Behavioral', title: 'Behavioral', description: 'STAR method, soft skills', icon: Users },
  { id: 'Leadership', title: 'Leadership', description: 'Management, strategy, vision', icon: Award },
  { id: 'General', title: 'General', description: 'Mixed question types', icon: Brain },
];

const difficultyLevels: { id: DifficultyLevel; title: string; description: string; icon: typeof Star }[] = [
  { id: 'Entry', title: 'Entry Level', description: '0-2 years', icon: Star },
  { id: 'Mid', title: 'Mid Level', description: '3-7 years', icon: Zap },
  { id: 'Senior', title: 'Senior', description: '8-15 years', icon: Trophy },
  { id: 'Executive', title: 'Executive', description: '15+ years', icon: Crown },
];

export function ConfigurationPanel({ onGenerate, isLoading, isCompact = false }: ConfigurationPanelProps) {
  const [interviewType, setInterviewType] = useState<InterviewType>('General');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('Mid');
  const [numQuestions, setNumQuestions] = useState(5);

  const handleGenerate = () => {
    onGenerate({ interviewType, difficultyLevel, numQuestions });
  };

  const getQuestionLabel = () => {
    if (numQuestions <= 5) return 'Quick practice';
    if (numQuestions <= 10) return 'Standard session';
    return 'Deep dive';
  };

  return (
    <Card className="border-border/60">
      <CardHeader className={isCompact ? 'pb-4' : ''}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Quiz Configuration</CardTitle>
            <CardDescription className="text-xs">
              Customize your practice session
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Interview Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Interview Type</Label>
          <div className="flex flex-wrap gap-2">
            {interviewTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = interviewType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setInterviewType(type.id)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card border-border hover:border-primary/50 hover:bg-muted/50",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{type.title}</span>
                </button>
              );
            })}
          </div>
          {/* Selected type description */}
          <p className="text-xs text-muted-foreground">
            {interviewTypes.find(t => t.id === interviewType)?.description}
          </p>
        </div>
        
        {/* Difficulty Level Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Difficulty Level</Label>
          <div className="flex flex-wrap gap-2">
            {difficultyLevels.map((level) => {
              const IconComponent = level.icon;
              const isSelected = difficultyLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setDifficultyLevel(level.id)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card border-border hover:border-primary/50 hover:bg-muted/50",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{level.title}</span>
                </button>
              );
            })}
          </div>
          {/* Selected difficulty description */}
          <p className="text-xs text-muted-foreground">
            {difficultyLevels.find(l => l.id === difficultyLevel)?.description}
          </p>
        </div>
        
        {/* Question Count Stepper */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <Label className="text-sm font-medium">Number of Questions</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getQuestionLabel()}
                </p>
              </div>
              
              <div className="flex items-center gap-4 justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNumQuestions(Math.max(3, numQuestions - 1))}
                  disabled={numQuestions <= 3 || isLoading}
                  className="h-10 w-10"
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Decrease</span>
                </Button>
                
                <div className="flex items-baseline gap-1 min-w-[60px] justify-center">
                  <span className="text-3xl font-mono font-bold text-primary tabular-nums">
                    {numQuestions}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNumQuestions(Math.min(15, numQuestions + 1))}
                  disabled={numQuestions >= 15 || isLoading}
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Increase</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Generate Button - Solid, No Gradient */}
        <Button 
          onClick={handleGenerate} 
          disabled={isLoading} 
          size="lg" 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {isCompact ? 'Start New Quiz' : 'Start Quiz'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export { interviewTypes, difficultyLevels };
