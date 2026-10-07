import { describe, expect, it, vi } from "vitest"

import {
  consumePendingSave,
  getGateRequest,
  peekPendingSave,
  PENDING_SAVE_KEY,
  PENDING_SAVE_TTL_MS,
  readMergeInput,
  requestSaveGate,
  requestSignIn,
  stashPendingSave,
  subscribeGateRequest,
  type PendingSave,
} from "../lib/pending-save"

// sign-in-to-save ticket 07, from ticket 04's decided behaviour.
//
// Pressing Save while signed out opens the provider sheet in place and saves
// the Demo on return. The intent has to survive a full OAuth round trip,
// which is the fiddly part — so what is pinned here is the lifetime, not the
// happy path alone: last press wins, consume clears on read, dismissal leaves
// the key in place but the TTL bounds it, and a stale intent never fires.
//
// Storage is injected (a Map-backed fake) and the clock is a number, so every
// case below runs in a node runner with no browser.

const FACTS = {
  recording_id: "01J9ZQ8N4P5R6S7T8U9V0ABCD",
  caption: "Radial FAB",
  category: "Buttons",
  contributor: "Hewad Mubariz",
}

function storage(contents: Record<string, string> = {}) {
  const map = new Map(Object.entries(contents))
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value)
    }),
    removeItem: (key: string) => {
      map.delete(key)
    },
    snapshot: () => new Map(map),
  }
}

const NOW = 1_700_000_000_000

function intent(overrides: Partial<PendingSave> = {}): PendingSave {
  return {
    recordingId: FACTS.recording_id,
    facts: { ...FACTS },
    at: NOW,
    ...overrides,
  }
}

describe("the pending-save intent", () => {
  it("round-trips through stash and consume", () => {
    const store = storage()
    stashPendingSave(
      { recordingId: FACTS.recording_id, facts: FACTS },
      store,
      NOW
    )
    expect(store.setItem).toHaveBeenCalledTimes(1)

    const pending = consumePendingSave(store, NOW)
    expect(pending?.recordingId).toBe(FACTS.recording_id)
    expect(pending?.facts).toEqual(FACTS)
  })

  it("clears on read, so a save fires exactly once", () => {
    const store = storage()
    stashPendingSave(
      { recordingId: FACTS.recording_id, facts: FACTS },
      store,
      NOW
    )
    expect(consumePendingSave(store, NOW)?.recordingId).toBe(
      FACTS.recording_id
    )
    expect(consumePendingSave(store, NOW)).toBeNull()
    expect(peekPendingSave(store, NOW)).toBeNull()
  })

  it("last press wins — at most one save is ever pending", () => {
    const store = storage()
    stashPendingSave({ recordingId: "AAAA", facts: FACTS }, store, NOW)
    stashPendingSave({ recordingId: "BBBB", facts: FACTS }, store, NOW + 1)
    expect(consumePendingSave(store, NOW + 1)?.recordingId).toBe("BBBB")
    expect(consumePendingSave(store, NOW + 1)).toBeNull()
  })

  it("dismissal leaves the key in place but unconsumed", () => {
    // Ticket 04: closing the sheet, or failing sign-in, is not an error. The
    // key stays — and the timestamp below is what stops it resurrecting on
    // some later unrelated sign-in.
    const store = storage()
    stashPendingSave(
      { recordingId: FACTS.recording_id, facts: FACTS },
      store,
      NOW
    )
    expect(peekPendingSave(store, NOW)?.recordingId).toBe(FACTS.recording_id)
    expect(store.snapshot().has(PENDING_SAVE_KEY)).toBe(true)
  })

  it("refuses a stale intent, which is what bounds a dismissal", () => {
    const store = storage()
    stashPendingSave(
      { recordingId: FACTS.recording_id, facts: FACTS },
      store,
      NOW
    )
    expect(peekPendingSave(store, NOW + PENDING_SAVE_TTL_MS)).not.toBeNull()
    expect(peekPendingSave(store, NOW + PENDING_SAVE_TTL_MS + 1)).toBeNull()
    expect(consumePendingSave(store, NOW + PENDING_SAVE_TTL_MS + 1)).toBeNull()
  })

  it("reads a malformed entry as absent, never as a crash", () => {
    for (const raw of [
      "not-json{",
      JSON.stringify({ recordingId: "", facts: FACTS, at: NOW }),
      JSON.stringify({ recordingId: "AAAA", at: NOW }),
      JSON.stringify({ recordingId: "AAAA", facts: FACTS }),
      JSON.stringify(["AAAA"]),
      JSON.stringify(null),
    ]) {
      const store = storage({ [PENDING_SAVE_KEY]: raw })
      expect(peekPendingSave(store, NOW), raw).toBeNull()
      expect(consumePendingSave(store, NOW), raw).toBeNull()
    }
  })

  it("is a no-op without storage, for SSR and the node runner", () => {
    stashPendingSave(
      { recordingId: FACTS.recording_id, facts: FACTS },
      null,
      NOW
    )
    expect(peekPendingSave(null, NOW)).toBeNull()
    expect(consumePendingSave(null, NOW)).toBeNull()
  })
})

