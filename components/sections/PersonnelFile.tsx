import { PROFILE, SIDEARM_TRAITS } from '@/lib/profile';
import { model } from '@/lib/models';
import ProfileShowcase from '@/components/home/ProfileShowcase';
import Placeholder from '@/components/ui/Placeholder';
import Schematic from '@/components/ui/Schematic';
import SectionHeader from '@/components/ui/SectionHeader';

// OBJ-02 Personnel File (About). Phase 2: redaction bars wipe off on scroll;
// Phase 4: the pistol field-strips in 3D.
export default function PersonnelFile({ profileImages, intervalSeconds }: { profileImages: string[]; intervalSeconds: number }) {
  const pistol = model('pistol').poster;
  const fields: [string, React.ReactNode][] = [
    ['Name', PROFILE.name],
    ['Callsign', PROFILE.callsign ?? <Placeholder id="callsign">[CALLSIGN]</Placeholder>],
    ['Unit', PROFILE.unit],
    ['Status', PROFILE.status],
    ['Location', PROFILE.location.label],
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="relative scroll-mt-16 border-t border-steel/60 bg-void py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader id="about" />

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Dossier */}
          <article data-reveal="up" className="clip-corner relative bg-gunmetal p-6 ring-1 ring-inset ring-steel md:p-10 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-steel pb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
              <span>File 02 {'//'} Personnel</span>
              <span className="flex items-center gap-4">
                <span>Clearance: Public</span>
                <span aria-hidden="true" className="rotate-[-6deg] border-2 border-signal/80 px-2.5 py-0.5 font-stencil text-lg tracking-[0.2em] text-signal/90">
                  Cleared
                </span>
              </span>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-[minmax(0,220px)_1fr]">
              <div className="mx-auto w-full max-w-[220px]">
                <ProfileShowcase images={profileImages} intervalSeconds={intervalSeconds} />
              </div>
              <dl className="grid content-start gap-4">
                {fields.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-steel/50 pb-3">
                    <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">{k}</dt>
                    <dd className="text-bone">{v}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Specialty</dt>
                  <dd>
                    <ul className="flex flex-wrap gap-2">
                      {PROFILE.specialization.map((s) => (
                        <li key={s} className="bg-void px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-bone ring-1 ring-inset ring-steel">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-10 space-y-5 text-lg leading-relaxed text-bone/90">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Summary</p>
              {PROFILE.bio.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </article>

          {/* Sidearm */}
          <aside data-reveal="up" aria-labelledby="sidearm-title" className="clip-corner bg-[#0b0f13] p-6 ring-1 ring-inset ring-steel md:p-8 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-dashed border-steel pb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
              <span id="sidearm-title">Personal sidearm</span>
              <span>Traits</span>
            </div>
            <Schematic
              poster={pistol}
              alt="Schematic render of a pistol, with numbered parts matching the trait list"
              sizes="(min-width: 1024px) 420px, 90vw"
              className="mx-auto mt-8 max-w-md"
              reveal="mask"
              markers={SIDEARM_TRAITS.map((t, i) => ({ part: t.part, n: i + 1, label: t.label }))}
            />
            <ol data-reveal="stagger" className="mt-8 grid gap-3">
              {SIDEARM_TRAITS.map((t, i) => (
                <li key={t.part} className="grid grid-cols-[2rem_6.5rem_1fr] items-baseline gap-2 border-b border-steel/50 pb-2">
                  <span className="font-mono text-xs text-nv">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">{t.label}</span>
                  <span className="text-bone">{t.trait}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}
