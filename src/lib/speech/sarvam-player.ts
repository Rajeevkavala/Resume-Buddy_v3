'use client';

/**
 * Sarvam Audio Player
 * 
 * Plays base64-encoded audio from Sarvam TTS API.
 * Supports queued playback of multiple audio chunks
 * for seamless long-text speech output.
 * 
 * Features:
 * - Queue-based playback for chunked TTS
 * - AudioContext for low-latency playback
 * - Volume control
 * - Pause/Resume/Stop
 * - Audio level visualization callback
 */

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused';

interface PlayerCallbacks {
  onStatusChange?: (status: PlayerStatus) => void;
  onAudioLevel?: (level: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export class SarvamAudioPlayer {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private audioQueue: string[] = [];
  private isProcessing = false;
  private callbacks: PlayerCallbacks = {};
  private _status: PlayerStatus = 'idle';
  private _volume = 1.0;
  private pausePosition = 0;
  private currentBuffer: AudioBuffer | null = null;
  private startTime = 0;

  get status(): PlayerStatus { return this._status; }
  get isPlaying(): boolean { return this._status === 'playing'; }
  
  get volume(): number { return this._volume; }
  set volume(val: number) {
    this._volume = Math.max(0, Math.min(1, val));
    if (this.gainNode) {
      this.gainNode.gain.value = this._volume;
    }
  }

  private setStatus(status: PlayerStatus) {
    this._status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      // Use 24000 Hz to match Sarvam TTS default output sample rate
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this._volume;
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    return this.audioContext;
  }

  /**
   * Play base64-encoded audio with callbacks
   */
  async play(audioBase64: string | string[], callbacks: PlayerCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;
    this.stop();

    const chunks = Array.isArray(audioBase64) ? audioBase64 : [audioBase64];
    this.audioQueue = [...chunks];
    
    this.setStatus('loading');
    await this.processQueue();
  }

  /**
   * Add audio chunks to the queue (for streaming)
   */
  enqueue(audioBase64: string | string[]): void {
    const chunks = Array.isArray(audioBase64) ? audioBase64 : [audioBase64];
    this.audioQueue.push(...chunks);
    
    if (!this.isProcessing && this._status !== 'playing') {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.audioQueue.length === 0) {
      if (this.audioQueue.length === 0 && !this.isProcessing) {
        this.setStatus('idle');
        this.stopVisualization();
        this.callbacks.onComplete?.();
      }
      return;
    }

    this.isProcessing = true;
    const base64Audio = this.audioQueue.shift()!;

    try {
      const ctx = this.getAudioContext();
      
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Try to decode as WAV first, then as raw audio
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      } catch {
        // If decoding fails, try wrapping in a WAV header (24000 Hz matches Sarvam default)
        try {
          const wavBuffer = this.createWavBuffer(bytes, 24000);
          audioBuffer = await ctx.decodeAudioData(wavBuffer);
        } catch (innerErr) {
          // Try without specifying sample rate — let the context decide
          try {
            const wavBuffer = this.createWavBuffer(bytes, ctx.sampleRate);
            audioBuffer = await ctx.decodeAudioData(wavBuffer);
          } catch {
            throw new Error('Could not decode audio data in any format');
          }
        }
      }

      this.currentBuffer = audioBuffer;
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode!);
      
      source.onended = () => {
        this.currentSource = null;
        this.isProcessing = false;
        this.processQueue(); // Play next chunk
      };

      this.currentSource = source;
      this.startTime = ctx.currentTime;
      this.pausePosition = 0;
      source.start(0);
      
      this.setStatus('playing');
      this.startVisualization();
    } catch (error: any) {
      console.error('[SarvamPlayer] Playback error:', error);
      this.isProcessing = false;
      this.callbacks.onError?.(error.message || 'Audio playback failed');
      this.processQueue(); // Try next chunk
    }
  }

  /**
   * Create a minimal WAV header for raw PCM data
   */
  private createWavBuffer(pcmData: Uint8Array, sampleRate: number): ArrayBuffer {
    const header = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(header);
    
    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    this.writeString(view, 8, 'WAVE');
    
    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);         // chunk size
    view.setUint16(20, 1, true);          // PCM format
    view.setUint16(22, 1, true);          // mono
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true);          // block align
    view.setUint16(34, 16, true);         // bits per sample
    
    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true);
    
    // Copy PCM data
    const output = new Uint8Array(header);
    output.set(pcmData, 44);
    
    return header;
  }

  private writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this._status === 'playing' && this.currentSource && this.audioContext) {
      this.pausePosition = this.audioContext.currentTime - this.startTime;
      this.currentSource.stop();
      this.currentSource = null;
      this.setStatus('paused');
      this.stopVisualization();
    }
  }

  /**
   * Resume playback from paused position
   */
  resume(): void {
    if (this._status !== 'paused' || !this.currentBuffer || !this.gainNode) return;

    const ctx = this.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = this.currentBuffer;
    source.connect(this.gainNode);
    
    source.onended = () => {
      this.currentSource = null;
      this.isProcessing = false;
      this.processQueue();
    };

    this.currentSource = source;
    this.startTime = ctx.currentTime - this.pausePosition;
    source.start(0, this.pausePosition);
    
    this.setStatus('playing');
    this.startVisualization();
  }

  /**
   * Stop all playback and clear queue
   */
  stop(): void {
    this.audioQueue = [];
    this.isProcessing = false;

    if (this.currentSource) {
      try { this.currentSource.stop(); } catch { /* already stopped */ }
      this.currentSource = null;
    }

    this.currentBuffer = null;
    this.pausePosition = 0;
    this.stopVisualization();
    this.setStatus('idle');
  }

  private startVisualization() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const visualize = () => {
      if (this._status !== 'playing') return;
      
      this.analyser!.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avgLevel = sum / (bufferLength * 255); // 0-1
      
      this.callbacks.onAudioLevel?.(avgLevel);
      this.animFrameId = requestAnimationFrame(visualize);
    };

    this.animFrameId = requestAnimationFrame(visualize);
  }

  private stopVisualization() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.callbacks.onAudioLevel?.(0);
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
    this.gainNode = null;
    this.analyser = null;
  }
}

// Singleton
let _player: SarvamAudioPlayer | null = null;

export function getSarvamPlayer(): SarvamAudioPlayer {
  if (!_player) {
    _player = new SarvamAudioPlayer();
  }
  return _player;
}
