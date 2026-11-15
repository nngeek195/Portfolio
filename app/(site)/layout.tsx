import SiteNav from '@/components/site/SiteNav';

// Shared shell for the public pages (/, /projects, /articles, /about).
// The admin dashboard has its own layout and does not get this nav.
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-cyan-500/30">
      <SiteNav />
      {children}
    </div>
  );
}
