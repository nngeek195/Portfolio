'use client';

import { useState, useSyncExternalStore, type SyntheticEvent } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { isOptimizedImageSrc } from '@/lib/image-hosts';

type SmartImageProps = Omit<ImageProps, 'src'> & { src: string };

// Once one optimized image has failed in this visit, the optimizer is assumed to
// be unreachable for remote hosts (e.g. the server can only reach the internet
// through a proxy, which Next's IP-pinned image fetcher can't use): later
// images go straight to the direct URL instead of each waiting for a timeout.
let optimizerDown = false;
const listeners = new Set<() => void>();
const markOptimizerDown = () => {
  if (optimizerDown) return;
  optimizerDown = true;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

type Stage = 'optimized' | 'direct' | 'failed';

/**
 * next/image with a fallback chain, so an image never shows as broken:
 *  1. optimized through /_next/image (known hosts, see lib/image-hosts.ts)
 *  2. if that fails: the original URL loaded directly by the browser
 *  3. if that fails too: a styled "image unavailable" tile (or the caller's
 *     own onError handling, e.g. the certificate placeholder)
 * Unknown hosts start at step 2.
 */
export default function SmartImage({ src, alt, unoptimized, onError, fill, width, height, className = '', style, ...props }: SmartImageProps) {
  const down = useSyncExternalStore(subscribe, () => optimizerDown, () => false);
  const canOptimize = !unoptimized && isOptimizedImageSrc(src);
  const remote = /^https?:\/\//.test(src);
  const [stage, setStage] = useState<Stage>(canOptimize ? 'optimized' : 'direct');

  // A different image: start over ("adjust state during render").
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setStage(canOptimize ? 'optimized' : 'direct');
  }

  const effective: Stage = stage === 'optimized' && down && remote ? 'direct' : stage;

  const handleError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    if (effective === 'optimized') {
      if (remote) markOptimizerDown();
      setStage('direct');
      return;
    }
    if (onError) {
      onError(e); // the caller has its own fallback (it may pass a new src)
      return;
    }
    setStage('failed');
  };

  if (effective === 'failed') {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`${fill ? 'absolute inset-0' : 'relative inline-flex'} flex flex-col items-center justify-center gap-1.5 bg-gunmetal text-ash ring-1 ring-inset ring-steel ${className.replace(/\b(opacity|grayscale|contrast|object)-\S+/g, '')}`}
        style={fill ? style : { width: typeof width === 'number' ? width : undefined, aspectRatio: width && height ? `${width} / ${height}` : undefined, maxWidth: '100%', ...style }}
      >
        <ImageOff size={22} aria-hidden="true" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em]">Image unavailable</span>
      </span>
    );
  }

  return (
    <Image
      key={effective}
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      style={style}
      unoptimized={effective === 'direct'}
      onError={handleError}
      {...props}
    />
  );
}
