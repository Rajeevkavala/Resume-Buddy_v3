'use client';

/**
 * Billing Page
 * 
 * Shows Pro status and allows renewal.
 * One-time payment model - no cancellation needed (just expires naturally).
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Crown, Calendar, Check, X, Loader2, RefreshCw, ArrowRight, Shield, Clock, Zap, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { checkProStatusAction, getSubscriptionInfoAction, createOrderAction, verifyPaymentAction } from '@/app/actions/payment-actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { BillingSkeleton } from '@/components/ui/page-skeletons';

// Razorpay Types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string; name?: string; };
  theme?: { color?: string; backdrop_color?: string; };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void; };
}

interface RazorpayInstance { open: () => void; close: () => void; }
interface RazorpayResponse { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; }

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    tier, 
    limits, 
    dailyAICreditsUsed, 
    dailyAICreditsRemaining,
    dailyExportsUsed,
    dailyExportsRemaining,
    currentPeriodEnd,
    loading: subscriptionLoading,
    refresh 
  } = useSubscription();
  const router = useRouter();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pricing, setPricing] = useState({ amount: 99, duration: 30 });
  const [pricingLoading, setPricingLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const isPro = tier === 'pro';
  const isUnlimitedExports = dailyExportsRemaining === -1;

  // Check if Razorpay is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, []);

  // Calculate days remaining (using calendar day difference for accuracy)
  const daysRemaining = (() => {
    if (!currentPeriodEnd) return 0;
    const endDate = new Date(currentPeriodEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  })();

  const expiryDate = currentPeriodEnd 
    ? new Date(currentPeriodEnd).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Fetch dynamic pricing
  useEffect(() => {
    const fetchPricing = async () => {
      if (!user) return;
      try {
        setPricingLoading(true);
        const result = await getSubscriptionInfoAction(user.uid);
        if (!result.error && result.priceINR && result.durationDays) {
          setPricing({ 
            amount: result.priceINR, 
            duration: result.durationDays 
          });
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPricing();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=/billing');
    }
  }, [user, authLoading, router]);

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await checkProStatusAction(user.uid);
      await refresh();
    } catch (err) {
      console.error('Error refreshing status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Renew/Upgrade payment directly
  const handlePayment = async () => {
    if (!user) {
      router.push('/login?returnUrl=/billing');
      return;
    }

    if (!razorpayLoaded) {
      toast.error('Payment system loading. Please wait...');
      return;
    }

    setIsPaymentLoading(true);

    try {
      const result = await createOrderAction({
        userId: user.uid,
        email: user.email || '',
        name: user.displayName || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        setIsPaymentLoading(false);
        return;
      }

      if (!result.orderId || !result.keyId) {
        toast.error('Failed to create payment order');
        setIsPaymentLoading(false);
        return;
      }

      const options: RazorpayOptions = {
        key: result.keyId,
        amount: result.amount!,
        currency: result.currency!,
        name: 'ResumeBuddy',
        description: `Pro Access - ${pricing.duration} Days`,
        order_id: result.orderId,
        prefill: result.prefill,
        theme: { color: '#7c3aed', backdrop_color: 'rgba(0, 0, 0, 0.8)' },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyResult = await verifyPaymentAction(
              user.uid,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResult.error) {
              toast.error('Payment Error', { description: verifyResult.error });
            } else {
              toast.success('🎉 Pro Access Renewed!', {
                description: `Your Pro access has been extended by ${pricing.duration} days.`,
              });
              await refresh();
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Payment verification failed. Please contact support.');
          }
          setIsPaymentLoading(false);
        },
        modal: {
          ondismiss: () => setIsPaymentLoading(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Error creating order:', err);
      toast.error('Failed to start payment. Please try again.');
      setIsPaymentLoading(false);
    }
  };

  if (authLoading || subscriptionLoading) {
    return <BillingSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Load Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <div className="min-h-screen bg-background page-enter">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="space-y-2 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-headline font-semibold text-foreground">Billing & Plan</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your subscription and view usage
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Current Plan Card */}
          <Card className={cn(
            "relative overflow-hidden transition-shadow",
            isPro && "border-primary/50"
          )}>
            {isPro && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            )}
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-headline">Current Plan</CardTitle>
                  <CardDescription className="text-sm">Your active subscription details</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="self-start sm:self-auto"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* Plan Info Row */}
                <div className="flex items-start gap-4">
                  {/* Clean icon container - no gradient */}
                  <div className={cn(
                    "p-3 rounded-xl flex-shrink-0",
                    isPro 
                      ? "bg-primary/10" 
                      : "bg-muted"
                  )}>
                    <Crown className={cn(
                      "h-6 w-6 sm:h-8 sm:w-8",
                      isPro ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-headline font-semibold">
                        {isPro ? 'Pro' : 'Free'} Plan
                      </h3>
                      {isPro && (
                        <Badge variant="outline" className="border-success/50 text-success bg-success/5">
                          Active
                        </Badge>
                      )}
                    </div>
                    {isPro && expiryDate && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>Expires {expiryDate}</span>
                        </p>
                        <p className={cn(
                          "text-sm font-medium flex items-center gap-1.5",
                          daysRemaining <= 7 ? "text-destructive" : "text-primary"
                        )}>
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{daysRemaining} days remaining</span>
                        </p>
                      </div>
                    )}
                    {!isPro && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Upgrade to unlock all features
                      </p>
                    )}
                  </div>
                </div>

                {/* Expiry Warning - Clean Alert */}
                {isPro && daysRemaining <= 7 && (
                  <Alert className="border-destructive/30 bg-destructive/5">
                    <Clock className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      Your Pro access expires soon. Renew to keep all features.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Button - Solid color, no gradient */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button 
                    className="w-full sm:w-auto"
                    onClick={handlePayment}
                    disabled={isPaymentLoading || !razorpayLoaded}
                  >
                    {isPaymentLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isPro ? (
                      <CreditCard className="h-4 w-4 mr-2" />
                    ) : (
                      <Crown className="h-4 w-4 mr-2" />
                    )}
                    {isPaymentLoading 
                      ? 'Processing...' 
                      : isPro 
                        ? `Renew Pro – ₹${pricingLoading ? '...' : pricing.amount}` 
                        : `Upgrade to Pro – ₹${pricingLoading ? '...' : pricing.amount}`
                    }
                    {!isPaymentLoading && !isPro && (
                      <ArrowRight className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center sm:text-left">
                    {isPro 
                      ? `Adds ${pricingLoading ? '...' : pricing.duration} days from today` 
                      : `${pricingLoading ? '...' : pricing.duration}-day access`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl font-headline flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Today's Usage
              </CardTitle>
              <CardDescription className="text-sm">Credits reset at midnight</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Credits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Credits</span>
                  <span className="text-sm text-muted-foreground font-accent">
                    {dailyAICreditsUsed} / {limits.dailyAICredits}
                  </span>
                </div>
                <Progress 
                  value={(dailyAICreditsUsed / limits.dailyAICredits) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {dailyAICreditsRemaining} credits remaining
                </p>
              </div>

              <Separator />

              {/* PDF Exports */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">PDF Exports</span>
                  <span className="text-sm text-muted-foreground font-accent">
                    {isUnlimitedExports 
                      ? `${dailyExportsUsed} used`
                      : `${dailyExportsUsed} / ${limits.dailyExports}`
                    }
                  </span>
                </div>
                {!isUnlimitedExports && (
                  <Progress 
                    value={(dailyExportsUsed / limits.dailyExports) * 100} 
                    className="h-2"
                  />
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isUnlimitedExports ? (
                    <>
                      <Crown className="h-3 w-3 text-primary" />
                      <span>Unlimited with Pro</span>
                    </>
                  ) : (
                    <span>{dailyExportsRemaining} exports remaining</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl font-headline">Plan Features</CardTitle>
              <CardDescription className="text-sm">What's included in your {isPro ? 'Pro' : 'Free'} plan</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Responsive grid: 1 column on mobile, 2 on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Resume Analysis', included: true },
                  { name: 'Resume Improvements', included: true },
                  { name: 'Create Resume', included: true },
                  { name: `${limits.dailyAICredits} AI Credits/day`, included: true },
                  { name: isPro ? 'Unlimited Exports' : '2 Exports/day', included: true },
                  { name: 'Q&A Preparation', included: isPro, proOnly: true },
                  { name: 'Interview Practice', included: isPro, proOnly: true },
                  { name: 'Priority Support', included: isPro, proOnly: true },
                ].map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3 py-2">
                    {feature.included ? (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className={cn(
                      "text-sm",
                      !feature.included && "text-muted-foreground"
                    )}>
                      {feature.name}
                    </span>
                    {feature.proOnly && !feature.included && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary ml-auto">
                        Pro
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Upsell Section - Clean, no gradient */}
              {!isPro && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base">Unlock all features</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get 10 AI credits, unlimited exports, and interview prep for just ₹{pricingLoading ? '...' : pricing.amount}.
                      </p>
                      <Link href="/pricing">
                        <Button size="sm" className="mt-3">
                          View Pricing
                          <ArrowRight className="h-3.5 w-3.5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure payments via Razorpay</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm">
              One-time payment. No auto-renewal.
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
