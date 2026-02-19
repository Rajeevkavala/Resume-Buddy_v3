'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Trash2,
  Archive,
  ArchiveRestore,
  MoreVertical,
  BarChart3,
  Calendar,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface GeneratedResume {
  id: string;
  templateId: string;
  format: string;
  status: string;
  createdAt: string;
  file?: { objectKey: string; originalName: string; size: number } | null;
  downloadUrl?: string | null;
}

interface ResumeCardData {
  id: string;
  title: string | null;
  resumeText: string | null;
  jobRole: string | null;
  analysis: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  originalFile?: {
    id: string;
    objectKey: string;
    originalName: string;
    size: number;
    createdAt: string;
  } | null;
  improvedFile?: {
    id: string;
    objectKey: string;
    originalName: string;
    size: number;
    createdAt: string;
  } | null;
  generatedResumes: GeneratedResume[];
}

interface ResumeCardProps {
  resume: ResumeCardData;
  onDelete?: (id: string) => void;
  onArchive?: (id: string, archived: boolean) => void;
  onRefresh?: () => void;
}

export function ResumeCard({ resume, onDelete, onArchive, onRefresh }: ResumeCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const title = resume.title || 'Untitled Resume';
  const atsScore = resume.analysis
    ? (resume.analysis as { atsScore?: number }).atsScore
    : null;
  const hasExports = resume.generatedResumes.length > 0;
  const latestExport = resume.generatedResumes[0];
  const hasOriginal = Boolean(resume.originalFile);
  const hasImproved = Boolean(resume.improvedFile);
  const isArchived = !resume.isActive;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
    if (score >= 60) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950';
    return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
  };

  const getStatusBadge = () => {
    if (isArchived) return { label: 'Archived', variant: 'secondary' as const };
    if (hasExports) return { label: 'Exported', variant: 'default' as const };
    if (resume.analysis) return { label: 'Analyzed', variant: 'outline' as const };
    return { label: 'Draft', variant: 'secondary' as const };
  };

  const statusBadge = getStatusBadge();

  const handleView = () => {
    router.push(`/analysis?resumeId=${resume.id}`);
  };

  const handleDownload = async () => {
    if (!latestExport?.downloadUrl) {
      // Try to get download URL from API
      try {
        const response = await fetch(`/api/resumes/${resume.id}/download`, {
          headers: { accept: 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.downloadUrl) {
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.filename || 'resume.pdf';
            link.click();
          }
        }
      } catch (err) {
        console.error('Download failed:', err);
      }
      return;
    }

    const link = document.createElement('a');
    link.href = latestExport.downloadUrl;
    link.download = latestExport.file?.originalName || 'resume.pdf';
    link.click();
  };

  const handleDownloadBySource = async (source: 'original' | 'improved') => {
    try {
      const response = await fetch(`/api/resumes/${resume.id}/download?source=${source}`, {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.downloadUrl) return;

      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename || `resume-${source}.txt`;
      link.click();
    } catch (err) {
      console.error(`Download ${source} failed:`, err);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/resumes/${resume.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !isArchived }),
      });
      if (response.ok) {
        onArchive?.(resume.id, !isArchived);
        onRefresh?.();
      }
    } catch (err) {
      console.error('Archive failed:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/resumes/${resume.id}?hard=true`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onDelete?.(resume.id);
        onRefresh?.();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateText = (text: string | null, maxLen: number) => {
    if (!text) return 'No content yet';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  };

  return (
    <>
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30',
          isArchived && 'opacity-70',
        )}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-base truncate cursor-pointer hover:text-primary transition-colors"
                onClick={handleView}
                title={title}
              >
                {title}
              </h3>
              {resume.jobRole && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {resume.jobRole}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View / Analyze
                </DropdownMenuItem>
                {hasExports && (
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                {!hasExports && hasOriginal && (
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                {hasOriginal && (
                  <DropdownMenuItem onClick={() => handleDownloadBySource('original')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Original
                  </DropdownMenuItem>
                )}
                {hasImproved && (
                  <DropdownMenuItem onClick={() => handleDownloadBySource('improved')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Improved
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive} disabled={isArchiving}>
                  {isArchived ? (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content preview */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {truncateText(resume.resumeText, 120)}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant={statusBadge.variant} className="text-xs">
              {statusBadge.label}
            </Badge>
            {atsScore !== null && atsScore !== undefined && (
              <Badge
                variant="outline"
                className={cn('text-xs', getScoreColor(atsScore))}
              >
                <BarChart3 className="mr-1 h-3 w-3" />
                ATS: {atsScore}%
              </Badge>
            )}
            {latestExport && (
              <Badge variant="outline" className="text-xs">
                <FileText className="mr-1 h-3 w-3" />
                {latestExport.templateId}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(resume.updatedAt)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleView}
              >
                <Eye className="mr-1 h-3 w-3" />
                Open
              </Button>
              {hasExports && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleDownload}
                >
                  <Download className="mr-1 h-3 w-3" />
                  PDF
                </Button>
              )}
              {!hasExports && hasOriginal && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleDownloadBySource('original')}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Original
                </Button>
              )}
              {hasImproved && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleDownloadBySource('improved')}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Improved
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete &quot;{title}&quot;? This will
              remove all associated files and exports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
