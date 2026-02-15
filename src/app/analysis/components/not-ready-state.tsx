'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';

interface NotReadyStateProps {
  hasResume: boolean;
}

export function NotReadyState({ hasResume }: NotReadyStateProps) {
  const targetSection = !hasResume ? '/dashboard#resume' : '/dashboard#job-info';
  const message = !hasResume
    ? 'Upload your resume on the Dashboard so we can analyze it.'
    : 'Add a job description or target role on the Dashboard to tailor the analysis.';

  return (
    <Card className="border-border/60 border-dashed">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-headline font-semibold">
              Add Your Inputs First
            </h3>
            <p className="text-muted-foreground text-sm">
              {message}
            </p>
          </div>
          
          <Button asChild size="lg">
            <Link href={targetSection}>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
