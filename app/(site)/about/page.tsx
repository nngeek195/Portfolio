// app/about/page.tsx
'use client';

import { useState } from 'react';
import ItemModal from '@/components/ItemModal';

export default function AboutPage() {
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Mock data - will be replaced by Firestore fetch: db.collection('curated_content').where('category', '==', 'certificate')
  const certificates = [
    { id: 1, title: 'Networking Basics', issuer: 'Cisco', mediaUrls: ['/images/placeholders/cert.svg'], description: 'Completed fundamentals of network architecture.' }
  ];

  return (
    <div className="min-h-screen bg-black pt-24 px-6 md:px-20">
      
      {/* About Section */}
      <section className="max-w-7xl mx-auto mb-32 flex flex-col md:flex-row gap-16 items-center">
        <div className="md:w-1/2 text-slate-300">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            Hello, I'm <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Niranga Kumara</span>
          </h1>
          <p className="text-xl leading-relaxed mb-6">
            An undergraduate at the Faculty of Computing, Sabaragamuwa University of Sri Lanka, specializing in Computing and Information Systems. 
          </p>
          <p className="text-lg leading-relaxed text-slate-400">
            I am a full-stack developer and cybersecurity enthusiast heavily focused on network scanning, vulnerability assessments, and building complex systems using Next.js, Python, and Ubuntu environments.
          </p>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="w-64 h-64 rounded-full border-4 border-cyan-500 shadow-[0_0_30px_rgba(0,255,234,0.5)] overflow-hidden">
             <img src="/images/placeholders/profile.svg" /* PLACEHOLDER: about-page — orphaned page, see PLACEHOLDERS.md */ alt="Niranga Kumara" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Certificates Section */}
      <section className="max-w-7xl mx-auto mb-32">
        <h2 className="text-4xl font-bold text-cyan-400 mb-12 border-b border-gray-800 pb-4">Curated Certificates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map(cert => (
            <div 
              key={cert.id} 
              onClick={() => setSelectedCert(cert)}
              className="bg-gray-900 border border-gray-800 hover:border-cyan-500 p-6 rounded-xl cursor-pointer transition-all hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
            >
              <h3 className="text-xl font-bold text-slate-200 mb-2">{cert.title}</h3>
              <p className="text-cyan-600">{cert.issuer}</p>
            </div>
          ))}
        </div>
      </section>

      <ItemModal 
        isOpen={!!selectedCert} 
        onClose={() => setSelectedCert(null)} 
        type="certificate" 
        data={selectedCert} 
      />
    </div>
  );
}