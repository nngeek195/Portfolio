'use client';

import { useState } from 'react';
import { FolderGit2 } from 'lucide-react';
import ItemModal from '@/components/ItemModal';
import SmartImage from '@/components/SmartImage';
import type { ContentItem } from '@/lib/content-types';
import { stripHtml } from '@/lib/text';

type Project = ContentItem;

export default function ProjectList({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);

  if (projects.length === 0) {
    return (
      <div className="text-slate-400 text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
        No projects published yet. Check back soon!
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-6">
        {projects.map((project) => {
          const name = project.repoName || project.title || 'Untitled project';
          const excerpt = project.description ? stripHtml(project.description) : '';
          return (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => setSelected(project)}
                className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-gray-900 border border-gray-800 hover:border-cyan-500 p-6 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] group"
              >
                <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden border-2 border-cyan-900 group-hover:border-cyan-400 transition-colors shrink-0 bg-black flex items-center justify-center">
                  {project.bannerImage ? (
                    <SmartImage src={project.bannerImage} alt={name} fill sizes="(min-width: 640px) 192px, 100vw" className="object-cover" />
                  ) : (
                    <FolderGit2 className="text-slate-700" size={32} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">{name}</h3>
                  <p className="text-slate-400 mt-2 line-clamp-2">{excerpt}</p>
                  <span className="inline-block mt-4 text-cyan-500 text-sm font-semibold group-hover:text-cyan-300">
                    Click to view documentation →
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <ItemModal isOpen={!!selected} onClose={() => setSelected(null)} type="project" data={selected} />
    </>
  );
}
