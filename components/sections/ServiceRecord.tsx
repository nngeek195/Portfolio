import { SERVICE_RECORD } from '@/lib/profile';
import Placeholder from '@/components/ui/Placeholder';
import SectionHeader from '@/components/ui/SectionHeader';

const TYPE_STYLE: Record<string, string> = {
  Role: 'text-nv ring-nv/50',
  Hackathon: 'text-amber ring-amber/50',
  Competition: 'text-amber ring-amber/50',
  Education: 'text-blueprint ring-blueprint/50',
};

// OBJ-05 Service Record (Experience). Phase 2: the spine draws as you scroll
// and each waypoint lights up when reached.
export default function ServiceRecord() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="relative scroll-mt-16 border-t border-steel/60 bg-void py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <SectionHeader id="experience" kicker="Operations log: roles, education and competitions, newest first." />

        <div className="relative md:ml-32">
          {/* Spine: steel base line + night-vision overlay drawn by scroll (Reveals: "spine") */}
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-steel" />
          <span aria-hidden="true" data-reveal="spine" className="absolute inset-y-0 left-0 w-px origin-top bg-nv shadow-[0_0_8px_rgb(124_255_91/0.6)]" />
        <ol className="relative">
          {SERVICE_RECORD.map((e, i) => (
            <li key={`${e.title}-${i}`} data-reveal="up" className="relative pb-12 pl-8 last:pb-0 md:pl-10">
              {/* waypoint */}
              <span
                aria-hidden="true"
                data-waypoint
                className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rotate-45 border border-nv bg-void transition-[background-color,box-shadow] duration-300 [&.is-lit]:bg-nv [&.is-lit]:shadow-[0_0_10px_rgb(124_255_91/0.8)]"
              />
              {/* date column on wide screens */}
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash md:absolute md:-left-32 md:top-1 md:w-24 md:text-right">
                {e.placeholder && e.date.startsWith('[') ? <Placeholder id={e.placeholder}>{e.date}</Placeholder> : e.date}
              </p>
              <div className="mt-2 md:mt-0">
                <span className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] ring-1 ring-inset ${TYPE_STYLE[e.type]}`}>{e.type}</span>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-wide text-bone">
                  {e.placeholder && e.title.startsWith('[') ? <Placeholder id={e.placeholder}>{e.title}</Placeholder> : e.title}
                </h3>
                <p className="mt-1 text-ash">
                  {e.placeholder && e.org.startsWith('[') ? <Placeholder id={e.placeholder}>{e.org}</Placeholder> : e.org}
                </p>
                {e.detail && (
                  <p className="mt-3 text-sm text-bone/80">
                    {e.placeholder && (e.detail.startsWith('[') || e.type === 'Role') ? <Placeholder id={e.placeholder}>{e.detail}</Placeholder> : e.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}
