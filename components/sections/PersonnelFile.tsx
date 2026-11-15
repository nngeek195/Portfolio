import { PROFILE, SIDEARM_TRAITS } from '@/lib/profile';
import { model } from '@/lib/models';
import ProfileShowcase from '@/components/home/ProfileShowcase';
import Placeholder from '@/components/ui/Placeholder';
import Schematic from '@/components/ui/Schematic';
import SectionHeader from '@/components/ui/SectionHeader';
import DossierScene from '@/components/scenes/DossierScene';
import ModelSlot from '@/components/three/ModelSlot';

// Redaction bar over a field. Invisible unless DossierScene runs (desktop,
// motion allowed), which shows it and then wipes it away on scroll. The text
// underneath is always in the DOM, so screen readers read it normally.
function RedactBar({ lines = false }: { lines?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-redact
      className="pointer-events-none absolute -inset-x-1 inset-y-0 origin-right opacity-0"
      style={{
        background: lines
          ? // one bar per text line (line-height 1.625em) so paragraphs look redacted line by line
            'repeating-linear-gradient(to bottom, transparent 0 0.22em, #000 0.22em 1.42em, transparent 1.42em 1.625em)'
          : '#000',
      }}
    />
  );
}

// OBJ-02 Personnel File (About). DossierScene pins this on desktop: redaction
// bars wipe off one by one, the sidearm's traits light up with their pistol
// markers, then the CLEARED stamp lands. Phase 4: the pistol field-strips in 3D.
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

        <div data-dossier="stage" className="grid gap-6 lg:grid-cols-12">
          {/* Dossier */}
          <article data-reveal="up" className="clip-corner relative bg-gunmetal p-6 ring-1 ring-inset ring-steel md:p-8 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-steel pb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
              <span>File 02 {'//'} Personnel</span>
              <span className="flex items-center gap-4">
                <span>Clearance: Public</span>
                <span
                  aria-hidden="true"
                  data-dossier="stamp"
                  className="inline-block rotate-[-6deg] border-2 border-signal/80 px-2.5 py-0.5 font-stencil text-lg tracking-[0.2em] text-signal/90"
                >
                  Cleared
                </span>
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,200px)_1fr] lg:grid-cols-[minmax(0,180px)_1fr]">
              <div className="mx-auto w-full max-w-[200px] lg:max-w-[180px]">
                <ProfileShowcase images={profileImages} intervalSeconds={intervalSeconds} />
              </div>
              <dl className="grid content-start gap-3">
                {fields.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[6rem_1fr] gap-3 border-b border-steel/50 pb-2.5">
                    <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">{k}</dt>
                    <dd className="relative text-bone">
                      {v}
                      <RedactBar />
                    </dd>
                  </div>
                ))}
                <div className="grid grid-cols-[6rem_1fr] gap-3">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Specialty</dt>
                  <dd className="relative">
                    <ul className="flex flex-wrap gap-1.5">
                      {PROFILE.specialization.map((s) => (
                        <li key={s} className="bg-void px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bone ring-1 ring-inset ring-steel">
                          {s}
                        </li>
                      ))}
                    </ul>
                    <RedactBar />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-7 space-y-4 text-base leading-[1.625] text-bone/90 md:text-[17px]">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Summary</p>
              {PROFILE.bio.map((p) => (
                <p key={p.slice(0, 24)} className="relative">
                  {p}
                  <RedactBar lines />
                </p>
              ))}
            </div>
          </article>

          {/* Sidearm */}
          <aside data-reveal="up" aria-labelledby="sidearm-title" className="clip-corner bg-[#12171c] p-6 ring-1 ring-inset ring-steel md:p-8 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-dashed border-steel pb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
              <span id="sidearm-title">Personal sidearm</span>
              <span>Traits</span>
            </div>
            {/* 3D pistol field-strips here (Phase 4); the schematic is the fallback / poster */}
            <ModelSlot kind="pistol" className="mx-auto mt-6 max-w-md">
              <Schematic
                poster={pistol}
                alt="Schematic render of a pistol, with numbered parts matching the trait list"
                sizes="(min-width: 1024px) 420px, 90vw"
                reveal="mask"
                markers={SIDEARM_TRAITS.map((t, i) => ({ part: t.part, n: i + 1, label: t.label }))}
              />
            </ModelSlot>
            <ol className="mt-6 grid gap-2.5">
              {SIDEARM_TRAITS.map((t, i) => (
                <li key={t.part} data-trait={i + 1} className="grid grid-cols-[2rem_6.5rem_1fr] items-baseline gap-2 border-b border-steel/50 pb-2">
                  <span className="font-mono text-xs text-nv">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">{t.label}</span>
                  <span className="text-bone">{t.trait}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
      <DossierScene />
    </section>
  );
}
