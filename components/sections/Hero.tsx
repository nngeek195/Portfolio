import Image from 'next/image';
import { PROFILE } from '@/lib/profile';
import { model } from '@/lib/models';
import Placeholder from '@/components/ui/Placeholder';
import TacButton from '@/components/ui/TacButton';

// OBJ-01 Insertion. Static layout; Phase 2 adds the night-vision power-on,
// parallax push-in and the decoding name.
export default function Hero() {
  const heli = model('heli').poster;
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Sky + glow */}
      <div className="nv-sky absolute inset-0 -z-30" aria-hidden="true" />

      {/* Helicopter flying over (pre-rendered silhouette of public/models/heli.glb) */}
      <Image
        src={heli.src}
        width={heli.width}
        height={heli.height}
        alt=""
        aria-hidden="true"
        preload
        sizes="(min-width: 1024px) 42vw, 80vw"
        className="absolute right-[4%] top-[14%] -z-20 w-[80vw] max-w-[760px] -rotate-3 opacity-90 lg:w-[42vw]"
      />

      {/* Ridge line */}
      <svg aria-hidden="true" viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-[28vh] w-full">
        <path d="M0 150 L120 120 L210 138 L330 92 L430 118 L560 70 L690 112 L820 84 L930 126 L1060 96 L1180 132 L1300 104 L1440 128 L1440 220 L0 220 Z" fill="#050806" />
        <path d="M0 185 L160 160 L300 176 L470 150 L620 172 L780 146 L950 170 L1120 152 L1290 176 L1440 160 L1440 220 L0 220 Z" fill="#030403" />
      </svg>

      <div className="scanlines pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.3em] text-nv">
            <span>Operation</span>
            <span aria-hidden="true">{'//'}</span>
            {PROFILE.callsign ?? <Placeholder id="callsign">[CALLSIGN]</Placeholder>}
          </p>

          <h1 id="hero-title" className="mt-5 font-display text-[clamp(4rem,13vw,10.5rem)] font-extrabold uppercase leading-[0.82] tracking-tight text-bone">
            {PROFILE.firstName}
            <br />
            <span className="text-bone/90">{PROFILE.lastName}</span>
          </h1>

          <p className="mt-6 font-stencil text-2xl uppercase tracking-[0.12em] text-bone md:text-3xl">{PROFILE.roles.join(' // ')}</p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ash">{PROFILE.heroIntro}</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <TacButton href="#operations">View operations</TacButton>
            <TacButton href="#contact" variant="secondary">
              Open comms
            </TacButton>
          </div>
        </div>

        {/* Operator art */}
        <div className="relative mx-auto w-full max-w-[260px] sm:max-w-sm lg:col-span-5 lg:max-w-none">
          <div className="hud-corners relative aspect-[4/5] border border-dashed border-amber/50 bg-black/20 [--hud-c:var(--color-amber)]">
            <OperatorSilhouette />
            <div className="absolute inset-x-3 bottom-3">
              <Placeholder id="hero-art" block>
                <span className="font-mono text-[11px] uppercase leading-snug tracking-wide">
                  [HERO ART] Operator art goes here — layered PNG/WebP, ~2560px wide
                </span>
              </Placeholder>
            </div>
          </div>
        </div>
      </div>

      {/* Viewport HUD corners */}
      <div className="hud-corners pointer-events-none absolute inset-x-4 bottom-4 top-20 [--hud-c:rgb(124_255_91/0.5)] [--hud-l:28px]" aria-hidden="true" />
    </section>
  );
}

// Generic stand-in bust (helmet, NVG mount, balaclava) — original artwork, replaced by hero art.
function OperatorSilhouette() {
  return (
    <svg viewBox="0 0 400 500" aria-hidden="true" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="op-rim" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#7cff5b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7cff5b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill="url(#op-rim)" />
      {/* shoulders + plate carrier */}
      <path d="M40 500 C55 395 120 352 200 352 C280 352 345 395 360 500 Z" fill="#050706" />
      <path d="M128 392 L272 392 L286 500 L114 500 Z" fill="#0b0e0c" />
      {/* neck */}
      <path d="M168 300 L232 300 L240 360 L160 360 Z" fill="#050706" />
      {/* head + helmet */}
      <ellipse cx="200" cy="228" rx="78" ry="92" fill="#050706" />
      <path d="M116 214 C116 140 160 110 200 110 C240 110 284 140 284 214 L276 222 L124 222 Z" fill="#0b0e0c" />
      {/* NVG mount + tubes */}
      <rect x="182" y="120" width="36" height="26" fill="#121612" />
      <rect x="172" y="146" width="22" height="34" rx="4" fill="#121612" />
      <rect x="206" y="146" width="22" height="34" rx="4" fill="#121612" />
      <circle cx="183" cy="180" r="7" fill="#7cff5b" opacity="0.7" />
      <circle cx="217" cy="180" r="7" fill="#7cff5b" opacity="0.7" />
      {/* balaclava eye slit + skull jaw lines */}
      <rect x="146" y="226" width="108" height="20" rx="8" fill="#000" />
      <path d="M160 282 L240 282 M168 270 L168 296 M184 268 L184 300 M200 268 L200 300 M216 268 L216 300 M232 270 L232 296" stroke="#e8e4d9" strokeOpacity="0.35" strokeWidth="3" />
    </svg>
  );
}
