'use client';

import { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, PlusCircle, FolderGit2, CheckCircle, X, Trash2, Globe, Upload, Loader2, RefreshCw, AlertTriangle, ChevronDown, Search, Check } from 'lucide-react';
import ItemModal from '@/components/ItemModal';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
}

// Searchable single-select dropdown, used below for the GitHub repo merge
// picker — lets you type to filter instead of scrolling a native <select>.
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No results found.',
  className = '',
}: {
  options: SearchableOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 bg-gray-900 text-slate-300 border border-gray-700 rounded p-3 outline-none focus:border-cyan-500 hover:border-gray-600 transition-colors"
      >
        <span className={`truncate ${selected ? 'text-slate-200' : 'text-slate-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full min-w-[280px] bg-gray-950 border border-cyan-900/50 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
            <Search size={16} className="text-slate-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">{emptyMessage}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left hover:bg-cyan-950/30 transition-colors ${
                    opt.id === value ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-300'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{opt.label}</span>
                    {opt.sublabel && <span className="block text-xs text-slate-500 truncate mt-0.5">{opt.sublabel}</span>}
                  </span>
                  {opt.id === value && <Check size={16} className="flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
          <div className="px-3 py-1.5 border-t border-gray-800 text-[11px] text-slate-600">
            {filtered.length} of {options.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImportersPage() {
  const [activeTab, setActiveTab] = useState<'url' | 'github' | 'live'>('url');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [publishedIds, setPublishedIds] = useState<Record<string, boolean>>({});
  
  // Scraper States
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewCategory, setPreviewCategory] = useState('article');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // GitHub States
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<Record<string, boolean>>({});

  // Live Content States
  const [liveContent, setLiveContent] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  // Fetch Live Content & Published IDs
  const fetchLiveContent = async () => {
    setIsLoadingLive(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'curated_content'));
      const items: any[] = [];
      const ids: Record<string, boolean> = {};
      
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        ids[doc.id] = true;
      });
      
      setLiveContent(items);
      setPublishedIds(ids);
    } catch (error) {
      console.error("Failed to fetch live content");
    } finally {
      setIsLoadingLive(false);
    }
  };
  // --- UPDATE LOGIC (For Banner Images) ---
  const handleUpdateItem = async (updatedItem: any) => {
    try {
      await setDoc(doc(db, 'curated_content', updatedItem.id), updatedItem, { merge: true });
      setSelectedItem(updatedItem); // Update modal UI instantly
      fetchLiveContent(); // Refresh the live list in the background
    } catch (error) {
      alert('Failed to update item in database.');
    }
  };
  useEffect(() => {
    fetchLiveContent();
  }, []);

  const fetchGithubData = async () => {
    setIsLoadingGithub(true);
    setGithubError(null);
    try {
      const res = await fetch('/api/github/repos');
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Unexpected response shape from /api/github/repos');

      // De-dupe by id (in case the API ever returns overlapping pages) and
      // sort alphabetically so the list — and the search below — is predictable.
      const deduped = Array.from(new Map(data.map((r: any) => [r.id, r])).values());
      deduped.sort((a: any, b: any) => (a.repoName || '').localeCompare(b.repoName || ''));

      setGithubRepos(deduped);
    } catch (error: any) {
      console.error('Error fetching GitHub data:', error);
      setGithubError(error?.message || 'Failed to load repositories.');
    } finally {
      setIsLoadingGithub(false);
    }
  };

  useEffect(() => {
    if (githubRepos.length === 0) fetchGithubData();
  }, []);

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(scrapeUrl)}`);
      const data = await res.json();
      if (res.ok) {
        setPreviewItem({ ...data, id: `imported-${Date.now()}` });
      } else {
        alert(data.error || 'Failed to scrape');
      }
    } catch (error) {
      alert('Error fetching URL data');
    } finally {
      setIsScraping(false);
    }
  };

  // --- MANUAL PDF UPLOAD (For LinkedIn document posts scraping can't reach) ---
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }

    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'portfolio_preset');

    try {
      // Use the "auto" endpoint (not "image") since this is a raw PDF, not an image.
      const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`;
      const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const uploadData = await response.json();

      if (uploadData.secure_url) {
        setPreviewItem((prev: any) => ({ ...prev, pdfUrl: uploadData.secure_url }));
      } else {
        alert(uploadData.error?.message || 'Failed to upload PDF.');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Failed to upload PDF to Cloudinary.');
    } finally {
      setIsUploadingPdf(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  const removePreviewImage = (indexToRemove: number) => {
    setPreviewItem((prev: any) => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_: any, i: number) => i !== indexToRemove)
    }));
  };

  // --- PUBLISH LOGIC (Updated for Merge ID) ---
  const handlePublish = async (item: any, type: 'url' | 'github') => {
    const finalCategory = type === 'url' ? previewCategory : 'project';
    let mergedData = { ...item };
    let finalId = item.id;

    // FIX: If merging URL to Project, force the ID to be the GitHub Repo ID
    if (type === 'url' && finalCategory === 'project') {
      if (!selectedRepoId) return alert('Please select a GitHub repository to merge with this project.');
      const linkedRepo = githubRepos.find(r => r.id === selectedRepoId);
      if (linkedRepo) {
        finalId = selectedRepoId; 
        mergedData = {
          ...mergedData,
          repoName: linkedRepo.repoName,
          repoUrl: linkedRepo.repoUrl,
          bannerImage: item.mediaUrls?.[0] || linkedRepo.bannerImage || null,
        };
      }
    }

    setIsPublishing(prev => ({ ...prev, [finalId]: true }));

    try {
      const docData = { ...mergedData, category: finalCategory, publishedAt: new Date().toISOString(), id: finalId };
      await setDoc(doc(db, 'curated_content', finalId), docData);
      
      setPublishedIds(prev => ({ ...prev, [finalId]: true }));
      fetchLiveContent(); // Refresh live content tab
      
      if (type === 'url') {
        alert('Published successfully!');
        setPreviewItem(null);
        setScrapeUrl('');
        setSelectedRepoId('');
      }
    } catch (error) {
      alert('Failed to publish.');
    } finally {
      setIsPublishing(prev => ({ ...prev, [finalId]: false }));
    }
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from your live portfolio?')) return;
    
    setIsDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await deleteDoc(doc(db, 'curated_content', id));
      
      // Update local states immediately
      setPublishedIds(prev => {
        const newIds = { ...prev };
        delete newIds[id];
        return newIds;
      });
      setLiveContent(prev => prev.filter(item => item.id !== id));
      
    } catch (error) {
      alert('Failed to remove item.');
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Data Importers</h1>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-800 pb-px">
        <button onClick={() => setActiveTab('url')} className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition-colors ${activeTab === 'url' ? 'bg-cyan-950/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <LinkIcon size={20} /> URL Importer
        </button>
        <button onClick={() => setActiveTab('github')} className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition-colors ${activeTab === 'github' ? 'bg-cyan-950/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <FolderGit2 size={20} /> GitHub Repositories
        </button>
        <button onClick={() => setActiveTab('live')} className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-t-lg transition-colors ${activeTab === 'live' ? 'bg-cyan-950/30 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <Globe size={20} /> Manage Live Content
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[500px]">
        
        {/* --- URL IMPORTER TAB --- */}
        {activeTab === 'url' && (
          <div className="space-y-8">
            <div className="flex gap-4">
              <input type="text" placeholder="Paste any article, certificate, or project URL..." value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} className="flex-1 bg-black text-white border border-gray-700 rounded-lg p-4 outline-none focus:border-cyan-500" />
              <button onClick={handleScrape} disabled={isScraping || !scrapeUrl} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-8 py-4 rounded-lg transition-all disabled:opacity-50">
                {isScraping ? 'Scraping...' : 'Fetch Preview'}
              </button>
            </div>

            {previewItem && (
              <div className="bg-black border border-cyan-900 p-6 rounded-xl relative">
                <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-red-400"><X size={20} /></button>
                
                <h3 className="text-cyan-400 font-bold mb-2">Title</h3>
                <input type="text" value={previewItem.title} onChange={(e) => setPreviewItem({...previewItem, title: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2 mb-4" />

                <h3 className="text-cyan-400 font-bold mb-2">Description</h3>
                <textarea rows={4} value={previewItem.description} onChange={(e) => setPreviewItem({...previewItem, description: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2 mb-4 custom-scrollbar" />

                <div className="mb-6">
                  <h3 className="text-cyan-400 font-bold mb-2">Extracted Media & Documents</h3>
                  
                  {/* Media Grid (Images & PDF preview cards) */}
                  <div className="flex flex-wrap gap-4">
                    {/* Render standard extracted images */}
                    {previewItem.mediaUrls?.map((url: string, idx: number) => (
                      <div key={idx} className="relative w-32 h-32 rounded-lg border border-gray-700 overflow-hidden group bg-gray-900">
                        <img src={url} className="w-full h-full object-cover" alt="Extracted" />
                        <button onClick={() => removePreviewImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={14}/>
                        </button>
                      </div>
                    ))}

                    {/* Render PDF Preview Card if a PDF was scraped */}
                    {previewItem.pdfUrl && (
                      <div className="relative w-48 h-32 rounded-lg border border-cyan-800 bg-cyan-950/40 p-3 flex flex-col justify-between overflow-hidden group">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-cyan-900 text-cyan-300 rounded font-bold text-xs uppercase">PDF</span>
                          <span className="text-xs text-slate-300 truncate font-medium">Document attached</span>
                        </div>
                        <a 
                          href={previewItem.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-cyan-400 hover:text-cyan-300 underline truncate"
                        >
                          Preview PDF File ↗
                        </a>
                        <button 
                          onClick={() => setPreviewItem({ ...previewItem, pdfUrl: null })} 
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14}/>
                        </button>
                      </div>
                    )}

                    {/* Manual PDF Upload (Cloudinary) — for LinkedIn document posts the scraper can't reach */}
                    <label className={`relative w-48 h-32 rounded-lg border border-dashed border-gray-700 hover:border-cyan-600 bg-gray-900 p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${isUploadingPdf ? 'opacity-70 pointer-events-none' : ''}`}>
                      {isUploadingPdf ? (
                        <Loader2 className="text-cyan-400 animate-spin" size={24} />
                      ) : (
                        <Upload className="text-slate-400" size={24} />
                      )}
                      <span className="text-xs text-slate-400 text-center font-medium">
                        {isUploadingPdf ? 'Uploading to Cloudinary...' : previewItem.pdfUrl ? 'Replace PDF' : 'Upload PDF Manually'}
                      </span>
                      <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} disabled={isUploadingPdf} />
                    </label>
                  </div>

                  {/* Video Notice */}
                  {previewItem.videoUrl && (
                    <div className="mt-4 p-4 bg-gray-900 border border-emerald-900 rounded-lg text-emerald-400 font-medium text-sm">
                      ✅ Video Detected in Post
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 mt-6 border-t border-gray-800 pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <select value={previewCategory} onChange={(e) => setPreviewCategory(e.target.value)} className="bg-gray-900 text-slate-300 border border-gray-700 rounded p-3 outline-none focus:border-cyan-500">
                      <option value="article">Article</option>
                      <option value="project">Project</option>
                    </select>

                    {previewCategory === 'project' && (
                      <SearchableSelect
                        className="flex-1"
                        value={selectedRepoId}
                        onChange={setSelectedRepoId}
                        placeholder="Select GitHub Repo to Merge..."
                        emptyMessage="No matching repositories."
                        options={githubRepos.map((repo) => ({
                          id: repo.id,
                          label: repo.repoName,
                          sublabel: repo.description || undefined,
                        }))}
                      />
                    )}

                    <button onClick={() => handlePublish(previewItem, 'url')} disabled={isPublishing[previewItem.id]} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-8 py-3 rounded transition-all flex items-center justify-center gap-2">
                      {isPublishing[previewItem.id] ? 'Saving...' : <><PlusCircle size={20} /> Publish to Live Site</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- GITHUB TAB --- */}
        {activeTab === 'github' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">
                {isLoadingGithub ? 'Loading…' : `${githubRepos.length} repositor${githubRepos.length === 1 ? 'y' : 'ies'} found`}
              </p>
              <button
                onClick={fetchGithubData}
                disabled={isLoadingGithub}
                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={isLoadingGithub ? 'animate-spin' : ''} />
                {isLoadingGithub ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {githubError && (
              <div className="flex items-center gap-3 bg-red-950/30 border border-red-900 text-red-400 rounded-lg px-4 py-3 mb-6">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span className="text-sm flex-1">{githubError}</span>
                <button onClick={fetchGithubData} className="text-sm font-bold underline hover:text-red-300 flex-shrink-0">
                  Retry
                </button>
              </div>
            )}

            {isLoadingGithub && githubRepos.length === 0 && (
              <div className="text-cyan-400 flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} /> Loading GitHub data...
              </div>
            )}

            {!isLoadingGithub && !githubError && githubRepos.length === 0 && (
              <div className="text-gray-500 text-center py-10">No repositories returned by the GitHub API.</div>
            )}

            {githubRepos.map((repo) => (
              <div key={repo.id} className="bg-black border border-gray-800 p-6 rounded-lg flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:border-cyan-900 transition-colors mb-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedItem({ ...repo, category: 'project', type: 'project' })}
                >
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">{repo.repoName}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{repo.description}</p>
                </div>

                {publishedIds[repo.id] ? (
                  <button disabled className="flex items-center gap-2 bg-emerald-950/30 text-emerald-500 border border-emerald-900 font-bold px-6 py-2 rounded cursor-not-allowed">
                    <CheckCircle size={18} /> Added
                  </button>
                ) : (
                  <button onClick={() => handlePublish(repo, 'github')} disabled={isPublishing[repo.id]} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-6 py-2 rounded transition-all disabled:opacity-50">
                    {isPublishing[repo.id] ? 'Saving...' : <><PlusCircle size={18} /> Add to Projects</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* --- LIVE CONTENT TAB --- */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {isLoadingLive ? (
              <div className="text-cyan-400">Loading live content...</div>
            ) : liveContent.length === 0 ? (
              <div className="text-gray-500 text-center py-10">No content published yet.</div>
            ) : (
              liveContent.map((item) => (
                <div key={item.id} className="bg-black border border-gray-800 p-6 rounded-lg flex flex-col sm:flex-row gap-6 justify-between items-center hover:border-red-900/50 transition-colors">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedItem(item)}>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 bg-cyan-950/30 px-2 py-1 rounded mb-2 inline-block">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-200">{item.title || item.repoName}</h3>
                    <p className="text-sm text-slate-400 line-clamp-1">{item.description}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting[item.id]}
                    className="flex items-center gap-2 bg-red-950/30 hover:bg-red-900 text-red-500 hover:text-white border border-red-900 font-bold px-4 py-2 rounded transition-all disabled:opacity-50"
                  >
                    {isDeleting[item.id] ? 'Removing...' : <><Trash2 size={18} /> Remove</>}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <ItemModal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        type={selectedItem?.category || selectedItem?.type || 'article'} 
        data={selectedItem} 
        onUpdate={handleUpdateItem} // <-- THIS enables the banner upload!
      />
    </div>
  );
}