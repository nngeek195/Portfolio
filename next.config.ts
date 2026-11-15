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
};

export default nextConfig;
