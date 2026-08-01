import { describe, expect, it, vi } from "vitest"

import {
  createCounters,
  inMemoryCounterStore,
  type CounterStore,
} from "../lib/counters"

// None of this was testable before. The collection name and its fallback were
// written out separately in each of the four places that touched Firestore, and the
// only way to reach the rules was through a server action holding a live client.

const RECORDING = "01ARZ3NDEKTSV4RRFFQ69G5FAV"

describe("recordView", () => {
  it("adds one view and leaves the votes alone", async () => {
    const store = inMemoryCounterStore({
      [RECORDING]: { view_count: 40, vote_count: 7 },
    })
    await createCounters(store).recordView(RECORDING)

    expect(store.documents[RECORDING]).toEqual({
      view_count: 41,
      vote_count: 7,
    })
  })

  it("creates the document when the Recording has never been counted", async () => {
    const store = inMemoryCounterStore()
    await createCounters(store).recordView(RECORDING)

    expect(store.documents[RECORDING]).toEqual({ view_count: 1, vote_count: 0 })
  })

  it("never rejects, whatever the store does", async () => {
    const broken: CounterStore = {
      readAll: async () => ({}),
      addTo: async () => {
        throw new Error("permission-denied")
      },
      create: async () => {},
    }
    const reported = vi.spyOn(console, "error").mockImplementation(() => {})

    // The contract the call sites rely on: they fire this without waiting, so a
    // rejection here would be an unhandled promise on every view.
    await expect(
      createCounters(broken).recordView(RECORDING)
    ).resolves.toBeUndefined()
    expect(reported).toHaveBeenCalled()

    reported.mockRestore()
  })
})

describe("changeVote", () => {
  it("adds one vote when cast", async () => {
    const store = inMemoryCounterStore({
      [RECORDING]: { view_count: 40, vote_count: 7 },
    })
    await createCounters(store).changeVote(RECORDING, "cast")

    expect(store.documents[RECORDING]).toEqual({
      view_count: 40,
      vote_count: 8,
    })
  })

  it("takes one vote away when withdrawn", async () => {
    const store = inMemoryCounterStore({
      [RECORDING]: { view_count: 40, vote_count: 7 },
    })
    await createCounters(store).changeVote(RECORDING, "withdraw")

    expect(store.documents[RECORDING]).toEqual({
      view_count: 40,
      vote_count: 6,
    })
  })

  it("does not clamp a withdrawal at zero", async () => {
    // Documenting what the tree does rather than asserting what it should: the
    // stored count goes negative and only the card's display clamps. Clearing
    // browser storage and voting again is one way to reach it.
    const store = inMemoryCounterStore({
      [RECORDING]: { view_count: 1, vote_count: 0 },
    })
    await createCounters(store).changeVote(RECORDING, "withdraw")

    expect(store.documents[RECORDING]).toEqual({
      view_count: 1,
      vote_count: -1,
    })
  })

  it("creates the document a cast vote is missing, and invents no view with it", async () => {
    // Reachable since ADR-0007: a vote no longer records a view first, so this is
    // what a first-ever vote on a Recording nobody has watched writes. It used to
    // seed `view_count: 1` — a phantom view, on the one path that can now hit it.
    const store = inMemoryCounterStore()
    await createCounters(store).changeVote(RECORDING, "cast")

    expect(store.documents[RECORDING]).toEqual({ view_count: 0, vote_count: 1 })
  })

  it("creates an empty document a withdrawn vote is missing", async () => {
    const store = inMemoryCounterStore()
    await createCounters(store).changeVote(RECORDING, "withdraw")

    expect(store.documents[RECORDING]).toEqual({ view_count: 0, vote_count: 0 })
  })
})

describe("readCounts", () => {
  it("returns every counted Recording", async () => {
    const seed = {
      [RECORDING]: { view_count: 40, vote_count: 7 },
      "01BX5ZZKBKACTAV9WEVGEMMVRZ": { view_count: 2, vote_count: 0 },
    }
    await expect(
      createCounters(inMemoryCounterStore(seed)).readCounts()
    ).resolves.toEqual(seed)
  })

  it("returns an empty set when nothing has been counted", async () => {
    // What a fresh collection looks like. The catalogue merge has to survive it,
    // since every Recording then reads zero rather than undefined.
    await expect(
      createCounters(inMemoryCounterStore()).readCounts()
    ).resolves.toEqual({})
  })

  it("hands back a copy, so a caller cannot edit the stored counts", async () => {
    const store = inMemoryCounterStore({
      [RECORDING]: { view_count: 40, vote_count: 7 },
    })
    const counts = await createCounters(store).readCounts()
    counts[RECORDING].view_count = 9999

    expect(store.documents[RECORDING].view_count).toBe(40)
  })
})
