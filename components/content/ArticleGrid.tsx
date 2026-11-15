'use client';

import { useState } from 'react';
import { Calendar, FileText } from 'lucide-react';
import ItemModal from '@/components/ItemModal';
import SmartImage from '@/components/SmartImage';
import type { ContentItem } from '@/lib/content-types';
import { formatDate, stripHtml } from '@/lib/text';

type Article = ContentItem;

export default function ArticleGrid({ articles }: { articles: Article[] }) {
  const [selected, setSelected] = useState<Article | null>(null);

  if (articles.length === 0) {
    return (
      <div className="text-slate-400 text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
        No articles published yet. Check back soon!
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => {
          const excerpt = article.description ? stripHtml(article.description) : '';
          const date = formatDate(article.publishedAt);
          const cover = article.mediaUrls?.[0];
          const title = article.title || 'Untitled article';
          return (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => setSelected(article)}
                className="w-full h-full text-left bg-gray-900 border border-gray-800 hover:border-cyan-500 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden flex flex-col group"
              >
                <div className="h-48 w-full bg-gray-800 overflow-hidden relative">
                  {cover ? (
                    <SmartImage
                      src={cover}
                      alt={title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <FileText size={40} aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  {date && (
                    <span className="flex items-center gap-1.5 text-xs text-cyan-600 font-semibold mb-2">
                      <Calendar size={12} aria-hidden="true" /> {date}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-slate-200 group-hover:text-cyan-300 transition-colors mb-2">
                    {title}
                  </h3>
                  {excerpt && <p className="text-slate-400 text-sm line-clamp-3">{excerpt}</p>}
                  <span className="mt-4 text-cyan-500 text-sm font-semibold group-hover:text-cyan-300 inline-flex items-center gap-1">
                    Read more →
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <ItemModal isOpen={!!selected} onClose={() => setSelected(null)} type="article" data={selected} />
    </>
  );
}
