/**
 * Sarvam AI Provider
 * 
 * Indian AI provider for voice interactions.
 * APIs: STT (Saarika/Saaras), TTS (Bulbul v2/v3), LLM (Sarvam-M)
 * 
 * Used primarily for real-time live interview voice pipeline:
 *   User speaks -> Sarvam STT -> AI generates -> Sarvam TTS -> User hears
 * 
 * API Docs: https://docs.sarvam.ai/api-reference-docs
 * 
 * IMPORTANT: STT endpoint uses multipart/form-data (file upload).
 *            TTS endpoint uses JSON with `text` (string, not array).
 *            Speakers & params are model-specific (v2 vs v3).
 */

// --- Types ---

export interface SarvamSTTResponse {
  request_id?: string | null;
  transcript: string;
  language_code: string | null;
  language_probability?: number | null;
  timestamps?: {
    words?: string[];
    start_time_seconds?: number[];
    end_time_seconds?: number[];
  } | null;
}

export interface SarvamTTSResponse {
  request_id?: string | null;
  audios: string[];  // base64-encoded WAV audio
}

export type SarvamTTSLanguage =
  | 'hi-IN' | 'en-IN' | 'bn-IN' | 'gu-IN' | 'kn-IN'
  | 'ml-IN' | 'mr-IN' | 'od-IN' | 'pa-IN' | 'ta-IN' | 'te-IN';

// bulbul:v2 speakers (7 total)
export type SarvamV2Speaker =
  | 'anushka' | 'manisha' | 'vidya' | 'arya'   // female
  | 'abhilash' | 'karun' | 'hitesh';            // male

// bulbul:v3 speakers (39 total)
export type SarvamV3Speaker =
  | 'shubh' | 'aditya' | 'ritu' | 'priya' | 'neha' | 'rahul'
  | 'pooja' | 'rohan' | 'simran' | 'kavya' | 'amit' | 'dev'
  | 'ishita' | 'shreya' | 'ratan' | 'varun' | 'manan' | 'sumit'
  | 'roopa' | 'kabir' | 'aayan' | 'ashutosh' | 'advait' | 'amelia'
  | 'sophia' | 'anand' | 'tanya' | 'tarun' | 'sunny' | 'mani'
  | 'gokul' | 'vijay' | 'shruti' | 'suhani' | 'mohit' | 'kavitha'
  | 'rehan' | 'soham' | 'rupali';

export type SarvamTTSSpeaker = SarvamV2Speaker | SarvamV3Speaker;

export type SarvamTTSModel = 'bulbul:v2' | 'bulbul:v3';
export type SarvamSTTModel = 'saarika:v2.5' | 'saaras:v3';

export interface SarvamSTTOptions {
  languageCode?: SarvamTTSLanguage | 'unknown';
  model?: SarvamSTTModel;
  withTimestamps?: boolean;
  /** Only for saaras:v3 */
  mode?: 'transcribe' | 'translate' | 'verbatim' | 'translit' | 'codemix';
  /** Mime type of the audio being sent (helps API decode) */
  mimeType?: string;
}

export interface SarvamTTSOptions {
  targetLanguageCode?: SarvamTTSLanguage;
  speaker?: SarvamTTSSpeaker;
  model?: SarvamTTSModel;
  /** Only for bulbul:v2 -- range: -0.75 to 0.75 */
  pitch?: number;
  /** bulbul:v2: 0.3-3.0, bulbul:v3: 0.5-2.0 */
  pace?: number;
  /** Only for bulbul:v2 -- range: 0.3-3.0 */
  loudness?: number;
  speechSampleRate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000;
  /** Only for bulbul:v2 */
  enablePreprocessing?: boolean;
  /** Only for bulbul:v3 -- range: 0.01-2.0, default 0.6 */
  temperature?: number;
}

export interface SarvamLLMOptions {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

// --- Configuration ---

const SARVAM_API_BASE = 'https://api.sarvam.ai';

function getApiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error('SARVAM_API_KEY environment variable not set');
  return key;
}

