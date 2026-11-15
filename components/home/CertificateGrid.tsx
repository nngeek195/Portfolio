'use client';

import { useState } from 'react';
import { Award, FileText, Loader2 } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { CERT_PLACEHOLDER } from '@/lib/certificates';

export type CertificateCard = {
  id: string;
  title: string;
  issuer?: string;
  credentialUrl?: string | null;
  link?: string | null;
  mediaUrls?: string[];
};

// Shows a spinner while a certificate image loads, and falls back to the
// placeholder (then a plain icon) instead of a broken-image icon on failure.
function CertImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  // Reset when the parent passes a different image (React's "adjust state
  // during render" pattern; avoids an extra effect pass).
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setCurrentSrc(src);
    setStatus('loading');
  }

  // An <img> can never render a PDF, so show a badge instead of trying.
  const isPdf = src.toLowerCase().split('?')[0].endsWith('.pdf');
  if (isPdf) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-cyan-400">
        <FileText size={32} />
        <span className="text-[10px] font-bold uppercase tracking-wide">PDF</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-600">
        <Award size={40} />
      </div>
    );
  }

  const handleError = () => {
    if (currentSrc !== CERT_PLACEHOLDER) {
      setStatus('loading');
      setCurrentSrc(CERT_PLACEHOLDER);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="relative w-full h-full">
      {status === 'loading' && (
        <Loader2 className="absolute inset-0 m-auto animate-spin text-cyan-400" size={24} />
      )}
      <SmartImage
        src={currentSrc}
        alt={alt}
        fill
        sizes="128px"
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        className={`object-contain group-hover:scale-110 transition-all duration-300 ${
          status === 'loading' ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

// Clicking a certificate opens its credential link in a new tab if one exists;
// cards without a link are inert.
export default function CertificateGrid({ certificates }: { certificates: CertificateCard[] }) {
  if (certificates.length === 0) {
    return <div className="text-slate-400 text-center py-10">No certificates published yet.</div>;
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {certificates.map((cert) => {
        const url = cert.credentialUrl || cert.link || null;
        const body = (
          <>
            <div className="w-32 h-32 mb-6 bg-white/10 rounded-lg p-2 overflow-hidden">
              <CertImage src={cert.mediaUrls?.[0] || CERT_PLACEHOLDER} alt={cert.title} />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">{cert.title}</h3>
            <p className="text-cyan-600 font-medium">{cert.issuer || 'Certification'}</p>
          </>
        );
        const base = 'h-full bg-gray-900 border border-gray-800 p-8 rounded-xl transition-all flex flex-col items-center text-center group';

        return (
          <li key={cert.id}>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${base} hover:border-cyan-500 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]`}
              >
                {body}
              </a>
            ) : (
              <div className={base}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
