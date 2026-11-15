import Image from 'next/image';
import type { ModelEntry } from '@/lib/models';

// Static model render with numbered markers on specific parts (positions come
// from lib/generated/models.json). Stand-in until the 3D scene loads in Phase 4.
export default function Schematic({
  poster,
  markers,
  alt,
  sizes,
  className = '',
  hideMarkersOnMobile = false,
}: {
  poster: ModelEntry['poster'];
  markers: { part: string; n: number; label: string }[];
  alt: string;
  sizes: string;
  className?: string;
  // Hide markers below the sm breakpoint, where the render is too small for them.
  hideMarkersOnMobile?: boolean;
}) {
  return (
    <figure className={`relative ${className}`}>
      <Image src={poster.src} width={poster.width} height={poster.height} alt={alt} sizes={sizes} className="h-auto w-full" />
      <ol aria-hidden="true" className={hideMarkersOnMobile ? 'hidden sm:block' : undefined}>
        {markers.map((m) => {
          const [x, y] = poster.anchors[m.part] ?? [50, 50];
          return (
            <li
              key={m.part}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              title={m.label}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full border border-nv bg-void/85 font-mono text-[11px] font-bold text-nv shadow-[0_0_0_4px_rgb(7_8_10/0.6)]">
                {String(m.n).padStart(2, '0')}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
