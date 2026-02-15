'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAdminLogsAction } from '@/app/actions/admin';
import type { AdminAction } from '@/types/admin';
import { RefreshCw, Search, Filter, FileText, Calendar, User, Target } from 'lucide-react';

// Skeleton for loading state
function LogsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Filter skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mobile log card component
function LogCard({ log, formatAction, getActionBadgeVariant }: { 
  log: AdminAction; 
  formatAction: (action: string) => string;
  getActionBadgeVariant: (action: string) => 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  return (
    <Card className="border">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant={getActionBadgeVariant(log.action)}>
            {formatAction(log.action)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(log.timestamp).toLocaleString()}
          </span>
        </div>

        <div className="space-y-2 text-sm mt-3">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Admin:</span>
            <span className="font-medium truncate">{log.adminEmail}</span>
          </div>
          {(log.targetEmail || log.targetUserId) && (
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Target:</span>
              <span className="truncate">{log.targetEmail || log.targetUserId}</span>
            </div>
          )}
        </div>

        {log.details && (
          <div className="mt-3 p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto">
            {JSON.stringify(log.details).substring(0, 100)}...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [user?.email]);

  async function fetchLogs() {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const result = await getAdminLogsAction(user.email, 200);
      if (result.success && result.data) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const actionTypes = [...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (action.includes('block') || action.includes('delete') || action.includes('remove')) {
      return 'destructive';
    }
    if (action.includes('add') || action.includes('unblock')) {
      return 'default';
    }
    return 'secondary';
  }

  function formatAction(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  if (loading) {
    return <LogsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            Admin Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of all admin actions
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by admin, target, or action..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => {
                const today = new Date().toISOString().split('T')[0];
                const logDate = new Date(l.timestamp).toISOString().split('T')[0];
                return today === logDate;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(l.timestamp) >= weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map(l => l.adminEmail)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs - Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Action Log ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Chronological record of admin operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{log.adminEmail}</TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {formatAction(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.targetEmail || log.targetUserId || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {searchQuery || filterAction !== 'all' 
                      ? 'No logs match your filters' 
                      : 'No admin actions logged yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Logs - Mobile Cards */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Action Log ({filteredLogs.length})</h3>
        </div>
        {filteredLogs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                {searchQuery || filterAction !== 'all' 
                  ? 'No logs match your filters' 
                  : 'No admin actions logged yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <LogCard 
              key={log.id} 
              log={log} 
              formatAction={formatAction}
              getActionBadgeVariant={getActionBadgeVariant}
            />
          ))
        )}
      </div>
    </div>
  );
}
