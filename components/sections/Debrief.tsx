import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import { model } from '@/lib/models';
import SectionHeader from '@/components/ui/SectionHeader';
import TacButton from '@/components/ui/TacButton';

// OBJ-08 Debrief (Summary). Night vision powers down to black here; on capable
// desktops the live 3D helicopter lifts off from the pad and climbs away.
export default function Debrief({ stats }: { stats: { label: string; value: number }[] }) {
  const heli = model('heli').poster;
  return (
    <section id="debrief" aria-labelledby="debrief-title" className="relative scroll-mt-16 border-t border-steel/60 bg-gradient-to-b from-void to-black py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 text-center md:px-8">
        <SectionHeader id="debrief" align="center" />
        {/* Extraction pad: the live helicopter lifts off from here; faint silhouette as the fallback */}
        <div data-debrief="pad" aria-hidden="true" className="relative -mx-5 mb-6 flex h-48 items-center justify-start md:-mx-8 md:h-56">
          <Image src={heli.src} width={heli.width} height={heli.height} alt="" sizes="240px" data-heli-still className="ml-[8%] w-56 -rotate-6 opacity-60 drop-shadow-[0_0_2px_rgb(124_255_91/0.8)]" />
        </div>
        <p className="font-stencil text-4xl uppercase tracking-[0.15em] text-nv md:text-6xl">
          <span data-reveal="decode">Mission complete</span>
        </p>

        <dl data-reveal="stagger" className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px bg-steel/60 ring-1 ring-steel/60 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse bg-void px-4 py-8">
              <dt className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">{s.label}</dt>
              <dd className="font-display text-6xl font-bold text-bone">{String(s.value).padStart(2, '0')}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 flex justify-center">
          <TacButton href="#top" variant="secondary">
            <ArrowUp size={16} aria-hidden="true" /> Return to base
          </TacButton>
        </div>
      </div>
    </section>
  );
}
