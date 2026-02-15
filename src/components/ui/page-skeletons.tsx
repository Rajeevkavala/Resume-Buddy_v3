import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced Loading Spinner with theme support
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function PageLoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" 
             style={{ animationDuration: '1.5s' }} />
        {/* Main spinner */}
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary relative z-10")} />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Full page loading overlay with spinner
export function PageLoadingOverlay({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-card border border-border/50 shadow-lg">
        <PageLoadingSpinner size="lg" />
        <p className="text-sm font-medium text-foreground">{text}</p>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Loading indicator at top */}
        <div className="flex items-center justify-center py-2 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading dashboard..." />
        </div>
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-52 sm:h-9 sm:w-64" />
              <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
            </div>
            
            {/* Status Pills - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
          
          {/* Status Pills - Mobile (horizontal scroll simulation) */}
          <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <Skeleton className="h-7 w-24 rounded-full shrink-0" />
            <Skeleton className="h-7 w-28 rounded-full shrink-0" />
            <Skeleton className="h-7 w-20 rounded-full shrink-0" />
          </div>
        </div>

        {/* Progress Stepper Card */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="relative">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                    {i < 4 && (
                      <div className="hidden sm:block absolute top-1/2 left-full w-full h-0.5 -translate-y-1/2">
                        <Skeleton className="h-0.5 w-full" />
                      </div>
                    )}
                  </div>
                  <Skeleton className="h-3 w-14 sm:w-20 hidden sm:block" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Step Card */}
        <Card className="border-border/60 bg-primary/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 sm:w-40" />
                  <Skeleton className="h-4 w-48 sm:w-64" />
                </div>
              </div>
              <Skeleton className="h-10 w-full sm:w-36" />
            </div>
          </CardContent>
        </Card>

        {/* Job Information Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Role Selector */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Job URL */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Two Column Grid for Resume & Job Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Resume Card */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Uploader Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8">
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 text-center">
                    <Skeleton className="h-4 w-40 mx-auto" />
                    <Skeleton className="h-3 w-32 mx-auto" />
                  </div>
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
              
              {/* Extracted Text Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-[180px] sm:h-[240px] w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Job Description Card */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enhanced Job Description Input */}
              <Skeleton className="h-[280px] sm:h-[340px] w-full rounded-lg" />
              
              {/* Pro Tip Box */}
              <div className="p-4 rounded-lg border border-dashed border-border bg-muted/30">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 shrink-0 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <Card className="border-border/60 sticky bottom-4 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Skeleton className="h-10 w-full sm:w-28" />
                <Skeleton className="h-10 w-full sm:w-24" />
              </div>
              <Skeleton className="h-10 w-full sm:w-36" />
            </div>
          </CardContent>
        </Card>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center pb-4">
          <PageLoadingSpinner size="sm" text="Preparing your workspace..." />
        </div>
      </div>
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Mobile Loading Indicator */}
        <div className="flex items-center justify-center py-2 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading analysis..." />
        </div>
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44 sm:h-9 sm:w-56" />
              <Skeleton className="h-4 w-56 sm:h-5 sm:w-80" />
            </div>
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
        </div>

        {/* Score Overview Card */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Score Circle */}
              <div className="relative">
                <Skeleton className="h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
              </div>
              
              {/* Score Details */}
              <div className="flex-1 space-y-4 text-center sm:text-left w-full">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 mx-auto sm:mx-0" />
                  <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
                </div>
                
                {/* Mini Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <Skeleton className="h-4 w-16 mx-auto mb-2" />
                      <Skeleton className="h-6 w-12 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills Card */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-border/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center pb-4">
          <PageLoadingSpinner size="sm" text="Preparing analysis view..." />
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QASkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Mobile Loading Indicator */}
        <div className="flex items-center justify-center py-2 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading Q&A..." />
        </div>
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-36 sm:h-9 sm:w-48" />
              <Skeleton className="h-4 w-52 sm:h-5 sm:w-72" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full hidden sm:block" />
          </div>
        </div>

        {/* Topic Selection Card */}
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full sm:w-48" />
              </div>
              <div className="space-y-2 flex-1 sm:flex-none">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full sm:w-28" />
              </div>
              <Skeleton className="h-10 w-full sm:w-36" />
            </div>
          </CardContent>
        </Card>

        {/* Q&A List */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Question */}
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-4/5 sm:w-3/4" />
                    </div>
                  </div>
                  
                  {/* Answer */}
                  <div className="ml-0 sm:ml-11 space-y-2 p-4 rounded-lg bg-muted/30">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                  
                  {/* Actions */}
                  <div className="ml-0 sm:ml-11 flex gap-2">
                    <Skeleton className="h-8 w-20 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center pb-4">
          <PageLoadingSpinner size="sm" text="Preparing Q&A view..." />
        </div>
      </div>
    </div>
  );
}

