import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
  images: {
    domains: [],
  },
  // Configure webpack to handle @/ imports
  webpack: (config) => {
    // This fixes the dependency resolution for the next-themes package
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
