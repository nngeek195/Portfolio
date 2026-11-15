'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { ExternalLink, FileText, FolderGit2, Loader2, X } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import type { ContentItem } from '@/lib/content-types';
import { formatDate } from '@/lib/text';
import 'github-markdown-css/github-markdown-dark.css';

type Props = { item: ContentItem | null; type: 'project' | 'article'; onClose: () => void };

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, iframe, video[controls], [tabindex]:not([tabindex="-1"])';
const hasHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);
// Imported LinkedIn titles: "Post title | Name posted on the topic | LinkedIn".
const cleanTitle = (t?: string) => (t ?? '').split(' | ')[0].trim();

/**
 * Public "intel" viewer for projects and articles (the admin keeps using
 * components/ItemModal). Accessible dialog: focus moves in and is trapped,
 * Escape closes, focus returns to the opener; page scrolling pauses via the
 * body overflow lock (MotionProvider stops Lenis). Imported descriptions are
 * sanitised before rendering.
 */
export default function IntelViewer({ item, type, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [readme, setReadme] = useState<{ repo: string; html: string | null; error?: string } | null>(null);

  const open = !!item;
  const repo = type === 'project' ? item?.repoName : undefined;

  // Lock page scroll, manage focus, trap Tab, close on Escape.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow === 'hidden' ? '' : previousOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  // README for projects (stored copy if the importer saved one, else fetched).
  useEffect(() => {
    if (!open || !repo) return;
    if (typeof item?.readmeHtml === 'string' && item.readmeHtml) return;
    let cancelled = false;
    fetch(`/api/github/readme?repo=${encodeURIComponent(repo)}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setReadme({ repo, html: d.html ?? null, error: d.error }))
      .catch(() => !cancelled && setReadme({ repo, html: null, error: 'Could not load the README.' }));
    return () => {
      cancelled = true;
    };
  }, [open, repo, item?.readmeHtml]);

  const description = useMemo(() => {
    const raw = item?.description ?? '';
    return hasHtml(raw) ? { html: DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } }) } : { text: raw };
  }, [item?.description]);

  if (!item || typeof document === 'undefined') return null;

  const title = (type === 'project' ? item.repoName || item.title : cleanTitle(item.title)) || 'Untitled';
  const date = formatDate(item.publishedAt);
  const storedReadme = typeof item.readmeHtml === 'string' && item.readmeHtml ? item.readmeHtml : null;
  const rawReadme = storedReadme ?? (readme?.repo === repo ? readme?.html : undefined);
  const readmeHtml = rawReadme ? DOMPurify.sanitize(rawReadme, { USE_PROFILES: { html: true } }) : rawReadme;
  const readmeLoading = !!repo && !storedReadme && readme?.repo !== repo;
  const media = (item.mediaUrls ?? []).filter((u) => u && u !== item.bannerImage);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 md:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intel-title"
        className="clip-corner relative flex max-h-full w-full max-w-5xl flex-col bg-void ring-1 ring-steel"
      >
        {/* Header strip */}
        <div className="flex items-center justify-between gap-4 border-b border-steel bg-gunmetal px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
          <span className="flex items-center gap-2 text-nv">
            {type === 'project' ? <FolderGit2 size={14} aria-hidden="true" /> : <FileText size={14} aria-hidden="true" />}
            {type === 'project' ? 'Operation briefing' : 'Intel report'}
          </span>
          <span className="hidden sm:inline">{date ?? 'Classified'}</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="-mr-2 p-2 text-ash hover:text-bone">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain" data-lenis-prevent>
          {item.bannerImage && (
            <div className="relative h-48 bg-black md:h-64">
              <SmartImage src={item.bannerImage} alt="" fill sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover opacity-80" />
              <div className="scanlines absolute inset-0 opacity-40" aria-hidden="true" />
            </div>
          )}

          <div className="space-y-8 p-5 md:p-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <h2 id="intel-title" className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-bone md:text-5xl">
                {title}
              </h2>
              <div className="flex flex-wrap gap-3">
                {item.repoUrl && (
                  <a href={item.repoUrl} target="_blank" rel="noopener noreferrer" className="clip-corner-sm inline-flex items-center gap-2 bg-bone px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-void hover:bg-white">
                    Repository <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
                {item.sourceUrl && (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="clip-corner-sm inline-flex items-center gap-2 bg-gunmetal px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-bone ring-1 ring-inset ring-steel hover:ring-ash">
                    Original post <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {(description.html || description.text) && (
              <section aria-label="Briefing">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">{type === 'project' ? 'Objective' : 'Report'}</p>
                {description.html ? (
                  <div className="intel-prose max-w-3xl text-lg leading-relaxed text-bone/90" dangerouslySetInnerHTML={{ __html: description.html }} />
                ) : (
                  <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-bone/90">{description.text}</p>
                )}
              </section>
            )}

            {(media.length > 0 || item.videoUrl || item.pdfUrl) && (
              <section aria-label="Attachments" className="grid gap-4 md:grid-cols-2">
                {item.videoUrl && <video controls src={item.videoUrl} className="w-full bg-black ring-1 ring-steel" />}
                {media.map((url) => (
                  <a key={url} href={item.sourceUrl || url} target="_blank" rel="noopener noreferrer" className="block bg-black ring-1 ring-steel hover:ring-ash">
                    <SmartImage src={url} alt={`${title} attachment`} width={1200} height={800} sizes="(min-width: 768px) 480px, 100vw" className="h-auto w-full" />
                  </a>
                ))}
                {item.pdfUrl && (
                  <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="clip-corner flex items-center gap-3 bg-gunmetal p-5 ring-1 ring-inset ring-steel hover:ring-ash">
                    <FileText size={22} className="text-nv" aria-hidden="true" />
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-bone">Open attached document (PDF)</span>
                  </a>
                )}
              </section>
            )}

            {repo && (
              <section aria-label="README" className="clip-corner bg-gunmetal p-5 ring-1 ring-inset ring-steel md:p-8">
                <p className="mb-5 border-b border-dashed border-steel pb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ash">Field manual {'//'} README.md</p>
                {readmeLoading ? (
                  <p className="flex items-center gap-3 text-ash">
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" /> Retrieving README from GitHub…
                  </p>
                ) : readmeHtml ? (
                  <div className="markdown-body intel-readme" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
                ) : (
                  <p className="text-ash">{readme?.error ?? 'No README available.'}</p>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
