import Image from 'next/image';
import { LOADOUT, type Skill } from '@/lib/loadout';
import { model } from '@/lib/models';
import Schematic from '@/components/ui/Schematic';
import SectionHeader from '@/components/ui/SectionHeader';
import LoadoutScene from '@/components/scenes/LoadoutScene';

function SkillChips({ skills }: { skills: Skill[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <li key={s.name} className="flex items-center gap-2 bg-gunmetal py-1.5 pl-1.5 pr-3 ring-1 ring-inset ring-steel">
          <span className="relative grid h-7 w-7 place-items-center rounded-sm bg-bone/90 p-1">
            <Image src={`/icons/skills/${s.icon}`} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
          </span>
          <span className="text-sm text-bone">{s.name}</span>
        </li>
      ))}
    </ul>
  );
}

const markers = LOADOUT.map((m, i) => ({ part: m.anchor ?? m.part, n: i + 1, label: `${m.slot}: ${m.group}` }));

// OBJ-03 Loadout (Skills).
//  - Default (phones, reduced motion, short screens, no JS): schematic + module grid.
//  - Desktop scene (LoadoutScene sets data-scene="on" on the section): a pinned
//    loadout screen that steps through the six modules as you scroll.
//    Phase 4 swaps the schematic for the 3D rifle assembling on the same timeline.
export default function Loadout() {
  const rifle = model('rifle').poster;
  return (
    <section id="skills" aria-labelledby="skills-title" className="group/loadout blueprint-grid relative scroll-mt-16 border-t border-steel/60 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader id="skills" kicker="My stack, mapped onto a primary weapon: each module of the rifle carries one group of skills." />

        {/* ---------- Default layout ---------- */}
        <div data-loadout="grid" className="group-data-[scene=on]/loadout:hidden">
          <div data-reveal="up" className="hud-corners relative px-2 py-10 [--hud-c:rgb(95_168_211/0.6)] md:px-10">
            <div className="mb-6 flex flex-wrap justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-blueprint/80">
              <span>Schematic {'//'} Primary</span>
              <span>{LOADOUT.length} modules · 18 skills</span>
            </div>
            <Schematic
              poster={rifle}
              alt="Schematic render of a rifle, with numbered modules matching the skill groups below"
              sizes="(min-width: 1280px) 1100px, 92vw"
              className="mx-auto max-w-5xl"
              reveal="mask"
              hideMarkersOnMobile
              markers={markers}
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
                <div className="mt-5">
                  <SkillChips skills={m.skills} />
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ---------- Desktop scene: pinned loadout screen ---------- */}
        <div
          data-loadout="stage"
          className="hidden h-[min(700px,calc(100vh-120px))] grid-cols-12 gap-6 group-data-[scene=on]/loadout:grid"
        >
          <ol aria-label="Loadout modules" className="col-span-4 flex flex-col justify-center gap-1.5">
            {LOADOUT.map((m, i) => (
              <li
                key={m.part}
                data-module={i}
                className="clip-corner-sm flex items-center gap-4 px-4 py-3 text-ash ring-1 ring-inset ring-transparent transition-colors duration-300 data-[active=true]:bg-gunmetal data-[active=true]:text-bone data-[active=true]:ring-blueprint/40"
              >
                <span className="font-mono text-xs font-bold text-nv">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-blueprint/80">{m.slot}</span>
                  <span className="block font-display text-2xl font-bold uppercase leading-tight tracking-wide">{m.group}</span>
                </span>
                <span className="font-mono text-[10px] text-ash">{m.skills.length}</span>
              </li>
            ))}
          </ol>

          <div className="col-span-8 flex min-h-0 flex-col">
            <div className="hud-corners relative flex min-h-0 flex-1 flex-col px-8 py-6 [--hud-c:rgb(95_168_211/0.6)]">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-blueprint/80">
                <span>Schematic {'//'} Primary</span>
                <span data-loadout="counter">Module 01/{String(LOADOUT.length).padStart(2, '0')}</span>
              </div>
              <div data-loadout="viewport" className="relative grid min-h-0 flex-1 place-items-center overflow-hidden">
                <Schematic
                  poster={rifle}
                  alt="Schematic render of a rifle; the highlighted marker is the module described below"
                  sizes="(min-width: 1280px) 760px, 60vw"
                  className="w-full max-w-3xl"
                  markers={markers}
                />
                <span aria-hidden="true" data-loadout="scan" className="absolute inset-y-4 left-0 w-px bg-blueprint shadow-[0_0_14px_rgb(95_168_211/0.9)]" />
              </div>
            </div>

            <div className="relative mt-4 h-36 shrink-0">
              {LOADOUT.map((m, i) => (
                <div
                  key={m.part}
                  data-panel={i}
                  className="clip-corner absolute inset-0 flex flex-col justify-center gap-3 bg-void/90 px-6 ring-1 ring-inset ring-blueprint/25"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs font-bold text-nv">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">{m.group}</h3>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-blueprint/80">{'// '}{m.slot}</span>
                  </div>
                  <SkillChips skills={m.skills} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <LoadoutScene count={LOADOUT.length} />
    </section>
  );
}
