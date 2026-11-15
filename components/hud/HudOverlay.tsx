import { PROFILE } from '@/lib/profile';
import { OBJECTIVES } from '@/lib/sections';

// Static HUD shell (desktop only, decorative). Phase 2 makes it live:
// the objective tracker, compass and ammo counter follow scroll progress.
const COMPASS = ['N', '015', '030', 'NE', '060', '075', 'E', '105', '120', 'SE', '150', '165', 'S'];

export default function HudOverlay() {
  const first = OBJECTIVES[0];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 hidden select-none font-mono text-[10px] tracking-[0.2em] text-ash/80 min-[1440px]:block">
      {/* Compass strip */}
      <div className="absolute left-1/2 top-[76px] flex -translate-x-1/2 items-end gap-5 opacity-70">
        {COMPASS.map((c, i) => (
          <div key={c} className={`flex flex-col items-center gap-1 ${i === 6 ? 'text-nv' : ''}`}>
            <span>{c}</span>
            <span className={`w-px ${c.length > 2 ? 'h-1.5 bg-steel' : 'h-2.5 bg-ash'}`} />
          </div>
        ))}
        <span className="absolute -bottom-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-nv" />
      </div>

      {/* Objective tracker */}
      <div className="absolute right-6 top-[84px] text-right">
        <div className="text-nv">
          OBJ {first.code}/{String(OBJECTIVES.length).padStart(2, '0')}
        </div>
        <div className="mt-1 text-bone">{first.title.toUpperCase()}</div>
        <div className="mt-2 ml-auto h-0.5 w-16 bg-steel">
          <div className="h-full w-[12%] bg-nv" />
        </div>
      </div>

      {/* Left tick ruler */}
      <div className="absolute left-5 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {Array.from({ length: 21 }, (_, i) => (
          <span key={i} className={`h-px ${i % 5 === 0 ? 'w-4 bg-ash' : 'w-2 bg-steel'}`} />
        ))}
      </div>

      {/* Location / time readout */}
      <div className="absolute bottom-6 left-6 space-y-1">
        <div className="flex items-center gap-2 text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" /> REC
        </div>
        {PROFILE.location.coords.split(' ').map((c) => (
          <div key={c}>{c}</div>
        ))}
        <div>{PROFILE.location.utcOffset}</div>
      </div>

      {/* Ammo counter: rounds = progress through the current section, mags = sections left */}
      <div className="absolute bottom-[92px] right-6 text-right">
        <div className="font-display text-3xl font-bold tracking-normal text-bone/90">
          30<span className="text-ash"> / 30</span>
        </div>
        <div className="mt-1 flex justify-end gap-1">
          {OBJECTIVES.map((o, i) => (
            <span key={o.id} className={`h-2 w-1 ${i === 0 ? 'bg-nv' : 'bg-steel'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
