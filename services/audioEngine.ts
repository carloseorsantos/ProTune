import { autoCorrelate, getNoteFromFrequency } from '../utils/tunerMath';
import { DetectedPitch } from '../types';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private isListening: boolean = false;
  private stream: MediaStream | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  async init() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);
  }

  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async start(onPitchDetected: (pitch: DetectedPitch | null) => void, sensitivity: number = 0.5, a4: number = 440) {
    try {
      if (!this.audioContext) await this.init();

      // Check if mediaDevices exists (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         throw new Error("Browser API not supported. App must be served over HTTPS.");
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          latency: 0 
        } as any
      });

      this.mediaStreamSource = this.audioContext!.createMediaStreamSource(this.stream);
      this.mediaStreamSource.connect(this.analyser!);
      
      this.isListening = true;
      this.detectPitchLoop(onPitchDetected, sensitivity, a4);

      // Attempt to resume context if suspended, but don't await/block
      // This handles autoplay policies where a gesture might be needed later
      this.resume().catch(() => {
          console.log("AudioContext resume pending user gesture.");
      });

    } catch (err) {
      console.error("Microphone access denied or error", err);
      throw err;
    }
  }

  stop() {
    this.isListening = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    // We keep the AudioContext alive but disconnect sources
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
  }

  playTone(frequency: number) {
    if (!this.audioContext) this.init();
    
    // Ensure context is running for playback
    this.resume();

    if (this.osc) this.stopTone();

    this.osc = this.audioContext!.createOscillator();
    this.gainNode = this.audioContext!.createGain();

    this.osc.type = 'sine';
    this.osc.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);
    
    this.gainNode.gain.setValueAtTime(0.1, this.audioContext!.currentTime); // Low volume
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 2); // Fade out

    this.osc.connect(this.gainNode);
    this.gainNode.connect(this.audioContext!.destination);
    
    this.osc.start();
    this.osc.stop(this.audioContext!.currentTime + 2);
  }

  stopTone() {
    if (this.osc) {
      try {
        this.osc.stop();
      } catch (e) {}
      this.osc.disconnect();
      this.osc = null;
    }
  }

  private detectPitchLoop(callback: (pitch: DetectedPitch | null) => void, sensitivity: number, a4: number) {
    if (!this.isListening || !this.analyser) return;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const { frequency, clarity } = autoCorrelate(this.buffer, this.audioContext!.sampleRate, sensitivity);

    if (frequency === -1) {
      callback(null);
    } else {
      const { name, octave, cents, targetFrequency } = getNoteFromFrequency(frequency, a4);
      callback({
        frequency,
        note: name,
        octave,
        deviation: cents,
        clarity: clarity
      });
    }

    requestAnimationFrame(() => this.detectPitchLoop(callback, sensitivity, a4));
  }
}

export const audioEngine = new AudioEngine();