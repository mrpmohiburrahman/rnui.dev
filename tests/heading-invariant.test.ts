import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// The exactly-one-`h1` invariant, restated independently.
//
// `6acf554` deleted the heading row's `h1`/`h2` element along with its visible
// text, and took `/products` and `/bookmarks` to **zero** `h1`s. The code it
// removed had a comment saying so — "every route carries exactly one h1 —
// /products has none without this" — and 19 e2e tests went red asserting text
// that was gone. Nobody ran them, so the regression sat in `main`.
//
// The element came back as `sr-only`, so this cannot be checked by looking at a
// screenshot and it does not fail at build time either. It is checked here, from
// the source, on the assumption that a route which renders no `h1` at all is a
// bug regardless of what it looks like.
//
// Expectations are written by hand and deliberately NOT derived from the
// components, for ADR-0005's reason: a test that reads its expectation from the
// code under test can no longer catch that code being wrong.

/**
 * One route -> the `h1` it must carry. Every entry here is a page, not a
 * fragment, and each is asserted to name *something*: an `h1` with no text is
 * not an outline either.
 */
const ROUTE_HEADINGS: Record<string, string> = {
  "app/page.tsx": "Recent",
  "app/products/page.tsx": "Recent",
  "app/bookmarks/page.tsx": "Saved on this device",
}

describe("every catalogue route carries exactly one h1", () => {
  it("the route list has not silently shrunk", () => {
    // A new catalogue route that is not listed here gets no protection, so the
    // count is asserted rather than trusted. Three routes, and
    // tests/e2e/headings.spec.ts walks `/` and `/products` in a browser.
    expect(Object.keys(ROUTE_HEADINGS).sort()).toEqual([
      "app/bookmarks/page.tsx",
      "app/page.tsx",
      "app/products/page.tsx",
    ])
  })

  for (const [file, expected] of Object.entries(ROUTE_HEADINGS)) {
    it(`${file} hands the grid a heading of ${JSON.stringify(expected)}`, () => {
      const source = readFileSync(file, "utf8")
      expect(
        /heading=\{|heading="/.test(source),
        `${file} no longer passes a heading to CataloguePage, so the grid's ` +
          `sr-only h1 has nothing to render and this route has no h1 at all.`
      ).toBe(true)
      // The named value, where the route hard-codes it. `/` and `/products`
      // compute theirs through catalogueHeading, so they are asserted by
      // function name instead of by literal — what matters there is that the
      // heading is *derived* rather than absent.
      if (file === "app/bookmarks/page.tsx") {
        expect(source).toContain(`heading="${expected}"`)
      } else {
        expect(source).toContain("catalogueHeading(")
      }
    })
  }

  it("the grid renders the heading as an h1, or an h2 under a hero", () => {
    // The other half: a `heading` prop that nothing renders would satisfy every
    // assertion above while leaving the routes with no h1. Both branches are
    // required because the hero decides which, and `6acf554` deleted both.
    const grid = readFileSync("components/recording-card-grid.tsx", "utf8")
    expect(grid).toMatch(/<h1[^>]*>\{heading\}<\/h1>/)
    expect(grid).toMatch(/<h2[^>]*>\{heading\}<\/h2>/)
  })

  it("the grid's heading is visually hidden, not painted", () => {
    // `6acf554` removed the visible heading on purpose. Restoring the element
    // must not reinstate the text, or this change reverses a deliberate design
    // decision rather than fixing a defect.
    const grid = readFileSync("components/recording-card-grid.tsx", "utf8")
    for (const tag of ["h1", "h2"]) {
      expect(grid).toMatch(new RegExp(`<${tag} className="sr-only">`))
    }
    // And the heading prop is required, so a new caller cannot forget it and
    // silently drop the route's outline. Optional-to-optional is how this
    // happened: the prop and the element were removed in the same commit.
    expect(grid).toMatch(/^\s*heading: string$/m)
  })

  it("/bookmarks' Suspense fallback carries the h1 into the served HTML", () => {
    // The route is a client component whose grid only renders once localStorage
    // has been read, so the fallback is the *only* thing in the served document.
    // `6acf554` set that fallback to `null` and the route stopped shipping a
    // heading to a crawler or a no-JavaScript visitor as well as to the DOM.
    const source = readFileSync("app/bookmarks/page.tsx", "utf8")
    const fallback = source.match(/fallback=\{([\s\S]*?)\n\s*\}/)?.[1] ?? ""
    expect(fallback, "the fallback is not a brace expression any more").toMatch(
      /<h1/
    )
    expect(fallback).toContain("Saved on this device")
  })

  it("no route imports catalogueHeading without using it", () => {
    // `6acf554` left the import behind in both routes, which is why `pnpm lint`
    // reported two unused-import warnings on files nobody had opened since. A
    // dead import of the heading function is the fingerprint of this exact
    // regression, so it is checked directly.
    for (const file of Object.keys(ROUTE_HEADINGS)) {
      const source = readFileSync(file, "utf8")
      const imports = /catalogue-heading/.test(source)
      expect(
        imports,
        `${file} no longer imports catalogueHeading — if it now hard-codes its ` +
          `heading, that is fine, but the import must go with it.`
      ).toBe(source.includes("catalogueHeading("))
    }
  })
})