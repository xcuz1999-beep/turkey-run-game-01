// All sound is synthesised with WebAudio: no audio files, nothing fetched. A small
// autumn tune loops under the run, and every game event has its own little voice —
// the gobble, the corn pluck, the oven hiss, the alarm when the farmer spots you.
export class AudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOn = false;
  }

  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone({ frequency, endFrequency = null, duration = 0.15, type = 'sine', volume = 0.25, when = 0, slide = false }) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== null) {
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
      else osc.frequency.setValueAtTime(endFrequency, start + duration * 0.6);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  noise({ duration = 0.2, volume = 0.2, when = 0, low = 400, high = 2400 }) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (low + high) / 2;
    filter.Q.value = 0.8;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
    source.stop(start + duration);
  }

  // The turkey's signature: three quick descending gobbles.
  gobble() {
    this.tone({ frequency: 420, endFrequency: 240, duration: 0.09, type: 'square', volume: 0.12 });
    this.tone({ frequency: 380, endFrequency: 210, duration: 0.09, type: 'square', volume: 0.12, when: 0.1 });
    this.tone({ frequency: 520, endFrequency: 260, duration: 0.14, type: 'square', volume: 0.14, when: 0.2 });
  }

  jump() {
    this.tone({ frequency: 280, endFrequency: 640, duration: 0.16, type: 'triangle', volume: 0.2, slide: true });
  }

  corn() {
    this.tone({ frequency: 880, duration: 0.07, type: 'sine', volume: 0.2 });
    this.tone({ frequency: 1320, duration: 0.1, type: 'sine', volume: 0.18, when: 0.06 });
  }

  thud() {
    this.noise({ duration: 0.18, volume: 0.3, low: 120, high: 500 });
    this.tone({ frequency: 140, endFrequency: 60, duration: 0.18, type: 'sine', volume: 0.3, slide: true });
  }

  hiss() {
    this.noise({ duration: 0.5, volume: 0.16, low: 2000, high: 6000 });
  }

  alarm() {
    this.tone({ frequency: 660, duration: 0.12, type: 'sawtooth', volume: 0.16 });
    this.tone({ frequency: 660, duration: 0.12, type: 'sawtooth', volume: 0.16, when: 0.16 });
    this.tone({ frequency: 880, duration: 0.2, type: 'sawtooth', volume: 0.16, when: 0.32 });
  }

  caught() {
    const notes = [392, 370, 349, 311];
    notes.forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.28, type: 'triangle', volume: 0.22, when: i * 0.26 });
    });
  }

  escapeFanfare() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.22, type: 'triangle', volume: 0.22, when: i * 0.14 });
    });
    this.tone({ frequency: 1319, duration: 0.5, type: 'triangle', volume: 0.2, when: 0.9 });
  }

  click() {
    this.tone({ frequency: 700, duration: 0.05, type: 'sine', volume: 0.15 });
  }

  stageClear() {
    [523, 659, 784].forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.16, type: 'triangle', volume: 0.18, when: i * 0.1 });
    });
  }

  // A lazy plucked autumn tune: A minor pentatonic, eight steps, looped.
  startMusic() {
    if (!this.context || this.musicOn) return;
    this.musicOn = true;
    const melody = [440, 523, 659, 523, 587, 659, 784, 659, 587, 523, 440, 392];
    const step = () => {
      if (!this.musicOn) return;
      const frequency = melody[this.musicStep % melody.length];
      this.musicStep += 1;
      this.tone({ frequency, duration: 0.34, type: 'triangle', volume: 0.07 });
      this.tone({ frequency: frequency / 2, duration: 0.34, type: 'sine', volume: 0.05, when: 0.02 });
      this.musicTimer = window.setTimeout(step, 340);
    };
    step();
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
