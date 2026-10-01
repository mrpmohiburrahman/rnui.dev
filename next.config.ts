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
      // The Archive. `www.rnui.dev` serves the current Design and this branch
      // serves the previous one, and between them they publish the same 277
      // Recordings — so without this, `old.rnui.dev` is indexable duplicate
      // content against the live site. next-sitemap's `siteUrl` is
      // `https://www.rnui.dev`, so both hosts also claim the same canonical
      // URLs.
      //
      // Header rather than a robots.txt rule, for the same reason the live site
      // uses one: `Disallow` stops the crawl, and a page that is never crawled
      // is a page whose noindex is never read — a URL blocked that way can
      // still be indexed from inbound links. The committed `public/robots.txt`
      // says `Allow: /` and carries only a Yandex `Host:` hint, which Google
      // does not read as an instruction.
      //
      // No `rel=canonical`, deliberately. `X-Robots-Tag: noindex` makes Google
      // ignore canonical outright, so one adds nothing; and Next cannot
      // interpolate the matched path into a header value, so the only canonical
      // available is the bare site root — which would tell a crawler that every
      // page of the Archive duplicates the homepage rather than the page it
      // mirrors. The header alone is the honest instruction.
      //
      // Two hosts, for the same reason the live branch covers two: the Archive
      // is *also* served at `rnui-dev-archive-*.vercel.app`, which is the same
      // duplicate content on a hostname a crawler can find. Matching both means
      // the protection does not depend on which URL somebody shares.
      //
      // `has` is the whole safety of this rule: unconditional, it would deindex
      // rnui.dev itself. Neither alternative can match the live host — there is
      // deliberately no bare `rnui\.dev` alternative, and this branch is never
      // deployed to `www` — so even read unanchored the blast radius stays on
      // the Archive.
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "old\\.rnui\\.dev|rnui-dev-archive-.*\\.vercel\\.app",
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
