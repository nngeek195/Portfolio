import type { Metadata } from 'next';
import { getArticles } from '@/lib/content';
import ArticleGrid from '@/components/content/ArticleGrid';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Articles',
  description: "Notes and write-ups on systems, security, and things I'm learning along the way.",
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 border-b border-gray-800 pb-6">
          <p className="text-cyan-500 text-sm font-semibold tracking-wide uppercase mb-2">Writing</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Knowledge Sharing
          </h1>
          <p className="text-slate-400 mt-4 max-w-2xl">
            Notes and write-ups on systems, security, and things I&apos;m learning along the way.
          </p>
        </div>
        <ArticleGrid articles={articles} />
      </div>
    </div>
  );
}
