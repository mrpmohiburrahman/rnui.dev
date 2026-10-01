// lib/catalogue-filters.ts
//
// The zero-result panel's whole brain (Catalogue.dc.html:98-109). A panel that
// diagnoses has to compute rather than render a string: the sentence the mock
// draws at :102 names the wrong Category for the Recording it cites, and its own
// query turns out to have three helpful drops where the mock draws one. Both
// facts are in ticket 08; neither is spelled here, because no word of this panel
// is written down. tests/catalogue-filters.test.ts asserts the Category against
// data/ rather than against a literal, which is the guard against that changing.
//
// Pure, and in lib/ for the reason app/actions/get-recordings.ts gives for
// matchesSearchTerm: a rule inside a "use server" action or a client component
// is a rule nothing can test. It imports nothing from react, next or data/, and
// never returns a Recording — so the server component that calls it hands the
// result down as a small plain object and data/catalogue.ts stays out of every
// client chunk (components/catalogue-search.tsx:54-57).

import type { Recording } from "@/data/recording"

import { matchesSearchTerm } from "@/lib/recording-search"

export type ActiveFilters = {
  category?: string
  contributor?: string
  search?: string
}

/** In the order the diagnosis prefers to drop them. */
export const FILTER_KEYS = ["category", "contributor", "search"] as const

export type FilterKey = (typeof FILTER_KEYS)[number]

/** The one Recording the panel names, reduced to the three fields it prints. */
export type DiagnosisExample = {
  caption: string
  category: string
  contributor: string
}

export type CatalogueDiagnosis = {
  /** The filters actually in force, in FILTER_KEYS order. Never empty. */
  keys: FilterKey[]
  /** The one filter the panel proposes giving up, or null when none helps. */
  dropped: FilterKey | null
  /** What dropping it would show. Null exactly when `dropped` is. */
  example: DiagnosisExample | null
  /** The other filters that would also help, `dropped` excluded. */
  alternatives: FilterKey[]
  /** Whether the search term alone returns anything, so the panel can offer it. */
  searchAll: boolean
}

/** The active filters, in FILTER_KEYS order, ignoring empty strings. */
function activeKeys(active: ActiveFilters): FilterKey[] {
  return FILTER_KEYS.filter((key) => Boolean(active[key]))
}

/**
 * What the catalogue would show under some subset of the active filters.
 *
 * The three rules are the server's own, in the server's own order and by the
 * server's own predicates (app/actions/get-recordings.ts:44-64). A diagnosis
 * computed by a second, differently-spelled filter would eventually name an
 * example the grid does not show.
 */
function matching(
  recordings: Recording[],
  active: ActiveFilters,
  subset: readonly FilterKey[]
): Recording[] {
  return recordings.filter((recording) => {
    if (
      subset.includes("search") &&
      !matchesSearchTerm(recording, active.search!)
    )
      return false
    if (
      subset.includes("category") &&
      recording.category.toLowerCase() !== active.category!.toLowerCase()
    )
      return false
    if (
      subset.includes("contributor") &&
      recording.contributor.toLowerCase() !== active.contributor!.toLowerCase()
    )
      return false
    return true
  })
}

/**
 * Why this filtered catalogue is empty, and which single filter to give up.
 *
 * Null when nothing is filtered: an unfiltered catalogue is never zero, so the
 * panel would have nothing to say.
 */
export function catalogueDiagnosis(
  recordings: Recording[],
  active: ActiveFilters
): CatalogueDiagnosis | null {
  const keys = activeKeys(active)
  if (keys.length === 0) return null

  const without = (key: FilterKey) => keys.filter((k) => k !== key)

  // Category first, Contributor second, search last, and the order is the whole
  // rule — no arithmetic, no largest-set tie-break. The term is the visitor's
  // own words and the two facets are navigation: somebody who typed `wheel`
  // meant `wheel`, so the panel proposes giving up a click before it proposes
  // giving up the typing.
  const helpful = keys.filter(
    (key) => matching(recordings, active, without(key)).length > 0
  )

  const dropped = helpful[0] ?? null
  // First in allRecordings order, which is Category-file order — deterministic,
  // and needing no Firestore read. See the ticket's open question 2.
  const example = dropped
    ? (matching(recordings, active, without(dropped))[0] ?? null)
    : null

  return {
    keys,
    dropped,
    example: example && {
      caption: example.caption,
      category: example.category,
      contributor: example.contributor,
    },
    alternatives: helpful.filter((key) => key !== dropped),
    // Only worth offering when there is another filter to shed, and only when
    // the term alone actually returns something — a panel that offers a search
    // which also returns zero is a second dead end.
    searchAll:
      keys.includes("search") &&
      keys.length > 1 &&
      matching(recordings, active, ["search"]).length > 0,
  }
}

/**
 * `two` or `three`, the mock's own spelling (Catalogue.dc.html:102,106). Only
 * ever asked for a count above one, because both callers omit the sentence
 * under a single filter. The digit fallback is not decoration: a fourth
 * FILTER_KEY would otherwise make every sentence quietly say "three".
 */
