// lib/catalogue-heading.ts
//
// The two strings that pair with every catalogue heading row
// (Catalogue.dc.html:85-88): the section head on the left and the mono result
// line on the right. Pure functions of the filter state, living in lib/ rather
// than inside a "use server" action or a client component, for the reason
// lib/recording-search.ts records for matchesSearchTerm: a rule inside either
// is a rule nothing can test.
//
// A search term never enters the heading. The mock's `filtered` variant has a
// search chip on (Catalogue.dc.html:80) and its heading is still "Misc, by one
// contributor"; the term lives in the chip and in the filter count on the
// result line.

export type SortLabel = "recent" | "top-viewed" | "top-voted"

/**
 * The section head under the hero (mock Catalogue.dc.html:210). `total` is the
 * filtered result count, so a search that matches nothing yields "No matches"
 * on an otherwise Recent page.
 */
export function catalogueHeading(config: {
  category?: string
  contributor?: string
  total: number
}): string {
  const { category, contributor, total } = config
  if (total === 0) return "No matches"
  if (category && contributor) return `${category}, by one contributor`
  if (category) return category
  if (contributor) return contributor
  return "Recent"
}

/**
 * The mono result count under the heading. `shown` is the number of tiles
 * actually rendered and `catalogueTotal` is always the whole catalogue (277),
 * not the filtered set — that one rule reproduces every value the mock draws.
 *
 * The forms win in this order and nothing else: placeholder space, the saved
 * view, the filtered view, the reduced variant, then the sort tail.
 */
export function catalogueResultLine(config: {
  shown: number
  catalogueTotal: number
  filterCount: number
  sort: SortLabel
  savedView?: boolean
  loading?: boolean
  reducedMotion?: boolean
}): string {
  const {
    shown,
    catalogueTotal,
    filterCount,
    sort,
    savedView,
    loading,
    reducedMotion,
  } = config
  if (loading) return `RESERVING SPACE FOR ${shown}`
  if (savedView) return `${shown} SAVED · THIS BROWSER`
  if (filterCount > 0)
    return `${shown} OF ${catalogueTotal} · ${filterCount} FILTER${
      filterCount === 1 ? "" : "S"
    }`
  if (reducedMotion) return `${shown} OF ${catalogueTotal} · STILLS ONLY`
  const label =
    sort === "top-viewed"
      ? "MOST VIEWED"
      : sort === "top-voted"
        ? "MOST VOTED"
        : "RECENT"
  return `${shown} OF ${catalogueTotal} · SORTED ${label}`
}

/**
 * The zero-result panel's own eyebrow (Catalogue.dc.html:100). It lives beside
 * its two siblings so the numerator and denominator obey the same one rule —
 * `shown` is tiles rendered, `catalogueTotal` is always the whole catalogue —
 * and so the two mono lines cannot drift apart.
 *
 * A third function rather than a flag on catalogueResultLine because the strings
 * genuinely differ: `0 OF 277 · 3 FILTERS` in the heading row and
 * `0 OF 277 MATCH` in the panel, both drawn, both on screen at once in the mock's
 * `zero` variant.
 */
export function catalogueMatchLine(config: {
  shown: number
  catalogueTotal: number
}): string {
  return `${config.shown} OF ${config.catalogueTotal} MATCH`
}
