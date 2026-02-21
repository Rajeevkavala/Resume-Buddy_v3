'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminDashboardOverviewAction } from '@/app/actions/admin';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  Zap,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  Sparkles,
  IndianRupee,
  Crown,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DashboardStats {
  users: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    adminUsers: number;
  };
  usage: {
    totalCalls: number;
    activeUsers: number;
  };
  weeklyUsage: Array<{ day: string; requests: number; users: number }>;
  subscriptionStats?: {
    totalUsers: number;
    proUsers: number;
    freeUsers: number;
    expiringSoon: number;
    totalRevenue: number;
    conversionRate: string;
  };
}

const DASHBOARD_CACHE_KEY = 'admin_dashboard_stats_v2';
const DASHBOARD_CACHE_TTL_MS = 30_000;

const chartConfig = {
  requests: {
    label: 'API Requests',
    color: 'hsl(var(--primary))',
  },
  users: {
    label: 'Active Users',
    color: 'hsl(217 72% 70%)',
  },
};

// Use primary blue tones instead of random colors
const COLORS = ['hsl(217 63% 49%)', 'hsl(217 72% 70%)'];

// Skeleton component for the dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-5 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-5 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full rounded-full mx-auto" style={{ maxWidth: '200px' }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('7');

  async function fetchStats(days: number = 7, force: boolean = false) {
    if (!user?.email) return;

    const cacheKey = `${DASHBOARD_CACHE_KEY}:${user.email}:${days}`;

    if (!force && typeof window !== 'undefined') {
      try {
        const rawCache = sessionStorage.getItem(cacheKey);
        if (rawCache) {
          const parsed = JSON.parse(rawCache) as { timestamp: number; data: DashboardStats };
          if (Date.now() - parsed.timestamp < DASHBOARD_CACHE_TTL_MS) {
            setStats(parsed.data);
            setLoading(false);
            setRefreshing(false);
            return;
          }

          setStats(parsed.data);
          setLoading(false);
        }
      } catch {
        // ignore cache parse issues
      }
    }

    try {
      const result = await getAdminDashboardOverviewAction(user.email, days);

      if (result.success && result.data) {
        setStats(result.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: result.data }));
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats(parseInt(timeRange), false);
  }, [user?.email, timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats(parseInt(timeRange), true);
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    setRefreshing(true);
  };

  // Prepare pie chart data from subscription stats (Pro vs Free)
  const userDistribution = stats?.subscriptionStats ? [
    { name: 'Pro Users', value: stats.subscriptionStats.proUsers, color: 'hsl(217 63% 49%)' },
    { name: 'Free Users', value: stats.subscriptionStats.freeUsers, color: 'hsl(217 72% 70%)' },
  ].filter(item => item.value > 0) : [];

  // Use real weekly usage data
  const weeklyUsageData = stats?.weeklyUsage && stats.weeklyUsage.length > 0 
    ? stats.weeklyUsage 
    : [
        { day: 'No data', requests: 0, users: 0 }
      ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your ResumeBuddy application
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards - User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.users.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.users.activeUsers || 0}</div>
            <Progress 
              value={stats?.users.totalUsers ? (stats.users.activeUsers / stats.users.totalUsers) * 100 : 0} 
              className="mt-2 h-1.5 bg-muted"
            />
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
            <div className="p-2 rounded-lg bg-destructive/10">
              <UserX className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.users.blockedUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Access revoked</p>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.users.adminUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Admin access</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Stats Row */}
      {stats?.subscriptionStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">₹{stats.subscriptionStats.totalRevenue.toLocaleString()}</div>
              <Link href="/admin/transactions">
                <p className="text-xs text-primary hover:underline mt-1">View transactions →</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Crown className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.subscriptionStats.proUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.subscriptionStats.conversionRate}% conversion</p>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.subscriptionStats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground mt-1">Within 7 days</p>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Free Users</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.subscriptionStats.freeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Potential upgrades</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Usage Chart */}
        <Card className="lg:col-span-2 border bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Activity Overview
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  API requests and active users over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 63% 49%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217 63% 49%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 72% 70%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217 72% 70%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    className="fill-muted-foreground"
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="fill-muted-foreground"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="hsl(217 63% 49%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRequests)" 
                    name="Requests"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(217 72% 70%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                    name="Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution Pie Chart */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <PieChart className="h-5 w-5 text-primary" />
              Subscription Tiers
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Pro vs Free users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))'
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {userDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* API Usage Stats */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              API Usage
            </CardTitle>
            <CardDescription className="text-muted-foreground">Overall API request statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.usage.totalCalls || 0}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                All time
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Clock className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.usage.activeUsers || 0}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Today
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Usage Breakdown */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Usage Summary
            </CardTitle>
            <CardDescription className="text-muted-foreground">Overview of API usage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-semibold text-foreground">{stats?.usage.totalCalls || 0} total calls</p>
              <p className="text-sm text-muted-foreground">{stats?.usage.activeUsers || 0} active users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription className="text-muted-foreground">Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/users">
              <div className="group p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all duration-200 cursor-pointer">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 font-medium text-foreground">Manage Users</p>
                <p className="text-xs text-muted-foreground mt-1">View & manage accounts</p>
              </div>
            </Link>
            <Link href="/admin/subscriptions">
              <div className="group p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all duration-200 cursor-pointer">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 font-medium text-foreground">Subscriptions</p>
                <p className="text-xs text-muted-foreground mt-1">Pro access & tiers</p>
              </div>
            </Link>
            <Link href="/admin/api-usage">
              <div className="group p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all duration-200 cursor-pointer">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 font-medium text-foreground">API Usage</p>
                <p className="text-xs text-muted-foreground mt-1">Monitor requests</p>
              </div>
            </Link>
            <Link href="/admin/logs">
              <div className="group p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all duration-200 cursor-pointer">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 font-medium text-foreground">View Logs</p>
                <p className="text-xs text-muted-foreground mt-1">Activity history</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
