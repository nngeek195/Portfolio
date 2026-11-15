import Image from 'next/image';
import { LOADOUT } from '@/lib/loadout';
import { model } from '@/lib/models';
import Schematic from '@/components/ui/Schematic';
import SectionHeader from '@/components/ui/SectionHeader';

// OBJ-03 Loadout (Skills). Static schematic; Phase 4 replaces the render with
// the 3D rifle assembling part by part as you scroll.
export default function Loadout() {
  const rifle = model('rifle').poster;
  return (
    <section id="skills" aria-labelledby="skills-title" className="blueprint-grid relative scroll-mt-16 border-t border-steel/60 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader id="skills" kicker="My stack, mapped onto a primary weapon: each module of the rifle carries one group of skills." />

        <div data-reveal="up" className="hud-corners relative px-2 py-10 [--hud-c:rgb(95_168_211/0.6)] md:px-10">
          <div className="mb-6 flex flex-wrap justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-blueprint/80">
            <span>Schematic // Primary</span>
            <span>{LOADOUT.length} modules · 18 skills</span>
          </div>
          <Schematic
            poster={rifle}
            alt="Schematic render of a rifle, with numbered modules matching the skill groups below"
            sizes="(min-width: 1280px) 1100px, 92vw"
            className="mx-auto max-w-5xl"
            reveal="mask"
            hideMarkersOnMobile
            markers={LOADOUT.map((m, i) => ({ part: m.anchor ?? m.part, n: i + 1, label: `${m.slot}: ${m.group}` }))}
          />
        </div>

        <ol data-reveal="stagger" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOADOUT.map((m, i) => (
            <li key={m.part} className="clip-corner bg-void/80 p-6 ring-1 ring-inset ring-blueprint/25">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs font-bold text-nv">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-blueprint/80">{m.slot}</span>
              </div>
              <h3 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide text-bone">{m.group}</h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {m.skills.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 bg-gunmetal py-1.5 pl-1.5 pr-3 ring-1 ring-inset ring-steel">
                    <span className="relative grid h-7 w-7 place-items-center rounded-sm bg-bone/90 p-1">
                      <Image src={`/icons/skills/${s.icon}`} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                    </span>
                    <span className="text-sm text-bone">{s.name}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
