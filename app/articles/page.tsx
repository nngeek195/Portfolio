// app/articles/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ItemModal from '@/components/ItemModal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, FileText, Calendar, Menu, X  } from 'lucide-react';
import { usePathname } from 'next/dist/client/components/navigation';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Articles', href: '/articles' },
  { label: 'Projects', href: '/projects' },
  { label: 'Contact', href: '/#contact' },
];
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArticlesPage() {
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => !href.startsWith('/#') && pathname === href;
 

  // Fetch real articles from Firestore — mirrors the projects/certificates pattern:
  // everything lives in `curated_content`, filtered by category.
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'curated_content'), where('category', '==', 'article'));
        const querySnapshot = await getDocs(q);

        const fetchedArticles = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Newest first
        fetchedArticles.sort((a: any, b: any) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));

        setArticles(fetchedArticles);
      } catch (error) {
        console.error('Error fetching articles from Firebase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
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
    </header>

      <div className="pt-32 pb-24 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 border-b border-gray-800 pb-6">
            <p className="text-cyan-500 text-sm font-semibold tracking-wide uppercase mb-2">Writing</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Knowledge Sharing
            </h1>
            <p className="text-slate-400 mt-4 max-w-2xl">
              Notes and write-ups on systems, security, and things I'm learning along the way.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-cyan-400">
              <Loader2 className="animate-spin mr-3" size={32} /> Loading articles...
            </div>
          ) : articles.length === 0 ? (
            <div className="text-slate-400 text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
              No articles published yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => {
                const excerpt = article.description ? stripHtml(article.description) : '';
                const date = formatDate(article.publishedAt);
                return (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="bg-gray-900 border border-gray-800 hover:border-cyan-500 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden flex flex-col group"
                  >
                    <div className="h-48 bg-gray-800 overflow-hidden relative">
                      {article.mediaUrls?.[0] ? (
                        <img
                          src={article.mediaUrls[0]}
                          alt={article.title}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <FileText size={40} />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      {date && (
                        <span className="flex items-center gap-1.5 text-xs text-cyan-600 font-semibold mb-2">
                          <Calendar size={12} /> {date}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-slate-200 group-hover:text-cyan-300 transition-colors mb-2">
                        {article.title}
                      </h3>
                      {excerpt && <p className="text-slate-400 text-sm line-clamp-3">{excerpt}</p>}
                      <span className="mt-4 text-cyan-500 text-sm font-semibold group-hover:text-cyan-300 inline-flex items-center gap-1">
                        Read more →
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
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        type="article"
        data={selectedArticle}
      />
    </div>
  );
}