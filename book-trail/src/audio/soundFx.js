/**
 * Web Audio API 기반 레트로 8비트 아케이드 사운드 합성기
 * 외부 파일 로드 없이 브라우저 자체 오디오 컨텍스트로 순수 생성
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(mute) {
    this.muted = mute;
    if (mute && this.bgmPlaying) {
      this.stopBgm();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  play(type) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      switch (type) {
        case 'click':
          this._playTone(520, 'sine', 0.05, 0.1);
          break;

        case 'coin':
          this._playArpeggio([987.77, 1318.51], 'square', 0.08, 0.15);
          break;

        case 'correct':
          this._playArpeggio([523.25, 659.25, 783.99, 1046.50], 'triangle', 0.08, 0.2);
          break;

        case 'wrong':
          this._playBuzzer();
          break;

        case 'laser':
          this._playLaser();
          break;

        case 'hit':
          this._playTone(300, 'square', 0.06, 0.15, 120);
          break;

        case 'explosion':
          this._playNoise(0.25, 0.25);
          break;

        case 'victory':
          this._playFanfare();
          break;

        case 'gameover':
          this._playGameOver();
          break;

        case 'whack':
          this._playTone(220, 'sawtooth', 0.08, 0.2, 80);
          break;

        case 'dot':
          // 미로 별 조각 먹기: 아주 짧고 조용한 틱
          this._playTone(1200, 'square', 0.04, 0.05);
          break;

        case 'combo':
          this._playArpeggio([659.25, 880, 1174.66], 'square', 0.06, 0.12);
          break;

        case 'countdown':
          this._playTone(440, 'square', 0.12, 0.15);
          break;

        case 'go':
          this._playArpeggio([523.25, 783.99, 1046.5], 'square', 0.1, 0.18);
          break;

        case 'star':
          this._playArpeggio([783.99, 1046.5, 1318.51, 1567.98], 'triangle', 0.1, 0.16);
          break;

        case 'bonk':
          this._playTone(140, 'square', 0.1, 0.12, 90);
          break;

        default:
          break;
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  _playTone(freq, type = 'sine', duration = 0.1, volume = 0.15, endFreq = null) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _playArpeggio(notes, type = 'square', noteDuration = 0.08, volume = 0.12) {
    if (!this.ctx) return;
    notes.forEach((freq, idx) => {
      const startTime = this.ctx.currentTime + idx * noteDuration;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  _playLaser() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  _playBuzzer() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.setValueAtTime(130, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  _playNoise(duration = 0.2, volume = 0.2) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  _playFanfare() {
    const notes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];
    let offset = 0;
    notes.forEach((n) => {
      setTimeout(() => {
        this._playTone(n.f, 'triangle', n.d, 0.18);
      }, offset * 1000);
      offset += n.d;
    });
  }

  _playGameOver() {
    const notes = [
      { f: 440, d: 0.15 },
      { f: 392, d: 0.15 },
      { f: 349, d: 0.15 },
      { f: 293, d: 0.35 }
    ];
    let offset = 0;
    notes.forEach((n) => {
      setTimeout(() => {
        this._playTone(n.f, 'sawtooth', n.d, 0.15);
      }, offset * 1000);
      offset += n.d;
    });
  }

  // Chiptune background music loop
  startBgm() {
    if (this.muted || this.bgmPlaying) return;
    this.init();
    if (!this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    const melody = [
      523.25, 0, 659.25, 0, 783.99, 659.25, 523.25, 0,
      587.33, 0, 698.46, 0, 880.00, 698.46, 587.33, 0,
      659.25, 0, 783.99, 0, 1046.5, 783.99, 659.25, 0,
      587.33, 659.25, 587.33, 523.25, 493.88, 0, 523.25, 0
    ];

    const tick = () => {
      if (!this.bgmPlaying) return;
      const freq = melody[this.bgmStep % melody.length];
      if (freq > 0) {
        this._playTone(freq, 'sine', 0.12, 0.04);
      }
      this.bgmStep++;
      this.bgmTimer = setTimeout(tick, 220);
    };

    tick();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBgm() {
    if (this.bgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }
}

export const soundFx = new SoundEffects();
