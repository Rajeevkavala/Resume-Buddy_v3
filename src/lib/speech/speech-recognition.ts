'use client';

/**
 * Speech Recognition (STT) using Web Speech API
 * 
 * Free, browser-native speech recognition.
 * Chrome/Edge: Full support | Safari: Partial | Firefox: None
 */

export interface RecognitionConfig {
  language?: string;       // BCP-47 language code (default: 'en-US')
  continuous?: boolean;    // Keep recognizing after silence (default: false)
  interimResults?: boolean; // Show partial results (default: true)
  maxAlternatives?: number; // Number of alternatives (default: 1)
}

export type RecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

interface RecognitionCallbacks {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStatusChange?: (status: RecognitionStatus) => void;
}

export class SpeechRecognizer {
  private recognition: any = null; // SpeechRecognition type varies by browser
  private config: RecognitionConfig;
  private callbacks: RecognitionCallbacks = {};
  private _isListening = false;
  private _isSupported = false;

  constructor(config: RecognitionConfig = {}) {
    this.config = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      ...config,
    };

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this._isSupported = true;
        this.recognition = new SpeechRecognition();
        this.configureRecognition();
      }
    }
  }

  /** Whether STT is supported in this browser */
  get isSupported(): boolean {
    return this._isSupported;
  }

  /** Whether currently listening */
  get isListening(): boolean {
    return this._isListening;
  }

  private configureRecognition() {
    if (!this.recognition) return;

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        this.callbacks.onResult?.(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        this.callbacks.onResult?.(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorMap: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Check permissions.',
        'not-allowed': 'Microphone access denied. Please allow microphone access.',
        'network': 'Network error. Check your connection.',
        'aborted': 'Recognition was aborted.',
      };

      const message = errorMap[event.error] || `Speech recognition error: ${event.error}`;
      this.callbacks.onError?.(message);
      this.callbacks.onStatusChange?.('error');
      this._isListening = false;
    };

    this.recognition.onend = () => {
      this._isListening = false;
      this.callbacks.onStatusChange?.('idle');
      this.callbacks.onEnd?.();
    };

    this.recognition.onstart = () => {
      this._isListening = true;
      this.callbacks.onStatusChange?.('listening');
    };

    this.recognition.onspeechend = () => {
      this.callbacks.onStatusChange?.('processing');
    };
  }

  /** Start listening for speech */
  start(callbacks: RecognitionCallbacks): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    if (this._isListening) {
      this.stop();
    }

    this.callbacks = callbacks;
    this.configureRecognition();

    try {
      this.recognition.start();
    } catch (error) {
      // Already started - restart
      this.recognition.stop();
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch {
          callbacks.onError?.('Failed to start speech recognition. Please try again.');
        }
      }, 100);
    }
  }

  /** Stop listening */
  stop(): void {
    if (this.recognition && this._isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
      this._isListening = false;
    }
  }

  /** Abort listening (no final result callback) */
  abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Already aborted
      }
      this._isListening = false;
    }
  }

  /** Update recognition config */
  updateConfig(config: Partial<RecognitionConfig>) {
    this.config = { ...this.config, ...config };
    if (this.recognition) {
      this.configureRecognition();
    }
  }
}

// Singleton — lazy init so SSR is safe
let _speechRecognizer: SpeechRecognizer | null = null;

export function getSpeechRecognizer(): SpeechRecognizer {
  if (!_speechRecognizer) {
    _speechRecognizer = new SpeechRecognizer();
  }
  return _speechRecognizer;
}
