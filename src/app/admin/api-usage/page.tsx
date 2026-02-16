'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { getUsageStatsAction, getAllUsersAction, getHistoricalUsageAction, cleanupApiLogsAction, getApiLogCountAction } from '@/app/actions/admin';
import { RefreshCw, TrendingUp, Users, Activity, BarChart3, PieChart as PieChartIcon, Clock, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { UserData } from '@/types/admin';

import type { AggregatedStats, HistoricalDataPoint } from '@/lib/admin/api-usage-tracking';

type UsageStats = AggregatedStats;
type HistoricalData = HistoricalDataPoint[];

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  requests: {
    label: "Requests",
    color: "hsl(var(--chart-1))",
  },
  uniqueUsers: {
    label: "Unique Users",
    color: "hsl(var(--chart-2))",
  },
  daily: {
    label: "Daily",
    color: "hsl(var(--chart-1))",
  },
  monthly: {
    label: "Monthly",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "Total",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

// Skeleton Loading Component
function ApiUsageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApiUsagePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('7');
  const [logCount, setLogCount] = useState<number>(0);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [user?.email, timeRange]);

  async function fetchStats() {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const [statsResult, usersResult, historicalResult, logCountResult] = await Promise.all([
        getUsageStatsAction(user.email),
        getAllUsersAction(user.email),
        getHistoricalUsageAction(user.email, parseInt(timeRange)),
        getApiLogCountAction(user.email),
      ]);
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }
      if (historicalResult.success && historicalResult.data) {
        setHistoricalData(Array.isArray(historicalResult.data) ? historicalResult.data : []);
      }
      if (logCountResult.success) {
        setLogCount(logCountResult.count);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate aggregated stats from users
  const totalDailyUsage = users.reduce((sum, u) => sum + (u.apiUsage?.dailyCount || 0), 0);
  const totalMonthlyUsage = users.reduce((sum, u) => sum + (u.apiUsage?.monthlyCount || 0), 0);
  const usersWithUsage = users.filter(u => (u.apiUsage?.totalCount || 0) > 0);

  // Prepare data for pie chart from users with usage
  const pieData = usersWithUsage.slice(0, 5).map((u, i) => ({
    name: u.email.split('@')[0],
    value: u.apiUsage?.totalCount || 0,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Historical data is already HistoricalDataPoint[]
  const dailyUsageData = historicalData.map(d => ({
    date: d.date,
    calls: d.calls,
    uniqueUsers: d.uniqueUsers,
  }));

  // Handle cleanup of old logs
  async function handleCleanupLogs() {
    if (!user?.email) return;
    
    if (!confirm('This will delete all API usage logs older than 7 days. Continue?')) {
      return;
    }
    
    setCleaningUp(true);
    try {
      const result = await cleanupApiLogsAction(user.email, 7);
      if (result.success) {
        toast.success(result.message);
        // Refresh the log count
        const countResult = await getApiLogCountAction(user.email);
        if (countResult.success) {
          setLogCount(countResult.count);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error cleaning up logs:', error);
      toast.error('Failed to cleanup logs');
    } finally {
      setCleaningUp(false);
    }
  }

  if (loading) {
    return <ApiUsageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            API Usage Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze API usage patterns across all users
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stats?.totalCalls?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All time API calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalDailyUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requests today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalMonthlyUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Users active today</p>
          </CardContent>
        </Card>
      </div>

      {/* Log Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trash2 className="h-5 w-5 text-amber-500" />
            Log Management
          </CardTitle>
          <CardDescription>
            Manage API usage logs - logs older than 7 days are automatically eligible for cleanup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Current log entries: <span className="font-semibold text-foreground">{logCount.toLocaleString()}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Logs are auto-deleted after 7 days to keep the database lean
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleCleanupLogs}
              disabled={cleaningUp}
            >
              {cleaningUp ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cleanup Old Logs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
          <TabsTrigger value="users">By User</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        {/* Usage Trends Chart */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Daily Usage Trends
              </CardTitle>
              <CardDescription>
                API requests and unique users over the last {timeRange} days
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full min-w-[300px]">
                <AreaChart data={dailyUsageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueUsers"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hourly Distribution Chart — replaced with tokens chart */}
        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Token Usage Over Time
              </CardTitle>
              <CardDescription>
                Token consumption over the last {timeRange} days
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full min-w-[300px]">
                <BarChart data={dailyUsageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="calls" 
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Usage Distribution */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Bar chart for user usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top Users by Total Usage
                </CardTitle>
                <CardDescription>
                  Users with highest API consumption
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full min-w-[300px]">
                  <BarChart 
                    data={usersWithUsage.slice(0, 10).map(u => ({ email: u.email, total: u.apiUsage?.totalCount || 0 }))} 
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      dataKey="email" 
                      type="category" 
                      className="text-xs"
                      tickFormatter={(value) => value.split('@')[0].slice(0, 15)}
                      width={100}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pie chart for distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Usage Share
                </CardTitle>
                <CardDescription>
                  Top 5 users by total API requests
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full min-w-[300px]">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="hsl(var(--chart-1))"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Stacked bar chart for daily/monthly comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                User Usage Breakdown
              </CardTitle>
              <CardDescription>
                Daily vs Monthly usage by user
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full min-w-[300px]">
                <BarChart 
                  data={usersWithUsage.slice(0, 10).map(u => ({ email: u.email, daily: u.apiUsage?.dailyCount || 0, monthly: u.apiUsage?.monthlyCount || 0 }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="email" 
                    className="text-xs"
                    tickFormatter={(value: string) => value.split('@')[0].slice(0, 10)}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="daily" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="monthly" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="space-y-4">
          {/* Top Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Usage</CardTitle>
              <CardDescription>Users with highest API consumption</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-muted-foreground">Rank</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Total Requests</TableHead>
                    <TableHead className="text-muted-foreground">Daily</TableHead>
                    <TableHead className="text-muted-foreground">Monthly</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithUsage.slice(0, 20).map((topUser, index) => {
                    const dailyUsed = topUser.apiUsage?.dailyCount || 0;
                    const monthlyUsed = topUser.apiUsage?.monthlyCount || 0;
                    const dailyLimit = topUser.limits?.dailyLimit ?? 10;
                    const monthlyLimit = topUser.limits?.monthlyLimit ?? 300;
                    return (
                      <TableRow key={topUser.uid} className="border-border/50 hover:bg-muted/50">
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell className="text-foreground">{topUser.email}</TableCell>
                        <TableCell className="font-bold text-foreground">{(topUser.apiUsage?.totalCount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-foreground">{`${dailyUsed}/${dailyLimit}`}</TableCell>
                        <TableCell className="text-foreground">{`${monthlyUsed}/${monthlyLimit}`}</TableCell>
                      </TableRow>
                    );
                  })}
                  {usersWithUsage.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No usage data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* All Users Usage Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users Usage</CardTitle>
              <CardDescription>Usage statistics for all registered users</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Daily</TableHead>
                    <TableHead className="text-muted-foreground">Monthly</TableHead>
                    <TableHead className="text-muted-foreground">Total</TableHead>
                    <TableHead className="text-muted-foreground">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithUsage.map((userData) => {
                    const dailyUsed = userData.apiUsage?.dailyCount || 0;
                    const monthlyUsed = userData.apiUsage?.monthlyCount || 0;
                    const dailyLimit = userData.limits?.dailyLimit ?? 10;
                    const monthlyLimit = userData.limits?.monthlyLimit ?? 300;
                    const dailyUtilization = Math.round(
                      (dailyUsed / dailyLimit) * 100
                    );
                    
                    return (
                      <TableRow key={userData.uid} className="border-border/50 hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{userData.email}</TableCell>
                        <TableCell className="text-foreground">{`${dailyUsed}/${dailyLimit}`}</TableCell>
                        <TableCell className="text-foreground">{`${monthlyUsed}/${monthlyLimit}`}</TableCell>
                        <TableCell className="text-foreground">{userData.apiUsage?.totalCount || 0}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  dailyUtilization > 80 ? 'bg-red-500' : 
                                  dailyUtilization > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(dailyUtilization, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {dailyUtilization}% daily
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {usersWithUsage.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No users with API usage
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
