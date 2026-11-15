'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, FolderGit2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import IntelViewer from '@/components/intel/IntelViewer';
import { SCENE_MEDIA } from '@/lib/motion/scenes';
import SmartImage from '@/components/SmartImage';
import type { ContentItem } from '@/lib/content-types';
import { formatDate, stripHtml } from '@/lib/text';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Mission-briefing cards for featured projects + the latest articles.
// Phones / reduced motion: a swipeable track. Desktop scene: the track is
// pinned and vertical scrolling drives it sideways, with a progress bar.
// Imported LinkedIn titles look like "Post title | Name posted on the topic | LinkedIn";
// show just the first segment.
function reportTitle(title?: string) {
  return (title ?? '').split(' | ')[0].trim() || 'Untitled report';
}

export default function OperationsTrack({ projects, articles, totalProjects }: { projects: ContentItem[]; articles: ContentItem[]; totalProjects: number }) {
  const [selected, setSelected] = useState<{ item: ContentItem; type: 'project' | 'article' } | null>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SCENE_MEDIA, () => {
      const pin = pinRef.current, viewport = viewportRef.current, track = trackRef.current;
      if (!pin || !viewport || !track) return;
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      if (distance() < 40) return; // everything fits: nothing to drive

      viewport.style.overflowX = 'clip';
      track.classList.remove('snap-x', 'snap-mandatory');
      if (hintRef.current) hintRef.current.textContent = 'Scroll to advance';

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => progressRef.current && (progressRef.current.style.transform = `scaleX(${self.progress})`),
        },
      });

      // Keyboard: focusing a card that is off to the side scrolls the page to
      // the point where that card is in view.
      const onFocus = (e: FocusEvent) => {
        const st = tween.scrollTrigger;
        const card = (e.target as HTMLElement).closest('li');
        if (!st || !card || !track.contains(card)) return;
        const target = Math.min(1, card.offsetLeft / Math.max(distance(), 1));
        window.scrollTo({ top: st.start + target * (st.end - st.start), behavior: 'auto' });
        viewport.scrollLeft = 0; // focus may have scrolled the clipped viewport itself
      };
      track.addEventListener('focusin', onFocus);
      ScrollTrigger.refresh();

      return () => {
        track.removeEventListener('focusin', onFocus);
        viewport.style.overflowX = '';
        track.classList.add('snap-x', 'snap-mandatory');
        if (hintRef.current) hintRef.current.textContent = 'Swipe / scroll sideways';
      };
    });
    return () => mm.revert();
  });

  return (
    <>
      <div ref={pinRef}>
      <p className="mb-4 flex items-center justify-end gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash" aria-hidden="true">
        <span ref={hintRef}>Swipe / scroll sideways</span> <ArrowRight size={13} />
      </p>
      <div ref={viewportRef} className="-mx-5 overflow-x-auto px-5 pb-6 no-scrollbar md:-mx-8 md:px-8" role="region" aria-label="Featured operations" tabIndex={0}>
        <ol ref={trackRef} data-reveal="stagger" className="flex snap-x snap-mandatory gap-5">
          {projects.map((p, i) => {
            const name = p.repoName || p.title || 'Untitled operation';
            const excerpt = p.description ? stripHtml(p.description) : '';
            return (
              <li key={p.id} className="w-[min(82vw,360px)] shrink-0 snap-start">
                <article className="clip-corner flex h-full flex-col bg-gunmetal ring-1 ring-inset ring-steel">
                  <div className="flex items-center justify-between border-b border-dashed border-steel px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
                    <span className="text-nv">OP-{String(i + 1).padStart(2, '0')}</span>
                    <span>{p.source === 'github' || p.repoUrl ? 'Source: GitHub' : 'Field report'}</span>
                  </div>
                  <div className="relative h-40 bg-void">
                    {p.bannerImage ? (
                      <SmartImage src={p.bannerImage} alt="" fill sizes="400px" className="object-cover opacity-70 grayscale-[40%]" />
                    ) : (
                      <div className="grid h-full place-items-center text-steel">
                        <FolderGit2 size={40} aria-hidden="true" />
                      </div>
                    )}
                    <div className="scanlines absolute inset-0 opacity-40" aria-hidden="true" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-wide text-bone">{name}</h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Objective</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-bone/80">{excerpt || 'Briefing on file.'}</p>
                    <div className="mt-auto pt-5">
                      <button
                        type="button"
                        onClick={() => setSelected({ item: p, type: 'project' })}
                        className="clip-corner-sm bracket-hover bg-bone px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-void hover:bg-white"
                      >
                        View intel<span className="sr-only">: {name}</span>
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
          <li className="w-[min(70vw,300px)] shrink-0 snap-start">
            <Link
              href="/projects"
              className="clip-corner hud-corners flex h-full min-h-72 flex-col justify-between bg-void p-6 ring-1 ring-inset ring-steel transition-colors hover:ring-ash"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Archive</span>
              <span>
                <span className="block font-display text-4xl font-bold uppercase leading-none text-bone">All operations</span>
                <span className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-nv">
                  {totalProjects} on file <ArrowRight size={14} aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        </ol>
      </div>
      <div className="hidden h-0.5 bg-steel/70 lg:block" aria-hidden="true">
        <span ref={progressRef} className="block h-full origin-left bg-nv" style={{ transform: 'scaleX(0)' }} />
      </div>
      </div>

      {articles.length > 0 && (
        <div className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h3 className="font-display text-3xl font-bold uppercase tracking-wide text-bone">
              Intel reports <span className="font-sans text-base font-normal normal-case tracking-normal text-ash">/ Articles</span>
            </h3>
            <Link href="/articles" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-nv hover:text-bone">
              All reports <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <ul data-reveal="stagger" className="grid gap-px bg-steel/60 ring-1 ring-steel/60 md:grid-cols-3">
            {articles.map((a) => (
              <li key={a.id} className="bg-void">
                <button type="button" onClick={() => setSelected({ item: a, type: 'article' })} className="group flex h-full w-full flex-col gap-3 p-5 text-left hover:bg-gunmetal">
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
                    <FileText size={13} aria-hidden="true" /> {formatDate(a.publishedAt) ?? 'Report'}
                  </span>
                  <span className="line-clamp-3 font-display text-xl font-bold uppercase leading-tight tracking-wide text-bone group-hover:text-white">{reportTitle(a.title)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <IntelViewer item={selected?.item ?? null} type={selected?.type ?? 'project'} onClose={() => setSelected(null)} />
    </>
  );
}
