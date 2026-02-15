'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, BarChart3, Plus, Target, Wand2, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  onGenerate: () => void;
  isLoading: boolean;
  hasDataChanged?: boolean;
}

const features = [
  {
    icon: BarChart3,
    title: 'Quantify Impact',
    description: 'Transform vague tasks into measurable achievements',
  },
  {
    icon: Plus,
    title: 'Integrate Skills',
    description: 'Weave missing keywords naturally into your content',
  },
  {
    icon: Target,
    title: 'ATS Optimize',
    description: 'Improve compatibility with applicant tracking systems',
  },
];

export function EmptyState({ onGenerate, isLoading, hasDataChanged }: EmptyStateProps) {
  return (
    <Card className="border-border/60 border-dashed">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Wand2 className="w-8 h-8 text-primary" />
          </div>
          
          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-headline font-semibold text-foreground">
              {hasDataChanged ? 'Content Updated' : 'Transform Your Resume'}
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              {hasDataChanged
                ? 'Your resume or job description has changed. Regenerate to get fresh, personalized improvements.'
                : 'Let AI enhance your resume with quantified achievements, integrated skills, and ATS optimization.'}
            </p>
          </div>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          
          {/* Generate Button - Solid, No Gradient */}
          <Button 
            onClick={onGenerate} 
            disabled={isLoading} 
            size="lg"
            className="px-8"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : hasDataChanged ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Improvements
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Transform My Resume
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
