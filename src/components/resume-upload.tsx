'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ResumeUploadProps {
  tier?: 'free' | 'pro';
  onUploadComplete?: (result: {
    fileId: string;
    objectKey: string;
    resumeDataId?: string;
    filename: string;
    size: number;
  }) => void;
  onError?: (error: string) => void;
  resumeDataId?: string;
  className?: string;
}

export function ResumeUpload({
  tier = 'free',
  onUploadComplete,
  onError,
  resumeDataId,
  className,
}: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxSizeMB = tier === 'pro' ? 25 : 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setSuccess(null);
      setUploading(true);
      setProgress(10);

      try {
        // Client-side validation
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
        }
        if (file.size > maxSizeBytes) {
          throw new Error(`File too large. Maximum size is ${maxSizeMB}MB for ${tier} tier.`);
        }

        setProgress(30);

        // Upload via form data
        const formData = new FormData();
        formData.append('file', file);
        if (resumeDataId) {
          formData.append('resumeDataId', resumeDataId);
        }

        setProgress(50);

        const response = await fetch('/api/resumes/upload', {
          method: 'POST',
          body: formData,
        });

        setProgress(80);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const result = await response.json();
        setProgress(100);
        setSuccess(`"${file.name}" uploaded successfully!`);

        onUploadComplete?.({
          fileId: result.fileId,
          objectKey: result.objectKey,
          resumeDataId: result.resumeDataId,
          filename: file.name,
          size: file.size,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        onError?.(msg);
      } finally {
        setUploading(false);
      }
    },
    [maxSizeBytes, maxSizeMB, tier, resumeDataId, onUploadComplete, onError],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer',
          isDragActive && !isDragReject && 'border-primary bg-primary/5 scale-[1.02]',
          isDragReject && 'border-destructive bg-destructive/5',
          uploading && 'opacity-60 cursor-not-allowed',
          !isDragActive && !uploading && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="h-10 w-10 text-primary animate-bounce" />
            <p className="text-sm font-medium text-primary">Drop your resume here</p>
          </>
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-3">
              <File className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag & drop your resume here, or{' '}
                <span className="text-primary underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, DOCX, or TXT • Max {maxSizeMB}MB ({tier} tier)
              </p>
            </div>
          </>
        )}
      </div>

      {uploading && (
        <Progress value={progress} className="h-2" />
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {success}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuccess(null)}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
