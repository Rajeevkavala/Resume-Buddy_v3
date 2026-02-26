/**
 * GET /api/live-interview/history
 *
 * Returns the authenticated user's live interview history.
 * Optionally accepts ?limit=N (default 20, max 50).
 *
 * GET /api/live-interview/history?id=<sessionId>
 * Returns details for a single live interview session.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';
import {
  getUserLiveInterviews,
  getLiveInterview,
  deleteLiveInterview,
} from '@/lib/live-interview-service';

export async function GET(req: NextRequest) {
  try {
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Single session detail
    if (id) {
      const record = await getLiveInterview(id);
      if (!record || record.userId !== session.userId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(record);
    }

    // List all sessions
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1),
      50,
    );
    const records = await getUserLiveInterviews(session.userId, limit);
    return NextResponse.json({ interviews: records, total: records.length });
  } catch (error: any) {
    console.error('[LiveInterview] History error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch interview history' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    // Verify ownership
    const record = await getLiveInterview(id);
    if (!record || record.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await deleteLiveInterview(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[LiveInterview] Delete error:', error.message);
    return NextResponse.json(
      { error: 'Failed to delete interview' },
      { status: 500 },
    );
  }
}
