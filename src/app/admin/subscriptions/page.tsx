'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  getAllUsersWithSubscriptionsAction,
  adminUpgradeUserToProAction,
  adminDowngradeUserToFreeAction,
  adminExtendProAction,
  getSubscriptionStatsAction,
  getRecentPaymentsAction,
  adminBulkUpgradeAction,
  adminAddUserWithProAction,
  adminBulkAddUsersAction,
  adminBulkDowngradeAction,
  adminRemoveUsersAction,
  type UserWithSubscription,
  type SubscriptionStats,
  type RecentPayment,
} from '@/app/actions/admin-subscription';

// Local CSV parsing helper (not a server action)
function parseCSVForUsers(csvContent: string): Array<{ email: string; displayName?: string; days?: number }> {
  const lines = csvContent.split(/[\n\r]+/).filter(line => line.trim());
  const users: Array<{ email: string; displayName?: string; days?: number }> = [];
  
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    const email = parts[0];
    
    if (email && email.includes('@')) {
      users.push({
        email: email.toLowerCase(),
        displayName: parts[1] || undefined,
        days: parts[2] ? parseInt(parts[2]) : undefined,
      });
    }
  }
  
  return users;
}

import { 
  Crown, 
  User, 
  Search, 
  RefreshCw, 
  Calendar,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  IndianRupee,
  Percent,
  AlertTriangle,
  CheckCircle,
  Loader2,
  UserPlus,
  Upload,
  Trash2,
  Download,
  MoreVertical,
  UserX,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Skeleton Loading Component
function SubscriptionsSkeleton() {
  return (
    <div className="flex-1 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Mobile User Card Component
interface UserCardProps {
  user: UserWithSubscription;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpgrade: () => void;
  onExtend: () => void;
  onDowngrade: () => void;
}

function UserCard({ user, isSelected, onToggleSelect, onUpgrade, onExtend, onDowngrade }: UserCardProps) {
  return (
    <Card className={isSelected ? 'ring-2 ring-primary' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{user.displayName}</p>
                {user.tier === 'pro' ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              
              {user.tier === 'pro' && user.proExpiresAt && (
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Expires: {format(new Date(user.proExpiresAt), 'MMM d, yyyy')}</span>
                  {user.daysRemaining <= 7 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {user.daysRemaining}d
                    </Badge>
                  )}
                </div>
              )}
              
              {user.totalPayments > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {user.totalPayments} payment(s)
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.tier === 'free' ? (
                <DropdownMenuItem onClick={onUpgrade}>
                  <ArrowUpCircle className="h-4 w-4 mr-2 text-primary" />
                  Upgrade to Pro
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={onExtend}>
                    <Clock className="h-4 w-4 mr-2" />
                    Extend Access
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDowngrade} className="text-destructive">
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    Downgrade
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all');
  
  // Selection for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [actionType, setActionType] = useState<'upgrade' | 'downgrade' | 'extend' | null>(null);
  const [extensionDays, setExtensionDays] = useState(30);
  const [upgradeDays, setUpgradeDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Bulk action dialogs
  const [showBulkUpgradeDialog, setShowBulkUpgradeDialog] = useState(false);
  const [showBulkDowngradeDialog, setShowBulkDowngradeDialog] = useState(false);
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
  const [bulkDays, setBulkDays] = useState(30);
  
  // Add user dialogs
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserDays, setNewUserDays] = useState(30);
  const [csvContent, setCsvContent] = useState('');
  const [csvDays, setCsvDays] = useState(30);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const [usersResult, statsResult, paymentsResult] = await Promise.all([
        getAllUsersWithSubscriptionsAction(user.email),
        getSubscriptionStatsAction(user.email),
        getRecentPaymentsAction(user.email, 5),
      ]);
      
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      } else if (!usersResult.success) {
        toast.error(usersResult.message || 'Failed to fetch users');
      }
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
      
      if (paymentsResult.success && paymentsResult.data) {
        setRecentPayments(paymentsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Single user actions
  async function handleAction() {
    if (!user?.email || !selectedUser) return;
    
    setActionLoading(true);
    try {
      let result;
      
      switch (actionType) {
        case 'upgrade':
          result = await adminUpgradeUserToProAction(
            user.email,
            selectedUser.uid,
            upgradeDays,
            'Admin upgrade'
          );
          break;
        case 'downgrade':
          result = await adminDowngradeUserToFreeAction(
            user.email,
            selectedUser.uid,
            'Admin downgrade'
          );
          break;
        case 'extend':
          result = await adminExtendProAction(
            user.email,
            selectedUser.uid,
            extensionDays,
            'Admin extension'
          );
          break;
      }
      
      if (result?.success) {
        toast.success(result.message);
        setActionType(null);
        setSelectedUser(null);
        await fetchData();
      } else {
        toast.error(result?.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  }

  // Add single user
  async function handleAddUser() {
    if (!user?.email || !newUserEmail) return;
    
    setActionLoading(true);
    try {
      const result = await adminAddUserWithProAction(
        user.email,
        newUserEmail,
        newUserName,
        newUserDays,
        'Admin manual add'
      );
      
      if (result.success) {
        toast.success(result.message);
        setShowAddUserDialog(false);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserDays(30);
        await fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Failed to add user');
    } finally {
      setActionLoading(false);
    }
  }

  // Bulk import from CSV
  async function handleBulkImport() {
    if (!user?.email || !csvContent.trim()) return;
    
    setActionLoading(true);
    try {
      const parsedUsers = parseCSVForUsers(csvContent);
      
      if (parsedUsers.length === 0) {
        toast.error('No valid emails found in CSV');
        return;
      }

      const result = await adminBulkAddUsersAction(
        user.email,
        parsedUsers.map(u => ({ email: u.email, displayName: u.displayName })),
        csvDays,
        'Bulk CSV import'
      );
      
      if (result.success) {
        toast.success(result.message);
        setShowBulkImportDialog(false);
        setCsvContent('');
        setCsvDays(30);
        await fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error('Bulk import failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Bulk upgrade
  async function handleBulkUpgrade() {
    if (!user?.email || selectedUserIds.length === 0) return;
    
    setActionLoading(true);
    try {
      const result = await adminBulkUpgradeAction(
        user.email,
        selectedUserIds,
        bulkDays,
        'Bulk admin upgrade'
      );
      
      if (result.success) {
        toast.success(result.message);
        setSelectedUserIds([]);
        setShowBulkUpgradeDialog(false);
        await fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk upgrade error:', error);
      toast.error('Bulk upgrade failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Bulk downgrade
  async function handleBulkDowngrade() {
    if (!user?.email || selectedUserIds.length === 0) return;
    
    setActionLoading(true);
    try {
      const result = await adminBulkDowngradeAction(
        user.email,
        selectedUserIds,
        'Bulk admin downgrade'
      );
      
      if (result.success) {
        toast.success(result.message);
        setSelectedUserIds([]);
        setShowBulkDowngradeDialog(false);
        await fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk downgrade error:', error);
      toast.error('Bulk downgrade failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Bulk remove
  async function handleBulkRemove() {
    if (!user?.email || selectedUserIds.length === 0) return;
    
    setActionLoading(true);
    try {
      const result = await adminRemoveUsersAction(
        user.email,
        selectedUserIds,
        'Bulk admin removal'
      );
      
      if (result.success) {
        toast.success(result.message);
        setSelectedUserIds([]);
        setShowBulkRemoveDialog(false);
        await fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk remove error:', error);
      toast.error('Bulk remove failed');
    } finally {
      setActionLoading(false);
    }
  }

  // File upload handler
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

  // Export selected users to CSV
  function exportSelectedToCSV() {
    const selectedData = users.filter(u => selectedUserIds.includes(u.uid));
    const csvData = selectedData.map(u => `${u.email},${u.displayName},${u.tier},${u.daysRemaining}`).join('\n');
    const header = 'email,name,tier,days_remaining\n';
    const blob = new Blob([header + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleUserSelection(uid: string) {
    setSelectedUserIds(prev => 
      prev.includes(uid) 
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  }

  function toggleSelectAll() {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.uid));
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || u.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  if (loading) {
    return <SubscriptionsSkeleton />;
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            Subscription Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage user subscriptions and Pro access</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddUserDialog(true)} variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add User</span>
          </Button>
          <Button onClick={() => setShowBulkImportDialog(true)} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.proUsers}</p>
                  <p className="text-xs text-muted-foreground">Pro Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.freeUsers}</p>
                  <p className="text-xs text-muted-foreground">Free Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPayments.map((payment, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{payment.userEmail || payment.userId.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.createdAt ? format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">₹{(payment.amount / 100).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">{payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage subscription status for each user</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as typeof tierFilter)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="pro">Pro Only</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Bulk Actions Bar */}
          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium">{selectedUserIds.length} users selected</span>
              <div className="flex-1" />
              <Button 
                size="sm" 
                onClick={() => setShowBulkUpgradeDialog(true)}
              >
                <ArrowUpCircle className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Upgrade to Pro</span>
                <span className="sm:hidden">Upgrade</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowBulkDowngradeDialog(true)}
              >
                <ArrowDownCircle className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Downgrade</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={exportSelectedToCSV}
              >
                <Download className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setShowBulkRemoveDialog(true)}
              >
                <Trash2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Remove</span>
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedUserIds([])}
              >
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <UserCard
                  key={u.uid}
                  user={u}
                  isSelected={selectedUserIds.includes(u.uid)}
                  onToggleSelect={() => toggleUserSelection(u.uid)}
                  onUpgrade={() => {
                    setSelectedUser(u);
                    setUpgradeDays(30);
                    setActionType('upgrade');
                  }}
                  onExtend={() => {
                    setSelectedUser(u);
                    setExtensionDays(30);
                    setActionType('extend');
                  }}
                  onDowngrade={() => {
                    setSelectedUser(u);
                    setActionType('downgrade');
                  }}
                />
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Pro Expires</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.uid}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(u.uid)}
                          onCheckedChange={() => toggleUserSelection(u.uid)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.displayName}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.tier === 'pro' ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Crown className="h-3 w-3 mr-1" />
                            Pro
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.tier === 'pro' && u.proExpiresAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(u.proExpiresAt), 'MMM d, yyyy')}
                            {u.daysRemaining <= 7 && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                {u.daysRemaining}d left
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.totalPayments > 0 ? (
                          <span className="text-sm">{u.totalPayments} payment(s)</span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {u.tier === 'free' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setSelectedUser(u);
                                setUpgradeDays(30);
                                setActionType('upgrade');
                              }}
                            >
                              <ArrowUpCircle className="h-3 w-3 mr-1" />
                              Upgrade
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setExtensionDays(30);
                                  setActionType('extend');
                                }}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Extend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('downgrade');
                                }}
                              >
                                <ArrowDownCircle className="h-3 w-3 mr-1" />
                                Downgrade
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Single User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User with Pro Access</DialogTitle>
            <DialogDescription>
              Manually add a user and grant them Pro access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name (optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="days">Pro Access Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={365}
                  value={newUserDays}
                  onChange={(e) => setNewUserDays(parseInt(e.target.value) || 30)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={actionLoading || !newUserEmail}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import CSV Dialog */}
      <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Users from CSV</DialogTitle>
            <DialogDescription>
              Import multiple users at once. Each user will receive Pro access.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CSV Format</Label>
              <p className="text-xs text-muted-foreground">
                Each line: <code className="bg-muted px-1 py-0.5 rounded">email</code> or <code className="bg-muted px-1 py-0.5 rounded">email,name</code>
              </p>
            </div>
            
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV File
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="csv">Or paste email list</Label>
              <Textarea
                id="csv"
                placeholder="user1@example.com,John Doe&#10;user2@example.com&#10;user3@example.com,Jane Smith"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="csvDays">Pro Access Duration for All</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csvDays"
                  type="number"
                  min={1}
                  max={365}
                  value={csvDays}
                  onChange={(e) => setCsvDays(parseInt(e.target.value) || 30)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            
            {csvContent && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Found {parseCSVForUsers(csvContent).length} valid emails
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} disabled={actionLoading || !csvContent.trim()}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Action Dialog */}
      <Dialog open={!!actionType && !!selectedUser} onOpenChange={() => { setActionType(null); setSelectedUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'upgrade' && 'Upgrade to Pro'}
              {actionType === 'downgrade' && 'Downgrade to Free'}
              {actionType === 'extend' && 'Extend Pro Access'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  User: <strong>{selectedUser.displayName}</strong> ({selectedUser.email})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {actionType === 'upgrade' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Set the number of days for Pro access.
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={upgradeDays}
                    onChange={(e) => setUpgradeDays(parseInt(e.target.value) || 30)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
            {actionType === 'downgrade' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ This will immediately remove Pro access. The user will be downgraded to Free tier.
                </p>
              </div>
            )}
            {actionType === 'extend' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add more days to the user&apos;s Pro subscription.
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(parseInt(e.target.value) || 30)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setSelectedUser(null); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={actionLoading}
              variant={actionType === 'downgrade' ? 'destructive' : 'default'}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'upgrade' && `Upgrade for ${upgradeDays} Days`}
              {actionType === 'downgrade' && 'Downgrade to Free'}
              {actionType === 'extend' && `Extend by ${extensionDays} Days`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upgrade Dialog */}
      <Dialog open={showBulkUpgradeDialog} onOpenChange={setShowBulkUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Upgrade {selectedUserIds.length} selected users to Pro tier
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm">Duration:</span>
              <Input
                type="number"
                min={1}
                max={365}
                value={bulkDays}
                onChange={(e) => setBulkDays(parseInt(e.target.value) || 30)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-sm text-muted-foreground">
              All selected users will receive Pro access for {bulkDays} days.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpgrade} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upgrade {selectedUserIds.length} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Downgrade Dialog */}
      <AlertDialog open={showBulkDowngradeDialog} onOpenChange={setShowBulkDowngradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Downgrade to Free</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to downgrade {selectedUserIds.length} users to Free tier? 
              This will immediately remove their Pro access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDowngrade}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Downgrade All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Remove Dialog */}
      <AlertDialog open={showBulkRemoveDialog} onOpenChange={setShowBulkRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUserIds.length} users? 
              This will delete their subscription records. Users added manually will also have their profiles removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
