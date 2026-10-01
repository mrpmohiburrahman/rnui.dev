import { expect, test } from "@playwright/test"

// two-designs ticket 02. The Archive is the previous Design, published at
// old.rnui.dev alongside the live site rather than in place of it, and it must
// not be indexed: both hosts serve the same 277 Recordings, so an indexable
// Archive is duplicate content competing with the live site for its own pages.
//
// `request.get` rather than `page.goto`: this asserts on response headers, and
// a forged `Host` is the only way to reach the Archive branch of the rule from
// a server listening on localhost. Chromium will not send a Host that disagrees
// with the URL it dialled; the request context will.
//
// The last test is the one that matters. The `has` condition in next.config.ts
// is all that stands between this header and rnui.dev deindexing itself, and a
// rule that lost its condition would still pass the two above it.
const ARCHIVE_HOST = "old.rnui.dev"

// The same build is served at its own Vercel alias, which is the same duplicate
// content on a third hostname. Vercel is widely said to noindex its deployment
// URLs; the rule covers this rather than depending on that.
const BRANCH_ALIAS = "rnui-dev-archive-mrpmohiburrahmans-projects.vercel.app"

test("the Archive host answers noindex", async ({ request }) => {
  const response = await request.get("/", { headers: { host: ARCHIVE_HOST } })

  expect(response.status()).toBe(200)
  expect(response.headers()["x-robots-tag"]).toBe("noindex")
})

test("the Archive's Vercel alias answers noindex", async ({ request }) => {
  const response = await request.get("/", { headers: { host: BRANCH_ALIAS } })

  expect(response.status()).toBe(200)
  expect(response.headers()["x-robots-tag"]).toBe("noindex")
})

test("every other host does not", async ({ request }) => {
  const response = await request.get("/")

  expect(response.status()).toBe(200)
  expect(response.headers()["x-robots-tag"]).toBeUndefined()
})

test("the live host's apex and www do not", async ({ request }) => {
  // The blast radius, named rather than implied. `old\.rnui\.dev` is anchored,
  // and there is deliberately no bare `rnui\.dev` alternative in the rule — but
  // a future edit that added one would deindex the whole site, and the two
  // hosts above would still pass.
  for (const host of ["www.rnui.dev", "rnui.dev"]) {
    const response = await request.get("/", { headers: { host } })

    expect(response.status(), `${host} answers`).toBe(200)
    expect(
      response.headers()["x-robots-tag"],
      `${host} must not be noindexed`
    ).toBeUndefined()
  }
})
