// Procedural rotor chop for the companion helicopter (Web Audio, no files):
// low-passed noise, amplitude-modulated at the blade-pass rate, plus a soft
// low thump. Loaded on demand only after the visitor turns sound on.

export type RotorAudio = {
  /** volume 0..1 (follows the helicopter's distance), rate 0..1 (rotor speed). */
  update(volume: number, rate: number): void;
  dispose(): void;
};

export function createRotorAudio(ctx: AudioContext): RotorAudio {
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // brown-ish noise: deeper than white
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 520;
  lowpass.Q.value = 0.7;

  // Chop: a sawtooth LFO drives the gain, giving each blade pass a sharp attack and decay.
  const chop = ctx.createGain();
  chop.gain.value = 0.55;
  const lfo = ctx.createOscillator();
  lfo.type = 'sawtooth';
  lfo.frequency.value = 11;
  const depth = ctx.createGain();
  depth.gain.value = 0.45;
  lfo.connect(depth).connect(chop.gain);

  // Low thump in step with the chop.
  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.value = 46;
  const thumpGain = ctx.createGain();
  thumpGain.gain.value = 0.18;
  const thumpDepth = ctx.createGain();
  thumpDepth.gain.value = 0.18;
  lfo.connect(thumpDepth).connect(thumpGain.gain);

  const master = ctx.createGain();
  master.gain.value = 0;
  src.connect(lowpass).connect(chop).connect(master);
  thump.connect(thumpGain).connect(master);
  master.connect(ctx.destination);
  src.start();
  lfo.start();
  thump.start();

  return {
    update(volume, rate) {
      const t = ctx.currentTime;
      master.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)) * 0.32, t, 0.12);
      lfo.frequency.setTargetAtTime(7 + rate * 9, t, 0.25);
      lowpass.frequency.setTargetAtTime(380 + rate * 380, t, 0.25);
    },
    dispose() {
      const t = ctx.currentTime;
      master.gain.setTargetAtTime(0, t, 0.08);
      setTimeout(() => {
        src.stop();
        lfo.stop();
        thump.stop();
        master.disconnect();
      }, 400);
    },
  };
}
