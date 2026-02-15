'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Briefcase, FileText, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NextStepCardProps {
  resumeText: string;
  jobRole: string;
  jobDescription: string;
  onNavigate: (path: string) => void;
}

export function NextStepCard({ 
  resumeText, 
  jobRole, 
  jobDescription,
  onNavigate 
}: NextStepCardProps) {
  
  const getNextStepInfo = () => {
    if (!resumeText) {
      return {
        icon: Upload,
        title: "Upload Your Resume",
        description: "Drag and drop your resume file (PDF or DOCX) to get started with AI-powered analysis",
        href: "#resume",
        label: "Upload Resume",
        isInternal: true
      };
    }
    if (!jobRole) {
      return {
        icon: Briefcase,
        title: "Select Your Target Role",
        description: "Choose the job role you're targeting to help tailor our AI recommendations",
        href: "#job-info",
        label: "Select Role",
        isInternal: true
      };
    }
    if (!jobDescription) {
      return {
        icon: FileText,
        title: "Add Job Description",
        description: "Paste the job posting to get personalized recommendations and interview questions",
        href: "#job-description",
        label: "Add Description",
        isInternal: true
      };
    }
    return {
      icon: Sparkles,
      title: "Ready for AI Analysis",
      description: "Your inputs are complete. Generate AI-powered insights to improve your resume and ace your interviews",
      href: "/analysis",
      label: "Start Analysis",
      isInternal: false
    };
  };

  const stepInfo = getNextStepInfo();
  const Icon = stepInfo.icon;

  return (
    <Card className="border-border/60 bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left accent bar */}
          <div className="hidden sm:block w-1 bg-primary shrink-0" />
          
          <div className="flex-1 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    Next Step
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {stepInfo.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stepInfo.description}
                </p>
              </div>
              
              {/* Button */}
              <div className="shrink-0 w-full sm:w-auto">
                {stepInfo.isInternal ? (
                  <Button asChild className="w-full sm:w-auto gap-2">
                    <Link href={stepInfo.href}>
                      {stepInfo.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => onNavigate(stepInfo.href)}
                    className="w-full sm:w-auto gap-2"
                  >
                    {stepInfo.label}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
