'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { PROFILE } from '@/lib/profile';
import Placeholder from '@/components/ui/Placeholder';
import { useActiveObjective } from '@/lib/motion/scroll-store';
import SystemToggles from './SystemToggles';

// Themed label first, plain label underneath, so nobody has to decode it.
export const NAV_LINKS = [
  { label: 'Dossier', plain: 'About', href: '/#about', section: 'about' },
  { label: 'Loadout', plain: 'Skills', href: '/#skills', section: 'skills' },
  { label: 'Operations', plain: 'Projects', href: '/#operations', section: 'operations', activeOn: '/projects' },
  { label: 'Service Record', plain: 'Experience', href: '/#experience', section: 'experience' },
  { label: 'Intel', plain: 'Articles', href: '/articles', activeOn: '/articles' },
  { label: 'Comms', plain: 'Contact', href: '/#contact', section: 'contact' },
] as const;

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const header = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const activeSection = useActiveObjective();

  type NavLink = (typeof NAV_LINKS)[number];
  const onPage = (link: NavLink) => 'activeOn' in link && pathname === link.activeOn;
  const inView = (link: NavLink) => pathname === '/' && 'section' in link && link.section === activeSection;
  const isActive = (link: NavLink) => onPage(link) || inView(link);
  const current = (link: NavLink) => (onPage(link) ? 'page' : inView(link) ? 'location' : undefined);

  // Hide while scrolling down, reveal on scroll up. Never hides near the top,
  // with the mobile menu open, or while focus is inside the header.
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const focusInside = header.current?.contains(document.activeElement) ?? false;
        if (y < 120 || open || focusInside) setHidden(false);
        else if (y > last + 6) setHidden(true);
        else if (y < last - 6) setHidden(false);
        last = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open]);

  return (
    <header
      ref={header}
      onFocusCapture={() => setHidden(false)}
      className={`fixed inset-x-0 top-0 z-40 border-b border-steel/70 bg-void/90 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8 xl:gap-6">
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
                  aria-current={current(link)}
                  className={`group relative block whitespace-nowrap px-2.5 py-1.5 transition-colors xl:px-3 hover:text-bone ${isActive(link) ? 'text-nv' : 'text-ash'}`}
                >
                  <span className="block font-mono text-xs font-semibold uppercase tracking-[0.18em]">{link.label}</span>
                  <span className="block text-[11px] text-ash group-hover:text-bone">{link.plain}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-2.5 -bottom-[13px] h-0.5 xl:inset-x-3 bg-nv transition-transform duration-300 motion-reduce:transition-none ${isActive(link) ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SystemToggles variant="nav" className="hidden lg:flex" />

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
                  aria-current={current(link)}
                  className={`flex items-baseline justify-between py-3 ${isActive(link) ? 'text-nv' : 'text-bone'}`}
                >
                  <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em]">{link.label}</span>
                  <span className="text-sm text-ash">{link.plain}</span>
                </Link>
              </li>
            ))}
          </ul>
          <SystemToggles variant="menu" className="border-t border-steel/50 px-5 pb-4 pt-3" />
        </nav>
      </div>
    </header>
  );
}
