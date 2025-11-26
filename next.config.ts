import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  webpack: (config) => {
    // Prevent webpack from processing video files in public/demo
    // Files in public are static assets and don't need webpack processing anyway
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/public/demo/**', '**/node_modules/**'],
    };

    return config;
  },
};

export default nextConfig;
