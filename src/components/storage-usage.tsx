'use client';

import { useEffect, useState } from 'react';
import { HardDrive, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface StorageUsageProps {
  userId?: string;
  tier?: 'free' | 'pro';
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function StorageUsage({ tier = 'free', className }: StorageUsageProps) {
  const [loading, setLoading] = useState(true);
  const [resumeCount, setResumeCount] = useState(0);
  const [totalResumes, setTotalResumes] = useState(0);

  // Tier limits
  const maxResumes = tier === 'pro' ? 50 : 10;
  const maxFileSizeMB = tier === 'pro' ? 25 : 5;

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch('/api/resumes?status=all&limit=1');
        if (response.ok) {
          const data = await response.json();
          setTotalResumes(data.total || 0);
          setResumeCount(data.total || 0);
        }
      } catch (err) {
        console.error('Failed to fetch usage:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  const resumePercentage = Math.min((resumeCount / maxResumes) * 100, 100);

  const getUsageColor = () => {
    if (resumePercentage >= 90) return 'text-red-500';
    if (resumePercentage >= 70) return 'text-amber-500';
    return 'text-emerald-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          Storage Usage
          <Badge variant="outline" className="text-xs capitalize">
            {tier}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resume count */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Resumes
            </span>
            <span className={`text-sm font-medium ${getUsageColor()}`}>
              {resumeCount} / {maxResumes}
            </span>
          </div>
          <Progress value={resumePercentage} className="h-2" />
        </div>

        {/* Tier info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Max file size: {maxFileSizeMB}MB per file</p>
          <p>• Total resumes: {totalResumes}</p>
          {tier === 'free' && (
            <p className="text-primary cursor-pointer hover:underline">
              Upgrade to Pro for 50 resumes & 25MB uploads
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
