import type { Metadata } from 'next';
import { getProjects } from '@/lib/content';
import ProjectList from '@/components/content/ProjectList';
import PageHeader from '@/components/ui/PageHeader';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Projects',
  description: "Things I've built: software projects with full write-ups and READMEs.",
};

const byDateDesc = (a: { publishedAt?: string }, b: { publishedAt?: string }) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? ''));

export default async function ProjectsPage() {
  // Featured projects first (admin order), then the rest newest first.
  const projects = (await getProjects()).sort(
    (a, b) =>
      Number(!!b.featured) - Number(!!a.featured) ||
      (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity) ||
      byDateDesc(a, b)
  );

  return (
    <div className="topo-lines">
      <PageHeader
        code="ARCHIVE"
        plain="Projects"
        title="All operations"
        intro="Everything I've built, filed as mission briefings. Open one for the full write-up and README."
        count={projects.length}
        countLabel="Operations on file"
      />
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <ProjectList projects={projects} />
      </div>
    </div>
  );
}
