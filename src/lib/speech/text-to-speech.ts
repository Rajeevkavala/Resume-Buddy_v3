'use client';

/**
 * Voice Interviewer - Text-to-Speech using Web Speech API
 * 
 * Free, browser-native TTS with no API costs.
 * Supports Chrome, Edge, Safari, Firefox.
 */

export interface TTSConfig {
  voice?: string;
  rate?: number;    // 0.1 - 10 (default 1.0)
  pitch?: number;   // 0 - 2 (default 1.0)
  volume?: number;  // 0.0 - 1.0 (default 1.0)
}

export type TTSStatus = 'idle' | 'speaking' | 'paused' | 'loading';

export class VoiceInterviewer {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: TTSConfig;
  private statusCallbacks: Set<(status: TTSStatus) => void> = new Set();
  private voicesLoaded = false;

  constructor(config: TTSConfig = {}) {
    this.config = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      ...config,
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  /** Check if TTS is supported */
  get isSupported(): boolean {
    return this.synthesis !== null;
  }

  /** Subscribe to status changes */
  onStatusChange(callback: (status: TTSStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private emitStatus(status: TTSStatus) {
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  /** Load available voices (async on some browsers) */
  private loadVoices(): void {
    if (!this.synthesis) return;

    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      return;
    }

    // Chrome loads voices async
    this.synthesis.addEventListener('voiceschanged', () => {
      this.voicesLoaded = true;
    });
  }

  /** Get list of available voices */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /** Get a professional English voice (prefers Google/Microsoft voices) */
  private getBestVoice(): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    if (voices.length === 0) return undefined;

    // If user specified a voice, try to find it
    if (this.config.voice) {
      const match = voices.find(
        (v) => v.name.toLowerCase().includes(this.config.voice!.toLowerCase())
      );
      if (match) return match;
    }

    // Priority order for professional-sounding voices
    const preferredVoices = [
      'Google US English',
      'Microsoft David',
      'Microsoft Zira',
      'Google UK English Female',
      'Google UK English Male',
      'Samantha',
      'Alex',
    ];

    for (const preferred of preferredVoices) {
      const found = voices.find((v) => v.name.includes(preferred));
      if (found) return found;
    }

    // Fall back to first English voice
    const englishVoice = voices.find((v) => v.lang.startsWith('en'));
    return englishVoice || voices[0];
  }

  /** Speak text aloud */
  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Text-to-speech is not supported in this browser'));
        return;
      }

      // Cancel any current speech
      this.stop();

      this.emitStatus('loading');

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getBestVoice();
      if (voice) utterance.voice = voice;

      utterance.rate = this.config.rate ?? 1.0;
      utterance.pitch = this.config.pitch ?? 1.0;
      utterance.volume = this.config.volume ?? 1.0;

      utterance.onstart = () => this.emitStatus('speaking');
      utterance.onend = () => {
        this.emitStatus('idle');
        this.currentUtterance = null;
        resolve();
      };
      utterance.onerror = (event) => {
        this.emitStatus('idle');
        this.currentUtterance = null;
        // 'canceled' is not a real error
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve();
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      this.currentUtterance = utterance;

      // Chrome bug: long texts get cut off. Split into chunks.
      if (text.length > 200) {
        this.speakInChunks(text, resolve, reject);
      } else {
        this.synthesis.speak(utterance);
      }
    });
  }

  /** Split long text into sentence chunks to avoid Chrome TTS cutoff bug */
  private speakInChunks(text: string, resolve: () => void, reject: (e: Error) => void) {
    if (!this.synthesis) return;

    // Split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let index = 0;

    const speakNext = () => {
      if (index >= sentences.length) {
        this.emitStatus('idle');
        resolve();
        return;
      }

      const chunk = sentences[index].trim();
      if (!chunk) {
        index++;
        speakNext();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk);
      const voice = this.getBestVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = this.config.rate ?? 1.0;
      utterance.pitch = this.config.pitch ?? 1.0;
      utterance.volume = this.config.volume ?? 1.0;

      if (index === 0) {
        utterance.onstart = () => this.emitStatus('speaking');
      }

      utterance.onend = () => {
        index++;
        speakNext();
      };

      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') {
          this.emitStatus('idle');
          resolve();
        } else {
          this.emitStatus('idle');
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      this.currentUtterance = utterance;
      this.synthesis!.speak(utterance);
    };

    speakNext();
  }

  /** Pause current speech */
  pause() {
    if (this.synthesis?.speaking) {
      this.synthesis.pause();
      this.emitStatus('paused');
    }
  }

  /** Resume paused speech */
  resume() {
    if (this.synthesis?.paused) {
      this.synthesis.resume();
      this.emitStatus('speaking');
    }
  }

  /** Stop all speech */
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
      this.emitStatus('idle');
    }
  }

  /** Update TTS configuration */
  updateConfig(config: Partial<TTSConfig>) {
    this.config = { ...this.config, ...config };
  }

  /** Get current speaking status */
  get isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /** Get current paused status */
  get isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }
}

// Singleton instance — lazy init so SSR is safe
let _voiceInterviewer: VoiceInterviewer | null = null;

export function getVoiceInterviewer(): VoiceInterviewer {
  if (!_voiceInterviewer) {
    _voiceInterviewer = new VoiceInterviewer();
  }
  return _voiceInterviewer;
}
