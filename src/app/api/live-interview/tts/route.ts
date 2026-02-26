/**
 * POST /api/live-interview/tts
 * 
 * Server-side Text-to-Speech endpoint using Sarvam AI Bulbul.
 * Returns base64-encoded WAV audio for low-latency playback.
 * 
 * Default model: bulbul:v3 (latest, 2500 char limit, 39 speakers)
 * Default speaker: shubh (v3 default)
 * Default sample rate: 24000 Hz
 */
import { NextRequest, NextResponse } from 'next/server';
import { sarvamTTS, sarvamTTSLongText, isSarvamAvailable } from '@/ai/providers/sarvam';
import type { SarvamTTSModel, SarvamTTSSpeaker } from '@/ai/providers/sarvam';
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
      await enforceRateLimitAsync(session.userId, 'live-interview-tts');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }

    if (!isSarvamAvailable()) {
      return NextResponse.json(
        { error: 'Sarvam AI is not configured. Set SARVAM_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      text,
      speaker = 'shubh',
      pace = 1.0,
      languageCode = 'en-IN',
      model = 'bulbul:v3',
    } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "text" field.' },
        { status: 400 }
      );
    }

    const ttsModel = model as SarvamTTSModel;
    const maxLen = ttsModel === 'bulbul:v3' ? 2500 : 1500;

    // Use long-text chunking for texts exceeding model limit
    if (text.length > maxLen) {
      const audioChunks = await sarvamTTSLongText(text, {
        targetLanguageCode: languageCode,
        speaker: speaker as SarvamTTSSpeaker,
        model: ttsModel,
        pace,
        speechSampleRate: 24000,
      });

      return NextResponse.json({ audios: audioChunks });
    }

    const result = await sarvamTTS(text, {
      targetLanguageCode: languageCode,
      speaker: speaker as SarvamTTSSpeaker,
      model: ttsModel,
      pace,
      speechSampleRate: 24000,
    });

    return NextResponse.json({ audios: result.audios });
  } catch (error: any) {
    console.error('[TTS] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Text-to-speech failed' },
      { status: 500 }
    );
  }
}
