// lib/star-surface.ts
//
// github-star-button ticket 04. One question: does the star control belong on
// the surface being rendered?
//
// **A module rather than a constant inside the header, and that is the whole
// design.** The first version of this was a module-level
// `const SHOW_STARS = process.env.VERCEL_ENV !== "preview"` in
// components/site-header.tsx, which cannot be unit tested at all — module scope
// evaluates at import, before any test can set an environment variable, so the
// truth table could only ever be asserted by reading the source. A policy that
// fails silently is exactly the kind that does fail silently: had the comparison
// been `=== "production"`, the control would have vanished from production and
// every test in the repo would still have passed, because there would be no test
// for it. As a function the table below is pinned by tests/star-surface.test.ts.

/**
 * Whether the star control belongs on this surface.
 *
 * **Fails open deliberately.** Absent means shown, so a local dev server, a
 * contributor's `pnpm dev`, and anything not running on Vercel all render the
 * control. The alternative — absent means hidden — makes the control invisible in
 * every local check and every screenshot, which is how a control that exists in
 * production gets deleted by someone who could not see it.
 *
 * `VERCEL_ENV` is one of `production`, `preview` or undefined, and Next inlines
 * it at build time, so this cannot change within a page's life: no memo, no
 * effect, and calling it twice in one render costs nothing.
 *
 * **One gate for both header layouts.** The desktop bar and the phone header are
 * separate components that already drifted once — the `Saved` chip has two
 * spellings for one fact. This is read by both, once each, and never re-derived.
 */
export function showStarControl(
  vercelEnv: string | undefined = process.env.VERCEL_ENV
): boolean {
  return vercelEnv !== "preview"
}