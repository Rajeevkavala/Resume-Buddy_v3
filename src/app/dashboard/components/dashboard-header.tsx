'use client';

import { CheckCircle, Upload, FileText, Briefcase } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string | null;
  resumeText: string;
  jobDescription: string;
  jobRole: string;
}

export function DashboardHeader({ 
  userName, 
  resumeText, 
  jobDescription,
  jobRole 
}: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0];
  
  const getContextualMessage = () => {
    if (!resumeText && !jobDescription) {
      return "Let's get your resume ready for success";
    }
    if (resumeText && !jobDescription) {
      return "Great progress! Add a job description to continue";
    }
    if (resumeText && jobDescription) {
      return "You're all set to generate AI insights";
    }
    return "Continue setting up your profile";
  };

  const hasResume = !!resumeText;
  const hasJobDescription = !!jobDescription;
  const hasJobRole = !!jobRole;

  return (
    <div className="space-y-4">
      {/* Greeting Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-headline font-semibold text-foreground sm:text-3xl">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {getContextualMessage()}
          </p>
        </div>
        
        {/* Status Pills - Desktop */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          {hasResume && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Resume ready
            </div>
          )}
          {hasJobRole && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Role selected
            </div>
          )}
          {hasJobDescription && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Job added
            </div>
          )}
          {!hasResume && !hasJobDescription && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
              <Upload className="w-3.5 h-3.5" />
              Start by uploading your resume
            </div>
          )}
        </div>
      </div>
      
      {/* Status Pills - Mobile (horizontal scroll) */}
      <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {hasResume ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium whitespace-nowrap shrink-0">
            <FileText className="w-3 h-3" />
            Resume
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs whitespace-nowrap shrink-0">
            <FileText className="w-3 h-3" />
            Resume
          </div>
        )}
        {hasJobRole ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium whitespace-nowrap shrink-0">
            <Briefcase className="w-3 h-3" />
            Role
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs whitespace-nowrap shrink-0">
            <Briefcase className="w-3 h-3" />
            Role
          </div>
        )}
        {hasJobDescription ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium whitespace-nowrap shrink-0">
            <CheckCircle className="w-3 h-3" />
            Job Description
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs whitespace-nowrap shrink-0">
            <CheckCircle className="w-3 h-3" />
            Job Description
          </div>
        )}
      </div>
    </div>
  );
}
