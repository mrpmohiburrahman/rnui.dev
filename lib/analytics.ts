// lib/analytics.ts
//
// Every custom event the site captures, one exported function each. No component
// calls `posthog.capture` with a string literal, so an event name and each of its
// property names is spelled exactly once — which is the only thing standing
// between a catalogue of thirteen events and thirteen near-synonyms of
// `entryId` / `entry_id` / `id` spread over eight files.
//
// It talks to the posthog-js singleton directly rather than through
// `usePostHog()`. It is the same object lib/posthog-provider.tsx initialises, and
// reaching it from module scope is what lets the sort hook and the playback
// owner report — neither of those is a component body, so neither can call a
// hook, and threading a client through them as a prop would be the alternative.
//
// Capturing before `posthog.init` has run is a no-op with a console warning, not
// a throw; init happens in the root provider's mount effect, well before any of
// these can be triggered by a visitor.
//
// No property below carries visitor-entered text. `search_performed` is the one
// event with a visitor's own words behind it and it reports their length.

import type { Entry } from "@/data/entry"
import posthog from "posthog-js"

/** Where the visitor was: the grid of cards, or one Entry's detail body. */
export type Surface = "grid" | "detail"

/** Which of the two facets the catalogue filters on. `search` is not one. */
export type Facet = "category" | "author"

/**
 * The Entry facts a catalogue event carries. All four are public catalogue data
 * printed on the card itself — a contributor's name included — so none of this
 * is visitor data, which is the line the spec draws.
 */
export type EntryFacts = {
  entry_id: string
  caption: string
  category: string
  author: string
}

/**
 * Built from an Entry once, at the call site that has one. Components that never
 * see an Entry — the Demo tile, the playback owner — take the facts instead, so
 * the mapping from `id` to `entry_id` exists in exactly this function.
 */
export function entryFacts(entry: Entry): EntryFacts {
  return {
    entry_id: entry.id,
    caption: entry.caption,
    category: entry.category,
    author: entry.author,
  }
}

/** The two properties the save and vote events carry, and no others. */
const idAndCaption = ({ entry_id, caption }: EntryFacts) => ({
  entry_id,
  caption,
})

/**
 * A Demo started playing. Once per tile per page — a tile that scrolls out of
 * view and back holds its slot policy in components/playback-owner.tsx and would
 * otherwise bill a second play for the same recording on the same screen.
 */
export function demoPlayed(
  facts: EntryFacts,
  surface: Surface,
  trigger: "autoplay" | "click"
) {
  posthog.capture("demo_played", { ...facts, surface, trigger })
}

/**
 * A Demo actually advanced far enough to have been watched. `seconds` is the
 * playback accumulated when the threshold was crossed, not the threshold itself:
 * `lib/view-signal.ts` decides *whether*, and a constant echoed back would say
 * nothing that the event's own existence does not.
 */
export function demoWatched(
  facts: EntryFacts,
  surface: Surface,
  trigger: "autoplay" | "click",
  seconds: number
) {
  posthog.capture("demo_watched", { ...facts, surface, trigger, seconds })
}

/**
 * A Demo the browser refused to play. The Asset path rather than the Entry: this
 * event names specific bytes that are wrong (ADR-0003), and the same path can be
 * failing for a reason that has nothing to do with the Entry pointing at it.
 */
export function demoLoadFailed(assetPath: string, reason: string, url: string) {
  posthog.capture("demo_load_failed", { asset_path: assetPath, reason, url })
}

/**
 * The detail body opened. `card` is the grid pushing /entry/<id>; `url` is a cold
 * arrival at that address from a shared link or a cmd-clicked headline, which is
 * the same open with nobody on the page to have clicked it.
 */
export function entryOpened(facts: EntryFacts, source: "card" | "url") {
  posthog.capture("entry_opened", { ...facts, source })
}

/**
 * The outbound Source link was followed — what the site exists to produce, and
 * ticket 09's headline metric. No `category`: this event is about whose work was
 * opened, and the Category is already on `entry_opened` a step earlier.
 */
export function repoClicked(facts: EntryFacts, surface: Surface) {
  posthog.capture("repo_clicked", {
    entry_id: facts.entry_id,
    caption: facts.caption,
    author: facts.author,
    surface,
  })
}

/**
 * A facet was set. `active_filter_count` counts the facets in force *after* the
 * click, so 2 means the visitor has intersected a Category with an author — the
 * thing the sidebar only started supporting recently and nothing yet knows the
 * appetite for.
 */
export function filterApplied(
  facet: Facet,
  value: string,
  activeFilterCount: number
) {
  posthog.capture("filter_applied", {
    facet,
    value,
    active_filter_count: activeFilterCount,
  })
}

/** A facet was removed, by clicking the one already applied. */
export function filterCleared(facet: Facet, value: string) {
  posthog.capture("filter_cleared", { facet, value })
}

/**
 * A settled search. Length and count, never the term: a catalogue search is
 * often somebody typing their own name or their own repo to see whether it is
 * here, and "did this search return nothing" is answerable without reading it.
 */
export function searchPerformed(queryLength: number, resultCount: number) {
  posthog.capture("search_performed", {
    query_length: queryLength,
    result_count: resultCount,
  })
}

/** The sort control was used. Mirrors the `sort` query param verbatim. */
export function sortChanged(sort: "recent" | "top-viewed" | "top-voted") {
  posthog.capture("sort_changed", { sort })
}

export function bookmarkAdded(facts: EntryFacts) {
  posthog.capture("bookmark_added", idAndCaption(facts))
}

export function bookmarkRemoved(facts: EntryFacts) {
  posthog.capture("bookmark_removed", idAndCaption(facts))
}

/**
 * A vote was cast. Not fired when a vote is withdrawn: the ticket names one
 * event here where bookmarks get a pair, and firing the same name for both
 * directions would make the count of it mean nothing.
 */
export function voteCast(facts: EntryFacts) {
  posthog.capture("vote_cast", idAndCaption(facts))
}

/** Pagination advanced. `page` and `entries_shown` are both post-click. */
export function loadMoreClicked(page: number, entriesShown: number) {
  posthog.capture("load_more_clicked", { page, entries_shown: entriesShown })
}
