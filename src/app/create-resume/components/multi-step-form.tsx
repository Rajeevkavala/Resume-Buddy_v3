'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  User,
  FileText,
  Wrench,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Award,
} from 'lucide-react';
import type { ResumeData } from '@/lib/types';
import { PersonalInfoForm } from './forms/personal-info-form';
import { SummaryForm } from './forms/summary-form';
import { SkillsForm } from './forms/skills-form';
import { ExperienceForm } from './forms/experience-form';
import { EducationForm } from './forms/education-form';
import { ProjectsForm } from './forms/projects-form';
import { CertificationsForm } from './forms/certifications-form';

interface Step {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
  description: string;
}

const STEPS: Step[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    shortTitle: 'Personal',
    icon: <User className="w-4 h-4" />,
    description: 'Your contact details and online presence',
  },
  {
    id: 'summary',
    title: 'Professional Summary',
    shortTitle: 'Summary',
    icon: <FileText className="w-4 h-4" />,
    description: 'A brief overview of your professional background',
  },
  {
    id: 'skills',
    title: 'Skills',
    shortTitle: 'Skills',
    icon: <Wrench className="w-4 h-4" />,
    description: 'Technical and soft skills you possess',
  },
  {
    id: 'experience',
    title: 'Work Experience',
    shortTitle: 'Experience',
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Your professional work history',
  },
  {
    id: 'education',
    title: 'Education',
    shortTitle: 'Education',
    icon: <GraduationCap className="w-4 h-4" />,
    description: 'Your academic background',
  },
  {
    id: 'projects',
    title: 'Projects',
    shortTitle: 'Projects',
    icon: <FolderOpen className="w-4 h-4" />,
    description: 'Notable projects you have worked on',
  },
  {
    id: 'certifications',
    title: 'Certifications',
    shortTitle: 'Certs',
    icon: <Award className="w-4 h-4" />,
    description: 'Professional certifications and credentials',
  },
];

interface MultiStepFormProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

export function MultiStepForm({ resumeData, onResumeDataChange }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
    }
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Check if a step has content
  const isStepComplete = useCallback((stepId: string): boolean => {
    switch (stepId) {
      case 'personal':
        return Boolean(resumeData?.personalInfo?.fullName || resumeData?.personalInfo?.email);
      case 'summary':
        return Boolean(resumeData?.summary?.trim());
      case 'skills':
        return Array.isArray(resumeData?.skills) && resumeData.skills.length > 0;
      case 'experience':
        return Array.isArray(resumeData?.experience) && resumeData.experience.length > 0;
      case 'education':
        return Array.isArray(resumeData?.education) && resumeData.education.length > 0;
      case 'projects':
        return Array.isArray(resumeData?.projects) && resumeData.projects.length > 0;
      case 'certifications':
        return Array.isArray(resumeData?.certifications) && resumeData.certifications.length > 0;
      default:
        return false;
    }
  }, [resumeData]);

  const currentStepData = STEPS[currentStep];

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'personal':
        return (
          <PersonalInfoForm
            data={resumeData.personalInfo}
            onChange={(personalInfo) => onResumeDataChange({ ...resumeData, personalInfo })}
          />
        );
      case 'summary':
        return (
          <SummaryForm
            value={resumeData.summary || ''}
            onChange={(summary) => onResumeDataChange({ ...resumeData, summary })}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            skills={resumeData.skills || []}
            onChange={(skills) => onResumeDataChange({ ...resumeData, skills })}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            experience={resumeData.experience || []}
            onChange={(experience) => onResumeDataChange({ ...resumeData, experience })}
          />
        );
      case 'education':
        return (
          <EducationForm
            education={resumeData.education || []}
            onChange={(education) => onResumeDataChange({ ...resumeData, education })}
          />
        );
      case 'projects':
        return (
          <ProjectsForm
            projects={resumeData.projects || []}
            onChange={(projects) => onResumeDataChange({ ...resumeData, projects })}
          />
        );
      case 'certifications':
        return (
          <CertificationsForm
            certifications={resumeData.certifications || []}
            onChange={(certifications) => onResumeDataChange({ ...resumeData, certifications })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Compact Step Navigation - Dot indicators with connecting lines */}
      <div className="mb-6 pb-6 border-b border-border/40">
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-2 overflow-x-auto">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = isStepComplete(step.id);

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(index)}
                  className="group relative flex flex-col items-center"
                  title={step.title}
                >
                  {/* Step dot */}
                  <div className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isComplete && !isActive && "bg-emerald-500/15 text-emerald-600 border-2 border-emerald-500/40",
                    !isComplete && !isActive && "bg-muted text-muted-foreground hover:bg-muted/80 border border-border/60"
                  )}>
                    {isComplete && !isActive ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {/* Step label - visible on larger screens */}
                  <span className={cn(
                    "hidden md:block text-[10px] mt-1.5 font-medium transition-colors",
                    isActive && "text-primary",
                    isComplete && !isActive && "text-emerald-600",
                    !isComplete && !isActive && "text-muted-foreground"
                  )}>
                    {step.shortTitle}
                  </span>
                </button>
                {/* Connecting line */}
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-4 sm:w-6 lg:w-8 h-0.5 mx-0.5 sm:mx-1 transition-colors",
                    index < currentStep ? "bg-emerald-500/50" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Header - Compact */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary">{currentStepData.icon}</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold truncate">{currentStepData.title}</h2>
          <p className="text-xs text-muted-foreground">{currentStepData.description}</p>
        </div>
      </div>

      {/* Form Content - Natural height, no internal scroll */}
      <div className="space-y-6">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrevious}
          disabled={currentStep === 0}
          className="gap-1.5 h-9"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        
        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {STEPS.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === currentStep && "bg-primary w-5",
                i < currentStep && "bg-emerald-500 w-1.5",
                i > currentStep && "bg-muted-foreground/25 w-1.5"
              )}
            />
          ))}
        </div>

        <Button
          size="sm"
          onClick={goNext}
          disabled={currentStep === STEPS.length - 1}
          className="gap-1.5 h-9"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
