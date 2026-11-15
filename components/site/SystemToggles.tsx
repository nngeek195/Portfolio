'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { setSoundOn, useSoundOn } from '@/lib/audio/sound';

// Site switches: AUDIO (off by default; turning it on is the user gesture that
// creates the AudioContext, and only then is any sound code downloaded).
// `nav`: in the desktop header, icon-only below 1280px (room for the six links);
// `menu`: in the mobile menu, always labelled.
const BTN =
  'inline-flex h-8 items-center gap-1.5 whitespace-nowrap px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ash ring-1 ring-inset ring-steel transition-colors hover:text-bone hover:ring-ash';

export default function SystemToggles({ variant, className = '' }: { variant: 'nav' | 'menu'; className?: string }) {
  const sound = useSoundOn();
  const label = variant === 'nav' ? 'hidden xl:inline' : '';
  const Icon = sound ? Volume2 : VolumeX;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button type="button" aria-label="Audio" aria-pressed={sound} onClick={() => setSoundOn(!sound)} className={BTN} title={sound ? 'Audio on: click to mute' : 'Audio off: click to turn sound on'}>
        <Icon size={14} aria-hidden="true" className={sound ? 'text-nv' : ''} />
        <span className={label}>
          Audio: <span className={sound ? 'text-nv' : 'text-bone'}>{sound ? 'On' : 'Off'}</span>
        </span>
      </button>
    </div>
  );
}
