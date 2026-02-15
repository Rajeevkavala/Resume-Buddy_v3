'use client';

/**
 * Lazy-loaded components to improve initial page load performance
 * These components are loaded only when needed, reducing the initial bundle size
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Helper to create lazy components with consistent loading states
const createLazyComponent = <T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> } | { [key: string]: ComponentType<T> }>,
  exportName?: string,
  LoadingComponent?: ComponentType
) =>
  dynamic(
    () =>
      importFn().then((mod) =>
        exportName ? { default: (mod as any)[exportName] } : mod
      ),
    {
      ssr: false,
      loading: LoadingComponent ? () => <LoadingComponent /> : () => null,
    }
  );

// Lazy load heavy animation components
export const BackgroundBeams = dynamic(
  () => import('@/components/ui/background-beams').then(mod => mod.BackgroundBeams),
  {
    ssr: false,
    loading: () => null,
  }
);

export const TextGenerateEffect = dynamic(
  () => import('@/components/ui/text-generate-effect').then(mod => mod.TextGenerateEffect),
  {
    ssr: false,
    loading: () => <div className="h-20" />,
  }
);

export const SparklesCore = dynamic(
  () => import('@/components/ui/sparkles').then(mod => mod.SparklesCore),
  {
    ssr: false,
    loading: () => null,
  }
);

export const AnimatedCounter = dynamic(
  () => import('@/components/ui/animated-counter').then(mod => mod.AnimatedCounter),
  {
    ssr: false,
    loading: () => <span>0</span>,
  }
);

export const MovingBorder = dynamic(
  () => import('@/components/ui/moving-border').then(mod => mod.MovingBorder),
  {
    ssr: false,
    loading: () => null,
  }
);

// Lazy load chart components (recharts is ~200KB)
export const ChartContainer = dynamic(
  () => import('@/components/ui/chart').then(mod => mod.ChartContainer),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />,
  }
);

// Lazy load PDF generation components (jspdf + html2canvas ~300KB)
export const PDFGenerator = dynamic(
  () => import('@/components/modern-resume-preview').then(mod => mod.ModernResumePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
  }
);

// Lazy load heavy editor components (~100KB)
export const ResumeContentEditor = dynamic(
  () => import('@/components/resume-content-editor').then(mod => ({ default: mod.ResumeContentEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    ),
  }
);

// Lazy load analysis components
export const AnalysisTab = dynamic(
  () => import('@/components/analysis-tab'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    ),
  }
);

// Lazy load modern template selector
export const ModernTemplateSelector = dynamic(
  () => import('@/components/modern-template-selector').then(mod => mod.ModernTemplateSelector),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    ),
  }
);

// Lazy load modern resume preview
export const ModernResumePreview = dynamic(
  () => import('@/components/modern-resume-preview').then(mod => mod.ModernResumePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    ),
  }
);

// Note: Some components may need to be loaded directly if they don't have default exports
// Use these as examples for other components that need lazy loading
