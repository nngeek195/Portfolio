'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { PROFILE } from '@/lib/profile';
import Placeholder from '@/components/ui/Placeholder';

// Themed label first, plain label underneath, so nobody has to decode it.
export const NAV_LINKS = [
  { label: 'Dossier', plain: 'About', href: '/#about' },
  { label: 'Loadout', plain: 'Skills', href: '/#skills' },
  { label: 'Operations', plain: 'Projects', href: '/#operations', activeOn: '/projects' },
  { label: 'Service Record', plain: 'Experience', href: '/#experience' },
  { label: 'Intel', plain: 'Articles', href: '/articles', activeOn: '/articles' },
  { label: 'Comms', plain: 'Contact', href: '/#contact' },
] as const;

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (link: (typeof NAV_LINKS)[number]) => 'activeOn' in link && pathname === link.activeOn;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-steel/70 bg-void/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${PROFILE.name} — home`}>
          <span className="clip-corner-sm grid h-9 w-9 place-items-center bg-bone font-stencil text-lg font-bold text-void">NN</span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold uppercase tracking-wide text-bone">{PROFILE.name}</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-ash">
              Callsign:{' '}
              {PROFILE.callsign ?? <Placeholder id="callsign">[CALLSIGN]</Placeholder>}
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link) ? 'page' : undefined}
                  className={`group block px-3 py-1.5 transition-colors hover:text-bone ${isActive(link) ? 'text-nv' : 'text-ash'}`}
                >
                  <span className="block font-mono text-xs font-semibold uppercase tracking-[0.18em]">{link.label}</span>
                  <span className="block text-[11px] text-ash/70 group-hover:text-ash">{link.plain}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="p-1 text-bone hover:text-nv lg:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-steel/70 bg-void transition-[max-height,opacity] duration-300 lg:hidden ${
          open ? 'max-h-[28rem] opacity-100' : 'invisible max-h-0 opacity-0'
        }`}
      >
        <nav aria-label="Mobile">
          <ul className="px-5 py-3">
            {NAV_LINKS.map((link, i) => (
              <li key={link.href} className={i < NAV_LINKS.length - 1 ? 'border-b border-steel/50' : ''}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link) ? 'page' : undefined}
                  className={`flex items-baseline justify-between py-3 ${isActive(link) ? 'text-nv' : 'text-bone'}`}
                >
                  <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em]">{link.label}</span>
                  <span className="text-sm text-ash">{link.plain}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
