'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getAllUsersAction,
  resetUserUsageAction,
  deleteUserAction,
  bulkDeleteUsersAction,
} from '@/app/actions/admin';
import {
  adminUpgradeUserToProAction,
  adminBulkUpgradeAction,
} from '@/app/actions/admin-subscription';
import type { UserData, DeleteUserOptions } from '@/types/admin';
import { Search, RefreshCw, Trash2, AlertTriangle, Download, UserPlus, Upload, Users, MoreHorizontal, Crown, Calendar, Mail } from 'lucide-react';
import { toast } from 'sonner';

// Skeleton loading component
function UsersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Filters skeleton */}
      <Card className="border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="border bg-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mobile user card component
function UserCard({ 
  userData, 
  selected,
  onToggleSelect,
  onUpgrade,
  onResetUsage,
  onDelete,
  actionLoading
}: { 
  userData: UserData;
  selected: boolean;
  onToggleSelect: () => void;
  onUpgrade: () => void;
  onResetUsage: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}) {
  return (
    <Card className={`border ${selected ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={onToggleSelect}
            />
            <div>
              <p className="font-medium truncate max-w-[200px]">{userData.email}</p>
              <p className="text-sm text-muted-foreground">{userData.displayName || 'No name'}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onUpgrade}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onResetUsage}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Usage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
            {userData.role || 'user'}
          </Badge>
          <Badge 
            className={
              userData.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 
              userData.status === 'deleted' ? 'bg-muted text-muted-foreground' : 
              'bg-destructive/20 text-destructive'
            }
          >
            {userData.status || 'active'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Daily Usage</p>
            <p className="font-medium">{userData.apiUsage?.dailyCount || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Usage</p>
            <p className="font-medium">{userData.apiUsage?.totalCount || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Bulk CSV import state
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  
  // Delete functionality state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState<DeleteUserOptions>({
    deleteFromWhitelist: true,
    deleteUserData: true,
    deleteActivityLogs: false,
    deleteApiUsageLogs: false,
  });
  const [permanentDelete, setPermanentDelete] = useState(false);
  
  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, [user?.email]);

  async function fetchUsers() {
    if (!user?.email) return;
    
    try {
      const result = await getAllUsersAction(user.email);
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgradeToPro(userId: string, email: string) {
    if (!user?.email) return;
    
    setActionLoading(`upgrade-${email}`);
    try {
      const result = await adminUpgradeUserToProAction(user.email, userId, 30, 'Upgraded from users page');
      if (result.success) {
        toast.success(`Upgraded ${email} to Pro`);
        await fetchUsers();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error upgrading to Pro:', error);
      toast.error('Failed to upgrade to Pro');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkImport() {
    if (!user?.email || !csvContent.trim()) return;
    
    setActionLoading('bulk-import');
    try {
      // Parse CSV content - support email per line or comma-separated
      const emails = csvContent
        .split(/[,\n]/)  // Split by comma or newline
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@'));  // Basic email validation
      
      if (emails.length === 0) {
        toast.error('No valid emails found in input');
        return;
      }

      // Use subscription-based bulk upgrade for Pro access
      const userIds = emails.map(email => email.replace(/[^a-z0-9]/g, '_'));
      const result = await adminBulkUpgradeAction(user.email, userIds, 30, 'Bulk import from users page');
      
      if (result.success) {
        toast.success(result.message);
        setCsvContent('');
        setIsBulkImportDialogOpen(false);
        await fetchUsers();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error bulk importing:', error);
      toast.error('Failed to bulk import');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkUpgradeToPro() {
    if (!user?.email || selectedUsers.length === 0) return;
    
    setActionLoading('bulk-upgrade');
    try {
      const result = await adminBulkUpgradeAction(user.email, selectedUsers, 30, 'Bulk upgrade from users page');
      
      if (result.success) {
        toast.success(result.message);
        setSelectedUsers([]);
        await fetchUsers();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error bulk upgrading users:', error);
      toast.error('Failed to upgrade users to Pro');
    } finally {
      setActionLoading(null);
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  }

  async function handleResetUsage(uid: string, type: 'daily' | 'monthly') {
    if (!user?.email) return;
    
    setActionLoading(`${uid}-${type}`);
    try {
      const result = await resetUserUsageAction(uid, user.email, type);
      if (result.success) {
        await fetchUsers();
        toast.success(`Reset ${type} usage successfully`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error resetting usage:', error);
      toast.error('Failed to reset usage');
    } finally {
      setActionLoading(null);
    }
  }

  // Delete handlers
  function openDeleteDialog(userData: UserData) {
    setSelectedUser(userData);
    setPermanentDelete(false);
    setDeleteOptions({
      deleteFromWhitelist: true,
      deleteUserData: true,
      deleteActivityLogs: false,
      deleteApiUsageLogs: false,
    });
    setIsDeleteDialogOpen(true);
  }

  async function handleDeleteUser() {
    if (!user?.email || !selectedUser) return;
    
    setActionLoading('delete');
    try {
      const result = await deleteUserAction(
        selectedUser.uid,
        user.email,
        permanentDelete,
        permanentDelete ? deleteOptions : undefined
      );
      
      if (result.success) {
        setIsDeleteDialogOpen(false);
        await fetchUsers();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkDelete() {
    if (!user?.email || selectedUsers.length === 0) return;
    
    setActionLoading('bulk-delete');
    try {
      const result = await bulkDeleteUsersAction(
        selectedUsers,
        user.email,
        permanentDelete,
        permanentDelete ? deleteOptions : undefined
      );
      
      if (result.success) {
        setSelectedUsers([]);
        await fetchUsers();
        toast.success(`Deleted ${result.results.success.length} users. ${result.results.failed.length} failed.`);
      } else {
        toast.error('Bulk delete operation failed');
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('Failed to delete users');
    } finally {
      setActionLoading(null);
    }
  }

  // Selection handlers
  function toggleUserSelection(uid: string) {
    setSelectedUsers(prev => 
      prev.includes(uid) 
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  }

  function toggleSelectAll() {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.uid));
    }
  }

  // Export functionality
  function exportToCSV() {
    const headers = ['Email', 'Name', 'Role', 'Status', 'Daily Usage', 'Monthly Usage', 'Total Usage', 'Created'];
    const rows = filteredUsers.map(u => [
      u.email,
      u.displayName || '',
      u.role,
      u.status,
      u.apiUsage?.dailyCount || 0,
      u.apiUsage?.monthlyCount || 0,
      u.apiUsage?.totalCount || 0,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported to CSV');
  }



  const filteredUsers = users.filter(u => {
    // Search filter
    const matchesSearch = 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    
    // Role filter
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  if (loading) {
    return <UsersSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and access
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBulkImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upgrade
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border bg-card shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <Card className="border bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-sm font-medium text-primary">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Bulk Delete Users
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to delete {selectedUsers.length} user(s). This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="bulk-permanent" 
                          checked={permanentDelete}
                          onCheckedChange={(checked) => setPermanentDelete(checked as boolean)}
                        />
                        <Label htmlFor="bulk-permanent" className="text-sm font-medium">
                          Permanently delete (cannot be recovered)
                        </Label>
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete}
                        disabled={actionLoading === 'bulk-delete'}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {actionLoading === 'bulk-delete' ? 'Deleting...' : 'Delete All'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleBulkUpgradeToPro}
                  disabled={actionLoading === 'bulk-upgrade'}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {actionLoading === 'bulk-upgrade' ? 'Upgrading...' : 'Upgrade to Pro'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table - Desktop */}
      <Card className="border bg-card hidden md:block">
        <CardHeader>
          <CardTitle className="text-foreground">Registered Users ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-muted-foreground">
            All users who have signed up for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="w-[50px] text-muted-foreground">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">API Usage</TableHead>
                <TableHead className="text-muted-foreground">Last Login</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userData) => (
                <TableRow key={userData.uid} className={`border-border/50 hover:bg-muted/50 ${selectedUsers.includes(userData.uid) ? 'bg-primary/5' : ''}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(userData.uid)}
                      onCheckedChange={() => toggleUserSelection(userData.uid)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{userData.email}</TableCell>
                  <TableCell className="text-foreground/80">{userData.displayName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                      {userData.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        userData.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 
                        userData.status === 'deleted' ? 'bg-muted text-muted-foreground' : 
                        'bg-destructive/20 text-destructive'
                      }
                    >
                      {userData.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-foreground">Daily: {userData.apiUsage?.dailyCount || 0}</div>
                      <div className="text-muted-foreground">Total: {userData.apiUsage?.totalCount || 0}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {userData.lastLogin 
                      ? new Date(userData.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpgradeToPro(userData.uid, userData.email)}
                        disabled={actionLoading === `upgrade-${userData.email}`}
                        title="Upgrade to Pro"
                      >
                        <Crown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetUsage(userData.uid, 'daily')}
                        disabled={actionLoading === `${userData.uid}-daily`}
                        title="Reset Daily Usage"
                      >
                        Reset
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(userData)}
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No users match your search' : 'No users found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Users ({filteredUsers.length})</h3>
          <Checkbox
            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
            onCheckedChange={toggleSelectAll}
          />
        </div>
        {filteredUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No users found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchQuery ? 'No users match your search criteria.' : 'No users have signed up yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((userData) => (
            <UserCard
              key={userData.uid}
              userData={userData}
              selected={selectedUsers.includes(userData.uid)}
              onToggleSelect={() => toggleUserSelection(userData.uid)}
              onUpgrade={() => handleUpgradeToPro(userData.uid, userData.email)}
              onResetUsage={() => handleResetUsage(userData.uid, 'daily')}
              onDelete={() => openDeleteDialog(userData)}
              actionLoading={actionLoading}
            />
          ))
        )}
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Upgrade multiple users to Pro tier using CSV or paste emails directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CSV File</label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                CSV should contain emails (one per line or comma-separated)
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or paste emails</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email List</label>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-md bg-background text-sm font-mono resize-y"
                placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com&#10;&#10;Or comma-separated: email1@example.com, email2@example.com"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
            </div>
            {csvContent && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                📧 {csvContent.split(/[,\n]/).filter(e => e.trim() && e.includes('@')).length} valid emails detected
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBulkImportDialogOpen(false);
              setCsvContent('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkImport} 
              disabled={actionLoading === 'bulk-import' || !csvContent.trim()}
            >
              {actionLoading === 'bulk-import' ? 'Upgrading...' : 'Upgrade to Pro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Delete user: <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="permanent-delete" 
                checked={permanentDelete}
                onCheckedChange={(checked) => setPermanentDelete(checked as boolean)}
              />
              <Label htmlFor="permanent-delete" className="text-sm font-medium">
                Permanently delete (cannot be recovered)
              </Label>
            </div>
            
            {permanentDelete && (
              <div className="space-y-3 pl-6 border-l-2 border-destructive/20">
                <p className="text-sm text-muted-foreground">
                  Select what data to delete:
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="delete-subscription" 
                    checked={deleteOptions.deleteFromWhitelist}
                    onCheckedChange={(checked) => 
                      setDeleteOptions(prev => ({ ...prev, deleteFromWhitelist: checked as boolean }))
                    }
                  />
                  <Label htmlFor="delete-subscription" className="text-sm">
                    Delete subscription data
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="delete-user-data" 
                    checked={deleteOptions.deleteUserData}
                    onCheckedChange={(checked) => 
                      setDeleteOptions(prev => ({ ...prev, deleteUserData: checked as boolean }))
                    }
                  />
                  <Label htmlFor="delete-user-data" className="text-sm">
                    Delete user profile data
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="delete-activity" 
                    checked={deleteOptions.deleteActivityLogs}
                    onCheckedChange={(checked) => 
                      setDeleteOptions(prev => ({ ...prev, deleteActivityLogs: checked as boolean }))
                    }
                  />
                  <Label htmlFor="delete-activity" className="text-sm">
                    Delete activity logs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="delete-api-logs" 
                    checked={deleteOptions.deleteApiUsageLogs}
                    onCheckedChange={(checked) => 
                      setDeleteOptions(prev => ({ ...prev, deleteApiUsageLogs: checked as boolean }))
                    }
                  />
                  <Label htmlFor="delete-api-logs" className="text-sm">
                    Delete API usage logs
                  </Label>
                </div>
              </div>
            )}
            
            {!permanentDelete && (
              <p className="text-sm text-muted-foreground">
                Soft delete will mark the user as deleted but preserve their data. 
                You can restore them later or permanently delete.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser} 
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? 'Deleting...' : permanentDelete ? 'Permanently Delete' : 'Soft Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
