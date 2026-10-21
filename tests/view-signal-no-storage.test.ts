import { afterEach, describe, expect, it, vi } from "vitest"

import { countedThisSession } from "@/lib/view-signal"

// A file of its own, not a case beside the other cap tests. `countedThisSession`
// seeds its module-level set on first call, so any test that runs after a sibling
// finds memory already populated and never reaches the storage read. Only a fresh
// module graph exercises the absent-storage path.
//
// `sessionStorage` is stubbed rather than assumed absent. Node 26 supplies the
// global, so `typeof globalThis.sessionStorage === "undefined"` was a fact about
// the runner, not about this module — it failed the day the Node version moved.

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("countedThisSession without storage", () => {
  it("counts in memory when sessionStorage cannot be read or written", () => {
    vi.stubGlobal("sessionStorage", undefined)

    // The first call reaches the read, which throws on an absent binding. The
    // contract is that the throw is swallowed: at worst this session bills a
    // Recording twice, where a rethrow would stop playback instead.
    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ03")).toBe(false)
    expect(countedThisSession("01ABCDEFGHJKMNPQRSTVWXYZ03")).toBe(true)
  })
})
