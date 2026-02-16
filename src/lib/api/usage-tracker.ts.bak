/**
 * Real API Usage Tracking Service
 * Tracks actual calls to AI providers (Groq, Gemini, OpenRouter)
 */
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  increment, 
  collection,
  Timestamp,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import type { AIProvider, APICallRecord, ProviderStats, GlobalAPIStats } from '@/types/admin';

// Cost per 1M tokens (approximate, in USD)
const PROVIDER_COSTS: Record<AIProvider, { input: number; output: number }> = {
  groq: { input: 0.05, output: 0.10 },      // Llama models on Groq (very cheap)
  gemini: { input: 0.075, output: 0.30 },   // Gemini 1.5 Flash
  openrouter: { input: 0.15, output: 0.60 }, // Variable, using average
};

const COLLECTIONS = {
  API_CALLS: 'api_calls',
  USERS: 'users',
  APP_CONFIG: 'app_config',
};

/**
 * Calculate cost for an API call
 */
function calculateCost(provider: AIProvider, inputTokens: number, outputTokens: number): number {
  const rates = PROVIDER_COSTS[provider];
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Track an API call to any provider
 */
export async function trackAPICall(record: Omit<APICallRecord, 'timestamp' | 'cost'>): Promise<void> {
  try {
    const cost = calculateCost(record.provider, record.inputTokens, record.outputTokens);
    
    const fullRecord: APICallRecord = {
      ...record,
      timestamp: new Date().toISOString(),
      cost,
    };

    // 1. Log individual call
    const logRef = doc(collection(db, COLLECTIONS.API_CALLS));
    await setDoc(logRef, {
      ...fullRecord,
      createdAt: Timestamp.now(),
    });

    // 2. Update user's usage counters
    const userRef = doc(db, COLLECTIONS.USERS, record.userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        'apiUsage.dailyCount': increment(1),
        'apiUsage.monthlyCount': increment(1),
        'apiUsage.totalCount': increment(1),
        'apiUsage.lastReset': Timestamp.now(),
        'apiUsage.lastProvider': record.provider,
        'apiUsage.lastOperation': record.operation,
        [`apiUsage.byProvider.${record.provider}.calls`]: increment(1),
        [`apiUsage.byProvider.${record.provider}.tokens`]: increment(record.totalTokens),
        [`apiUsage.byProvider.${record.provider}.cost`]: increment(cost),
      });
    }

    // 3. Update global stats
    await updateGlobalStats(record.provider, record.totalTokens, cost, record.success);

    console.log(`📊 Tracked API call: ${record.provider} - ${record.operation} (${record.totalTokens} tokens, $${cost.toFixed(6)})`);
  } catch (error) {
    console.error('Error tracking API call:', error);
    // Don't throw - tracking should not break the main flow
  }
}

/**
 * Update global API statistics
 */
async function updateGlobalStats(
  provider: AIProvider, 
  tokens: number, 
  cost: number,
  success: boolean
): Promise<void> {
  try {
    const statsRef = doc(db, COLLECTIONS.APP_CONFIG, 'api_stats');
    const today = new Date().toISOString().split('T')[0];
    
    await updateDoc(statsRef, {
      totalCalls: increment(1),
      totalTokens: increment(tokens),
      totalCost: increment(cost),
      [`byProvider.${provider}.calls`]: increment(1),
      [`byProvider.${provider}.tokens`]: increment(tokens),
      [`byProvider.${provider}.cost`]: increment(cost),
      [`byProvider.${provider}.${success ? 'successfulCalls' : 'failedCalls'}`]: increment(1),
      [`byDay.${today}.calls`]: increment(1),
      [`byDay.${today}.tokens`]: increment(tokens),
      lastUpdated: Timestamp.now(),
    }).catch(async () => {
      // Create if doesn't exist
      await setDoc(statsRef, {
        totalCalls: 1,
        totalTokens: tokens,
        totalCost: cost,
        byProvider: {
          [provider]: { 
            calls: 1, 
            tokens: tokens, 
            cost: cost,
            successfulCalls: success ? 1 : 0,
            failedCalls: success ? 0 : 1,
          }
        },
        byDay: {
          [today]: { calls: 1, tokens: tokens }
        },
        lastUpdated: Timestamp.now(),
      }, { merge: true });
    });
  } catch (error) {
    console.error('Error updating global stats:', error);
  }
}

/**
 * Get provider statistics from Firestore
 */
