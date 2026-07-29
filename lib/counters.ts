// lib/counters.ts
//
// The counters: recording a view of an Entry, casting or withdrawing a vote, and
// reading every Entry's counts back for the catalogue. Three functions over one
// narrow store, so the rules can be exercised without credentials and without a
// network — see inMemoryCounterStore below and tests/counters.test.ts.
//
// The Firestore store, and with it the one declaration of the collection name,
// lives in lib/counters-firestore.ts. This module imports no Firebase, which is
// the whole reason a test can import it directly.

/**
 * The two stored fields, at their spellings inside live Firestore documents. Those
 * are records in a database rather than identifiers, so they keep the shape they
 * have — the boundary ADR-0004 draws.
 */
export type Counts = {
  view_count: number
  vote_count: number
}

/** Every Entry's counts, keyed by Entry id. */
export type CountsByEntry = Record<string, Counts>

/**
 * The slice of a document store the counters need. Three operations and no query
 * language, deliberately: everything the rules do has to be expressible against a
 * plain object.
 */
export interface CounterStore {
  readAll(): Promise<CountsByEntry>

  /**
   * Add `by` to one field of one Entry's document. Resolves `false` — rather than
   * throwing — when there is no such document. That is what turns the
   * create-if-missing recovery into a single `if`, where it was written out
   * verbatim in all three writers.
   */
  addTo(entryId: string, field: keyof Counts, by: number): Promise<boolean>

  create(entryId: string, counts: Counts): Promise<void>
}

export type VoteChange = "cast" | "withdraw"

export function createCounters(store: CounterStore) {
  async function addOrCreate(
    entryId: string,
    field: keyof Counts,
    by: number,
    whenMissing: Counts
  ): Promise<void> {
    if (!(await store.addTo(entryId, field, by))) {
      await store.create(entryId, whenMissing)
    }
  }

  return {
    /**
     * Never rejects, by contract. A view that failed to record is not something any
     * caller can act on, and every call site fires it without waiting — so there is
     * nothing left for a caller to handle rather than a handler at each one.
     */
    async recordView(entryId: string): Promise<void> {
      try {
        await addOrCreate(entryId, "view_count", 1, {
          view_count: 1,
          vote_count: 0,
        })
      } catch (error) {
        console.error("Error recording a view:", error)
      }
    },

    async changeVote(entryId: string, change: VoteChange): Promise<void> {
      try {
        if (change === "cast") {
          // `view_count: 1` is what the old increment wrote, kept rather than
          // corrected: a vote click records a view first, so by the time this runs
          // the document exists and this payload is all but unreachable.
          await addOrCreate(entryId, "vote_count", 1, {
            vote_count: 1,
            view_count: 1,
          })
        } else {
          await addOrCreate(entryId, "vote_count", -1, {
            vote_count: 0,
            view_count: 0,
          })
        }
      } catch (error) {
        console.error("Error changing a vote:", error)
      }
    },

    readCounts(): Promise<CountsByEntry> {
      return store.readAll()
    },
  }
}

export type Counters = ReturnType<typeof createCounters>

/**
 * A stand-in for the document store. `addTo` refuses an unknown Entry the way
 * Firestore's `updateDoc` does, because that refusal is the only reason the
 * create-if-missing recovery exists.
 *
 * `documents` is exposed so a test can read the state back without going through
 * `readAll`, and so it can assert on what a create actually wrote.
 */
export function inMemoryCounterStore(
  seed: CountsByEntry = {}
): CounterStore & { documents: CountsByEntry } {
  const documents: CountsByEntry = structuredClone(seed)

  return {
    documents,

    async readAll() {
      return structuredClone(documents)
    },

    async addTo(entryId, field, by) {
      const existing = documents[entryId]
      if (!existing) return false
      existing[field] += by
      return true
    },

    async create(entryId, counts) {
      documents[entryId] = { ...counts }
    },
  }
}
