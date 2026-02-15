'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSubscriptionStatusAction, checkExportLimitAction } from '@/app/actions';
import type { 
  SubscriptionTier, 
  SubscriptionState, 
  AIFeature, 
  TierLimits,
} from '@/lib/types/subscription';
import { TIER_LIMITS, PRO_ONLY_FEATURES, FEATURE_DISPLAY_NAMES } from '@/lib/types/subscription';

// ============ Context Types ============

interface SubscriptionContextType {
  // Subscription state
  tier: SubscriptionTier;
  status: string;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading
  error: string | null;
  
  // Usage tracking
  dailyAICreditsUsed: number;
  dailyAICreditsRemaining: number;
  dailyExportsUsed: number;
  dailyExportsRemaining: number;
  
  // Limits
  limits: TierLimits;
  
  // Billing info
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  
  // Helper methods
  isPro: boolean;
  canAccessFeature: (feature: AIFeature) => boolean;
  getFeatureBlockedMessage: (feature: AIFeature) => string | null;
  hasExportsRemaining: () => boolean;
  getExportLimitMessage: () => string;
  
  // Actions
  refreshSubscription: () => Promise<void>;
  refresh: () => Promise<void>; // Alias for refreshSubscription
  refreshExportUsage: () => Promise<void>;
}

// ============ Default Values ============

const defaultLimits: TierLimits = TIER_LIMITS.free;

const defaultContext: SubscriptionContextType = {
  tier: 'free',
  status: 'inactive',
  isLoading: true,
  loading: true, // Alias for isLoading
  error: null,
  
  dailyAICreditsUsed: 0,
  dailyAICreditsRemaining: defaultLimits.dailyAICredits,
  dailyExportsUsed: 0,
  dailyExportsRemaining: defaultLimits.dailyExports,
  
  limits: defaultLimits,
  
  isPro: false,
  canAccessFeature: () => true,
  getFeatureBlockedMessage: () => null,
  hasExportsRemaining: () => true,
  getExportLimitMessage: () => '',
  
  refreshSubscription: async () => {},
  refresh: async () => {}, // Alias for refreshSubscription
  refreshExportUsage: async () => {},
};

// ============ Context ============

const SubscriptionContext = createContext<SubscriptionContextType>(defaultContext);

// ============ Provider ============

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [status, setStatus] = useState<string>('inactive');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dailyAICreditsUsed, setDailyAICreditsUsed] = useState(0);
  const [dailyAICreditsRemaining, setDailyAICreditsRemaining] = useState(defaultLimits.dailyAICredits);
  const [dailyExportsUsed, setDailyExportsUsed] = useState(0);
  const [dailyExportsRemaining, setDailyExportsRemaining] = useState(defaultLimits.dailyExports);
  
  const [limits, setLimits] = useState<TierLimits>(defaultLimits);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | undefined>();
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean | undefined>();
  
  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    if (!user?.uid) {
      setTier('free');
      setStatus('inactive');
      setLimits(defaultLimits);
      setIsLoading(false);
      return;
    }
    
    try {
      setError(null);
      const result = await getSubscriptionStatusAction(user.uid);
      
      if (result.success && result.data) {
        const state = result.data;
        setTier(state.tier);
        setStatus(state.status);
        setLimits(state.limits);
        setDailyAICreditsUsed(state.dailyAICreditsUsed);
        setDailyAICreditsRemaining(state.dailyAICreditsRemaining);
        setDailyExportsUsed(state.dailyExportsUsed);
        setDailyExportsRemaining(state.dailyExportsRemaining);
        setCurrentPeriodEnd(state.currentPeriodEnd);
        setCancelAtPeriodEnd(state.cancelAtPeriodEnd);
      } else {
        setError(result.error || 'Failed to load subscription');
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError('Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);
  
  // Refresh just export usage (lighter weight)
  const refreshExportUsage = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const result = await checkExportLimitAction(user.uid);
      setDailyExportsUsed(result.used);
      setDailyExportsRemaining(result.unlimited ? -1 : result.remaining);
    } catch (err) {
      console.error('Error refreshing export usage:', err);
    }
  }, [user?.uid]);
  
  // Load subscription on auth change
  useEffect(() => {
    if (!authLoading) {
      refreshSubscription();
    }
  }, [authLoading, user?.uid, refreshSubscription]);
  
  // Helper: Check if user is Pro
  const isPro = tier === 'pro';
  
  // Helper: Check if feature is accessible
  const canAccessFeature = useCallback((feature: AIFeature): boolean => {
    return limits.allowedFeatures.includes(feature);
  }, [limits.allowedFeatures]);
  
  // Helper: Get message for blocked feature
  const getFeatureBlockedMessage = useCallback((feature: AIFeature): string | null => {
    if (canAccessFeature(feature)) {
      return null;
    }
    const featureName = FEATURE_DISPLAY_NAMES[feature] || feature;
    return `${featureName} is a Pro feature. Upgrade to unlock!`;
  }, [canAccessFeature]);
  
  // Helper: Check if exports remaining
  const hasExportsRemaining = useCallback((): boolean => {
    // Unlimited exports
    if (dailyExportsRemaining === -1) return true;
    return dailyExportsRemaining > 0;
  }, [dailyExportsRemaining]);
  
  // Helper: Get export limit message
  const getExportLimitMessage = useCallback((): string => {
    if (dailyExportsRemaining === -1) {
      return 'Unlimited exports (Pro)';
    }
    if (dailyExportsRemaining <= 0) {
      return 'No exports remaining today. Upgrade to Pro for unlimited exports!';
    }
    return `${dailyExportsRemaining} of ${limits.dailyExports} exports remaining today`;
  }, [dailyExportsRemaining, limits.dailyExports]);
  
  const value: SubscriptionContextType = {
    tier,
    status,
    isLoading,
    loading: isLoading, // Alias for isLoading
    error,
    
    dailyAICreditsUsed,
    dailyAICreditsRemaining,
    dailyExportsUsed,
    dailyExportsRemaining,
    
    limits,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    
    isPro,
    canAccessFeature,
    getFeatureBlockedMessage,
    hasExportsRemaining,
    getExportLimitMessage,
    
    refreshSubscription,
    refresh: refreshSubscription, // Alias for refreshSubscription
    refreshExportUsage,
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ============ Hook ============

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// ============ Feature Lock Component ============

interface FeatureLockProps {
  feature: AIFeature;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that shows children if feature is accessible,
 * or shows a locked state/fallback if not
 */
export function FeatureLock({ feature, children, fallback }: FeatureLockProps) {
  const { canAccessFeature, getFeatureBlockedMessage, isLoading } = useSubscription();
  
  if (isLoading) {
    return <>{children}</>; // Show content while loading
  }
  
  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default locked state
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-4">
          <div className="text-lg font-semibold mb-2">🔒 Pro Feature</div>
          <p className="text-sm text-muted-foreground mb-3">
            {getFeatureBlockedMessage(feature)}
          </p>
          <a 
            href="/pricing" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    </div>
  );
}
