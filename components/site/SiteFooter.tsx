import Image from 'next/image';
import { Mail } from 'lucide-react';
import { MODELS } from '@/lib/models';
import { PROFILE } from '@/lib/profile';

// Site-wide footer: social links, copyright and the 3D model credits
// (attribution is required by the model licences — see Model/CREDITS.md).
export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-steel/70 bg-void">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1fr_auto] md:px-8">
        <div>
          <p className="font-display text-2xl font-bold uppercase tracking-wide text-bone">{PROFILE.name}</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-ash">{PROFILE.roles.join(' // ')}</p>
          <ul className="mt-6 flex gap-3">
            <li>
              <a href={PROFILE.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="clip-corner-sm grid h-10 w-10 place-items-center bg-gunmetal ring-1 ring-inset ring-steel hover:ring-ash">
                <Image src="/icons/social/linkedin.svg" alt="" width={20} height={20} />
              </a>
            </li>
            <li>
              <a href={PROFILE.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="clip-corner-sm grid h-10 w-10 place-items-center bg-gunmetal ring-1 ring-inset ring-steel hover:ring-ash">
                <Image src="/icons/social/github.svg" alt="" width={20} height={20} className="rounded-full bg-bone" />
              </a>
            </li>
            {PROFILE.email && (
              <li>
                <a href={`mailto:${PROFILE.email}`} aria-label={`Email ${PROFILE.email}`} className="clip-corner-sm grid h-10 w-10 place-items-center bg-gunmetal text-bone ring-1 ring-inset ring-steel hover:ring-ash">
                  <Mail size={18} aria-hidden="true" />
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="max-w-xl text-xs text-ash md:text-right">
          <p className="font-mono uppercase tracking-[0.2em] text-ash/80">3D asset credits</p>
          <ul className="mt-3 space-y-2">
            {MODELS.map((m) => (
              <li key={m.id}>
                <a href={m.credit.source} target="_blank" rel="noreferrer" className="text-bone/90 underline decoration-steel underline-offset-2 hover:decoration-ash">
                  “{m.credit.title}”
                </a>{' '}
                by{' '}
                <a href={m.credit.authorUrl} target="_blank" rel="noreferrer" className="underline decoration-steel underline-offset-2 hover:decoration-ash">
                  {m.credit.author}
                </a>
                {' — '}
                {m.credit.licenseUrl ? (
                  <a href={m.credit.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-steel underline-offset-2 hover:decoration-ash">
                    {m.credit.license}
                  </a>
                ) : (
                  m.credit.license
                )}
                . Modified (re-textured, split, optimised).
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-steel/50">
        <p className="mx-auto max-w-7xl px-5 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ash/70 md:px-8">
          © {year} {PROFILE.name}. Fan-inspired tactical theme; not affiliated with any game publisher.
        </p>
      </div>
    </footer>
  );
}
