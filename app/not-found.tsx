import type { Metadata } from 'next';
import Image from 'next/image';
import { model } from '@/lib/models';
import TacButton from '@/components/ui/TacButton';

export const metadata: Metadata = { title: 'LZ not found' };

// 404: "LZ NOT FOUND". The helicopter (pre-rendered still) circles the empty
// landing zone; CSS only, no 3D or JS. Static with reduced motion.
export default function NotFound() {
  const heli = model('heli').poster;
  return (
    <main className="relative isolate flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-void px-5 py-24 text-center text-bone">
      <div className="nv-sky absolute inset-0 -z-20" aria-hidden="true" />
      <div className="scanlines pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />

      {/* Empty LZ with a radar sweep, and the helicopter orbiting it */}
      <div aria-hidden="true" className="relative h-[46vh] w-full max-w-4xl">
        <div className="absolute bottom-[12%] left-1/2 h-[16vh] w-[60%] -translate-x-1/2 rounded-[50%] border border-dashed border-nv/40">
          <span className="absolute inset-0 grid place-items-center font-stencil text-5xl text-nv/30">H</span>
          <span className="lz404-sweep absolute inset-0 rounded-[50%]" />
        </div>
        <div className="lz404-orbit absolute left-1/2 top-[38%] w-[min(46vw,360px)] -translate-x-1/2 -translate-y-1/2">
          <Image src={heli.src} width={heli.width} height={heli.height} alt="" sizes="360px" className="lz404-heli w-full drop-shadow-[0_0_2px_rgb(124_255_91/0.8)]" />
        </div>
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.3em] text-signal">Error 404</p>
      <h1 className="mt-3 font-stencil text-5xl uppercase tracking-[0.12em] text-nv md:text-7xl">LZ not found</h1>
      <p className="mt-5 max-w-md text-ash">These coordinates don&apos;t match any landing zone. Circling until you pick a new heading.</p>
      <div className="mt-10">
        <TacButton href="/">Return to base</TacButton>
      </div>
    </main>
  );
}
