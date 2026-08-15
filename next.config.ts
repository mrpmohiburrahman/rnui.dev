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

  async headers() {
    return [
      // The Preview serves the same 277 Recordings as rnui.dev on a second
      // hostname, which is duplicate content Google may well rank against the
      // real site — cheap to prevent, tedious to undo.
      //
      // Header rather than a robots.txt rule on purpose: `Disallow` stops the
      // crawl, and a page that is never crawled is a page whose noindex is
      // never read — a URL blocked that way can still be indexed from inbound
      // links. next-sitemap keeps generating an allow-all robots.txt, which is
      // what lets the crawler reach this header and obey it.
      //
      // Two hosts, not one. `preview.rnui.dev` is the Preview proper; the
      // branch is *also* served at `rnui-dev-git-feat-studio-dark-*.vercel.app`,
      // which is the same duplicate content on a third hostname. Vercel is
      // widely said to noindex its own deployment URLs, but that was not
      // measurable from here and the claim is load-bearing, so this covers the
      // alias itself rather than trusting it. Matching both here also means the
      // protection does not depend on which URL someone shares.
      //
      // `has` is the whole safety of this rule: unconditional, it would deindex
      // rnui.dev itself. Neither alternative can match the production host —
      // there is deliberately no bare `rnui\.dev` branch — so even read
      // unanchored the blast radius stays off production.
      // tests/e2e/preview-noindex.spec.ts asserts all three cases. The hosts
      // are written out rather than read from an env var for the reason
      // `api_host` is in lib/posthog-provider.tsx: a stale dashboard value
      // cannot then silently move it.
      //
      // Known exception, deliberately not chased: a `redirects()` entry is
      // resolved before headers are written, so the one config redirect
      // (`/feedback`) and Next's trailing-slash normalisation answer without
      // this header. Both are empty 307/308s whose destination does carry it,
      // so there is no body to index; closing them would mean moving those
      // redirects into middleware, which is a lot of moving parts for nothing a
      // crawler would have indexed. The middleware redirects in middleware.ts
      // *do* carry it, having run after the header was written.
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "preview\\.rnui\\.dev|rnui-dev-git-.*\\.vercel\\.app",
          },
        ],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
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

// Neither set is the normal case — a fork, a clone, a contributor. Exactly one
// set is somebody halfway through configuring Vercel, and that build would
// otherwise go green while shipping stack traces nobody can read.
if (Boolean(personalApiKey) !== Boolean(projectId)) {
  console.warn(
    "[posthog] Source maps will NOT be uploaded: POSTHOG_API_KEY and POSTHOG_PROJECT_ID must both be set. Stack traces in error tracking will stay minified."
  )
}

export default withPostHogConfig(nextConfig, {
  personalApiKey: personalApiKey ?? "",
  projectId,
  sourcemaps: { enabled: Boolean(personalApiKey && projectId) },
})
