// Header for secondary pages (/projects, /articles): code + plain label eyebrow,
// big themed title, intro line and a count readout.
export default function PageHeader({ code, plain, title, intro, count, countLabel }: { code: string; plain: string; title: string; intro: string; count: number; countLabel: string }) {
  return (
    <header className="relative overflow-hidden border-b border-steel/60 pb-12 pt-32 md:pt-40">
      <div className="nv-sky pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p data-reveal="up" className="font-mono text-xs uppercase tracking-[0.3em] text-ash">
            <span className="text-nv">{code}</span> <span aria-hidden="true">{'//'}</span> {plain}
          </p>
          <h1 aria-label={`${title} (${plain})`} className="mt-3 font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight text-bone md:text-8xl">
            <span data-reveal="decode">{title}</span>
          </h1>
          <p data-reveal="up" className="mt-5 max-w-2xl text-lg text-ash">
            {intro}
          </p>
        </div>
        <p data-reveal="up" className="font-mono text-xs uppercase tracking-[0.2em] text-ash">
          <span className="block font-display text-6xl font-bold tracking-normal text-bone">{String(count).padStart(2, '0')}</span>
          {countLabel}
        </p>
      </div>
    </header>
  );
}
