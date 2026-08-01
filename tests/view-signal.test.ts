import { describe, expect, it } from "vitest"

import {
  countedThisSession,
  createPlayedWatcher,
  VIEW_THRESHOLD_SECONDS,
} from "@/lib/view-signal"

// ADR-0007 calls the two-second threshold and the once-per-Entry-per-session cap
// load-bearing: remove either and view_count is an impression count again. They
// live in one pure module so both can be pinned here, without a browser, a
// playback owner or Firestore in the way.

describe("createPlayedWatcher", () => {
  it("crosses only once the recording has actually advanced two seconds", () => {
    const played = createPlayedWatcher()

    // The first reading establishes a baseline and counts nothing. A Demo
    // handed to the watcher already at 1.9s has not been watched for 1.9s.
    expect(played(0)).toBe(false)
    expect(played(1.5)).toBe(false)
    expect(played(1.9)).toBe(false)
    expect(played(2.1)).toBe(true)
  })

  it("counts nothing while currentTime stands still", () => {
    const played = createPlayedWatcher()
    // A stalled, buffering or undecodable Demo fires timeupdate without moving.
    // A wall-clock timer would bill this; accumulated deltas do not.
    for (let tick = 0; tick < 20; tick++) expect(played(0.4)).toBe(false)
  })

  it("survives the loop wrap, which a raw subtraction would go negative on", () => {
    const played = createPlayedWatcher()
    played(0)
    expect(played(1.4)).toBe(false)

    // Demos loop, so currentTime drops back to ~0. The negative delta is
    // discarded rather than subtracted: the wrap costs one tick, not 1.2s.
    expect(played(0.2)).toBe(false)
    expect(played(0.5)).toBe(false)
    expect(played(0.9)).toBe(true)
  })

  it("holds the threshold at the exported constant", () => {
    expect(VIEW_THRESHOLD_SECONDS).toBe(2)

    const played = createPlayedWatcher()
    played(0)
    expect(played(VIEW_THRESHOLD_SECONDS - 0.01)).toBe(false)
    expect(played(VIEW_THRESHOLD_SECONDS)).toBe(true)
  })

  it("reports the seconds it accumulated, which demo_watched sends", () => {
    const played = createPlayedWatcher()
    expect(played.seconds()).toBe(0)

    played(0)
    played(1.4)
    // 1.4, then the wrap contributing nothing, then 0.7 — the same arithmetic
    // the threshold above crosses on, read out rather than compared. A wall
    // clock would say 2.3 here and demo_watched would report a Demo that
    // stalled as one that played.
    played(0.2)
    played(0.9)
    expect(played.seconds()).toBeCloseTo(2.1)
  })

  it("is one watcher per tile, with no shared total", () => {
    const first = createPlayedWatcher()
    const second = createPlayedWatcher()
    first(0)
    first(3)
    second(0)
    expect(second(1)).toBe(false)
  })
})

describe("countedThisSession", () => {
  it("refuses a second billing for the same Entry and allows a different one", () => {
    // Ids rather than a reset hook: the set is module state seeded from
    // sessionStorage, and a test-only reset export would be a second way in.
    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ01")).toBe(false)
    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ01")).toBe(true)
    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ01")).toBe(true)

    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ02")).toBe(false)
    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ02")).toBe(true)
  })

  it("still answers where there is no sessionStorage at all", () => {
    // This module is imported by the playback owner, and a throw on this path
    // would stop playback rather than lose a count. Node has no sessionStorage,
    // so this test is the case by running at all.
    expect(typeof globalThis.sessionStorage).toBe("undefined")
    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ03")).toBe(false)
  })
})
