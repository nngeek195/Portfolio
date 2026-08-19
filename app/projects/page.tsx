'use client';

import { useState, useEffect } from 'react';
import ItemModal from '@/components/ItemModal';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, FolderGit2, Menu, X  } from 'lucide-react';
import { usePathname } from 'next/navigation';

// Same HTML-description pattern as certificates/articles — strip tags for
// the card preview line, ItemModal still gets the untouched HTML.
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
const NAV_LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Articles', href: '/articles' },
  { label: 'Projects', href: '/projects' },
  { label: 'Contact', href: '/#contact' },];
   
export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => !href.startsWith('/#') && pathname === href;

  // Fetch real data from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, 'curated_content'), where('category', '==', 'project'));
        const querySnapshot = await getDocs(q);

        const fetchedProjects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects from Firebase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-300">
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-cyan-900/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
        >
          Niranga Nayanajith
        </Link>
 
        <nav className="hidden md:flex gap-8 font-semibold text-slate-300">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`hover:text-cyan-400 transition-colors ${
                isActive(link.href) ? 'text-cyan-400' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
 
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          className="md:hidden text-slate-200 hover:text-cyan-400 transition-colors p-1"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
 
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-cyan-900/50 bg-black/95 backdrop-blur-md ${
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col px-6 py-4 gap-1 font-semibold text-slate-300">
          {NAV_LINKS.map((link, idx) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`py-3 hover:text-cyan-400 transition-colors ${
                idx < NAV_LINKS.length - 1 ? 'border-b border-gray-900' : ''
              } ${isActive(link.href) ? 'text-cyan-400' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    `</header>

      <div className="pt-32 pb-24 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 border-b border-gray-800 pb-6">
            <p className="text-cyan-500 text-sm font-semibold tracking-wide uppercase mb-2">Portfolio</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Featured Projects
            </h1>
            <p className="text-slate-400 mt-4 max-w-2xl">
              A selection of things I've built — click any card for the full write-up.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-cyan-400">
              <Loader2 className="animate-spin mr-3" size={32} /> Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-slate-400 text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
              No projects published yet. Check back soon!
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => {
                const excerpt = project.description ? stripHtml(project.description) : '';
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-gray-900 border border-gray-800 hover:border-cyan-500 p-6 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] group"
                  >
                    <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden border-2 border-cyan-900 group-hover:border-cyan-400 transition-colors shrink-0 bg-black flex items-center justify-center">
                      {project.bannerImage ? (
                        <img
                          src={project.bannerImage}
                          className="w-full h-full object-cover"
                          alt={project.repoName || project.title}
                        />
                      ) : (
                        <FolderGit2 className="text-slate-700" size={32} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {project.repoName || project.title}
                      </h3>
                      <p className="text-slate-400 mt-2 line-clamp-2">{excerpt}</p>
                      <span className="inline-block mt-4 text-cyan-500 text-sm font-semibold group-hover:text-cyan-300">
                        Click to view documentation →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ItemModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        type="project"
        data={selectedProject}
      />
    </div>
  );
}