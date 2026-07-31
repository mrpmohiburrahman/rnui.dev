import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */

  // Next.js 16 uses Turbopack by default
  turbopack: {},

  async redirects() {
    return [
      // /feedback was a copy of /contactus — same form, same `userFeedback`
      // collection — and is deleted. `app/not-found.tsx` does not cover this:
      // it answers 404 with a `location` header, which no browser follows, so
      // without this rule the URL would just break. /contactus rather than /
      // because it is the page the visitor was actually asking for.
      { source: "/feedback", destination: "/contactus", permanent: true },
    ]
  },

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
