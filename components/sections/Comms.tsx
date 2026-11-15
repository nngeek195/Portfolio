import Image from 'next/image';
import { Mail, Send } from 'lucide-react';
import { PROFILE } from '@/lib/profile';
import { model } from '@/lib/models';
import Placeholder from '@/components/ui/Placeholder';
import SectionHeader from '@/components/ui/SectionHeader';
import OpenCommsHandler from './OpenCommsHandler';
import ExtractionEta from './ExtractionEta';

const channelClass =
  'clip-corner group grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 bg-gunmetal px-5 py-4 ring-1 ring-inset ring-steel transition-colors hover:ring-ash';

// OBJ-07 Comms (Contact). Exfil: on capable desktops the live 3D helicopter
// (components/three/companion) lands in the extraction panel, its searchlight
// locks onto TRANSMIT, and hovering a channel makes it dip towards it.
export default function Comms() {
  const heli = model('heli').poster;
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-16 border-t border-steel/60 bg-void py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-2">
        <div>
          <SectionHeader id="contact" kicker="Open to opportunities, collaborations and a good conversation. Pick a channel." />

          <ul data-reveal="stagger" className="grid gap-3">
            <li>
              <a href={PROFILE.socials.linkedin} target="_blank" rel="noreferrer" data-channel className={channelClass}>
                <span className="font-mono text-xs text-nv">CH-01</span>
                <span>
                  <span className="block font-display text-2xl font-bold uppercase tracking-wide text-bone">LinkedIn</span>
                  <span className="block text-sm text-ash">Professional network</span>
                </span>
                <Image src="/icons/social/linkedin.svg" alt="" width={28} height={28} />
              </a>
            </li>
            <li>
              <a href={PROFILE.socials.github} target="_blank" rel="noreferrer" data-channel className={channelClass}>
                <span className="font-mono text-xs text-nv">CH-02</span>
                <span>
                  <span className="block font-display text-2xl font-bold uppercase tracking-wide text-bone">GitHub</span>
                  <span className="block text-sm text-ash">Code &amp; repositories</span>
                </span>
                <Image src="/icons/social/github.svg" alt="" width={28} height={28} className="rounded-full bg-bone" />
              </a>
            </li>
            <li>
              {PROFILE.email ? (
                <a href={`mailto:${PROFILE.email}`} data-channel className={channelClass}>
                  <span className="font-mono text-xs text-nv">CH-03</span>
                  <span>
                    <span className="block font-display text-2xl font-bold uppercase tracking-wide text-bone">Email</span>
                    <span className="block text-sm text-ash [overflow-wrap:anywhere]">{PROFILE.email}</span>
                  </span>
                  <Mail size={26} className="text-bone" aria-hidden="true" />
                </a>
              ) : (
                <div data-channel className={`${channelClass} hover:ring-steel`}>
                  <span className="font-mono text-xs text-ash">CH-03</span>
                  <span>
                    <span className="block font-display text-2xl font-bold uppercase tracking-wide text-ash">Email</span>
                    <Placeholder id="contact-email">[EMAIL] awaiting frequency</Placeholder>
                  </span>
                  <Mail size={26} className="text-steel" aria-hidden="true" />
                </div>
              )}
            </li>
            <li>
              <OpenCommsHandler className={`${channelClass} w-full text-left`} />
            </li>
          </ul>

          {/* Primary call to action; the extraction helicopter's searchlight locks onto it */}
          <div data-reveal="up" className="mt-8">
            <a
              href={PROFILE.email ? `mailto:${PROFILE.email}` : PROFILE.socials.linkedin}
              {...(PROFILE.email ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              data-comms="transmit"
              className="transmit-btn clip-corner bracket-hover inline-flex items-center justify-center gap-3 bg-nv px-10 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-bone"
            >
              <Send size={16} aria-hidden="true" /> Transmit
            </a>
          </div>
        </div>

        {/* Extraction */}
        <div data-reveal="mask" data-comms="lz" className="hud-corners relative min-h-[420px] overflow-hidden bg-[#06110a] [--hud-c:rgb(124_255_91/0.6)]" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 58%, rgb(124 255 91 / 0.16), transparent 60%), repeating-radial-gradient(circle at 50% 58%, transparent 0 58px, rgb(124 255 91 / 0.14) 58px 59px), linear-gradient(rgb(124 255 91 / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgb(124 255 91 / 0.1) 1px, transparent 1px)',
              backgroundSize: 'auto, auto, 100% 50%, 50% 100%',
              backgroundPosition: 'center, center, 0 58%, 50% 0',
            }}
          />
          {/* Flat helicopter; on capable desktops the live 3D one lands here instead (this fades out) */}
          <Image
            src={heli.src}
            width={heli.width}
            height={heli.height}
            alt=""
            sizes="(min-width: 1024px) 560px, 90vw"
            data-heli-still
            className="absolute left-1/2 top-[44%] w-[86%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_2px_rgb(124_255_91/0.8)]"
          />
          {/* Landing pad */}
          <div className="absolute bottom-[14%] left-1/2 h-6 w-[46%] -translate-x-1/2 rounded-[50%] border border-dashed border-nv/40" />
          <div className="scanlines absolute inset-0 opacity-50" />
          <div className="absolute inset-x-5 top-5 flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-nv">
            <ExtractionEta />
          </div>
          <div className="absolute inset-x-5 bottom-5 flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-nv/80">
            <span>LZ {PROFILE.location.coords}</span>
            <span>Alt 120 m</span>
          </div>
        </div>
      </div>
    </section>
  );
}
