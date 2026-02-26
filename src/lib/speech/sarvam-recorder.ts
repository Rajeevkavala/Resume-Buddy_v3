'use client';

/**
 * Sarvam Audio Recorder
 * 
 * Captures audio from microphone using MediaRecorder API,
 * sends to server-side STT endpoint, and handles the full
 * record -> transcribe -> callback pipeline.
 * 
 * Features:
 * - Robust mic permission handling with user-friendly errors
 * - VAD (Voice Activity Detection) via AudioContext analyser
 * - Auto-stop after silence threshold
 * - Sends base64 audio + mime type to server for correct STT handling
 * - Edge case handling: no mic, denied permission, empty audio, etc.
 */

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

export interface AudioRecorderConfig {
  silenceThreshold?: number;     // dB level below which is "silence" (default: -45)
  silenceTimeout?: number;       // ms of silence before auto-stop (default: 2500)
  maxRecordingTime?: number;     // max recording duration in ms (default: 90000)
  sampleRate?: number;           // audio sample rate (default: 16000)
  mimeType?: string;             // preferred MIME type (auto-detected)
}

interface RecorderCallbacks {
  onStatusChange?: (status: RecorderStatus) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export class SarvamAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxTimer: ReturnType<typeof setTimeout> | null = null;
  private config: Required<AudioRecorderConfig>;
  private callbacks: RecorderCallbacks = {};
  private _status: RecorderStatus = 'idle';
  private _isSupported = false;
  private _actualMimeType: string = 'audio/webm';
  private _permissionGranted = false;

  constructor(config: AudioRecorderConfig = {}) {
    this.config = {
      silenceThreshold: config.silenceThreshold ?? -45,
      silenceTimeout: config.silenceTimeout ?? 2500,
      maxRecordingTime: config.maxRecordingTime ?? 90000,
      sampleRate: config.sampleRate ?? 16000,
      mimeType: config.mimeType || '',
    };

    if (typeof window !== 'undefined') {
      this._isSupported = !!(navigator.mediaDevices?.getUserMedia) && !!window.MediaRecorder;
      // Detect best mime type
      if (!this.config.mimeType) {
        this.config.mimeType = this.getPreferredMimeType();
      }
    }
  }

  get isSupported(): boolean { return this._isSupported; }
  get status(): RecorderStatus { return this._status; }
  get isRecording(): boolean { return this._status === 'recording'; }
  get permissionGranted(): boolean { return this._permissionGranted; }

  private setStatus(status: RecorderStatus) {
    this._status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private getPreferredMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    // Prefer opus codec for better compression and quality
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
  }

