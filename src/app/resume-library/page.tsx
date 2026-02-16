'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Grid3X3,
  List,
  Search,
  Filter,
  Plus,
  FileText,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResumeCard } from '@/components/resume-card';
import { ResumeUpload } from '@/components/resume-upload';
import { StorageUsage } from '@/components/storage-usage';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { cn } from '@/lib/utils';

interface ResumeListItem {
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
  generatedResumes: Array<{
    id: string;
    templateId: string;
    format: string;
    status: string;
    createdAt: string;
    file?: { objectKey: string; originalName: string; size: number } | null;
    downloadUrl?: string | null;
  }>;
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'active' | 'archived' | 'all';

export default function ResumeLibraryPage() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status: statusFilter,
      });
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/resumes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResumes();
  };

  const handleDelete = (id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    setTotal((prev) => prev - 1);
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchResumes();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            My Resumes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your resumes, exports, and versions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResumes}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Plus className="h-4 w-4 mr-1" />
            Upload Resume
          </Button>
        </div>
      </div>

      {/* Upload section (collapsible) */}
      {showUpload && (
        <div className="mb-6">
          <ResumeUpload
            tier={(tier as 'free' | 'pro') || 'free'}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </form>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Badge variant="secondary" className="text-xs">
            {total} resume{total !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No resumes found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : statusFilter === 'archived'
                  ? 'No archived resumes'
                  : 'Upload your first resume to get started'}
              </p>
              {!searchQuery && statusFilter === 'active' && (
                <Button onClick={() => setShowUpload(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Upload Resume
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3',
                )}
              >
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    onDelete={handleDelete}
                    onRefresh={fetchResumes}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar - Storage usage */}
        <div className="hidden lg:block w-64 shrink-0">
          <StorageUsage tier={(tier as 'free' | 'pro') || 'free'} />
        </div>
      </div>
    </div>
  );
}
