import { expect, test } from "@playwright/test"

// notify-and-preview ticket 12 wrote this file to noindex the Preview. That job
// is **done and retired**: two-designs ticket 04 (`3c32dfe`, 2026-10-02) made
// `preview.rnui.dev` 308 to `www.rnui.dev`, and `feat/studio-dark` — the branch
// whose Vercel alias this file also guarded — was merged into `main` and
// deleted. Nothing duplicate is served on a second hostname any more, so there is
// nothing left to noindex.
//
// **This file was left asserting the retired arrangement**, which is why it went
// red: `preview.rnui.dev` answers 308, not a noindexed 200, so the header it
// expects is not there. That is the desired behaviour and the test was wrong,
// which is the same shape of defect `6acf554` left behind in the heading row.
//
// So the tests are rewritten rather than deleted, because the underlying concern
// is live and worth keeping: **a redirect is not a duplicate-content fix if some
// future hostname starts serving this build again.** The noindex rule in
// `next.config.ts` is still there, still conditioned on `has`, and still the only
// thing that would deindex the site if the condition were lost. What is asserted
// now is the pair of rules as they stand:
//
//   1. `preview.rnui.dev` redirects — it serves no bytes of its own.
//   2. the production host is NOT redirected and NOT noindexed, which is what
//      makes both of those rules safe to have at all.
//
// The `has` condition is the load-bearing part and this is the file that says so.
const PREVIEW_HOST = "preview.rnui.dev"

test("the retired Preview host redirects to the live site", async ({ request }) => {
  // Duplicated from tests/e2e/preview-redirect.spec.ts deliberately: that file
  // covers the redirect, this one covers *why* nothing needs noindexing. If the
  // two disagree, one of them is describing a host that no longer exists.
  const response = await request.get("/", {
    headers: { host: PREVIEW_HOST },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  expect(response.headers()["location"]).toBe("https://www.rnui.dev")
})

test("the live site is neither redirected nor noindexed", async ({ request }) => {
  // The safety of every `has`-conditioned rule in next.config.ts, stated
  // directly. An unconditional noindex or redirect would deindex or self-redirect
  // the whole site, and neither rule's own tests would notice — they only send
  // preview hosts.
  const response = await request.get("/")

  expect(response.status()).toBe(200)
  expect(response.headers()["x-robots-tag"]).toBeUndefined()
})

test("the noindex rule is still conditioned, so an unlisted host is unaffected", async ({
  request,
}) => {
  // A host that is neither the live site nor the retired Preview. This is the
  // case that proves the `has` condition still exists: if someone drops it, this
  // request comes back noindexed.
  const response = await request.get("/", {
    headers: { host: "old.rnui.dev" },
    maxRedirects: 0,
  })

  expect(response.headers()["x-robots-tag"]).toBeUndefined()
  // `old.rnui.dev` is the Archive's own hostname and does answer, so the request
  // reaching 200 rather than erroring is itself part of what is being asserted.
  expect(response.status()).toBeLessThan(400)
})