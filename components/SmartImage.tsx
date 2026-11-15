import Image, { type ImageProps } from 'next/image';
import { isOptimizedImageSrc } from '@/lib/image-hosts';

type SmartImageProps = Omit<ImageProps, 'src'> & { src: string };

// next/image that optimizes known hosts and falls back to an unoptimized
// image for any other URL, instead of throwing on an unconfigured hostname.
// Works in both Server and Client Components.
export default function SmartImage({ src, alt, unoptimized, ...props }: SmartImageProps) {
  return <Image src={src} alt={alt} unoptimized={unoptimized ?? !isOptimizedImageSrc(src)} {...props} />;
}