describe("the merge input", () => {
  it("reads the stored key at its exact spelling", () => {
    // ADR-0008: renaming `"bookmarkedItems"` silently discards every bookmark
    // a visitor has already made. This reads the spelling, and nothing here
    // writes it.
    const store = storage({
      bookmarkedItems: JSON.stringify(["AAAA", "BBBB"]),
    })
    expect(readMergeInput(store)).toEqual(["AAAA", "BBBB"])
  })

  it("drops non-strings rather than uploading them to D1", () => {
    const store = storage({
      bookmarkedItems: JSON.stringify(["AAAA", 42, null, "BBBB"]),
    })
    expect(readMergeInput(store)).toEqual(["AAAA", "BBBB"])
  })

  it("reads absent and unreadable as empty, never as a throw", () => {
    expect(readMergeInput(storage())).toEqual([])
    expect(readMergeInput(storage({ bookmarkedItems: "  " }))).toEqual([])
    expect(readMergeInput(storage({ bookmarkedItems: "{" }))).toEqual([])
    expect(
      readMergeInput(storage({ bookmarkedItems: JSON.stringify(null) }))
    ).toEqual([])
    expect(readMergeInput(null)).toEqual([])
  })

  it("never writes — the key is merge input only", () => {
    // ADR-0013: the key survives so a browser's list can be merged once and is
    // never written to again. The module has no writer by construction; this
    // pins the read half making no write either.
    const store = storage({ bookmarkedItems: JSON.stringify(["AAAA"]) })
    readMergeInput(store)
    expect(store.setItem).not.toHaveBeenCalled()
  })
})

describe("the gate request bus", () => {
  it("a gated press stashes the intent and notifies the control", () => {
    const seen: number[] = []
    const stop = subscribeGateRequest(() => seen.push(getGateRequest().epoch))
    const before = getGateRequest().epoch

    requestSaveGate({ recordingId: "AAAA", facts: FACTS }, storage(), NOW)

    expect(getGateRequest().epoch).toBe(before + 1)
    expect(getGateRequest().recordingId).toBe("AAAA")
    // The modal names the Demo the press was on, from the bus — never by
    // re-reading storage during render, which would split server from client.
    expect(getGateRequest().caption).toBe(FACTS.caption)
    expect(seen).toEqual([before + 1])
    stop()
  })

  it("a bare sign-in request opens the sheet without stashing", () => {
    const store = storage()
    const before = getGateRequest().epoch
    requestSignIn()
    expect(getGateRequest().epoch).toBe(before + 1)
    expect(getGateRequest().recordingId).toBe("")
    expect(getGateRequest().caption).toBe("")
    expect(store.snapshot().has(PENDING_SAVE_KEY)).toBe(false)
  })

  it("accepts a well-formed entry the module itself stashed", () => {
    // The validator rejects entries without facts, because the resumed save
    // reports `bookmark_added` with them — stashing without them would defer
    // the failure to after sign-in, in front of the Reader.
    const store = storage()
    const pending = intent()
    stashPendingSave(pending, store, NOW)
    expect(peekPendingSave(store, NOW)).toEqual(pending)
  })
})
