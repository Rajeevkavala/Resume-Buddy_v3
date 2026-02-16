/**
 * Global Rate Limiter for AI Providers
 * Tracks usage across all users to stay within provider limits
 */

// Provider limit configurations
interface ProviderLimits {
  rpm: number;          // Requests per minute
  rpd: number;          // Requests per day
  tpm: number;          // Tokens per minute
  tpd: number;          // Tokens per day
}

// Provider usage tracking
interface ProviderUsage {
  minuteRequests: number[];
  dailyRequests: number;
  minuteTokens: number;
  dailyTokens: number;
  lastReset: Date;
}

// Provider limits based on free tiers
const providerLimits: Record<string, ProviderLimits> = {
  groq: {
    rpm: 30,
    rpd: 14400,
    tpm: 6000,
    tpd: 500000,
  },
  gemini: {
    rpm: 15,
    rpd: 1500,
    tpm: 32000,
    tpd: 1000000,
  },
  openrouter: {
    rpm: 20,
    rpd: 1000,
    tpm: 10000,
    tpd: 200000,
  },
};

// In-memory usage tracking
const providerUsage = new Map<string, ProviderUsage>();

/**
 * Get current usage for a provider, initializing if needed
 */
function getProviderUsage(provider: string): ProviderUsage {
  const now = new Date();
  let usage = providerUsage.get(provider);

  if (!usage) {
    usage = {
      minuteRequests: [],
      dailyRequests: 0,
      minuteTokens: 0,
      dailyTokens: 0,
      lastReset: now,
    };
    providerUsage.set(provider, usage);
  }

  // Reset daily counters at midnight
  if (usage.lastReset.getDate() !== now.getDate()) {
    usage.dailyRequests = 0;
    usage.dailyTokens = 0;
    usage.lastReset = now;
  }

  // Clean up minute requests older than 1 minute
  const oneMinuteAgo = Date.now() - 60000;
  usage.minuteRequests = usage.minuteRequests.filter(t => t > oneMinuteAgo);

  // Safety: cap minuteRequests array to prevent unbounded growth under burst traffic
  if (usage.minuteRequests.length > 1000) {
    usage.minuteRequests = usage.minuteRequests.slice(-500);
  }

  return usage;
}

/**
 * Check if a provider can be used based on limits
 * @param provider - Provider name (groq, gemini, openrouter)
 * @param estimatedTokens - Estimated tokens for the request (default: 1000)
 * @returns Whether the provider can be used and reason if not
 */
export function canUseProvider(
  provider: string,
  estimatedTokens: number = 1000
): { allowed: boolean; reason?: string; waitTime?: number } {
  const limits = providerLimits[provider];
  if (!limits) {
    return { allowed: true }; // Unknown provider, allow by default
  }

  const usage = getProviderUsage(provider);

  // Check RPM (requests per minute)
  if (usage.minuteRequests.length >= limits.rpm) {
    const waitTime = 60000 - (Date.now() - usage.minuteRequests[0]);
    return {
      allowed: false,
      reason: `RPM limit reached (${limits.rpm}/min)`,
      waitTime: Math.ceil(waitTime / 1000),
    };
  }

  // Check RPD (requests per day)
  if (usage.dailyRequests >= limits.rpd) {
    return {
      allowed: false,
      reason: `Daily request limit reached (${limits.rpd}/day)`,
    };
  }

  // Check TPD (tokens per day) - warn if approaching limit
  if (usage.dailyTokens + estimatedTokens > limits.tpd * 0.95) {
    return {
      allowed: false,
      reason: `Daily token limit approaching (${limits.tpd}/day)`,
    };
  }

  return { allowed: true };
}

/**
 * Record usage for a provider after a successful request
 * @param provider - Provider name
 * @param tokens - Number of tokens used
 */
export function recordProviderUsage(provider: string, tokens: number): void {
  const usage = getProviderUsage(provider);

  usage.minuteRequests.push(Date.now());
  usage.dailyRequests++;
  usage.minuteTokens += tokens;
  usage.dailyTokens += tokens;

  providerUsage.set(provider, usage);

  console.log(
    `📊 ${provider} usage: ${usage.dailyRequests}/${providerLimits[provider]?.rpd || 'N/A'} daily, ${tokens} tokens`
  );
}

/**
 * Get status of all providers
 */
export function getProvidersStatus(): Record<string, {
  usage: {
    minuteRequests: number;
    dailyRequests: number;
    dailyTokens: number;
  };
  limits: ProviderLimits;
  percentUsed: {
    rpm: number;
    rpd: number;
    tpd: number;
  };
  available: boolean;
}> {
  const status: Record<string, {
    usage: { minuteRequests: number; dailyRequests: number; dailyTokens: number };
    limits: ProviderLimits;
    percentUsed: { rpm: number; rpd: number; tpd: number };
    available: boolean;
  }> = {};

  for (const [provider, limits] of Object.entries(providerLimits)) {
    const usage = getProviderUsage(provider);
    const canUse = canUseProvider(provider);

    status[provider] = {
      usage: {
        minuteRequests: usage.minuteRequests.length,
        dailyRequests: usage.dailyRequests,
        dailyTokens: usage.dailyTokens,
      },
      limits,
      percentUsed: {
        rpm: Math.round((usage.minuteRequests.length / limits.rpm) * 100),
        rpd: Math.round((usage.dailyRequests / limits.rpd) * 100),
        tpd: Math.round((usage.dailyTokens / limits.tpd) * 100),
      },
      available: canUse.allowed,
    };
  }

  return status;
}

/**
 * Get the best available provider based on current usage
 * @returns Provider name or null if all are rate limited
 */
export function getBestAvailableProvider(): string | null {
  const providerOrder = ['groq', 'gemini', 'openrouter'];

  for (const provider of providerOrder) {
    const { allowed } = canUseProvider(provider);
    if (allowed) {
      return provider;
    }
  }

  return null;
}

/**
 * Reset usage for a provider (for testing)
 */
export function resetProviderUsage(provider: string): void {
  providerUsage.delete(provider);
  console.log(`🔄 Reset usage for ${provider}`);
}

/**
 * Reset all provider usage (for testing)
 */
export function resetAllProviderUsage(): void {
  providerUsage.clear();
  console.log('🔄 Reset all provider usage');
}
