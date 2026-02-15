'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BarChart3, FileText, Layout, Eye, Zap, TrendingUp } from 'lucide-react';
import type { AnalyzeResumeContentOutput } from '@/ai/flows/analyze-resume-content';

interface QualityAssessmentProps {
  qualityMetrics: AnalyzeResumeContentOutput['qualityMetrics'];
  actionVerbFeedback: string;
  quantifiableResultsFeedback: string;
}

interface QualityScoreProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

function QualityScore({ label, score, icon }: QualityScoreProps) {
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg sm:text-2xl font-accent font-bold text-foreground">
        {score}
      </div>
      <Progress value={score} className="h-1" />
    </div>
  );
}

interface FeedbackSectionProps {
  title: string;
  icon: React.ReactNode;
  content: string;
}

function FeedbackSection({ title, icon, content }: FeedbackSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed pl-6 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

export function QualityAssessment({ 
  qualityMetrics, 
  actionVerbFeedback, 
  quantifiableResultsFeedback 
}: QualityAssessmentProps) {
  if (!qualityMetrics) {
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
            <CardTitle className="text-base">Quality Assessment</CardTitle>
            <CardDescription className="text-xs">
              Content quality scores and feedback
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <QualityScore 
            label="Length" 
            score={qualityMetrics.lengthScore} 
            icon={<FileText className="w-4 h-4" />}
          />
          <QualityScore 
            label="Structure" 
            score={qualityMetrics.structureScore} 
            icon={<Layout className="w-4 h-4" />}
          />
          <QualityScore 
            label="Readability" 
            score={qualityMetrics.readabilityScore} 
            icon={<Eye className="w-4 h-4" />}
          />
        </div>
        
        <Separator />
        
        {/* Feedback Sections */}
        <div className="space-y-4">
          <FeedbackSection 
            title="Action Verbs"
            icon={<Zap className="w-4 h-4 text-primary" />}
            content={actionVerbFeedback}
          />
          <FeedbackSection 
            title="Quantifiable Results"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            content={quantifiableResultsFeedback}
          />
        </div>
      </CardContent>
    </Card>
  );
}
