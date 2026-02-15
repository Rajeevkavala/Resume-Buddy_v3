'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Brain, FileText, MessageSquare, Users, TrendingUp } from 'lucide-react';

// Generic loading spinner
export const LoadingSpinner = ({ size = 'default', text }: { size?: 'sm' | 'default' | 'lg'; text?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

// Pulsing dots animation
export const PulsingDots = ({ text }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Card skeleton for general loading states
export const CardSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
};

// Analysis loading component with specific animations
export const AnalysisLoading = () => {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-2 rounded-lg bg-primary/10"
            >
              <Brain className="h-5 w-5 text-primary" />
            </motion.div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <PulsingDots text="Analyzing your resume..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Q&A loading component with accordion-style skeletons
export const QALoading = () => {
  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="p-2 rounded-lg bg-primary/10"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
            </motion.div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <PulsingDots text="Generating interview questions..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <div className="pl-8 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// Interview loading component
export const InterviewLoading = () => {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 rounded-lg bg-primary/10"
            >
              <Users className="h-5 w-5 text-primary" />
            </motion.div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-56" />
              <PulsingDots text="Preparing interview questions..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Improvement loading component
export const ImprovementLoading = () => {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="p-2 rounded-lg bg-primary/10"
            >
              <TrendingUp className="h-5 w-5 text-primary" />
            </motion.div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <PulsingDots text="Analyzing improvement opportunities..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Improvement categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard loading component
export const DashboardLoading = () => {
  return (
    <div className="space-y-8">
      {/* Hero section skeleton */}
      <Card className="p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <CardSkeleton className="xl:col-span-2" />
        <CardSkeleton />
      </div>
    </div>
  );
};

// File processing loading
export const FileProcessingLoading = ({ fileName }: { fileName?: string }) => {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="p-3 rounded-full bg-primary/10"
          >
            <FileText className="h-6 w-6 text-primary" />
          </motion.div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Processing {fileName || 'file'}...</span>
              <PulsingDots />
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Extracting text content...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Page-level loading overlay
export const PageLoadingOverlay = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="p-8 max-w-sm mx-4">
        <CardContent className="text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Brain className="h-8 w-8 text-primary" />
          </motion.div>
          <div className="space-y-2">
            <h3 className="font-semibold">{text}</h3>
            <PulsingDots />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};