import { objective, type ObjectiveId } from '@/lib/sections';

// "OBJ-03 // SKILLS" eyebrow + big themed title + a coordinate rule.
// Scroll reveals (components/motion/Reveals): eyebrow rises, title decodes,
// rule draws. The heading's aria-label keeps its accessible name stable
// ("Loadout (Skills)") while the visible text scrambles.
export default function SectionHeader({ id, kicker, align = 'left' }: { id: ObjectiveId; kicker?: string; align?: 'left' | 'center' }) {
  const o = objective(id);
  const center = align === 'center';
  return (
    <header className={`mb-12 md:mb-16 ${center ? 'text-center' : ''}`}>
      <p data-reveal="up" className="font-mono text-xs uppercase tracking-[0.3em] text-ash">
        <span className="text-nv">OBJ-{o.code}</span> <span aria-hidden="true">{'//'}</span> {o.plain}
      </p>
      <h2
        id={`${o.id}-title`}
        aria-label={`${o.title} (${o.plain})`}
        className="mt-3 font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight text-bone sm:text-6xl md:text-7xl"
      >
        <span data-reveal="decode">{o.title}</span>
      </h2>
      {kicker && (
        <p data-reveal="up" className={`mt-4 max-w-2xl text-ash ${center ? 'mx-auto' : ''}`}>
          {kicker}
        </p>
      )}
      <div className={`mt-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] text-steel ${center ? 'justify-center' : ''}`} aria-hidden="true">
        <span data-reveal="line" className="h-px w-10 bg-nv/60" />
        {/* ash, not steel: steel is a border colour (1.4:1 on the page), too dark for text */}
        <span className="text-ash">SEC {o.code}/08</span>
        <span data-reveal="line" className="h-px max-w-xs flex-1 border-t border-dashed border-steel" />
      </div>
    </header>
  );
}