export function isSarvamAvailable(): boolean {
  return !!process.env.SARVAM_API_KEY;
}

// --- Speaker Validation ---

const V2_SPEAKERS: Set<string> = new Set([
  'anushka', 'manisha', 'vidya', 'arya', 'abhilash', 'karun', 'hitesh',
]);

const V3_SPEAKERS: Set<string> = new Set([
  'shubh', 'aditya', 'ritu', 'priya', 'neha', 'rahul', 'pooja', 'rohan',
  'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 'ratan', 'varun',
  'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'ashutosh', 'advait',
  'amelia', 'sophia', 'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul',
  'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 'soham', 'rupali',
]);

/** Get default speaker for a model */
function getDefaultSpeaker(model: SarvamTTSModel): string {
  return model === 'bulbul:v3' ? 'shubh' : 'anushka';
}

/** Validate speaker is compatible with model; fallback to default if not */
function validateSpeaker(speaker: string | undefined, model: SarvamTTSModel): string {
  if (!speaker) return getDefaultSpeaker(model);
  const lc = speaker.toLowerCase();
  const validSet = model === 'bulbul:v3' ? V3_SPEAKERS : V2_SPEAKERS;
  if (validSet.has(lc)) return lc;
  console.warn(`[Sarvam] Speaker "${speaker}" not compatible with ${model}, falling back to default`);
  return getDefaultSpeaker(model);
}

// --- Speech-to-Text (Saarika/Saaras) ---

/**
 * Convert audio buffer to text using Sarvam STT.
 * 
 * CRITICAL: The API requires multipart/form-data with a `file` field.
 * We accept a Buffer (from server-side route handler) and build FormData.
 * 
 * @param audioBuffer - Raw audio bytes (Buffer or Uint8Array)
 * @param options - STT configuration
 * @returns Transcript and metadata
 */
export async function sarvamSTT(
  audioBuffer: Buffer | Uint8Array,
  options: SarvamSTTOptions = {}
): Promise<SarvamSTTResponse> {
  const {
    languageCode = 'en-IN',
    model = 'saarika:v2.5',
    withTimestamps = false,
    mode,
    mimeType = 'audio/webm',
  } = options;

  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/wav': 'wav',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/flac': 'flac',
  };
  const ext = extMap[mimeType] || 'webm';

  // Build multipart form-data using standard FormData + Blob
  // Copy to a plain ArrayBuffer so TS Blob types are satisfied (Buffer.buffer may be SharedArrayBuffer)
  const ab = new ArrayBuffer(audioBuffer.byteLength);
  new Uint8Array(ab).set(new Uint8Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength));
  const blob = new Blob([ab], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, `audio.${ext}`);

  // Append optional params
  if (languageCode) {
    formData.append('language_code', languageCode);
  }
  formData.append('model', model);
  if (withTimestamps) {
    formData.append('with_timestamps', 'true');
  }
  if (mode && model === 'saaras:v3') {
    formData.append('mode', mode);
  }

  const response = await fetch(`${SARVAM_API_BASE}/speech-to-text`, {
    method: 'POST',
    headers: {
      // DO NOT set Content-Type -- fetch/FormData sets correct multipart boundary
      'api-subscription-key': getApiKey(),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sarvam STT failed (${response.status}): ${err}`);
  }

  return response.json();
}

/**
 * Convert audio to text with translation to English.
 * Also uses multipart/form-data file upload.
 */
export async function sarvamSTTTranslate(
  audioBuffer: Buffer | Uint8Array,
  options: { languageCode?: SarvamTTSLanguage | 'unknown'; mimeType?: string } = {}
): Promise<SarvamSTTResponse> {
  const { languageCode = 'en-IN', mimeType = 'audio/webm' } = options;

  const ab = new ArrayBuffer(audioBuffer.byteLength);
  new Uint8Array(ab).set(new Uint8Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength));
  const blob = new Blob([ab], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'saaras:v2.5');
  if (languageCode) {
    formData.append('language_code', languageCode);
  }

  const response = await fetch(`${SARVAM_API_BASE}/speech-to-text-translate`, {
    method: 'POST',
    headers: {
      'api-subscription-key': getApiKey(),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sarvam STT-Translate failed (${response.status}): ${err}`);
  }

  return response.json();
}

