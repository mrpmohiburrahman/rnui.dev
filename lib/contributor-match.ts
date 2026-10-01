// lib/contributor-match.ts
//
// When two Contributor names are the same person, as ordinary functions a test
// can import — and, as importantly, as functions with **no `@/data/*` import at
// all**, so the submission form can call them from a client chunk without
// dragging all 280 Recordings in behind them. The names themselves are computed
// on the server and passed in.
//
// The rule is docs/adr/0009-a-contributors-identity-is-their-name-string.md: a
// Contributor's identity is the name string, and two spellings differing only in
// letter case, surrounding or repeated spaces, or Unicode encoding form name the
// **same** Contributor.
//
// **Folding is for matching, and never for storage.** `canonicaliseContributor`
// returns an exact spelling the catalogue already holds whenever the typed name
// means one, and otherwise returns the visitor's own words with only whitespace
// tidied — never lower-cased, never accent-stripped, never slugified. This repo
// removed its one real duplicate (`"Pushkar Tandon "`) by editing
// `data/fullapps.ts`, not by normalising on the way out, and
// `tests/data-integrity.test.ts` guards the same property from the other end.
//
// public-submissions ticket 13.

/**
 * The form two names are compared in: composed (NFC), trimmed, with runs of
 * whitespace collapsed, then lower-cased.
 *
 * Deliberately not NFKD and not accent-stripping. `Daehyeon Mun (문대현)` is the
 * reason: every slugifier tried on this data loses `문대현` entirely, and a rule
 * that handles 22 of 23 names correctly and merges the 23rd silently is worse
 * than no rule at all (`app/contributors/page.tsx`).
 */
export function foldContributorName(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase()
}

/**
 * The exact catalogue spelling this name means, or null when it means somebody
 * the catalogue has not seen.
 */
export function existingContributor(
  name: string,
  names: readonly string[]
): string | null {
  const folded = foldContributorName(name)
  if (!folded) return null
  return (
    names.find((candidate) => foldContributorName(candidate) === folded) ?? null
  )
}

/**
 * What to offer as the visitor types: prefix matches first, then matches
 * anywhere in the name, each keeping the order `names` arrives in (alphabetical,
 * from `getUniqueContributors`).
 *
 * Prefix-first rather than a relevance score, and no edit distance at all. With
 * 23 names a ranking function is more machinery than the list can use, and a
 * typo-tolerant one offers the wrong John Smith exactly as readily as the right
 * one. The caller decides how many rows to draw.
 */
export function suggestContributors(
  query: string,
  names: readonly string[],
  limit = 6
): string[] {
  const folded = foldContributorName(query)
  if (!folded) return []

  const prefix: string[] = []
  const inside: string[] = []
  for (const name of names) {
    const candidate = foldContributorName(name)
    if (candidate.startsWith(folded)) prefix.push(name)
    else if (candidate.includes(folded)) inside.push(name)
  }
  return [...prefix, ...inside].slice(0, limit)
}

/**
 * What is actually sent, and eventually published: the existing spelling when
 * the name means one, otherwise the visitor's own words with whitespace tidied
 * and nothing else.
 *
 * Called on both sides deliberately. The browser calls it so the name it posts is
 * the name the form just said it would credit, and the endpoint calls it because
 * the browser is not to be trusted with a field that decides a Contributor's
 * identity. It is idempotent, so running twice costs nothing.
 */
export function canonicaliseContributor(
  name: string,
  names: readonly string[]
): string {
  const existing = existingContributor(name, names)
  if (existing) return existing
  return name.normalize("NFC").trim().replace(/\s+/g, " ")
}
