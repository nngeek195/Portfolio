import type { Metadata } from 'next';
import { getProjects } from '@/lib/content';
import ProjectList from '@/components/content/ProjectList';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Projects',
  description: "Things I've built: software projects with full write-ups and READMEs.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 border-b border-gray-800 pb-6">
          <p className="text-cyan-500 text-sm font-semibold tracking-wide uppercase mb-2">Portfolio</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Featured Projects
          </h1>
          <p className="text-slate-400 mt-4 max-w-2xl">
            A selection of things I&apos;ve built — click any card for the full write-up.
          </p>
        </div>
        <ProjectList projects={projects} />
      </div>
    </div>
  );
}
