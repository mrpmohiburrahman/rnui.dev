import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */

  // Next.js 16 uses Turbopack by default
  turbopack: {},

  webpack: (config) => {
    // Allow watching public/demo for local video fallback
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**"], // Only ignore node_modules
    }

    return config
  },
}

export default nextConfig
