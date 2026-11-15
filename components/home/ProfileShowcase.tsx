'use client';

import { useEffect, useState } from 'react';
import SmartImage from '@/components/SmartImage';

type Props = {
  images: string[];
  intervalSeconds: number;
};

// Round photo frame that crossfades through the profile images managed in
// /admin/dashboard/media. Images and timing are loaded on the server.
export default function ProfileShowcase({ images, intervalSeconds }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setCurrent((prev) => (prev + 1) % images.length), intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [images.length, intervalSeconds]);

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full border-4 border-cyan-500 shadow-[0_0_40px_rgba(0,255,234,0.3)] overflow-hidden group">
      {images.map((src, index) => (
        <SmartImage
          key={src}
          src={src}
          alt={`Profile photo ${index + 1}`}
          fill
          sizes="(min-width: 768px) 384px, 288px"
          preload={index === 0}
          className={`object-cover transition-all duration-1000 ease-in-out group-hover:scale-110 ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20" aria-hidden="true">
          {images.map((src, idx) => (
            <div
              key={src}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === current ? 'bg-cyan-400 w-4 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-gray-500/80 w-2'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