export function InterviewSkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Mobile Loading Indicator */}
        <div className="flex items-center justify-center py-2 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading interview prep..." />
        </div>
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44 sm:h-9 sm:w-56" />
              <Skeleton className="h-4 w-56 sm:h-5 sm:w-80" />
            </div>
          </div>
        </div>

        {/* Quiz Configuration Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Config Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full sm:w-40" />
          </CardContent>
        </Card>

        {/* Quiz Questions */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-4/5" />
                    </div>
                  </div>
                  
                  {/* Answer Options */}
                  <div className="ml-0 sm:ml-11 space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                        <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center pb-4">
          <PageLoadingSpinner size="sm" text="Preparing interview quiz..." />
        </div>
      </div>
    </div>
  );
}

export function CoverLetterSkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Mobile Loading Indicator */}
        <div className="flex items-center justify-center py-2 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading cover letter..." />
        </div>
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40 sm:h-9 sm:w-52" />
              <Skeleton className="h-4 w-64 sm:h-5 sm:w-96" />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Company Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            {/* Hiring Manager */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-3 w-48" />
            </div>
            {/* Tone */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-border/60 bg-muted/30">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <Skeleton className="w-5 h-5 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center pt-2">
          <Skeleton className="h-11 w-48 rounded-lg" />
        </div>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center pb-4">
          <PageLoadingSpinner size="sm" text="Preparing cover letter generator..." />
        </div>
      </div>
    </div>
  );
}

export function ImprovementSkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Mobile Loading Indicator */}
        <div className="flex items-center justify-center py-2 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading improvements..." />
        </div>
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 sm:h-9 sm:w-56" />
              <Skeleton className="h-4 w-60 sm:h-5 sm:w-80" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-full sm:w-32" />
              <Skeleton className="h-10 w-10 shrink-0 hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Before/After Score Card */}
        <Card className="border-border/60 bg-gradient-to-r from-muted/30 to-muted/10">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              {/* Before */}
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              
              {/* Arrow */}
              <div className="flex justify-center">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              
              {/* After */}
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Improvement Sections */}
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 sm:w-40" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original vs Improved */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-success/5 border border-success/20">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
                
                {/* Bullet Points */}
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-start gap-2">
                      <Skeleton className="w-5 h-5 rounded shrink-0 mt-0.5" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center pb-4">
          <PageLoadingSpinner size="sm" text="Preparing improvements view..." />
        </div>
      </div>
    </div>
  );
}

export function TextAreaSkeleton({ height = "h-32" }: { height?: string }) {
  return <Skeleton className={`w-full ${height}`} />;
}

export function ButtonSkeleton({ width = "w-24" }: { width?: string }) {
  return <Skeleton className={`h-10 ${width}`} />;
}

// Create Resume Page Skeleton
export function CreateResumeSkeleton() {
  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Mobile Loading Indicator */}
        <div className="flex items-center justify-center py-3 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading resume builder..." />
        </div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 sm:h-9 sm:w-52" />
            <Skeleton className="h-4 w-56 sm:w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-full sm:w-36" />
            <Skeleton className="h-10 w-10 shrink-0" />
          </div>
        </div>

        {/* AI Banner */}
        <Card className="border-border/60 bg-primary/5 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Form Section */}
          <Card className="border-border/60 order-2 lg:order-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form Steps */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
                ))}
              </div>
              
              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-18" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="border-border/60 order-1 lg:order-2 lg:sticky lg:top-6 lg:h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              {/* Preview Document */}
              <div className="aspect-[8.5/11] bg-muted/50 rounded-lg border border-border/60 p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <Skeleton className="h-6 w-40 mx-auto" />
                    <Skeleton className="h-3 w-64 mx-auto" />
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-6 w-16 rounded" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center py-6">
          <PageLoadingSpinner size="sm" text="Preparing resume builder..." />
        </div>
      </div>
    </div>
  );
}

// Billing Page Skeleton
export function BillingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        
        {/* Mobile Loading Indicator */}
        <div className="flex items-center justify-center py-2 sm:hidden">
          <PageLoadingSpinner size="sm" text="Loading billing..." />
        </div>
        
        {/* Header */}
        <div className="space-y-2 mb-6 sm:mb-8">
          <Skeleton className="h-8 w-40 sm:h-9 sm:w-52" />
          <Skeleton className="h-4 w-52 sm:w-72" />
        </div>

        <div className="space-y-4 sm:space-y-6">
          
          {/* Current Plan Card */}
          <Card className="border-border/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted" />
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* Plan Info */}
                <div className="flex items-start gap-4">
                  <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                
                {/* Expiry Info */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats Card */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-52" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* AI Credits */}
                <div className="p-4 rounded-lg border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
                
                {/* Exports */}
                <div className="p-4 rounded-lg border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade/Renew Card */}
          <Card className="border-primary/30">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-52" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              
              {/* Features List */}
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded shrink-0" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
              
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        </div>
        
        {/* Desktop Loading Indicator */}
        <div className="hidden sm:flex items-center justify-center py-6">
          <PageLoadingSpinner size="sm" text="Preparing billing details..." />
        </div>
      </div>
    </div>
  );
}