'use client';

import { useState } from 'react';
import { Award, ExternalLink, FileText, Loader2 } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { CERT_PLACEHOLDER } from '@/lib/certificates';

export type CertificateCard = {
  id: string;
  title: string;
  issuer?: string;
  dateIssued?: string;
  credentialUrl?: string | null;
  link?: string | null;
  mediaUrls?: string[];
};

// Ribbon colour by kind of commendation (field events vs. courses vs. vendor certs).
function ribbon(cert: CertificateCard) {
  const text = `${cert.title} ${cert.issuer ?? ''}`.toLowerCase();
  if (/hack|xtream|buildathon|challenge|ieee/.test(text)) return { label: 'Field op', bar: 'bg-amber' };
  if (/microsoft|cisco|finops|wso2|aws|azure/.test(text)) return { label: 'Vendor', bar: 'bg-nv' };
  return { label: 'Training', bar: 'bg-blueprint' };
}

// Shows a spinner while a certificate image loads, and falls back to the
// placeholder (then a plain icon) instead of a broken-image icon on failure.
function CertImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  // Reset when the parent passes a different image ("adjust state during render").
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setCurrentSrc(src);
    setStatus('loading');
  }

  // An <img> can never render a PDF, so show a badge instead of trying.
  if (src.toLowerCase().split('?')[0].endsWith('.pdf')) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ash">
        <FileText size={28} aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-widest">PDF</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex h-full w-full items-center justify-center text-steel">
        <Award size={36} aria-hidden="true" />
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
    <div className="relative h-full w-full">
      {status === 'loading' && <Loader2 className="absolute inset-0 m-auto animate-spin text-ash" size={20} aria-hidden="true" />}
      <SmartImage
        src={currentSrc}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
        onLoad={() => setStatus('loaded')}
        onError={handleError}
        className={`object-contain transition-opacity duration-300 ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
}

// One commendation card. Cards with a credential link open it in a new tab.
function CommendationCard({ cert, index }: { cert: CertificateCard; index: number }) {
  const url = cert.credentialUrl || cert.link || null;
  const r = ribbon(cert);
  const image = cert.mediaUrls?.find((u) => u.trim()) ?? null;
  const body = (
    <>
      <div className="flex h-2" aria-hidden="true">
        <span className={`flex-1 ${r.bar}`} />
        <span className="w-3 bg-void" />
        <span className={`w-6 ${r.bar} opacity-60`} />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ash sm:px-4">
        <span>CMD-{String(index + 1).padStart(3, '0')}</span>
        <span className="hidden sm:inline">{r.label}</span>
      </div>
      {/* No real image on file (e.g. FinOps, whose old signed URL expired): no image box at all,
          rather than a generic stand-in that looks like a certificate. */}
      {image && (
        <div className="relative mx-3 mt-3 h-24 bg-bone/[0.06] p-2 sm:mx-4 sm:h-36">
          <CertImage src={image} alt={`${cert.title} certificate`} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-wide text-bone sm:text-xl">{cert.title}</h3>
        <p className="mt-1 text-xs text-ash sm:text-sm">{cert.issuer || 'Certification'}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-1 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] sm:text-[11px]">
          <span className="text-ash">{cert.dateIssued || '—'}</span>
          {url && (
            <span className="flex items-center gap-1 text-nv">
              Verify <ExternalLink size={12} aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </>
  );
  const base = 'clip-corner flex h-full flex-col bg-gunmetal ring-1 ring-inset ring-steel';
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${base} transition-colors hover:ring-ash`}>
      {body}
      <span className="sr-only"> (opens credential in a new tab)</span>
    </a>
  ) : (
    <div className={base}>{body}</div>
  );
}

const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4';

// Commendations: certificate "service ribbon" cards. The first `initial` are
// always shown; the rest sit behind a native <details> toggle (works without JS).
export default function CertificateGrid({ certificates, initial = 8 }: { certificates: CertificateCard[]; initial?: number }) {
  if (certificates.length === 0) {
    return <p className="py-10 text-center text-ash">No commendations on file yet.</p>;
  }
  const shown = certificates.slice(0, initial);
  const rest = certificates.slice(initial);

  return (
    <>
      <ul data-reveal="stagger" className={GRID}>
        {shown.map((cert, i) => (
          <li key={cert.id}>
            <CommendationCard cert={cert} index={i} />
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group mt-3 sm:mt-5">
          <summary className="clip-corner bracket-hover mx-auto flex w-fit cursor-pointer list-none items-center gap-2 bg-gunmetal px-9 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-bone ring-1 ring-inset ring-steel hover:ring-ash group-open:mb-5 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show all {certificates.length} commendations</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul className={GRID}>
            {rest.map((cert, i) => (
              <li key={cert.id}>
                <CommendationCard cert={cert} index={initial + i} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
