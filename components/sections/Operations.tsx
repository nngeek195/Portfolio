import type { ContentItem } from '@/lib/content-types';
import Placeholder from '@/components/ui/Placeholder';
import SectionHeader from '@/components/ui/SectionHeader';
import OperationsTrack from './OperationsTrack';

const FEATURED_COUNT = 6;

// OBJ-04 Operations (Projects).
export default function Operations({ projects, articles }: { projects: ContentItem[]; articles: ContentItem[] }) {
  // PLACEHOLDER: featured-projects — no "featured" flag exists yet, so this shows
  // the most recently published projects. Add a flag in the admin to choose them.
  const featured = [...projects]
    .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')))
    .slice(0, FEATURED_COUNT);
  const latestArticles = articles.slice(0, 3);

  return (
    <section id="operations" aria-labelledby="operations-title" className="topo-lines relative scroll-mt-16 overflow-hidden border-t border-steel/60 bg-void py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader id="operations" kicker="Selected projects, filed as mission briefings. Open any one for the full write-up and README." />
        <p className="-mt-8 mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
          <Placeholder id="featured-projects">Showing latest {featured.length} — no featured flag yet</Placeholder>
        </p>
        <OperationsTrack projects={featured} articles={latestArticles} totalProjects={projects.length} />
      </div>
    </section>
  );
}
