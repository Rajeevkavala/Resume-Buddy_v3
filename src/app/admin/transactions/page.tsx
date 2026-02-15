'use client';

/**
 * Admin Transactions Page
 * 
 * Displays real Razorpay payment data with charts and detailed transaction table.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getRazorpayTransactionsAction,
  fetchRazorpayPaymentById,
  checkRazorpayConfigAction,
  type RazorpayDashboardData,
  type RazorpayPaymentItem,
} from '@/app/actions/razorpay-admin';
import {
  IndianRupee,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Eye,
  Download,
  Wallet,
  Smartphone,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  MoreVertical,
  Receipt,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  captured: '#10b981',
  authorized: '#f59e0b',
  created: '#3b82f6',
  failed: '#ef4444',
  refunded: '#8b5cf6',
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  upi: <Smartphone className="h-4 w-4" />,
  netbanking: <Building2 className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
};

// Skeleton Loading Component
function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
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
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <Skeleton className="h-6 w-36 mb-2" />
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

// Mobile Transaction Card Component
interface TransactionCardProps {
  payment: RazorpayPaymentItem;
  onViewDetails: () => void;
}

function TransactionCard({ payment, onViewDetails }: TransactionCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{(payment.amount / 100).toFixed(0)}
              </span>
              <Badge
                variant="secondary"
                className={
                  payment.status === 'captured'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : payment.status === 'failed'
                    ? 'bg-destructive/20 text-destructive'
                    : payment.status === 'refunded'
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }
              >
                {payment.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{payment.email}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {METHOD_ICONS[payment.method] || <CreditCard className="h-3 w-3" />}
                <span className="capitalize">{payment.method}</span>
              </div>
              <span>•</span>
              <span>{format(new Date(payment.createdAt * 1000), 'MMM d, HH:mm')}</span>
            </div>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {payment.id.slice(-12)}
            </code>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<RazorpayDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<RazorpayPaymentItem | null>(null);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Check if Razorpay is configured
      const configResult = await checkRazorpayConfigAction(user.email);
      if (!configResult.configured) {
        setConfigured(false);
        setLoading(false);
        return;
      }

      // Fetch transactions
      const result = await getRazorpayTransactionsAction(user.email);
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleViewDetails = async (paymentId: string) => {
    if (!user?.email) return;
    setPaymentDetailsLoading(true);
    
    const result = await fetchRazorpayPaymentById(user.email, paymentId);
    if (result.success && result.data) {
      setSelectedPayment(result.data);
    }
    setPaymentDetailsLoading(false);
  };

  const exportToCSV = () => {
    if (!data?.allPayments) return;

    const headers = ['Payment ID', 'Order ID', 'Email', 'Amount', 'Status', 'Method', 'Date'];
    const rows = data.allPayments.map(p => [
      p.id,
      p.orderId,
      p.email,
      (p.amount / 100).toFixed(2),
      p.status,
      p.method,
      format(new Date(p.createdAt * 1000), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `razorpay-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter payments
  const filteredPayments = data?.allPayments.filter(payment => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  }) || [];

  if (loading) {
    return <TransactionsSkeleton />;
  }

  if (!configured) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Razorpay Not Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Razorpay API credentials are not configured. Please add the following environment variables:
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><code className="bg-muted px-2 py-1 rounded">RAZORPAY_KEY_ID</code></li>
              <li><code className="bg-muted px-2 py-1 rounded">RAZORPAY_KEY_SECRET</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            Razorpay Transactions
          </h1>
          <p className="text-muted-foreground mt-1">Real-time payment data from Razorpay API</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">₹{data.stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{data.stats.totalPayments}</p>
                  <p className="text-xs text-muted-foreground">Total Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{data.stats.capturedPayments}</p>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{data.stats.failedPayments}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">₹{Math.round(data.stats.averageOrderValue)}</p>
                  <p className="text-xs text-muted-foreground">Avg. Order</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{data.stats.successRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      {data?.stats && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Daily revenue over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="h-[280px] min-w-[300px]">
                {data.stats.revenueByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.stats.revenueByDay}>
                      <defs>
                        <linearGradient id="colorRevenueRz" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis
                        dataKey="date"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        itemStyle={{
                          color: 'hsl(var(--foreground))',
                        }}
                        labelStyle={{
                          color: 'hsl(var(--foreground))',
                        }}
                        formatter={(value: number) => [`₹${value}`, 'Revenue']}
                        labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenueRz)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Payment Methods
              </CardTitle>
              <CardDescription>Breakdown by payment type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {data.stats.paymentMethodBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={data.stats.paymentMethodBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="method"
                      >
                        {data.stats.paymentMethodBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 5]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        itemStyle={{
                          color: 'hsl(var(--foreground))',
                        }}
                        labelStyle={{
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {data.stats.paymentMethodBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 5],
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{item.method} ({item.count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {data?.stats && data.stats.statusBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.stats.statusBreakdown.map((status, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {status.status.toLowerCase() === 'captured' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : status.status.toLowerCase() === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-sm font-medium">{status.status}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{status.count}</span>
                  </div>
                  <Progress
                    value={status.percentage}
                    className="h-2"
                    style={{
                      ['--progress-background' as string]: STATUS_COLORS[status.status.toLowerCase()] || '#94a3b8',
                    }}
                  />
                  <p className="text-xs text-muted-foreground text-right">{status.percentage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete list of Razorpay payments</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, email..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="authorized">Authorized</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="netbanking">Netbanking</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <TransactionCard
                  key={payment.id}
                  payment={payment}
                  onViewDetails={() => handleViewDetails(payment.id)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {data?.allPayments.length === 0
                    ? 'No transactions found'
                    : 'No matching transactions'}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {payment.id.slice(-12)}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{payment.email}</TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ₹{(payment.amount / 100).toFixed(0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {METHOD_ICONS[payment.method] || <CreditCard className="h-4 w-4" />}
                          <span className="capitalize text-sm">{payment.method}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            payment.status === 'captured'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : payment.status === 'failed'
                              ? 'bg-destructive/20 text-destructive'
                              : payment.status === 'refunded'
                              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(payment.createdAt * 1000), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(payment.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {data?.allPayments.length === 0
                        ? 'No transactions found'
                        : 'No matching transactions'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Complete transaction information</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Payment ID</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded block mt-1">
                    {selectedPayment.id}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded block mt-1">
                    {selectedPayment.orderId || 'N/A'}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ₹{(selectedPayment.amount / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={
                      selectedPayment.status === 'captured'
                        ? 'bg-green-500 text-white'
                        : selectedPayment.status === 'failed'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white'
                    }
                  >
                    {selectedPayment.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedPayment.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="text-sm">{selectedPayment.contact || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Method</p>
                  <p className="text-sm capitalize">{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">
                    {format(new Date(selectedPayment.createdAt * 1000), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>

              {selectedPayment.card && (
                <div>
                  <p className="text-xs text-muted-foreground">Card Details</p>
                  <p className="text-sm">
                    {selectedPayment.card.network} •••• {selectedPayment.card.last4} ({selectedPayment.card.type})
                  </p>
                </div>
              )}

              {selectedPayment.vpa && (
                <div>
                  <p className="text-xs text-muted-foreground">UPI ID</p>
                  <p className="text-sm">{selectedPayment.vpa}</p>
                </div>
              )}

              {selectedPayment.bank && (
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="text-sm">{selectedPayment.bank}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Fee</p>
                  <p className="text-sm">₹{(selectedPayment.fee / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tax</p>
                  <p className="text-sm">₹{(selectedPayment.tax / 100).toFixed(2)}</p>
                </div>
              </div>

              {selectedPayment.errorCode && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {selectedPayment.errorCode}: {selectedPayment.errorDescription}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
