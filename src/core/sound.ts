// Web Audio API でつくる効果音 (音声ファイルは使わない)

type Tone = { freq: number; at: number };

class SoundEffects {
  enabled = true;
  private ctx: AudioContext | null = null;

  /** ブラウザは、ユーザーが操作したあとでないと音を出せないので、ボタンを押したときに呼ぶ */
  init(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  private context(): AudioContext | null {
    if (!this.enabled) return null;
    this.init();
    return this.ctx;
  }

  /** 音をひとつ鳴らす。tones の順に周波数を切りかえる */
  private play(ctx: AudioContext, type: OscillatorType, tones: Tone[], volume: number, length: number, start = 0): void {
    const now = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    for (const t of tones) osc.frequency.setValueAtTime(t.freq, now + t.at);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + length);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + length);
  }

  /** ド・ミ・ソ・高いド (ピンポンパンポーン♪) */
  correct(): void {
    const ctx = this.context();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5].map((freq, i) => ({ freq, at: i * 0.1 }));
    this.play(ctx, 'triangle', notes, 0.3, 0.6);
    this.play(ctx, 'sine', notes.map((n) => ({ ...n, freq: n.freq / 2 })), 0.3, 0.6);
  }

  /** ブブー */
  wrong(): void {
    const ctx = this.context();
    if (!ctx) return;
    this.play(ctx, 'sawtooth', [{ freq: 160, at: 0 }, { freq: 120, at: 0.15 }], 0.25, 0.4);
  }

  /** のこり5秒からのカウントダウン */
  tick(): void {
    const ctx = this.context();
    if (!ctx) return;
    this.play(ctx, 'sine', [{ freq: 800, at: 0 }], 0.08, 0.05);
  }

  fanfare(): void {
    const ctx = this.context();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      this.play(ctx, 'triangle', [{ freq, at: 0 }], 0.25, 0.4, i * 0.12);
    });
  }
}

export const sound = new SoundEffects();
