'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Sparkles, 
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import type { GenerateCoverLetterOutput } from '@/ai/flows/generate-cover-letter';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Header Component
interface CoverLetterHeaderProps {
  coverLetter: GenerateCoverLetterOutput | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export function CoverLetterHeader({ coverLetter, onGenerate, onRegenerate, isLoading }: CoverLetterHeaderProps) {
  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeInUp}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cover Letter</h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Generate a personalized, professional cover letter tailored to your target job
        </p>
      </div>
      
      {coverLetter && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Generated
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            New Letter
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// Not Ready State
interface NotReadyStateProps {
  hasResume: boolean;
}

export function NotReadyState({ hasResume }: NotReadyStateProps) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {!hasResume ? 'Resume Required' : 'Job Information Required'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            {!hasResume 
              ? 'Please upload your resume on the dashboard first. This helps us personalize your cover letter with relevant experience and skills.'
              : 'Please add a job description or select a target role on the dashboard. This ensures your cover letter is tailored to the specific position.'
            }
          </p>
          <Link href="/dashboard">
            <Button className="gap-2">
              {!hasResume ? (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4" />
                  Add Job Details
                </>
              )}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty State / Ready to Generate
export function EmptyState() {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
      <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to Create Your Cover Letter</h3>
          <p className="text-muted-foreground text-sm max-w-md mb-2">
            Our AI will analyze your resume and the job description to craft a personalized, 
            compelling cover letter that highlights your most relevant qualifications.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Takes about 10-15 seconds
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { CoverLetterForm } from './cover-letter-form';
export { CoverLetterPreview } from './cover-letter-preview';