  /**
   * Request microphone permission without starting recording.
   * Useful for pre-checking permission before the interview starts.
   */
  async requestPermission(): Promise<boolean> {
    if (!this._isSupported) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      // Permission granted - release the stream immediately
      stream.getTracks().forEach(track => track.stop());
      this._permissionGranted = true;
      return true;
    } catch (error: any) {
      this._permissionGranted = false;
      return false;
    }
  }

  /**
   * Start recording audio from microphone
   */
  async start(callbacks: RecorderCallbacks): Promise<void> {
    if (!this._isSupported) {
      callbacks.onError?.('Audio recording is not supported in this browser. Please use Chrome, Edge, or Firefox.');
      return;
    }

    // Stop any existing recording
    if (this.isRecording) {
      this.stop();
      // Brief delay to let cleanup finish
      await new Promise(r => setTimeout(r, 100));
    }

    this.callbacks = callbacks;
    this.audioChunks = [];
    this.setStatus('requesting');

    try {
      // Request microphone access with optimal settings for speech
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: this.config.sampleRate },
          channelCount: 1,
        },
      });
      this._permissionGranted = true;

      // Verify we actually got audio tracks
      const audioTracks = this.stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw { name: 'NotFoundError', message: 'No audio track in stream' };
      }

      // Setup audio analysis for level monitoring and VAD
      try {
        this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
        // Resume AudioContext if suspended (Chrome autoplay policy)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        source.connect(this.analyser);
      } catch (audioCtxErr) {
        // AudioContext failure is non-fatal - recording still works
        console.warn('[SarvamRecorder] AudioContext setup failed:', audioCtxErr);
      }

      // Determine the actual mime type MediaRecorder will use
      let recorderOptions: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported(this.config.mimeType)) {
        recorderOptions.mimeType = this.config.mimeType;
        this._actualMimeType = this.config.mimeType;
      } else {
        // Let browser choose
        this._actualMimeType = 'audio/webm';
      }

      // Start MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('[SarvamRecorder] MediaRecorder error:', event);
        this.callbacks.onError?.('Recording error occurred. Please try again.');
        this.cleanup();
        this.setStatus('error');
      };

      this.mediaRecorder.onstop = async () => {
        this.stopAnalysis();
        this.setStatus('processing');
        
        try {
          if (this.audioChunks.length === 0) {
            throw new Error('No audio data captured. Please try speaking louder.');
          }

          const audioBlob = new Blob(this.audioChunks, { type: this._actualMimeType });
          
          // Check minimum blob size (very small = likely empty/noise)
          if (audioBlob.size < 500) {
            throw new Error('Audio too short. Please speak for longer.');
          }

          const base64 = await this.blobToBase64(audioBlob);
          
          // Send to STT API with mime type info
          const response = await fetch('/api/live-interview/stt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64,
              mimeType: this._actualMimeType,
            }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'STT request failed' }));
            throw new Error(err.error || `STT failed with status ${response.status}`);
          }

          const result = await response.json();
          
          if (!result.transcript || result.transcript.trim().length === 0) {
            // No speech detected
            this.callbacks.onTranscript?.('', true);
            this.callbacks.onError?.('No speech detected. Please try again and speak clearly.');
          } else {
            this.callbacks.onTranscript?.(result.transcript, true);
          }
        } catch (error: any) {
          console.error('[SarvamRecorder] STT error:', error);
          this.callbacks.onError?.(error.message || 'Failed to transcribe audio');
        }

        this.setStatus('idle');
        this.callbacks.onRecordingStop?.();
      };

      // Start collecting data every 250ms
      this.mediaRecorder.start(250);
      this.setStatus('recording');
      this.callbacks.onRecordingStart?.();

      // Start audio level monitoring (if AudioContext is available)
      if (this.analyser) {
        this.monitorAudioLevel();
      }

      // Set max recording timeout
      this.maxTimer = setTimeout(() => {
        if (this.isRecording) {
          console.log('[SarvamRecorder] Max recording time reached');
          this.stop();
        }
      }, this.config.maxRecordingTime);

    } catch (error: any) {
      this.cleanup();
      this.setStatus('error');

      let msg: string;
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          msg = 'Microphone access was denied. Please allow microphone access in your browser settings and try again.';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          msg = 'No microphone found. Please connect a microphone and try again.';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          msg = 'Microphone is being used by another application. Please close other apps using the mic and try again.';
          break;
        case 'OverconstrainedError':
          msg = 'Microphone does not support the required settings. Trying with default settings...';
          // Try again with minimal constraints
          try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            await this.start(callbacks);
            return;
          } catch {
            msg = 'Could not access microphone with any settings.';
          }
          break;
        case 'SecurityError':
          msg = 'Microphone access is blocked by browser security policy. Make sure you are on HTTPS.';
          break;
        default:
          msg = `Microphone error: ${error.message || 'Unknown error'}`;
      }
      this.callbacks.onError?.(msg);
    }
  }

  /**
   * Stop recording and trigger transcription
   */
  stop(): void {
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // MediaRecorder may already be stopped
        console.warn('[SarvamRecorder] stop() called on inactive recorder');
      }
    }

    // Release microphone
    this.releaseStream();
  }

  /**
   * Cancel recording without processing
   */
  cancel(): void {
    // Detach onstop handler to prevent transcription
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
    }
    this.audioChunks = [];
    this.stop();
    this.cleanup();
    this.setStatus('idle');
  }

  /**
   * Monitor audio levels for visualization and VAD
   */
  private monitorAudioLevel() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const check = () => {
      if (!this.analyser || this._status !== 'recording') return;

      this.analyser.getFloatTimeDomainData(dataArray);

      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = 20 * Math.log10(Math.max(rms, 1e-10));
      const normalizedLevel = Math.max(0, Math.min(1, (db + 60) / 60));

      this.callbacks.onAudioLevel?.(normalizedLevel);

      // Voice Activity Detection
      if (db < this.config.silenceThreshold) {
        // Silence detected
        if (!this.silenceTimer && this.audioChunks.length > 0) {
          this.silenceTimer = setTimeout(() => {
            if (this.isRecording && this.audioChunks.length > 0) {
              console.log('[SarvamRecorder] Auto-stop: silence threshold reached');
              this.stop();
            }
          }, this.config.silenceTimeout);
        }
      } else {
        // Voice detected, reset silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      }

      this.animFrameId = requestAnimationFrame(check);
    };

    this.animFrameId = requestAnimationFrame(check);
  }

  private stopAnalysis() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }

  private releaseStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.stream = null;
    }
  }

  private cleanup() {
    this.stopAnalysis();
    this.releaseStream();
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Convert Blob to base64 string (without data: prefix)
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data:audio/...;base64, prefix
        const commaIdx = result.indexOf(',');
        const base64 = commaIdx >= 0 ? result.substring(commaIdx + 1) : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read audio data'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.cancel();
    this.cleanup();
  }
}

// Singleton - lazy init for SSR safety
let _recorder: SarvamAudioRecorder | null = null;

export function getSarvamRecorder(config?: AudioRecorderConfig): SarvamAudioRecorder {
  if (!_recorder) {
    _recorder = new SarvamAudioRecorder(config);
  }
  return _recorder;
}

/**
 * Reset the singleton recorder (useful for config changes)
 */
export function resetSarvamRecorder(): void {
  _recorder?.destroy();
  _recorder = null;
}
