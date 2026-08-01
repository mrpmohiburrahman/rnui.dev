// lib/recording-search.ts
//
// The rule that decides whether a Recording answers a search term. A pure function of
// a Recording and a term, and not a line inside the server action that fetches Recordings,
// because the action reaches Firestore — nothing in the data suite could reach the
// rule where it used to live, so nothing checked it.
//
// What it used to be: a substring test against the caption and nothing else. A
// caption averages 2.31 words and never contains its own Category name, so fourteen
// of the eighteen Category names the search box offers as placeholder suggestions
// returned zero results when typed. `Misc` returned nothing against 148 Recordings.
//
// No search engine, no index, no dependency. Two independent measurements against
// this catalogue found embedding search scoring *below* untuned keyword search on it
// — the whole searchable corpus is under thirteen thousand characters and 69% of
// captions are one or two words, so there is nothing in them for a meaning-model to
// recover.

import type { Recording } from "@/data/recording"

// The three fields are joined before the substring test, so the separator has to be
// something no typed word can contain. A newline qualifies: terms are split on
// whitespace, so no word ever holds any. Joining with a space would let a single
// word match across a field boundary — a Recording captioned "…goes split" by a contributor
// "button Person" would answer to "splitbutton".
const FIELD_SEPARATOR = "\n"

function searchableText(recording: Recording): string {
  return [recording.caption, recording.contributor, recording.category]
    .join(FIELD_SEPARATOR)
    .toLowerCase()
}

/**
 * True when every word of `term` appears in the Recording's caption, contributor or Category.
 * Case-insensitive, and each word may come from a different one of the three.
 *
 * An empty or whitespace-only term matches every Recording, which is what makes the
 * unfiltered catalogue the same code path as a filtered one.
 */
export function matchesSearchTerm(recording: Recording, term: string): boolean {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true

  const text = searchableText(recording)
  return words.every((word) => text.includes(word))
}
