// Web Audio API Synthesizer for Cyber Transformer & Supersonic Jet Effects
// Zero external assets required — synthesized directly in-browser.

class SciFiAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays the full multi-phase Transformers transformation & jet flyby soundscape:
   * 1. Mechanical servo whirrs & robotic clicks
   * 2. Jet turbine spool-up & plasma ignition
   * 3. Supersonic sonic boom and flyby whoosh towards camera
   */
  public playTransformationSequence() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master gain to keep sound comfortable
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.connect(ctx.destination);

      // --- PHASE 1: TRANSFORMER ROBOTIC CLICKS & SERVO GEARS (0s - 1.2s) ---
      const servoPitches = [220, 440, 330, 660, 550, 880, 440, 1100];
      servoPitches.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
        const startTime = now + idx * 0.12;
        const duration = 0.08;

        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 2, startTime);
        filter.Q.setValueAtTime(4, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });

      // Metallic transformation ratchet clicks (noise bursts)
      for (let i = 0; i < 6; i++) {
        const clickTime = now + 0.2 + i * 0.15;
        const bufferSize = ctx.sampleRate * 0.03;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.3));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2500, clickTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, clickTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noise.start(clickTime);
        noise.stop(clickTime + 0.03);
      }

      // --- PHASE 2: TURBINE JET ENGINE SPOOL UP (1.0s - 2.2s) ---
      const jetOsc = ctx.createOscillator();
      const jetGain = ctx.createGain();
      const jetFilter = ctx.createBiquadFilter();

      jetOsc.type = 'sawtooth';
      const spoolStart = now + 0.9;
      const spoolDuration = 1.4;

      jetOsc.frequency.setValueAtTime(120, spoolStart);
      jetOsc.frequency.exponentialRampToValueAtTime(780, spoolStart + spoolDuration);

      jetFilter.type = 'lowpass';
      jetFilter.frequency.setValueAtTime(400, spoolStart);
      jetFilter.frequency.exponentialRampToValueAtTime(2800, spoolStart + spoolDuration);

      jetGain.gain.setValueAtTime(0.001, spoolStart);
      jetGain.gain.linearRampToValueAtTime(0.25, spoolStart + 0.5);
      jetGain.gain.linearRampToValueAtTime(0.4, spoolStart + spoolDuration);

      jetOsc.connect(jetFilter);
      jetFilter.connect(jetGain);
      jetGain.connect(masterGain);

      jetOsc.start(spoolStart);
      jetOsc.stop(spoolStart + spoolDuration + 1.2);

      // --- PHASE 3: SUPERSONIC FLYBY & SONIC BOOM (2.2s - 3.4s) ---
      const boomStart = now + 2.1;

      // Low-frequency sub-bass shockwave punch
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, boomStart);
      subOsc.frequency.exponentialRampToValueAtTime(35, boomStart + 0.9);

      subGain.gain.setValueAtTime(0.001, boomStart);
      subGain.gain.linearRampToValueAtTime(0.6, boomStart + 0.06);
      subGain.gain.exponentialRampToValueAtTime(0.001, boomStart + 1.0);

      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(boomStart);
      subOsc.stop(boomStart + 1.0);

      // White noise rushing air / hypersonic whoosh right past camera
      const whooshSize = ctx.sampleRate * 1.3;
      const whooshBuffer = ctx.createBuffer(1, whooshSize, ctx.sampleRate);
      const whooshData = whooshBuffer.getChannelData(0);
      for (let i = 0; i < whooshSize; i++) {
        whooshData[i] = Math.random() * 2 - 1;
      }

      const whooshSource = ctx.createBufferSource();
      whooshSource.buffer = whooshBuffer;

      const whooshFilter = ctx.createBiquadFilter();
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.setValueAtTime(600, boomStart);
      whooshFilter.frequency.exponentialRampToValueAtTime(2400, boomStart + 0.4);
      whooshFilter.frequency.exponentialRampToValueAtTime(300, boomStart + 1.2);
      whooshFilter.Q.setValueAtTime(2.5, boomStart);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.01, boomStart);
      whooshGain.gain.linearRampToValueAtTime(0.45, boomStart + 0.35);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, boomStart + 1.2);

      whooshSource.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(masterGain);

      whooshSource.start(boomStart);
      whooshSource.stop(boomStart + 1.3);

    } catch {
      // Audio playback fails gracefully if muted or unsupported
    }
  }
}

export const soundEffects = new SciFiAudioEngine();
