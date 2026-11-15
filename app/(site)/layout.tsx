import SiteNav from '@/components/site/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import MotionProvider from '@/components/motion/MotionProvider';
import Reveals from '@/components/motion/Reveals';
import BootScreen from '@/components/boot/BootScreen';
import BootController from '@/components/boot/BootController';
import AudioDirector from '@/components/site/AudioDirector';

// Shared shell for the public pages (/, /projects, /articles).
// The admin dashboard has its own layout and gets none of this — including the
// scroll engine (Lenis/GSAP), which only runs inside MotionProvider here.
// BootScreen (first in the HTML) is the "Establishing uplink" preloader.
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
    <BootScreen />
    <MotionProvider>
      <div className="film-grain flex min-h-screen flex-col bg-void text-bone">
        <a
          href="#main"
          className="sr-only z-50 bg-bone px-4 py-2 font-mono text-sm text-void focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
      <Reveals />
      <BootController />
      <AudioDirector />
    </MotionProvider>
    </>
  );
}
