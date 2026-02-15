'use client';

/**
 * Credits Exhausted Modal
 * 
 * Shows a modal prompting users to upgrade when they run out of daily AI credits.
 * Student-friendly messaging with clear upgrade CTA.
 * Fetches dynamic pricing from admin settings.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Zap, Sparkles, ArrowRight, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscription } from '@/context/subscription-context';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { getSubscriptionInfoAction } from '@/app/actions/payment-actions';

interface CreditsExhaustedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

/**
 * Modal that appears when a free user exhausts their daily AI credits
 */
export function CreditsExhaustedModal({ 
  open, 
  onOpenChange,
  featureName = 'this feature',
}: CreditsExhaustedModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { tier, limits } = useSubscription();
  const [pricing, setPricing] = useState({ amount: 99, duration: 30 });
  const [pricingLoading, setPricingLoading] = useState(true);

  // Fetch dynamic pricing when modal opens
  useEffect(() => {
    const fetchPricing = async () => {
      if (!open) return;
      try {
        setPricingLoading(true);
        const result = await getSubscriptionInfoAction(user?.uid || '');
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
  }, [open, user?.uid]);

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/pricing');
  };

  // Only show for free users
  if (tier !== 'free') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/30 bg-gradient-to-b from-background via-background to-primary/5">
        <DialogHeader className="text-center space-y-4">
          {/* Icon */}
          <div className="mx-auto p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
            <AlertCircle className="h-8 w-8 text-primary" />
          </div>
          
          <DialogTitle className="text-xl font-bold text-center w-full">
            Daily Credits Exhausted
          </DialogTitle>
          
          <DialogDescription className="text-base text-center">
            You&apos;ve used all your free AI credits for today. 
            Upgrade to Pro for more credits and premium features!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* What you get with Pro */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              What you get with Pro
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>10 AI credits/day</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Unlimited exports</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span>Q&A Preparation</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span>Interview Practice</span>
              </div>
            </div>
          </div>
          
          {/* Pricing info */}
          <div className="text-center py-3 border-y border-border/50">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold">
                {pricingLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${pricing.amount}`}
              </span>
              <div className="text-left text-sm text-muted-foreground">
                <p>for {pricingLoading ? '...' : pricing.duration} days</p>
                <p className="text-xs">No auto-debit</p>
              </div>
            </div>
            <Badge variant="outline" className="mt-2 border-green-500/30 bg-green-500/10 text-green-600">
              Student Friendly Pricing
            </Badge>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg"
              onClick={handleUpgrade}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          {/* Reset info */}
          <p className="text-xs text-center text-muted-foreground">
            Free credits reset every day at midnight IST
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage the credits exhausted modal state
 * Use this in pages that make AI requests to show the modal when credits run out
 */
export function useCreditsExhaustedModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { dailyAICreditsRemaining, tier } = useSubscription();
  
  const showModal = () => {
    if (tier === 'free' && dailyAICreditsRemaining <= 0) {
      setIsOpen(true);
    }
  };
  
  const hideModal = () => setIsOpen(false);
  
  return {
    isOpen,
    setIsOpen,
    showModal,
    hideModal,
    shouldShowModal: tier === 'free' && dailyAICreditsRemaining <= 0,
  };
}
