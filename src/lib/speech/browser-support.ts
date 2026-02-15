'use client';

/**
 * Browser support detection for voice features
 */

export interface BrowserSupport {
  tts: boolean;      // Text-to-Speech
  stt: boolean;      // Speech-to-Text
  browser: string;   // Browser name
  supportsMonaco: boolean;
}

export function detectBrowserSupport(): BrowserSupport {
  if (typeof window === 'undefined') {
    return { tts: false, stt: false, browser: 'unknown', supportsMonaco: false };
  }

  const ua = navigator.userAgent;
  let browser = 'unknown';

  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  const tts = 'speechSynthesis' in window;
  const stt =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  return {
    tts,
    stt,
    browser,
    supportsMonaco: true, // Monaco works in all modern browsers
  };
}

/**
 * Get a user-friendly message about voice support limitations
 */
export function getVoiceSupportMessage(support: BrowserSupport): string | null {
  if (support.tts && support.stt) return null; // Full support

  if (!support.tts && !support.stt) {
    return 'Voice features are not available in this browser. You can still type your answers.';
  }

  if (!support.stt) {
    if (support.browser === 'Firefox') {
      return 'Voice input is not supported in Firefox. AI will read questions aloud — type your answers below.';
    }
    if (support.browser === 'Safari') {
      return 'Voice input may be limited in Safari. Use Chrome or Edge for the full voice experience.';
    }
    return 'Voice input is not available. Type your answers instead.';
  }

  if (!support.tts) {
    return 'Voice output is not available. Questions will be displayed as text.';
  }

  return null;
}
