import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  webpack: (config) => {
    // Allow watching public/demo for local video fallback
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**'], // Only ignore node_modules
    };

    return config;
  },
};

export default nextConfig;
