import { objective, type ObjectiveId } from '@/lib/sections';

// "OBJ-03 // SKILLS" eyebrow + big themed title + a coordinate rule.
export default function SectionHeader({ id, kicker, align = 'left' }: { id: ObjectiveId; kicker?: string; align?: 'left' | 'center' }) {
  const o = objective(id);
  const center = align === 'center';
  return (
    <header className={`mb-12 md:mb-16 ${center ? 'text-center' : ''}`}>
      <p className="font-mono text-xs tracking-[0.3em] text-ash uppercase">
        <span className="text-nv">OBJ-{o.code}</span> <span aria-hidden="true">{'//'}</span> {o.plain}
      </p>
      <h2 id={`${o.id}-title`} className="mt-3 font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight text-bone sm:text-6xl md:text-7xl">
        {o.title}
        <span className="sr-only"> ({o.plain})</span>
      </h2>
      {kicker && <p className={`mt-4 max-w-2xl text-ash ${center ? 'mx-auto' : ''}`}>{kicker}</p>}
      <div className={`mt-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] text-steel ${center ? 'justify-center' : ''}`} aria-hidden="true">
        <span className="h-px w-10 bg-nv/60" />
        <span>SEC {o.code}/08</span>
        <span className="h-px flex-1 max-w-xs border-t border-dashed border-steel" />
      </div>
    </header>
  );
}
