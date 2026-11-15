import SiteNav from '@/components/site/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import HudOverlay from '@/components/hud/HudOverlay';

// Shared shell for the public pages (/, /projects, /articles).
// The admin dashboard has its own layout and gets none of this.
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="film-grain flex min-h-screen flex-col bg-void text-bone">
      <a
        href="#main"
        className="sr-only z-50 bg-bone px-4 py-2 font-mono text-sm text-void focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteNav />
      <HudOverlay />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
