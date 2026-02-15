'use client';

/**
 * Pricing Modal
 * 
 * Modal popup for pricing/upgrade to Pro.
 * Fetches dynamic pricing from admin settings.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check, X, Crown, Zap, Shield, FileDown, Sparkles, MessageSquare, HelpCircle, ArrowRight, Loader2, GraduationCap, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { createOrderAction, verifyPaymentAction, getSubscriptionInfoAction } from '@/app/actions/payment-actions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ============================================================================
// Feature List
// ============================================================================

const FEATURES = [
  {
    name: 'Resume Analysis',
    description: 'AI-powered resume scoring and feedback',
    free: true,
    pro: true,
    icon: Sparkles,
  },
  {
    name: 'Resume Improvements',
    description: 'Get AI-suggested improvements for your resume',
    free: true,
    pro: true,
    icon: Zap,
  },
  {
    name: 'Daily AI Credits',
    description: 'Number of AI requests per day',
    free: '2 credits',
    pro: '10 credits',
    icon: Zap,
  },
  {
    name: 'PDF Exports',
    description: 'Export resume to PDF with LaTeX',
    free: '2/day',
    pro: 'Unlimited',
    icon: FileDown,
  },
  {
    name: 'Q&A Preparation',
    description: 'Generate potential interview Q&A based on resume',
    free: false,
    pro: true,
    icon: MessageSquare,
    proOnly: true,
  },
  {
    name: 'Interview Practice',
    description: 'Practice with AI-generated interview quizzes',
    free: false,
    pro: true,
    icon: HelpCircle,
    proOnly: true,
  },
  {
    name: 'Priority Support',
    description: 'Get faster support response times',
    free: false,
    pro: true,
    icon: Shield,
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
// Component Props
// ============================================================================

interface PricingModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PricingModal({ children, open, onOpenChange, defaultOpen }: PricingModalProps) {
  const { user } = useAuth();
  const { tier, loading: subscriptionLoading, currentPeriodEnd, refresh } = useSubscription();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [pricing, setPricing] = useState({ amount: 99, duration: 30 });
  const [pricingLoading, setPricingLoading] = useState(true);

  const isPro = tier === 'pro';

  // Check if Razorpay is already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true);
    }
  }, []);

  // Fetch dynamic pricing when modal opens
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

  // Calculate days remaining if Pro
  const daysRemaining = isPro && currentPeriodEnd 
    ? Math.max(0, Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

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
          color: '#7c3aed',
          backdrop_color: 'rgba(0, 0, 0, 0.8)',
        },
        handler: async (response: RazorpayResponse) => {
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
              toast.success('🎉 Welcome to Pro!', {
                description: `Your Pro access is now active for ${pricing.duration} days.`,
              });
              
              await refresh();
              onOpenChange?.(false);
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

      <Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade to Pro
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Pricing Header */}
            <div className="text-center">
              <Badge variant="outline" className="mb-3 px-3 py-1 text-sm border-primary/30 bg-primary/10 gap-2">
                <GraduationCap className="h-4 w-4" />
                Student Friendly
              </Badge>
              <p className="text-muted-foreground">
                Just{' '}
                <span className="text-primary font-semibold">
                  ₹{pricingLoading ? '...' : pricing.amount}
                </span>{' '}
                for {pricingLoading ? '...' : pricing.duration} days. 
                No auto-debit. No recurring charges.
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Free Plan Summary */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  Free Plan
                  {tier === 'free' && !subscriptionLoading && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </h4>
                <ul className="space-y-2 text-sm">
                  {FEATURES.filter(f => f.free).slice(0, 4).map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{feature.name}</span>
                      {typeof feature.free === 'string' && (
                        <span className="text-muted-foreground text-xs">({feature.free})</span>
                      )}
                    </li>
                  ))}
                  {FEATURES.filter(f => !f.free).slice(0, 2).map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2 opacity-50">
                      <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Plan Summary */}
              <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 relative">
                <div className="absolute -top-2 right-2">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-xs">
                    Best Value
                  </Badge>
                </div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  Pro Plan
                  {isPro && !subscriptionLoading && (
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Active ({daysRemaining}d)
                    </Badge>
                  )}
                </h4>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-primary">
                    ₹{pricingLoading ? '...' : pricing.amount}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    / {pricingLoading ? '...' : pricing.duration} days
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  {FEATURES.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2">
                      <Check className={cn(
                        "h-4 w-4 flex-shrink-0",
                        feature.proOnly ? "text-primary" : "text-emerald-500"
                      )} />
                      <span>{feature.name}</span>
                      {feature.proOnly && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/30 text-primary">
                          Pro
                        </Badge>
                      )}
                      {typeof feature.pro === 'string' && (
                        <span className="text-primary text-xs">({feature.pro})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* CTA Button */}
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 gap-2 h-12 text-base shadow-lg shadow-primary/25"
                onClick={handleUpgrade}
                disabled={isLoading || pricingLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : !razorpayLoaded ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : isPro ? (
                  <>
                    View Subscription
                    <ArrowRight className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    <Crown className="h-5 w-5" />
                    Get Pro Access - ₹{pricingLoading ? '...' : pricing.amount}
                  </>
                )}
              </Button>
              
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Secure via Razorpay</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span>UPI, Cards, NetBanking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Instant activation</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PricingModal;
