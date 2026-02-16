import { NextRequest, NextResponse } from 'next/server';
import {
  cleanupOldLogs,
  emergencyCleanup,
  getDatabaseStats,
  getLogCount,
  runScheduledCleanup,
} from '@/lib/admin/database-cleanup';

/**
 * Database Cleanup API Endpoint
 * 
 * GET - Get database statistics
 * POST - Run cleanup operation
 * 
 * Body for POST:
 * {
 *   action: 'cleanup' | 'emergency' | 'scheduled',
 *   retentionDays?: number
 * }
 */

// Helper to verify admin
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;
    
    // In production, verify the token and check admin role
    // For now, we'll check the admin API key or token
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey && authHeader === `Bearer ${adminKey}`) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get database statistics
    const stats = await getDatabaseStats();
    const logCount = await getLogCount();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        totalLogCount: logCount,
        recommendations: getRecommendations(stats),
      },
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get database statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, retentionDays } = body;

    // Admin verification required for all cleanup actions
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let result;

    switch (action) {
      case 'cleanup':
        console.log('🧹 Running standard cleanup...');
        result = await cleanupOldLogs(retentionDays || 7);
        break;

      case 'emergency':
        console.log('🚨 Running emergency cleanup...');
        result = await emergencyCleanup(retentionDays || 3);
        break;

      case 'scheduled':
        console.log('🕐 Running scheduled cleanup...');
        result = await runScheduledCleanup();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: cleanup, emergency, or scheduled' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      data: {
        deletedCount: result.deletedCount,
        aggregatedCount: result.aggregatedCount,
        durationMs: result.duration,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Error running cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run cleanup operation' },
      { status: 500 }
    );
  }
}

function getRecommendations(stats: {
  totalLogs: number;
  logsOlderThan7Days: number;
  logsOlderThan30Days: number;
}): string[] {
  const recommendations: string[] = [];

  if (stats.logsOlderThan30Days > 1000) {
    recommendations.push(
      '🚨 Critical: Over 1000 logs older than 30 days. Run emergency cleanup immediately.'
    );
  }

  if (stats.logsOlderThan7Days > 5000) {
    recommendations.push(
      '⚠️ Warning: Over 5000 logs older than 7 days. Consider running standard cleanup.'
    );
  }

  if (stats.totalLogs > 50000) {
    recommendations.push(
      '📊 Info: Database has over 50,000 logs. Set up automated scheduled cleanup.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Database is healthy. No immediate action needed.');
  }

  return recommendations;
}