const NUMBER_WORDS: Record<number, string> = { 2: "two", 3: "three" }
function numberWord(count: number): string {
  return NUMBER_WORDS[count] ?? String(count)
}

/**
 * Where every filter off lands. `/products` when a facet was in force, because
 * that is where a facet lives; the route the visitor is on when only the term
 * was — the search box works on whatever route it is on.
 *
 * One spelling, shared by the filter bar's `Clear all` and the empty panel's.
 * Two of them is how the bar and the panel come to disagree about where "off"
 * is — the same reasoning `facetHref` carries for the chip and the rail row.
 */
export function clearAllHref(pathname: string, keys: FilterKey[]): string {
  return keys.some((key) => key !== "search") ? "/products" : pathname
}

export type CatalogueSentences = {
  /** Catalogue.dc.html:101. Always present. */
  headline: string
  /** Catalogue.dc.html:102, or null under a single filter, where "loosen one
   * of the one" is not a sentence and the example has no facet left to
   * qualify itself against. */
  body: string | null
}

/**
 * The panel's two sentences, so the component holds no copy of its own.
 *
 * The typographic quotes are U+201C and U+201D, exactly as the mock draws them;
 * do not substitute ".
 */
export function catalogueSentences(
  active: ActiveFilters,
  diagnosis: CatalogueDiagnosis
): CatalogueSentences {
  const { keys, dropped, example } = diagnosis
  const { category, contributor, search } = active

  const has = (key: FilterKey) => keys.includes(key)
  const headline = has("search")
    ? has("category") && has("contributor")
      ? `Nothing in ${category} by ${contributor} matches “${search}”.`
      : has("category")
        ? `Nothing in ${category} matches “${search}”.`
        : has("contributor")
          ? `Nothing by ${contributor} matches “${search}”.`
          : `Nothing in the catalogue matches “${search}”.`
    : has("category") && has("contributor")
      ? `Nothing in ${category} is by ${contributor}.`
      : // Unreachable from the UI — getUniqueCategories() and
        // getUniqueContributors() derive from the Recordings present, so an
        // empty Category never reaches the rail (data/recording.ts:8-12) — but
        // ?category=Nope is typeable, so it has a string rather than a crash.
        "Nothing matches these filters."

  if (keys.length === 1) return { headline, body: null }

  const word = numberWord(keys.length)
  if (!dropped || !example)
    return {
      headline,
      // True by construction: that is exactly what an empty `helpful` tested.
      body: `No single filter explains it — nothing matches any two of the ${word}.`,
    }

  // The strongest facet still applied, in the order Contributor, search,
  // Category.
  const remaining = keys.filter((key) => key !== dropped)
  const qualifier = remaining.includes("contributor")
    ? "by this contributor"
    : remaining.includes("search")
      ? `a match for “${search}”`
      : `in ${category}`

  const tail =
    dropped === "category"
      ? `but it lives in ${example.category} — not ${category}.`
      : dropped === "contributor"
        ? `but it is by ${example.contributor} — not ${contributor}.`
        : `but nothing there matches “${search}”.`

  return {
    headline,
    body: `Loosen one of the ${word}. ${example.caption} is ${qualifier}, ${tail}`,
  }
}

/**
 * One escape route out of the empty panel. `kind` is what the caller has to
 * turn into an href; the label is derived here so no component holds the copy.
 */
export type CatalogueAction = { label: string; primary: boolean } & (
  | { kind: "drop"; key: FilterKey }
  | { kind: "search-all" }
  | { kind: "clear-all" }
)

function dropLabel(key: FilterKey): string {
  return key === "search" ? "Clear the search" : `Drop the ${key} filter`
}

/**
 * Every action the zero panel offers, in the order it draws them. Built from
 * the diagnosis and never from a fixed list of three: on this catalogue the
 * mock's own query has three helpful drops, and other queries have one or none.
 */
export function catalogueActions(
  active: ActiveFilters,
  diagnosis: CatalogueDiagnosis,
  catalogueTotal: number
): CatalogueAction[] {
  const { keys, dropped, alternatives, searchAll } = diagnosis
  const actions: CatalogueAction[] = []

  if (dropped)
    actions.push({
      kind: "drop",
      key: dropped,
      label: dropLabel(dropped),
      primary: true,
    })
  for (const key of alternatives)
    actions.push({ kind: "drop", key, label: dropLabel(key), primary: false })

  // `dropped` as well as `searchAll`: when no single drop helps, the panel says
  // so and offers Clear all alone. The two are independent — three filters can
  // leave every pair empty while the term alone still matches something, which
  // is `/products?category=Sliders&contributor=Thomino&search=spin` against this
  // catalogue — so without this the "exactly one action" case offers two.
  if (searchAll && dropped)
    actions.push({
      kind: "search-all",
      label: `Search all ${catalogueTotal} for “${active.search}”`,
      primary: false,
    })

  // Never offered under a single filter, where it would be the same button
  // twice. Always offered above that, because the unfiltered catalogue is never
  // empty.
  if (keys.length > 1)
    actions.push({
      kind: "clear-all",
      label: `Clear all ${numberWord(keys.length)}`,
      primary: false,
    })

  return actions
}
