import type { ContentItem } from '@/lib/content-types';
import Placeholder from '@/components/ui/Placeholder';
import SectionHeader from '@/components/ui/SectionHeader';
import OperationsTrack from './OperationsTrack';

const LATEST_COUNT = 6;
const byDateDesc = (a: ContentItem, b: ContentItem) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? ''));
const orderOf = (p: ContentItem) => (typeof p.featuredOrder === 'number' ? p.featuredOrder : Number.POSITIVE_INFINITY);

// OBJ-04 Operations (Projects).
export default function Operations({ projects, articles }: { projects: ContentItem[]; articles: ContentItem[] }) {
  // Projects flagged "Featured" in the admin (Importers > Manage Live Content),
  // in their chosen order (then newest). If none are flagged yet, fall back to
  // the latest projects and show a placeholder note.
  const flagged = projects.filter((p) => p.featured === true).sort((a, b) => orderOf(a) - orderOf(b) || byDateDesc(a, b));
  const featured = flagged.length > 0 ? flagged : [...projects].sort(byDateDesc).slice(0, LATEST_COUNT);
  const latestArticles = articles.slice(0, 3);

  return (
    <section id="operations" aria-labelledby="operations-title" className="topo-lines relative scroll-mt-16 overflow-hidden border-t border-steel/60 bg-void py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader id="operations" kicker="Selected projects, filed as mission briefings. Open any one for the full write-up and README." />
        {flagged.length === 0 && (
          <p className="-mt-8 mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
            {/* PLACEHOLDER: featured-projects — feature projects in Admin > Importers > Manage Live Content */}
            <Placeholder id="featured-projects">Showing latest {featured.length} — feature projects in the admin</Placeholder>
          </p>
        )}
        <OperationsTrack projects={featured} articles={latestArticles} totalProjects={projects.length} />
      </div>
    </section>
  );
}