// --- Text-to-Speech (Bulbul) ---

/**
 * Convert text to speech using Sarvam Bulbul TTS.
 * Returns base64-encoded WAV audio.
 * 
 * Model limits:
 *   - bulbul:v3: max 2500 chars   (default sample rate: 24000)
 *   - bulbul:v2: max 1500 chars
 * 
 * Speaker must match model version (validated automatically).
 */
export async function sarvamTTS(
  text: string,
  options: SarvamTTSOptions = {}
): Promise<SarvamTTSResponse> {
  const model = options.model ?? 'bulbul:v3';
  const speaker = validateSpeaker(options.speaker, model);
  const targetLanguageCode = options.targetLanguageCode ?? 'en-IN';
  const pace = options.pace ?? 1.0;
  const speechSampleRate = options.speechSampleRate ?? 24000;

  // Build model-specific body
  const body: Record<string, unknown> = {
    text,                           // SINGULAR `text`, NOT `inputs` array
    target_language_code: targetLanguageCode,
    speaker,
    model,
    pace,
    speech_sample_rate: speechSampleRate,
  };

  if (model === 'bulbul:v2') {
    // v2-only parameters
    body.pitch = options.pitch ?? 0;
    body.loudness = options.loudness ?? 1.0;
    body.enable_preprocessing = options.enablePreprocessing ?? true;
  } else if (model === 'bulbul:v3') {
    // v3-only parameters
    body.temperature = options.temperature ?? 0.6;
    // v3 does NOT support pitch, loudness, or enable_preprocessing
  }

  const response = await fetch(`${SARVAM_API_BASE}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': getApiKey(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sarvam TTS failed (${response.status}): ${err}`);
  }

  return response.json();
}

/**
 * Split long text and generate TTS for each chunk.
 * 
 * Chunk limits:
 *   - bulbul:v3: max 2500 chars -> chunk at 2400
 *   - bulbul:v2: max 1500 chars -> chunk at 1400
 */
export async function sarvamTTSLongText(
  text: string,
  options: SarvamTTSOptions = {}
): Promise<string[]> {
  const model = options.model ?? 'bulbul:v3';
  const maxChunkSize = model === 'bulbul:v3' ? 2400 : 1400;

  // Split by sentences, keeping under limit per chunk
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChunkSize) {
      if (current.trim()) chunks.push(current.trim());
      // If single sentence exceeds limit, split by words
      if (sentence.length > maxChunkSize) {
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + ' ' + word).length > maxChunkSize) {
            if (wordChunk.trim()) chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk = wordChunk ? wordChunk + ' ' + word : word;
          }
        }
        current = wordChunk;
      } else {
        current = sentence;
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  if (chunks.length === 0) return [];

  const audioChunks: string[] = [];
  const batchSize = 3;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(chunk => sarvamTTS(chunk, options))
    );
    for (const result of results) {
      audioChunks.push(...result.audios);
    }
  }

  return audioChunks;
}

// --- LLM Generation ---

/**
 * Generate text using Sarvam LLM (OpenAI-compatible endpoint).
 */
export async function generateWithSarvam({
  prompt,
  systemPrompt,
  temperature = 0.7,
  maxTokens = 4096,
  jsonMode = true,
}: SarvamLLMOptions): Promise<string> {
  const response = await fetch(`${SARVAM_API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': getApiKey(),
    },
    body: JSON.stringify({
      model: 'sarvam-m',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sarvam LLM failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Sarvam LLM');
  }

  return content;
}

// --- Provider Export ---

export const sarvamProvider = {
  name: 'sarvam',
  priority: 4,
  dailyLimit: 10000,
  rateLimit: 50,
  generate: generateWithSarvam,
  isAvailable: isSarvamAvailable,
  stt: sarvamSTT,
  sttTranslate: sarvamSTTTranslate,
  tts: sarvamTTS,
  ttsLongText: sarvamTTSLongText,
};
