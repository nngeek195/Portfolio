'use client';

import { useState } from 'react';
import { ArrowRight, FolderGit2, Star } from 'lucide-react';
import IntelViewer from '@/components/intel/IntelViewer';
import SmartImage from '@/components/SmartImage';
import type { ContentItem } from '@/lib/content-types';
import { stripHtml } from '@/lib/text';

// /projects — every operation on file as a briefing row; opens the intel viewer.
export default function ProjectList({ projects }: { projects: ContentItem[] }) {
  const [selected, setSelected] = useState<ContentItem | null>(null);

  if (projects.length === 0) {
    return <p className="clip-corner bg-gunmetal py-20 text-center text-ash ring-1 ring-inset ring-steel">No operations on file yet.</p>;
  }

  return (
    <>
      <ol data-reveal="stagger" className="grid gap-4">
        {projects.map((project, i) => {
          const name = project.repoName || project.title || 'Untitled operation';
          const excerpt = project.description ? stripHtml(project.description) : '';
          return (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => setSelected(project)}
                className="clip-corner group grid w-full grid-cols-1 items-center gap-5 bg-gunmetal p-4 text-left ring-1 ring-inset ring-steel transition-colors hover:ring-ash sm:grid-cols-[5rem_12rem_1fr_auto] sm:p-5"
              >
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-nv">OP-{String(i + 1).padStart(2, '0')}</span>
                <span className="relative block h-32 overflow-hidden bg-void sm:h-24">
                  {project.bannerImage ? (
                    <SmartImage src={project.bannerImage} alt="" fill sizes="(min-width: 640px) 192px, 100vw" className="object-cover opacity-75 grayscale-[35%] transition-[opacity,filter] group-hover:opacity-100 group-hover:grayscale-0" />
                  ) : (
                    <span className="grid h-full place-items-center text-steel">
                      <FolderGit2 size={30} aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-2xl font-bold uppercase leading-tight tracking-wide text-bone md:text-3xl">{name}</span>
                    {project.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-amber ring-1 ring-inset ring-amber/50">
                        <Star size={11} fill="currentColor" aria-hidden="true" /> Featured
                      </span>
                    )}
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm text-ash">{excerpt || 'Briefing on file.'}</span>
                </span>
                <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-bone group-hover:text-nv">
                  View intel <ArrowRight size={14} aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <IntelViewer item={selected} type="project" onClose={() => setSelected(null)} />
    </>
  );
}
