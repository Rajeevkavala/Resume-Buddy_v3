'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VersionEntry {
  id: string;
  templateId: string;
  format: string;
  status: string;
  createdAt: string;
  file?: { objectKey: string; originalName: string; size: number } | null;
  downloadUrl?: string | null;
}

interface ResumeVersionsProps {
  resumeId: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ResumeVersions({ resumeId, className }: ResumeVersionsProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVersions() {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`, {
          headers: { accept: 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setVersions(data.generatedResumes || []);
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setLoading(false);
      }
    }

    if (resumeId) {
      fetchVersions();
    }
  }, [resumeId]);

  const handleDownload = (version: VersionEntry) => {
    if (!version.downloadUrl) return;
    const link = document.createElement('a');
    link.href = version.downloadUrl;
    link.download = version.file?.originalName || `resume-${version.templateId}.pdf`;
    link.click();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No exported versions yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Version History
          <Badge variant="secondary" className="text-xs">
            {versions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-64">
          <div className="space-y-1 px-6 pb-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate capitalize">
                      {version.templateId} template
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                      {version.file && (
                        <span>{formatBytes(version.file.size)}</span>
                      )}
                      <Badge
                        variant={
                          version.status === 'COMPLETED' ? 'default' : 'secondary'
                        }
                        className="text-[10px] h-4"
                      >
                        {version.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {version.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 shrink-0"
                    onClick={() => handleDownload(version)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
