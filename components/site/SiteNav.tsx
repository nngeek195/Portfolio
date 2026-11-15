'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

// Single source of truth for the public site navigation (previously copy-pasted
// into the home, projects and articles pages).
export const NAV_LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Articles', href: '/articles' },
  { label: 'Projects', href: '/projects' },
  { label: 'Contact', href: '/#contact' },
] as const;

export default function SiteNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  // Hash links point at home-page sections, so only full routes get an active state.
  const isActive = (href: string) => !href.startsWith('/#') && pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-cyan-900/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
        >
          Niranga Nayanajith
        </Link>

        <nav aria-label="Main" className="hidden md:flex gap-8 font-semibold text-slate-300">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`hover:text-cyan-400 transition-colors ${isActive(link.href) ? 'text-cyan-400' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          className="md:hidden text-slate-200 hover:text-cyan-400 transition-colors p-1"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-cyan-900/50 bg-black/95 backdrop-blur-md ${
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 invisible'
        }`}
      >
        <nav aria-label="Mobile" className="flex flex-col px-6 py-4 gap-1 font-semibold text-slate-300">
          {NAV_LINKS.map((link, idx) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive(link.href) ? 'page' : undefined}
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
  );
}
