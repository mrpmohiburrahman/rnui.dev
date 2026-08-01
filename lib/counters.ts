// lib/counters.ts
//
// The counters: recording a view of a Recording, casting or withdrawing a vote, and
// reading every Recording's counts back for the catalogue. Three functions over one
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

/** Every Recording's counts, keyed by Recording id. */
export type CountsByRecording = Record<string, Counts>

/**
 * The slice of a document store the counters need. Three operations and no query
 * language, deliberately: everything the rules do has to be expressible against a
 * plain object.
 */
export interface CounterStore {
  readAll(): Promise<CountsByRecording>

  /**
   * Add `by` to one field of one Recording's document. Resolves `false` — rather than
   * throwing — when there is no such document. That is what turns the
   * create-if-missing recovery into a single `if`, where it was written out
   * verbatim in all three writers.
   */
  addTo(recordingId: string, field: keyof Counts, by: number): Promise<boolean>

  create(recordingId: string, counts: Counts): Promise<void>
}

export type VoteChange = "cast" | "withdraw"

export function createCounters(store: CounterStore) {
  async function addOrCreate(
    recordingId: string,
    field: keyof Counts,
    by: number,
    whenMissing: Counts
  ): Promise<void> {
    if (!(await store.addTo(recordingId, field, by))) {
      await store.create(recordingId, whenMissing)
    }
  }

  return {
    /**
     * Never rejects, by contract. A view that failed to record is not something any
     * caller can act on, and every call site fires it without waiting — so there is
     * nothing left for a caller to handle rather than a handler at each one.
     */
    async recordView(recordingId: string): Promise<void> {
      try {
        await addOrCreate(recordingId, "view_count", 1, {
          view_count: 1,
          vote_count: 0,
        })
      } catch (error) {
        console.error("Error recording a view:", error)
      }
    },

    async changeVote(recordingId: string, change: VoteChange): Promise<void> {
      try {
        if (change === "cast") {
          // `view_count: 0`, and the zero is load-bearing. This payload used to
          // seed one view because a vote click recorded a view first, which made
          // it unreachable. ADR-0007 stops a vote counting as a view, so a
          // first-ever vote on a Recording nobody has watched now reaches here — and
          // a 1 would invent a view that never happened.
          await addOrCreate(recordingId, "vote_count", 1, {
            vote_count: 1,
            view_count: 0,
          })
        } else {
          await addOrCreate(recordingId, "vote_count", -1, {
            vote_count: 0,
            view_count: 0,
          })
        }
      } catch (error) {
        console.error("Error changing a vote:", error)
      }
    },

    readCounts(): Promise<CountsByRecording> {
      return store.readAll()
    },
  }
}

/**
 * A stand-in for the document store. `addTo` refuses an unknown Recording the way
 * Firestore's `updateDoc` does, because that refusal is the only reason the
 * create-if-missing recovery exists.
 *
 * `documents` is exposed so a test can read the state back without going through
 * `readAll`, and so it can assert on what a create actually wrote.
 */
export function inMemoryCounterStore(
  seed: CountsByRecording = {}
): CounterStore & { documents: CountsByRecording } {
  const documents: CountsByRecording = structuredClone(seed)

  return {
    documents,

    async readAll() {
      return structuredClone(documents)
    },

    async addTo(recordingId, field, by) {
      const existing = documents[recordingId]
      if (!existing) return false
      existing[field] += by
      return true
    },

    async create(recordingId, counts) {
      documents[recordingId] = { ...counts }
    },
  }
}
