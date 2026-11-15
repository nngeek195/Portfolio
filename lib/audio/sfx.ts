// One-shot sound effects (Web Audio, procedural: no files). Loaded on demand
// only after the visitor turns sound on (see ./cues.ts).
//   squelch: radio squelch tail on a section change
//   clack:   mechanical lock when a rifle module seats

export type Sfx = { squelch(): void; clack(): void };

export function createSfx(ctx: AudioContext): Sfx {
  // 1 s of white noise, shared by every effect.
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  const burst = (at: number, dur: number, filter: BiquadFilterType, freq: number, q: number, peak: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(master);
    src.start(at, Math.random() * 0.5, dur + 0.05);
  };

  const tone = (at: number, dur: number, type: OscillatorType, from: number, to: number, peak: number) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, at);
    o.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + dur + 0.02);
  };

  return {
    squelch() {
      const t = ctx.currentTime + 0.01;
      // Key-up click, then the band-limited hiss of an open channel that cuts off.
      tone(t, 0.03, 'square', 1450, 1300, 0.05);
      burst(t + 0.015, 0.2, 'bandpass', 1900, 0.9, 0.22);
      burst(t + 0.015, 0.12, 'highpass', 4200, 0.7, 0.06);
    },
    clack() {
      const t = ctx.currentTime + 0.005;
      // Metal-on-metal snap, a low body thunk, then the smaller second click of the catch.
      burst(t, 0.035, 'highpass', 2600, 1.2, 0.5);
      tone(t, 0.09, 'triangle', 190, 70, 0.32);
      burst(t + 0.05, 0.025, 'bandpass', 3400, 2.5, 0.28);
    },
  };
}
