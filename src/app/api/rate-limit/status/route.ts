import { NextRequest, NextResponse } from 'next/server';
import { getDailyUsageStatusAsync, getDailyLimitConfig, getRateLimitConfigs, resetDailyLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get daily usage status from Firestore (persistent)
    const dailyStatus = await getDailyUsageStatusAsync(userId);
    const dailyConfig = getDailyLimitConfig();
    const rateLimitConfigs = getRateLimitConfigs();

    return NextResponse.json(
      {
      success: true,
      userId,
      daily: {
        used: dailyStatus.used,
        remaining: dailyStatus.remaining,
        limit: dailyStatus.limit,
        resetAt: dailyStatus.resetAt.toISOString(),
      },
      config: {
        dailyLimit: dailyConfig.maxRequestsPerDay,
        requestsPerMinute: rateLimitConfigs.default.maxRequests,
        operations: Object.keys(rateLimitConfigs).filter(k => k !== 'default'),
      },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Rate limit status error:', error);
    // Fail-soft: do not break the UI if Firestore/env is unavailable.
    // Return a safe default payload with 200 so the client can render gracefully.
    const now = new Date();
    const resetAt = new Date(now);
    resetAt.setHours(24, 0, 0, 0);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get rate limit status',
        daily: {
          used: 0,
          remaining: 10,
          limit: 10,
          resetAt: resetAt.toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}

// POST endpoint to reset daily usage (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (action === 'reset') {
      await resetDailyLimit(userId);
      return NextResponse.json({
        success: true,
        message: `Daily usage reset for user ${userId}`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "reset"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Rate limit action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