export async function getProviderStats(): Promise<ProviderStats[]> {
  try {
    const statsRef = doc(db, COLLECTIONS.APP_CONFIG, 'api_stats');
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      return getEmptyProviderStats();
    }
    
    const data = statsDoc.data();
    const providers: AIProvider[] = ['groq', 'gemini', 'openrouter'];
    
    return providers.map(provider => {
      const providerData = data.byProvider?.[provider] || {};
      return {
        provider,
        totalCalls: providerData.calls || 0,
        successfulCalls: providerData.successfulCalls || 0,
        failedCalls: providerData.failedCalls || 0,
        totalTokens: providerData.tokens || 0,
        totalInputTokens: 0, // Would need additional tracking
        totalOutputTokens: 0, // Would need additional tracking
        averageLatency: 0, // Would need additional calculation
        estimatedCost: providerData.cost || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    return getEmptyProviderStats();
  }
}

/**
 * Get empty provider stats structure
 */
function getEmptyProviderStats(): ProviderStats[] {
  const providers: AIProvider[] = ['groq', 'gemini', 'openrouter'];
  return providers.map(provider => ({
    provider,
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    averageLatency: 0,
    estimatedCost: 0,
  }));
}

/**
 * Get global API statistics
 */
export async function getGlobalAPIStats(): Promise<GlobalAPIStats | null> {
  try {
    const statsRef = doc(db, COLLECTIONS.APP_CONFIG, 'api_stats');
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      return null;
    }
    
    const data = statsDoc.data();
    return {
      totalCalls: data.totalCalls || 0,
      totalTokens: data.totalTokens || 0,
      totalCost: data.totalCost || 0,
      byProvider: data.byProvider || {},
      byDay: data.byDay || {},
      lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching global API stats:', error);
    return null;
  }
}

/**
 * Get usage timeline (last N days)
 */
export async function getUsageTimeline(days: number = 7): Promise<Array<{
  date: string;
  groq: number;
  gemini: number;
  openrouter: number;
  total: number;
}>> {
  try {
    const statsRef = doc(db, COLLECTIONS.APP_CONFIG, 'api_stats');
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      return generateEmptyTimeline(days);
    }
    
    const data = statsDoc.data();
    const byDay = data.byDay || {};
    
    // Generate last N days
    const timeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = byDay[dateStr] || { calls: 0 };
      
      timeline.push({
        date: dateStr,
        groq: 0, // Would need per-provider daily tracking
        gemini: 0,
        openrouter: 0,
        total: dayData.calls || 0,
      });
    }
    
    return timeline;
  } catch (error) {
    console.error('Error fetching usage timeline:', error);
    return generateEmptyTimeline(days);
  }
}

/**
 * Generate empty timeline
 */
function generateEmptyTimeline(days: number): Array<{
  date: string;
  groq: number;
  gemini: number;
  openrouter: number;
  total: number;
}> {
  const timeline = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    timeline.push({
      date: date.toISOString().split('T')[0],
      groq: 0,
      gemini: 0,
      openrouter: 0,
      total: 0,
    });
  }
  return timeline;
}

/**
 * Get top users by API usage
 */
export async function getTopUsers(limitCount: number = 10): Promise<Array<{
  userId: string;
  email: string;
  totalCalls: number;
  totalTokens: number;
}>> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(
      usersRef, 
      orderBy('apiUsage.totalCount', 'desc'), 
      firestoreLimit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        userId: docSnap.id,
        email: data.email || 'Unknown',
        totalCalls: data.apiUsage?.totalCount || 0,
        totalTokens: 0, // Would need additional tracking per user
      };
    });
  } catch (error) {
    console.error('Error fetching top users:', error);
    return [];
  }
}

/**
 * Get recent API calls for a user
 */
export async function getUserRecentCalls(
  userId: string, 
  limitCount: number = 50
): Promise<APICallRecord[]> {
  try {
    const callsRef = collection(db, COLLECTIONS.API_CALLS);
    const q = query(
      callsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        userEmail: data.userEmail,
        provider: data.provider,
        model: data.model,
        operation: data.operation,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens: data.totalTokens,
        latencyMs: data.latencyMs,
        success: data.success,
        errorMessage: data.errorMessage,
        timestamp: data.timestamp,
        cost: data.cost,
      };
    });
  } catch (error) {
    console.error('Error fetching user recent calls:', error);
    return [];
  }
}

/**
 * Determine AI provider from model name
 */
export function detectProvider(model: string): AIProvider {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('gemini')) {
    return 'gemini';
  }
  if (modelLower.includes('llama') || modelLower.includes('mixtral') || modelLower.includes('groq')) {
    return 'groq';
  }
  if (modelLower.includes('openrouter') || modelLower.includes('anthropic') || modelLower.includes('gpt')) {
    return 'openrouter';
  }
  
  // Default to groq as it's the primary provider
  return 'groq';
}
