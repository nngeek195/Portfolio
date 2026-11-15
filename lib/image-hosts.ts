// Remote images that go through Next.js image optimization.
// Used by next.config.ts (remotePatterns) and components/SmartImage.tsx.
// Images from anywhere else (e.g. URLs scraped by the admin importers) are
// rendered unoptimized instead of erroring, so new content never breaks a page.
// Shared hosts are pinned to a path prefix so the optimizer can't be used for
// arbitrary third-party files.
export const OPTIMIZED_IMAGE_SOURCES = [
  { hostname: 'res.cloudinary.com' }, // admin uploads (profile photos, banners)
  { hostname: 'raw.githubusercontent.com', pathPrefix: '/nngeek195/' }, // certificate images
  { hostname: 's3.amazonaws.com', pathPrefix: '/coursera_assets/' }, // Coursera certificates
  { hostname: 'images.credly.com' },
  { hostname: 'certificates.simplicdn.net' },
  { hostname: 'd9jmtjs5r4cgq.cloudfront.net' }, // Great Learning certificates
] as const satisfies readonly { hostname: string; pathPrefix?: string }[];

export function isOptimizedImageSrc(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const { protocol, hostname, pathname } = new URL(src);
    return (
      protocol === 'https:' &&
      OPTIMIZED_IMAGE_SOURCES.some(
        (s) => s.hostname === hostname && (!('pathPrefix' in s) || pathname.startsWith(s.pathPrefix))
      )
    );
  } catch {
    return false;
  }
}
