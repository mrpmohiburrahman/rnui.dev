import type { NextConfig } from "next"
import { withPostHogConfig } from "@posthog/nextjs-config"

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

// Error tracking is worthless against a minified bundle, so the production
// build hands its source maps to PostHog and then deletes them — they are
// uploaded, never served. Turbopack is the bundler here (Next 16), and the
// wrapper covers it: it turns on `productionBrowserSourceMaps` and runs the
// PostHog CLI from the `runAfterProductionCompile` hook.
//
// Both credentials are maintainer-only and exist in no fork or clone, and the
// wrapper throws on sight if the upload is enabled without them. `next dev`
// evaluates this file too, so an unguarded wrapper would stop a contributor
// running the site at all. Off unless both are present; the site is identical
// either way, only the stack traces in PostHog differ.
const personalApiKey = process.env.POSTHOG_API_KEY
const projectId = process.env.POSTHOG_PROJECT_ID

export default withPostHogConfig(nextConfig, {
  personalApiKey: personalApiKey ?? "",
  projectId,
  sourcemaps: { enabled: Boolean(personalApiKey && projectId) },
})
