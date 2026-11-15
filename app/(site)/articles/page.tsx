import type { Metadata } from 'next';
import { getArticles } from '@/lib/content';
import ArticleGrid from '@/components/content/ArticleGrid';
import PageHeader from '@/components/ui/PageHeader';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Articles',
  description: "Notes and write-ups on systems, security, and things I'm learning along the way.",
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div>
      <PageHeader
        code="INTEL"
        plain="Articles"
        title="Intel reports"
        intro="Notes and write-ups on systems, security, and things I'm learning along the way."
        count={articles.length}
        countLabel="Reports filed"
      />
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <ArticleGrid articles={articles} />
      </div>
    </div>
  );
}
