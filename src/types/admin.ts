/**
 * Admin Panel Type Definitions
 * Note: Date fields are serialized as ISO strings for client component compatibility
 */

// ============================================================
// Admin Action Types
// ============================================================

export type AdminActionType = 
  | 'add_to_whitelist'
  | 'remove_from_whitelist'
  | 'block_user'
  | 'unblock_user'
  | 'update_role'
  | 'update_limits'
  | 'reset_daily_usage'
  | 'reset_monthly_usage'
  | 'delete_user'           // Soft delete - marks as deleted
  | 'permanent_delete_user' // Hard delete - removes all data
  | 'bulk_add_to_whitelist'
  | 'bulk_delete_users';

// ============================================================
// User Types
// ============================================================

export interface UserData {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: string | Date;
  lastLogin?: string | Date | null;
  status: 'active' | 'blocked' | 'pending' | 'deleted';
  role: 'user' | 'admin';
  deletedAt?: string | Date | null;
  apiUsage?: {
    dailyCount: number;
    monthlyCount: number;
    totalCount: number;
    lastReset?: string | Date;
    lastProvider?: string | null;
    lastOperation?: string | null;
    byProvider?: {
      groq?: { calls: number; tokens: number; cost: number };
      gemini?: { calls: number; tokens: number; cost: number };
      openrouter?: { calls: number; tokens: number; cost: number };
    };
  };
  limits?: {
    dailyLimit: number;
    monthlyLimit: number;
  };
  metadata?: {
    resumesAnalyzed: number;
    questionsGenerated: number;
    improvementsMade: number;
  };
}

// ============================================================
// Delete User Types
// ============================================================

export interface DeleteUserOptions {
  deleteFromWhitelist: boolean;
  deleteUserData: boolean;
  deleteActivityLogs: boolean;
  deleteApiUsageLogs: boolean;
}

export interface DeleteUserResult {
  success: boolean;
  deletedItems: string[];
  message?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details?: string | Record<string, unknown>;
  timestamp: string | Date;
  ipAddress?: string;
}

export interface AdminAction {
  id: string;
  adminId?: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
  timestamp: string | Date;
}

export interface WhitelistEntry {
  email: string;
  addedAt: string | Date;
  addedBy: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  notes?: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  role?: 'user' | 'admin';
}

export interface ApiUsageStats {
  dailyCount: number;
  monthlyCount: number;
  totalCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  lastReset: string | Date;
}

export interface UserAPILimitCheck {
  allowed: boolean;
  reason?: string;
  remaining: { daily: number; monthly: number };
}

export const DEFAULT_LIMITS = {
  user: { dailyLimit: 10, monthlyLimit: 300 },
  admin: { dailyLimit: 100, monthlyLimit: 300 },
};

// ============================================================
// API Provider & Usage Tracking Types
// ============================================================

export type AIProvider = 'groq' | 'gemini' | 'openrouter';

export interface APICallRecord {
  id?: string;
  userId: string;
  userEmail: string;
  provider: AIProvider;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
  cost?: number;
}

export interface ProviderStats {
  provider: AIProvider;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageLatency: number;
  estimatedCost: number;
}

export interface GlobalAPIStats {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  byProvider: {
    groq?: { calls: number; tokens: number; cost: number };
    gemini?: { calls: number; tokens: number; cost: number };
    openrouter?: { calls: number; tokens: number; cost: number };
  };
  byDay?: Record<string, { calls: number; tokens: number }>;
  lastUpdated: string | Date;
}
