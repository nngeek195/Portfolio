'use client';

import { useState } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import IntelViewer from '@/components/intel/IntelViewer';
import SmartImage from '@/components/SmartImage';
import type { ContentItem } from '@/lib/content-types';
import { formatDate, stripHtml } from '@/lib/text';

// Imported LinkedIn titles: "Post title | Name posted on the topic | LinkedIn".
const cleanTitle = (t?: string) => (t ?? '').split(' | ')[0].trim() || 'Untitled report';

// /articles — intel report cards; opens the intel viewer.
export default function ArticleGrid({ articles }: { articles: ContentItem[] }) {
  const [selected, setSelected] = useState<ContentItem | null>(null);

  if (articles.length === 0) {
    return <p className="clip-corner bg-gunmetal py-20 text-center text-ash ring-1 ring-inset ring-steel">No intel reports filed yet.</p>;
  }

  return (
    <>
      <ul data-reveal="stagger" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, i) => {
          const excerpt = article.description ? stripHtml(article.description) : '';
          const date = formatDate(article.publishedAt);
          const cover = article.mediaUrls?.[0];
          const title = cleanTitle(article.title);
          return (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => setSelected(article)}
                className="clip-corner group flex h-full w-full flex-col bg-gunmetal text-left ring-1 ring-inset ring-steel transition-colors hover:ring-ash"
              >
                <span className="flex items-center justify-between border-b border-dashed border-steel px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
                  <span className="text-nv">RPT-{String(i + 1).padStart(3, '0')}</span>
                  <span>{date ?? 'Undated'}</span>
                </span>
                <span className="relative block h-44 w-full overflow-hidden bg-void">
                  {cover ? (
                    <SmartImage
                      src={cover}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover opacity-70 grayscale-[35%] transition-[opacity,filter,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-steel">
                      <FileText size={36} aria-hidden="true" />
                    </span>
                  )}
                  <span className="scanlines absolute inset-0 opacity-40" aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="line-clamp-3 font-display text-2xl font-bold uppercase leading-tight tracking-wide text-bone [overflow-wrap:anywhere]">{title}</span>
                  {excerpt && <span className="mt-2 line-clamp-3 text-sm text-ash [overflow-wrap:anywhere]">{excerpt}</span>}
                  <span className="mt-auto flex items-center gap-2 pt-5 font-mono text-xs uppercase tracking-[0.2em] text-bone group-hover:text-nv">
                    Read report <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <IntelViewer item={selected} type="article" onClose={() => setSelected(null)} />
    </>
  );
}
