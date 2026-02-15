'use client';

/**
 * Pricing Page
 * 
 * Student-friendly pricing with one-time payment model.
 * ₹99 for 30 days Pro access - no auto-debit, no recurring charges.
 * Clean design with skeleton loading.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check, X, Crown, Shield, ArrowRight, Loader2, CreditCard, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { createOrderAction, verifyPaymentAction, getSubscriptionInfoAction } from '@/app/actions/payment-actions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Full feature list matching the original design
const FEATURES = [
  {
    name: 'Resume Analysis',
    free: true,
    pro: true,
  },
  {
    name: 'Resume Improvements',
    free: true,
    pro: true,
  },
  {
    name: 'Create Resume',
    free: true,
    pro: true,
  },
  {
    name: 'Daily AI Credits',
    free: '5 credits',
    pro: '10 credits',
    proHighlight: true,
  },
  {
    name: 'PDF Exports',
    free: '2/day',
    pro: 'Unlimited',
    proHighlight: true,
  },
  {
    name: 'Q&A Preparation',
    free: false,
    pro: true,
    proOnly: true,
  },
  {
    name: 'Interview Practice',
    free: false,
    pro: true,
    proOnly: true,
  },
  {
    name: 'Priority Support',
    free: false,
    pro: true,
  },
];

// ============================================================================
// Razorpay Types
// ============================================================================

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
  prefill?: {
    email?: string;
    name?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ============================================================================
// Skeleton Components
// ============================================================================

function PricingCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <Card className={cn(
      "relative",
      featured && "border-primary/50 ring-1 ring-primary/20"
    )}>
      {featured && (
        <div className="absolute -top-3 right-4">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 mt-1" />
        <div className="flex items-baseline gap-2 mt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        {featured && (
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        )}
      </CardHeader>
      
      <Separator className="mx-6" />
      
      <CardContent className="pt-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-4">
        <Skeleton className="h-12 w-full" />
      </CardFooter>
    </Card>
  );
}

function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header skeleton */}
        <div className="text-center mb-12 space-y-4">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>
        
        {/* Cards skeleton */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCardSkeleton />
          <PricingCardSkeleton featured />
        </div>
        
        {/* Trust footer skeleton */}
        <div className="flex justify-center gap-8 mt-12">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function PricingPage() {
  const { user } = useAuth();
  const { tier, loading: subscriptionLoading, currentPeriodEnd, refresh } = useSubscription();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [pricing, setPricing] = useState({ amount: 99, duration: 30 });
  const [pricingLoading, setPricingLoading] = useState(true);

  const isPro = tier === 'pro';

  // Check if Razorpay is already loaded (e.g., from cache)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, []);

  // Fetch dynamic pricing from admin settings
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setPricingLoading(true);
        // For non-logged in users, use a temporary fetch
        if (user) {
          const result = await getSubscriptionInfoAction(user.uid);
          if (!result.error && result.priceINR && result.durationDays) {
            setPricing({ 
              amount: result.priceINR, 
              duration: result.durationDays 
            });
          }
        } else {
          // Fetch without user context - just get pricing info
          const result = await getSubscriptionInfoAction('');
          if (!result.error && result.priceINR && result.durationDays) {
            setPricing({ 
              amount: result.priceINR, 
              duration: result.durationDays 
            });
          }
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPricing();
  }, [user]);

  // Calculate days remaining if Pro (using calendar day difference)
  const daysRemaining = (() => {
    if (!isPro || !currentPeriodEnd) return 0;
    const endDate = new Date(currentPeriodEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  })();

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/login?returnUrl=/pricing');
      return;
    }

    if (isPro) {
      router.push('/billing');
      return;
    }

    if (!razorpayLoaded) {
      setError('Payment system loading. Please wait...');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create order via server action
      const result = await createOrderAction({
        userId: user.uid,
        email: user.email || '',
        name: user.displayName || undefined,
      });

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (!result.orderId || !result.keyId) {
        setError('Failed to create payment order');
        setIsLoading(false);
        return;
      }

      // Open Razorpay Checkout
      const options: RazorpayOptions = {
        key: result.keyId,
        amount: result.amount!,
        currency: result.currency!,
        name: 'ResumeBuddy',
        description: `Pro Access - ${pricing.duration} Days`,
        order_id: result.orderId,
        prefill: result.prefill,
        theme: {
          color: '#7c3aed', // Primary purple matching the app
          backdrop_color: 'rgba(0, 0, 0, 0.8)',
        },
        handler: async (response: RazorpayResponse) => {
          // Payment successful - verify on server
          try {
            const verifyResult = await verifyPaymentAction(
              user.uid,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResult.error) {
              setError(verifyResult.error);
              toast.error('Payment Error', {
                description: verifyResult.error,
              });
            } else {
              // Success!
              toast.success('🎉 Welcome to Pro!', {
                description: `Your Pro access is now active for ${pricing.duration} days.`,
              });
              
              // Refresh subscription status
              await refresh();
              
              // Redirect to dashboard
              router.push('/dashboard');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          }
          setIsLoading(false);
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
          escape: true,
          animation: true,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to start payment. Please try again.');
      setIsLoading(false);
    }
  };

  // Show skeleton while loading pricing data
  if (pricingLoading || subscriptionLoading) {
    return (
      <>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          onLoad={() => setRazorpayLoaded(true)}
        />
        <PricingSkeleton />
      </>
    );
  }

  return (
    <>
      {/* Load Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => {
          console.error('Failed to load Razorpay script');
          setError('Failed to load payment system. Please refresh the page.');
        }}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
              <Zap className="h-4 w-4 mr-1.5 text-primary" />
              Student Friendly Pricing
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline tracking-tight">
              Simple, Affordable Plans
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more power. No auto-debit, no surprises.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="relative border-2 border-border hover:border-primary/30 transition-colors duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold">Free Forever</CardTitle>
                  {tier === 'free' && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </div>
                <CardDescription className="text-muted-foreground">
                  Get started with basic resume tools
                </CardDescription>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-bold font-accent">₹0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
              </CardHeader>
              
              <Separator className="mx-6" />
              
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {FEATURES.map((feature) => (
                    <li key={feature.name} className={cn(
                      "flex items-start gap-3",
                      !feature.free && "opacity-50"
                    )}>
                      {feature.free ? (
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{feature.name}</span>
                        {typeof feature.free === 'string' && (
                          <span className="text-muted-foreground text-sm">({feature.free})</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-base"
                  onClick={() => user ? router.push('/dashboard') : router.push('/signup')}
                  disabled={tier === 'free' && !!user}
                >
                  {tier === 'free' && user ? 'Current Plan' : user ? 'Go to Dashboard' : 'Get Started Free'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-2 border-primary shadow-xl shadow-primary/10 overflow-hidden">
              {/* Best Value badge */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold gap-1.5 shadow-lg">
                  <Crown className="h-3.5 w-3.5" />
                  Best Value
                </Badge>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold">Pro Access</CardTitle>
                  {isPro && (
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Active ({daysRemaining}d left)
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-muted-foreground">
                  Unlock everything for your job search
                </CardDescription>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-4xl font-bold font-accent text-primary">₹{pricing.amount}</span>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-sm">for {pricing.duration} days</span>
                    <span className="text-xs text-muted-foreground/70">One-time • No auto-debit</span>
                  </div>
                </div>
                
                {/* Trust badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="outline" className="text-xs gap-1.5 bg-background/50">
                    <CreditCard className="h-3 w-3" />
                    One-time payment
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1.5 bg-background/50">
                    <Clock className="h-3 w-3" />
                    Instant activation
                  </Badge>
                </div>
              </CardHeader>
              
              <Separator className="mx-6" />
              
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {FEATURES.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      <Check className={cn(
                        "h-5 w-5 mt-0.5 flex-shrink-0",
                        feature.proOnly ? "text-primary" : "text-emerald-500"
                      )} />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{feature.name}</span>
                        {feature.proOnly && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                            Pro
                          </Badge>
                        )}
                        {typeof feature.pro === 'string' && (
                          <span className={cn(
                            "text-sm",
                            feature.proHighlight ? "text-primary font-semibold" : "text-muted-foreground"
                          )}>({feature.pro})</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-4 flex flex-col gap-3">
                <Button 
                  className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition-all group"
                  onClick={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : !razorpayLoaded ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : isPro ? (
                    <>
                      View Subscription
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Get Pro Access - ₹{pricing.amount}
                    </>
                  )}
                </Button>
                
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Trust Section */}
          <div className="text-center mt-12">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Secure payments via Razorpay</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>UPI, Cards, NetBanking accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Student-friendly pricing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
