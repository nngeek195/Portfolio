'use client';

import { useEffect, useState } from 'react';
import SmartImage from '@/components/SmartImage';

type Props = {
  images: string[];
  intervalSeconds: number;
};

// Subject photo for the dossier: crossfades through the profile images managed
// in /admin/dashboard/media (loaded on the server), with a night-vision grade.
export default function ProfileShowcase({ images, intervalSeconds }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setCurrent((prev) => (prev + 1) % images.length), intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [images.length, intervalSeconds]);

  return (
    <figure className="w-full">
      <div className="hud-corners relative aspect-[4/5] overflow-hidden bg-gunmetal [--hud-c:var(--color-bone)]">
        {images.map((src, index) => (
          <SmartImage
            key={src}
            src={src}
            alt={`Photo of the subject, ${index + 1} of ${images.length}`}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 40vw, 80vw"
            className={`object-cover grayscale contrast-125 transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-nv/15 mix-blend-overlay" aria-hidden="true" />
        <div className="scanlines pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      </div>
      <figcaption className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
        <span>Subject photo</span>
        <span aria-hidden="true">
          {String(current + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}
        </span>
      </figcaption>
    </figure>
  );
}
