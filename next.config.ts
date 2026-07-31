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
      //
      // `permanent: false` (307), not 308: ticket 05 asks for four commits any
      // one of which can be reverted alone, and a 308 a browser has already
      // cached cannot be revoked. /feedback had zero pageviews in 90 days, so
      // there is no ranking to preserve by making it permanent.
      { source: "/feedback", destination: "/contactus", permanent: false },
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
