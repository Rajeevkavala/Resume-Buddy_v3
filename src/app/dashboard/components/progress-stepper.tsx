'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, Upload, FileText, Briefcase, Link as LinkIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  name: string;
  completed: boolean;
  icon: LucideIcon;
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  const completedCount = steps.filter(s => s.completed).length;
  
  // Find the first incomplete step index (active step)
  const activeIndex = steps.findIndex(s => !s.completed);
  const effectiveActiveIndex = activeIndex === -1 ? steps.length - 1 : activeIndex;
  
  // Calculate progress percentage for the line
  // Line goes from first to last step center, so we calculate based on completed steps
  const progressPercent = completedCount > 0 
    ? ((completedCount - 1) / (steps.length - 1)) * 100 
    : 0;

  return (
    <div className="w-full py-4">
      {/* Desktop: Horizontal Stepper */}
      <div className="hidden md:block relative">
        {/* Background Line */}
        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-border" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-5 left-[12.5%] h-0.5 bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent * 0.75}%` }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = step.completed;
            const isActive = index === effectiveActiveIndex && !isCompleted;
            
            return (
              <div 
                key={step.name}
                className="flex flex-col items-center flex-1"
              >
                {/* Step Circle */}
                <div 
                  className={cn(
                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : isActive
                        ? "bg-background text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                
                {/* Step Label */}
                <div className="text-center mt-3">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isCompleted ? "text-foreground" : isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isCompleted ? "text-success" : "text-muted-foreground"
                  )}>
                    {isCompleted ? "Complete" : isActive ? "Current" : "Pending"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Mobile: Compact Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {steps.length} complete
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        
        {/* Compact Step List */}
        <div className="grid grid-cols-2 gap-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = step.completed;
            
            return (
              <div 
                key={step.name}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg transition-colors",
                  isCompleted ? "bg-success/10" : "bg-muted/50"
                )}
              >
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    isCompleted 
                      ? "bg-success text-success-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium truncate",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
