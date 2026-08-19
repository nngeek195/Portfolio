'use client';

import { useEffect, useState } from 'react';
import { X, Upload, Loader2, ExternalLink } from 'lucide-react'; 
import 'github-markdown-css/github-markdown-dark.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'article' | 'certificate' | 'project';
  data: any; 
  onUpdate?: (updatedData: any) => void; 
}

export default function ItemModal({ isOpen, onClose, type, data, onUpdate }: ModalProps) {
  const [liveReadme, setLiveReadme] = useState<string | null>(null);
  const [isLoadingReadme, setIsLoadingReadme] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    setLiveReadme(null);
    if (isOpen && type === 'project' && data?.repoName) {
      if (data.readmeHtml) {
        setLiveReadme(data.readmeHtml);
      } else {
        setIsLoadingReadme(true);
        fetch(`/api/github/readme?repo=${data.repoName}`)
          .then(res => res.json())
          .then(resData => setLiveReadme(resData.html || '<p>No README found for this repository.</p>'))
          .catch(() => setLiveReadme('<p>Error loading README.</p>'))
          .finally(() => setIsLoadingReadme(false));
      }
    }
  }, [isOpen, type, data]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdate) return;

    setIsUploadingBanner(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'portfolio_preset'); 

    try {
      const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
      const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const uploadData = await response.json();
      
      if (uploadData.secure_url) {
        onUpdate({ ...data, bannerImage: uploadData.secure_url });
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Failed to upload banner to Cloudinary.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="relative w-[95vw] md:w-[90vw] h-[95vh] md:h-[90vh] bg-gray-950 border border-cyan-900/50 rounded-xl shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden flex flex-col">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-cyan-500/20 text-cyan-400 rounded-full transition-colors backdrop-blur-md"
        >
          <X size={24} />
        </button>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          
          {/* --- ARTICLE & CERTIFICATE LAYOUT --- */}
          {(type === 'article' || type === 'certificate') && (
             <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
              <div className="lg:w-1/2 text-slate-300 whitespace-pre-wrap leading-relaxed order-2 lg:order-1 text-lg">
                <h2 className="text-3xl font-bold text-cyan-400 mb-6">{data.title}</h2>
                <div dangerouslySetInnerHTML={{ __html: data.description }} />
              </div>
              <div className="lg:w-1/2 order-1 lg:order-2">
                <div className="rounded-lg overflow-hidden border border-cyan-900/50 bg-black/50">
                  {data.videoUrl ? (
                    <video controls src={data.videoUrl} className="w-full h-auto object-cover mb-2" />
                  ) : null}
                  {data.mediaUrls?.map((url: string, index: number) => (
                    <img key={index} src={url} alt="Showcase" className="w-full h-auto object-cover mb-2" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- PROJECT (GITHUB + SCRAPED POST) LAYOUT --- */}
          {type === 'project' && (
            <div className="flex flex-col max-w-5xl mx-auto w-full">
              
              {/* 1. EDITABLE BANNER SECTION */}
              <div className="w-full h-48 md:h-72 rounded-xl overflow-hidden relative mb-8 border border-gray-800 group shadow-lg">
                <img 
                  src={data.bannerImage || 'https://github.blog/wp-content/uploads/2020/12/102952402-23f2b480-449e-11eb-8dc0-019d65825700.png'} 
                  alt="Project Banner" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {onUpdate && (
                  <label className={`absolute inset-0 flex flex-col items-center justify-center bg-black/70 cursor-pointer transition-opacity ${isUploadingBanner ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isUploadingBanner ? (
                      <Loader2 className="text-cyan-400 animate-spin mb-2" size={32} />
                    ) : (
                      <Upload className="text-white mb-2" size={32} />
                    )}
                    <span className="text-white font-bold">{isUploadingBanner ? 'Uploading to Cloudinary...' : 'Change GitHub Banner Image'}</span>
                    <input type="file" className="hidden" onChange={handleBannerUpload} accept="image/*" disabled={isUploadingBanner} />
                  </label>
                )}
              </div>
              
              {/* 2. TITLE & EXPLORE BUTTON */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-gray-800 pb-6">
                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {data.repoName || data.title}
                </h2>
                {data.repoUrl && (
                  <a 
                    href={data.repoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-full shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all hover:-translate-y-1"
                  >
                    Explore Repository <ExternalLink size={18} />
                  </a>
                )}
              </div>

              {/* 3. POST DESCRIPTION WITH FLOATING MEDIA (Text wrapping) */}
              {(data.description || data.mediaUrls?.length > 0 || data.videoUrl) && (
                <div className="mb-12 text-slate-300 text-lg leading-relaxed whitespace-pre-wrap clear-both">
                  
                  {/* Media Container (Floats right on large screens) */}
                  {/* Media Container (Floats right on large screens for Projects, or centered for Articles) */}
                  {(data.mediaUrls?.length > 0 || data.videoUrl || data.pdfUrl) && (
                    <div className="float-none lg:float-right w-full lg:w-[45%] lg:ml-8 mb-6 flex flex-col gap-3">
                      
                      <div className="rounded-xl overflow-hidden border border-cyan-900/40 bg-black shadow-lg">
                        
                        {/* Video Player */}
                        {data.videoUrl ? (
                          <video controls src={data.videoUrl} className="w-full h-auto object-cover" />
                        ) : data.pdfUrl ? (
                          /* PDF Viewer Embedded */
                          <div className="flex flex-col">
                            <iframe 
                              src={`${data.pdfUrl}#toolbar=0`} 
                              className="w-full h-96 bg-white"
                              title="Attached Document"
                            />
                            <a 
                              href={data.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-3 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-400 text-center font-bold text-sm border-t border-cyan-900 transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink size={16} /> Open Full PDF Document
                            </a>
                          </div>
                        ) : (
                          /* Standard Images with Link */
                          data.sourceUrl ? (
                            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="block relative group cursor-pointer">
                              {data.mediaUrls?.map((url: string, index: number) => (
                                <img key={index} src={url} alt="Post Media" className="w-full h-auto object-cover border-b border-gray-900 last:border-0 group-hover:opacity-60 transition-opacity" />
                              ))}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                                <span className="bg-cyan-600 text-black font-bold px-5 py-3 rounded-full flex items-center gap-2 shadow-lg transform hover:scale-105 transition-transform">
                                  <ExternalLink size={20} /> View Original Post
                                </span>
                              </div>
                            </a>
                          ) : (
                            data.mediaUrls?.map((url: string, index: number) => (
                              <img key={index} src={url} alt="Post Media" className="w-full h-auto object-cover border-b border-gray-900 last:border-0" />
                            ))
                          )
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Text Container (Wraps around the floated media) */}
                  <div 
                    className="font-medium" 
                    dangerouslySetInnerHTML={{ __html: data.description || 'No description provided.' }} 
                  />
                  
                  {/* Clearfix to ensure layout doesn't break into the README */}
                  <div className="clear-both"></div>
                </div>
              )}

              {/* 4. GITHUB STYLED README */}
              <div className="bg-[#0d1117] p-6 md:p-10 rounded-xl border border-gray-800 shadow-xl overflow-x-auto">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                  <svg height="24" viewBox="0 0 16 16" version="1.1" width="24" className="fill-slate-400">
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
                  </svg>
                  <h3 className="text-slate-300 font-semibold tracking-wide uppercase text-sm">README.md</h3>
                </div>

                {isLoadingReadme ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <Loader2 className="text-cyan-400 animate-spin" size={32} />
                    <span className="text-slate-400">Extracting README from GitHub...</span>
                  </div>
                ) : (
                  <div 
                    className="markdown-body" 
                    style={{ backgroundColor: 'transparent' }} 
                    dangerouslySetInnerHTML={{ __html: liveReadme || '<p>No README available.</p>' }} 
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}