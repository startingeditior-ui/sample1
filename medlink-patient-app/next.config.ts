import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable Next.js image optimization so that arbitrary URLs (relative
    // backend paths, external URLs for profile photos / file uploads) do not
    // trigger "Invalid URL" errors inside getImgProps.
    unoptimized: true,
  },
};

export default nextConfig;
