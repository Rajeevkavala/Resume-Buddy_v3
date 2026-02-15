'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/context/subscription-context';
import type { AIFeature } from '@/lib/types/subscription';
import { FEATURE_DISPLAY_NAMES } from '@/lib/types/subscription';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature?: AIFeature;
  title?: string;
  description?: string;
  variant?: 'card' | 'inline' | 'banner';
  className?: string;
}

/**
 * Upgrade prompt component for Pro features
 * Shows a call-to-action to upgrade when user tries to access Pro features
 */
export function UpgradePrompt({ 
  feature, 
  title, 
  description,
  variant = 'card',
  className,
}: UpgradePromptProps) {
  const { tier, dailyAICreditsRemaining, limits } = useSubscription();
  
  const featureName = feature ? FEATURE_DISPLAY_NAMES[feature] : '';
  const displayTitle = title || `Unlock ${featureName}`;
  const displayDescription = description || 
    `${featureName} is available on the Pro plan. Upgrade now to access this feature and get more AI credits.`;
  
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20", className)}>
        <Lock className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {displayTitle}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            Pro feature • Upgrade to access
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Crown className="h-3.5 w-3.5 mr-1" />
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }
  
  if (variant === 'banner') {
    return (
      <div className={cn("w-full p-4 bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-orange-500/10 border-y border-purple-500/20", className)}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {displayTitle}
              </p>
              <p className="text-sm text-muted-foreground">
                Get {limits.dailyAICredits} AI credits/day + unlimited exports
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Default: card variant
  return (
    <Card className={cn("relative overflow-hidden border-2 border-dashed border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5", className)}>
      <div className="absolute top-0 right-0 p-2">
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      </div>
      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
          <Lock className="h-8 w-8 text-amber-500" />
        </div>
        <CardTitle className="text-xl">{displayTitle}</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          {displayDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-8">
        <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>10 AI credits/day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Unlimited exports</span>
          </div>
        </div>
        <Link href="/pricing">
          <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Usage indicator showing remaining credits/exports
 */
interface UsageIndicatorProps {
  type: 'credits' | 'exports';
  className?: string;
}

export function UsageIndicator({ type, className }: UsageIndicatorProps) {
  const { 
    tier,
    dailyAICreditsUsed, 
    dailyAICreditsRemaining, 
    dailyExportsUsed,
    dailyExportsRemaining,
    limits,
  } = useSubscription();
  
  const isCredits = type === 'credits';
  const used = isCredits ? dailyAICreditsUsed : dailyExportsUsed;
  const remaining = isCredits ? dailyAICreditsRemaining : dailyExportsRemaining;
  const limit = isCredits ? limits.dailyAICredits : limits.dailyExports;
  const unlimited = remaining === -1;
  
  const label = isCredits ? 'AI Credits' : 'Exports';
  const icon = isCredits ? <Zap className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />;
  
  if (unlimited) {
    return (
      <Badge variant="outline" className={cn("bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30", className)}>
        {icon}
        <span className="ml-1">Unlimited {label}</span>
        <Crown className="h-3 w-3 ml-1 text-purple-500" />
      </Badge>
    );
  }
  
  const isLow = remaining <= Math.ceil(limit * 0.2); // 20% remaining
  const isEmpty = remaining <= 0;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "transition-colors",
        isEmpty && "bg-red-500/10 border-red-500/30 text-red-500",
        isLow && !isEmpty && "bg-amber-500/10 border-amber-500/30 text-amber-600",
        !isLow && !isEmpty && "bg-green-500/10 border-green-500/30 text-green-600",
        className
      )}
    >
      {icon}
      <span className="ml-1">{remaining}/{limit} {label}</span>
    </Badge>
  );
}

/**
 * Pro badge for labeling Pro-only features
 */
export function ProBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn("bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs", className)}>
      <Crown className="h-3 w-3 mr-1" />
      Pro
    </Badge>
  );
}
