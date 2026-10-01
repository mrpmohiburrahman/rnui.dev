import { expect, test } from "@playwright/test"

// notify-and-preview ticket 12. The Preview is the Studio Dark build served at
// preview.rnui.dev alongside the live site, and it must not be indexed.
//
// `request.get` rather than `page.goto`: this asserts on response headers, and
// a forged `Host` is the only way to reach the Preview branch of the rule from
// a server listening on localhost. Chromium will not send a Host that
// disagrees with the URL it dialled; the request context will.
//
// The last test is the one that matters. The `has` condition in next.config.ts
// is all that stands between this header and rnui.dev deindexing itself, and a
// rule that lost its condition would still pass the two above it.
const PREVIEW_HOST = "preview.rnui.dev"

// The same build is served at the branch's own Vercel alias, which is the same
// duplicate content on a third hostname. Vercel is widely said to noindex its
// deployment URLs; the rule covers this rather than depending on that.
const BRANCH_ALIAS = "rnui-dev-git-feat-studio-dark-mrpmohiburrahmans-projects.vercel.app"

test("the Preview host answers noindex", async ({ request }) => {
  const response = await request.get("/", { headers: { host: PREVIEW_HOST } })

  expect(response.status()).toBe(200)
  expect(response.headers()["x-robots-tag"]).toBe("noindex")
})

test("the branch's Vercel alias answers noindex", async ({ request }) => {
  const response = await request.get("/", { headers: { host: BRANCH_ALIAS } })

  expect(response.status()).toBe(200)
  expect(response.headers()["x-robots-tag"]).toBe("noindex")
})

test("every other host does not", async ({ request }) => {
  const response = await request.get("/")

  expect(response.status()).toBe(200)
  expect(response.headers()["x-robots-tag"]).toBeUndefined()
})
