import { expect, test } from "@playwright/test"

// two-designs ticket 04. `preview.rnui.dev` was the hostname the studio-dark
// Design was reviewed on. That Design is `www.rnui.dev` now, so the Preview is a
// second address for the live site answering 200 with identical bytes — the same
// duplicate content the Archive has, except here a redirect also answers it.
//
// `request.get` rather than `page.goto`, because a redirect is asserted by not
// following it. Chromium will not send a Host that disagrees with the URL it
// dialled; the request context will.
//
// The last two tests are the point. A `has` condition lost from the rule would
// either redirect `www` to itself, or stop redirecting the Preview — and the
// first two would not notice.
const PREVIEW_HOST = "preview.rnui.dev"

test("the Preview host redirects to the live site", async ({ request }) => {
  const response = await request.get("/", {
    headers: { host: PREVIEW_HOST },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  // No trailing slash: `:path*` matches empty at the root, so the destination is
  // the bare origin. Asserted as emitted rather than as tidied — a redirect that
  // silently gained or lost a slash is a redirect whose exact bytes nobody has
  // checked.
  expect(response.headers()["location"]).toBe("https://www.rnui.dev")
})

test("a deep path on the Preview keeps its path", async ({ request }) => {
  const response = await request.get("/products", {
    headers: { host: PREVIEW_HOST },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(308)
  expect(response.headers()["location"]).toBe("https://www.rnui.dev/products")
})

test("the live host is not redirected", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 })

  expect(response.status()).toBe(200)
  expect(response.headers()["location"]).toBeUndefined()
})

test("the live host carries no noindex, and never will", async ({ request }) => {
  // The `has` on the host is what keeps this true. The same build serves the
  // Preview and the live site, and the headers() rule in next.config.ts noindexes
  // the Preview host — if the two ever shared a pattern, this is the assertion
  // that would fail rather than a page quietly dropping out of the index.
  for (const host of ["www.rnui.dev", "rnui.dev"]) {
    const response = await request.get("/", { headers: { host } })

    expect(response.status(), `${host} answers`).toBe(200)
    expect(
      response.headers()["x-robots-tag"],
      `${host} must stay indexable`
    ).toBeUndefined()
  }
})
