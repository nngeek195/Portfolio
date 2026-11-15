import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_SOURCES } from "./lib/image-hosts";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: OPTIMIZED_IMAGE_SOURCES.map((s) => ({
      protocol: "https" as const,
      hostname: s.hostname,
      pathname: "pathPrefix" in s ? `${s.pathPrefix}**` : "/**",
    })),
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  async redirects() {
    return [
      // The old standalone About page was replaced by the About section on the
      // home page. Temporary (307) so browsers don't cache it if this changes.
      { source: "/about", destination: "/#about", permanent: false },
    ];
  },
};

export default nextConfig;
