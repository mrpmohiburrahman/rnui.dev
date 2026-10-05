// lib/og-contributor-url.ts
//
// The address of a Contributor's card, and the key that makes it immutable.
//
// Split out of `app/products/page.tsx` because the *shape* of this URL is a decision with a
// failure mode, and a decision with a failure mode wants a test rather than a comment.

import { createHash } from "node:crypto"

import { allRecordings } from "@/data/catalogue"
import { defaultUrl } from "@/data/default-url"
import {
  canonicaliseContributor,
  existingContributor,
  foldContributorName,
} from "@/lib/contributor-match"

/** Every spelling the catalogue holds, for the matcher. */
const NAMES = [...new Set((allRecordings as { contributor: string }[]).map((r) => r.contributor))]

/**
 * The catalogue's own spelling for a name, or null.
 *
 * **Resolved through `lib/contributor-match.ts` rather than a private fold.** ADR-0009's rule is
 * already implemented and tested there, and this file was the third place re-implementing it —
 * which is how the first version ended up folding for the hash but matching *exactly* for the
 * id, so a mis-cased name produced a key that could never move when the fan changed.
 * `tests/og-contributor-card.test.ts` caught it; the fix was to stop duplicating the rule rather
 * than to patch the symptom.
 */
function canonical(contributor: string): string | null {
  return existingContributor(contributor, NAMES)
}

/**
 * The newest Recording's id for a Contributor, or "" when they have none.
 *
 * **This is the whole reason the card URL is not just the name.** A card is mutable: when a
 * Contributor's next Recording lands, the fan changes and the count rises, but their name does
 * not. Ticket 03 measured that **an existing LinkedIn share is permanent** — a refresh reaches
 * new posts only — and RFC 9111 §4 makes a *different target URI* a different cache entry. So
 * the key moves when the card's content moves, and every share made before it keeps the fan it
 * was made with instead of disagreeing with the page it points at.
 *
 * Newest-first is the catalogue's own order (`data/recording.ts` sorts `created_at`
 * descending), so this is the same Recording the card's front tile shows.
 */
export function newestRecordingId(contributor: string): string {
  const exact = canonical(contributor)
  if (!exact) return ""
  const mine = (allRecordings as { id: string; contributor: string; created_at?: string }[])
    .filter((r) => r.contributor === exact)
    .sort((a, b) => ((a.created_at ?? "") < (b.created_at ?? "") ? 1 : -1))
  return mine[0]?.id ?? ""
}

/**
 * The cache key: a hash of the folded name and that id.
 *
 * **Not a slug, and not an identity.** ADR-0009 gives a Contributor no slug and no id — the
 * name string *is* the identity. This is an opaque cache key that appears only inside the
 * card's own URL and in no link a person reads or shares; the page address stays
 * `/products?contributor=<exact name>`. Hashing rather than embedding the name keeps a
 * Contributor whose name contains `(`, `)` or Hangul from having to be percent-encoded twice.
 */
export function contributorCardKey(contributor: string): string {
  const folded = foldContributorName(contributor)
  return createHash("sha256").update(`${folded}|${newestRecordingId(contributor)}`).digest("hex").slice(0, 16)
}

/**
 * The absolute card URL.
 *
 * Absolute because a scraper resolves `og:image` against the page, and `metadataBase` is what
 * makes that possible — so this goes through the same `defaultUrl` every canonical on the
 * site already uses, rather than inventing an origin.
 */
export function contributorCardUrl(contributor: string): string {
  const base = defaultUrl.endsWith("/") ? defaultUrl : `${defaultUrl}/`
  const url = new URL("api/og/contributor", base)
  // **The catalogue's spelling goes in `name`, never the caller's.** A key computed from one
  // spelling and a lookup performed on another is the bug above, one layer down.
  url.searchParams.set(
    "name",
    canonicaliseContributor(
      contributor,
      (allRecordings as { contributor: string }[]).map((r) => r.contributor)
    )
  )
  url.searchParams.set("v", contributorCardKey(contributor))
  return url.toString()
}
