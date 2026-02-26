/**
 * POST /api/live-interview/stt
 * 
 * Server-side Speech-to-Text endpoint using Sarvam AI.
 * 
 * Accepts audio in two formats:
 *   1. multipart/form-data with 'audio' file field (preferred)
 *   2. JSON with { audio: base64string, mimeType?, languageCode? }
 * 
 * The Sarvam STT API requires multipart/form-data file upload.
 * This route converts either input format to the correct API call.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sarvamSTT, isSarvamAvailable } from '@/ai/providers/sarvam';
import { getSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/auth-cookies';
import { enforceRateLimitAsync } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const sessionId = await getSessionCookie();
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await getSession(sessionId);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
    try {
      await enforceRateLimitAsync(session.userId, 'live-interview-stt');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }

    if (!isSarvamAvailable()) {
      return NextResponse.json(
        { error: 'Sarvam AI is not configured. Set SARVAM_API_KEY.' },
        { status: 503 }
      );
    }

    let audioBuffer: Buffer;
    let mimeType = 'audio/webm';
    let languageCode = 'en-IN';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData upload
      const formData = await req.formData();
      const file = formData.get('audio') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'Missing "audio" file in form data.' },
          { status: 400 }
        );
      }
      const arrayBuf = await file.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuf);
      mimeType = file.type || 'audio/webm';
      languageCode = (formData.get('languageCode') as string) || 'en-IN';
    } else {
      // Handle JSON with base64 audio
      const body = await req.json();
      const { audio, mimeType: bodyMime, languageCode: bodyLang } = body;

      if (!audio || typeof audio !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid "audio" field (base64-encoded audio required).' },
          { status: 400 }
        );
      }

      // Strip data URL prefix if present
      const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
      audioBuffer = Buffer.from(base64Data, 'base64');
      if (bodyMime) mimeType = bodyMime;
      if (bodyLang) languageCode = bodyLang;
    }

    if (audioBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Audio data is empty.' },
        { status: 400 }
      );
    }

    // Minimum audio size check (~100 bytes is essentially silence/nothing)
    if (audioBuffer.length < 100) {
      return NextResponse.json(
        { error: 'Audio too short to transcribe.' },
        { status: 400 }
      );
    }

    const result = await sarvamSTT(audioBuffer, {
      languageCode: languageCode as any,
      model: 'saarika:v2.5',
      mimeType,
    });

    return NextResponse.json({
      transcript: result.transcript || '',
      language: result.language_code,
      confidence: result.language_probability,
    });
  } catch (error: any) {
    console.error('[STT] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Speech-to-text failed' },
      { status: 500 }
    );
  }
}
