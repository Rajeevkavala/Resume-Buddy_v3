'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getSubscriptionSettingsAction,
  updateSubscriptionSettingsAction,
  toggleTestModeAction,
  type SubscriptionSettings,
} from '@/app/actions/admin-settings';
import {
  Settings,
  IndianRupee,
  Calendar,
  FlaskConical,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// Skeleton for loading state
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Active price skeleton */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  
  // Form state
  const [priceINR, setPriceINR] = useState(99);
  const [testPriceINR, setTestPriceINR] = useState(5);
  const [durationDays, setDurationDays] = useState(30);
  const [isTestMode, setIsTestMode] = useState(true);

  async function fetchSettings() {
    try {
      const result = await getSubscriptionSettingsAction();
      if (result.success && result.data) {
        setSettings(result.data);
        setPriceINR(result.data.priceINR);
        setTestPriceINR(result.data.testPriceINR);
        setDurationDays(result.data.durationDays);
        setIsTestMode(result.data.isTestMode);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSave() {
    if (!user?.email) return;
    
    setSaving(true);
    try {
      const result = await updateSubscriptionSettingsAction(user.email, {
        priceINR,
        pricePaise: priceINR * 100,
        testPriceINR,
        testPricePaise: testPriceINR * 100,
        durationDays,
        isTestMode,
      });
      
      if (result.success) {
        toast.success(result.message);
        await fetchSettings();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTestMode() {
    if (!user?.email) return;
    
    try {
      const result = await toggleTestModeAction(user.email);
      if (result.success) {
        setIsTestMode(result.isTestMode ?? !isTestMode);
        toast.success(result.message);
        await fetchSettings();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error toggling test mode:', error);
      toast.error('Failed to toggle test mode');
    }
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  const activePrice = isTestMode ? testPriceINR : priceINR;
  const hasUnsavedChanges = settings && (
    priceINR !== settings.priceINR ||
    testPriceINR !== settings.testPriceINR ||
    durationDays !== settings.durationDays ||
    isTestMode !== settings.isTestMode
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure subscription pricing and app settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasUnsavedChanges}
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes
          </span>
        </div>
      )}

      {/* Current Active Price Display */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Active Price</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-4xl font-bold">₹{activePrice}</span>
                <Badge variant={isTestMode ? 'secondary' : 'default'} className="ml-2">
                  {isTestMode ? (
                    <>
                      <FlaskConical className="h-3 w-3 mr-1" />
                      Test Mode
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Production
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                for {durationDays} days of Pro access
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated</p>
              <p className="text-sm">
                {settings?.updatedAt 
                  ? new Date(settings.updatedAt).toLocaleString()
                  : 'Never'
                }
              </p>
              {settings?.updatedBy && (
                <p className="text-xs text-muted-foreground">{settings.updatedBy}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Production Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-500" />
              Production Pricing
            </CardTitle>
            <CardDescription>
              Set the live subscription price for real payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  min={1}
                  max={9999}
                  value={priceINR}
                  onChange={(e) => setPriceINR(parseInt(e.target.value) || 99)}
                  className="pl-10 w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                = {(priceINR * 100).toLocaleString()} paise for Razorpay
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-amber-500" />
              Test Pricing
            </CardTitle>
            <CardDescription>
              Low price for testing payments without real charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPrice">Test Price (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="testPrice"
                  type="number"
                  min={1}
                  max={100}
                  value={testPriceINR}
                  onChange={(e) => setTestPriceINR(parseInt(e.target.value) || 5)}
                  className="pl-10 w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                = {(testPriceINR * 100).toLocaleString()} paise for Razorpay
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duration & Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Subscription Duration & Mode
          </CardTitle>
          <CardDescription>
            Configure how long Pro access lasts and toggle test mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Pro Duration (days)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="testMode" className="text-base font-medium">Test Mode</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, uses test price (₹{testPriceINR}) instead of production price (₹{priceINR})
                </p>
              </div>
              <Switch
                id="testMode"
                checked={isTestMode}
                onCheckedChange={(checked) => setIsTestMode(checked)}
              />
            </div>
          </div>

          {isTestMode && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <FlaskConical className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    Test Mode is Active
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Users will be charged ₹{testPriceINR} instead of ₹{priceINR}. 
                    Disable test mode before going live.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-medium">Quick Toggle Test Mode</h3>
              <p className="text-sm text-muted-foreground">
                Instantly switch between test and production pricing
              </p>
            </div>
            <Button
              variant={isTestMode ? 'default' : 'outline'}
              onClick={handleToggleTestMode}
            >
              {isTestMode ? 'Switch to Production' : 'Switch to Test Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
