import { beforeEach, describe, expect, it } from "vitest"

import {
  decideLinkAction,
  mergeSavedDemos,
  pendingLinkCache,
  unionRecordingIds,
  type PendingLink,
} from "../lib/reader-link"

// sign-in-to-save ticket 08.
//
// Ticket 06 shipped two doors with a message pointing at the other one, and this
// ticket is what makes that message true instead of a dead end. The defect it
// exists to prevent: with Firebase's "one account per email address" off — the
// default, and what rnui.dev had until this ticket — one human who signs in with
// Google on a laptop and GitHub on a phone gets two uids and two saved-Demos
// lists. Nothing in the system can tell that person their saves are split; from
// where they stand the site lost their data.
//
// So the module below carries three things, and all three are pure or take an
// injected storage. Firebase's own calls — linkWithCredential, signInWithPopup
// — need a browser and are not here; what is here is the part where being wrong
// loses somebody their Demos.
//
//   1. `unionRecordingIds` — merge semantics. Union is the only option that loses
//      nothing, and it is the one the ticket names.
//   2. `decideLinkAction` — what the Reader is told and what they can do next.
//      Every branch lands somewhere; a dead end is the regression.
//   3. `pendingLinkCache` — the pending credential, in sessionStorage because
//      that is where Firebase's own docs put it.
//
// The invariant the whole ticket turns on is the third one: **the pending
// credential survives every failure.** It is only ever consumed by a call that
// has to be handed `linked: true`, so "drop it when the link fails" is not a bug
// someone can write, it is a call that does not typecheck.

/** The shape Firebase's `OAuthCredential.toJSON()` emits, trimmed to what the
 *  pure module asserts on. The id/access token is present because Firebase's
 *  `_fromParams` refuses a credential without one — see `PendingLink`. */
const GITHUB_PENDING: PendingLink = {
  providerId: "github.com",
  pendingToken: "gh-pending-token",
  nonce: "n-0S6_WzA2Mj",
  credentialJson: {
    providerId: "github.com",
    signInMethod: "github.com",
    accessToken: "gho_stub",
    pendingToken: "gh-pending-token",
    nonce: "n-0S6_WzA2Mj",
  },
}

const GOOGLE_PENDING: PendingLink = {
  providerId: "google.com",
  pendingToken: "goog-pending-token",
  nonce: null,
  credentialJson: {
    providerId: "google.com",
    signInMethod: "google.com",
    idToken: "stub-id-token",
    pendingToken: "goog-pending-token",
    nonce: null,
  },
}

/** A sessionStorage stand-in. Real enough for JSON round-trips, absent enough to
 *  prove nothing here depends on a browser being present. */
function fakeStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    get size() {
      return map.size
    },
  } as Storage & { size: number }
}

describe("merging two saved-Demos lists", () => {
  it("is a union, so neither account loses anything", () => {
    // The whole point. Last-write-wins or "prefer the account being signed into"
    // would each delete Demos the Reader can see; union deletes nothing.
    expect(unionRecordingIds(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"])
  })

  it("keeps one account's order and appends only what is new", () => {
    // Stable order matters: the list is what a Reader reads, and a merge that
    // reshuffles it on every sign-in is a merge they notice and distrust.
    expect(unionRecordingIds(["b", "a", "c"], ["z", "a"])).toEqual([
      "b",
      "a",
      "c",
      "z",
    ])
  })

  it("deduplicates within a single list, not just across two", () => {
    expect(unionRecordingIds(["a", "a", "b"], [])).toEqual(["a", "b"])
  })

  it("treats an empty account as no account, not as a wipe", () => {
    // The "one account empty and one not" case from the ticket. This is the one
    // a naive `a.concat(b)` or a last-write-wins merge gets catastrophically
    // wrong: signing in on a fresh device must not erase the phone's list.
    expect(unionRecordingIds([], ["a", "b"])).toEqual(["a", "b"])
    expect(unionRecordingIds(["a", "b"], [])).toEqual(["a", "b"])
    expect(unionRecordingIds([], [])).toEqual([])
  })

  it("ignores an id that is not a non-empty string", () => {
    // D1 rows are JSON the network produced. A null or a number in that array
    // must not become a Recording id, and must not delete the good ones.
    const merged = mergeSavedDemos(
      ["a", null as unknown as string, "b"],
      [undefined as unknown as string, "c"]
    )
    expect(merged).toEqual(["a", "b", "c"])
  })
})

describe("the pending credential cache", () => {
  let storage: ReturnType<typeof fakeStorage>

  beforeEach(() => {
    storage = fakeStorage()
  })

  it("round-trips a credential, because storage is the only thing that survives", () => {
    // A failed sign-in must not strand the credential in a variable that dies
    // with the attempt — the cache outlives it, in the tab, so the other door
    // stays offered. That is where Firebase's own docs put it.
    const cache = pendingLinkCache(storage)
    cache.put(GITHUB_PENDING)
    expect(cache.peek()).toEqual(GITHUB_PENDING)
  })

  it("reads back nothing when empty, rather than a broken credential", () => {
    expect(pendingLinkCache(storage).peek()).toBeNull()
  })

  it("survives a read that finds something malformed", () => {
    // A half-written or hand-edited entry must not crash the nav. The Reader is
    // simply told to start again, which is the same place as no credential.
    storage.setItem("rnui:pending-link", "{not json")
    expect(pendingLinkCache(storage).peek()).toBeNull()
  })

  it("cannot be consumed without proof the link succeeded", () => {
    // This is the invariant the ticket rests on, made structural. `consume` will
    // not compile unless it is handed `linked: true`, so the failure path that
    // drops a Reader's only route back to their other Demos cannot be written.
    const cache = pendingLinkCache(storage)
    cache.put(GITHUB_PENDING)

    expect(() => cache.consume({ linked: false } as never)).toThrow()
    expect(cache.peek()).toEqual(GITHUB_PENDING)

    expect(cache.consume({ linked: true })).toEqual(GITHUB_PENDING)
    expect(cache.peek()).toBeNull()
  })

  it("rejects an entry with no credential blob, rather than failing at link time", () => {
    // Firebase's `_fromParams` sets `pendingToken` only inside its
    // `if (idToken || accessToken)` branch, so a blob we cannot hand back to
    // `fromJSON` is a credential that cannot be linked. Better to read as "start
    // again" here than to throw `auth/argument-error` in front of a Reader.
    const withoutBlob = {
      providerId: GITHUB_PENDING.providerId,
      pendingToken: GITHUB_PENDING.pendingToken,
      nonce: GITHUB_PENDING.nonce,
    }
    storage.setItem("rnui:pending-link", JSON.stringify(withoutBlob))
    expect(pendingLinkCache(storage).peek()).toBeNull()
  })

  it("keeps the credential when the link is refused", () => {
    // A refusal is a retryable condition, not a reason to forget. Forgetting here
    // is precisely the silent data loss this ticket was written to stop.
    const cache = pendingLinkCache(storage)
    cache.put(GOOGLE_PENDING)
    cache.note("refused", "auth/credential-already-in-use")
    expect(cache.peek()).toEqual(GOOGLE_PENDING)
  })

  it("replaces rather than stacks, so a retry cannot strand an old credential", () => {
    const cache = pendingLinkCache(storage)
    cache.put(GITHUB_PENDING)
    cache.put(GOOGLE_PENDING)
    expect(cache.peek()).toEqual(GOOGLE_PENDING)
    expect(storage.size).toBe(1)
  })
})

describe("what the Reader is told", () => {
  it("offers the other door when the email already has an account", () => {
    // Ticket 06 shipped this copy as a message with nothing behind it. This is
    // the branch that makes it true: there is a button, and pressing it works.
    const action = decideLinkAction({
      phase: "needs-other-door",
      pending: GITHUB_PENDING,
      signedIn: false,
    })
    expect(action.kind).toBe("offer-other-door")
    expect(action.providerId).toBe("google.com")
  })

  it("names the door to use, never 'the other one'", () => {
    // The pending credential is the door they just tried, so the copy must name
    // the one they have not. Getting this backwards would send a Reader to the
    // button that is the reason they are being asked at all.
    const action = decideLinkAction({
      phase: "needs-other-door",
      pending: GITHUB_PENDING,
      signedIn: false,
    })
    expect(action.copy).toMatch(/Google/)
    expect(action.copy).not.toMatch(/GitHub/)
    expect(action.copy).not.toMatch(/other provider/i)
  })

  it("never calls the signed-in person a user or member", () => {
    // CONTEXT.md. Same rule as tests/sign-in-control.test.ts, kept here because
    // this is new copy and the glossary does not enforce itself.
    for (const phase of [
      "needs-other-door",
      "linking",
      "linked",
      "merge-unconfirmed",
      "signed-out",
    ] as const) {
      const action = decideLinkAction({
        phase,
        pending: GITHUB_PENDING,
        signedIn: phase !== "needs-other-door" && phase !== "signed-out",
      })
      expect(action.copy).not.toMatch(/\buser\b/i)
      expect(action.copy).not.toMatch(/\bmember\b/i)
    }
  })

  it("leaves a Reader who cancelled somewhere to go", () => {
    // Cancel is not a dead end. They are still signed in as the account they came
    // through; their Demos are intact; they can retry whenever they like.
    const action = decideLinkAction({
      phase: "cancelled",
      pending: GITHUB_PENDING,
      signedIn: true,
    })
    expect(action.kind).toBe("offer-retry")
    expect(action.copy).toMatch(/try again/i)
  })

  it("keeps the credential offered when a merge could not be confirmed", () => {
    // The JWKS-unreachable case from the ticket. The link itself succeeded — the
    // Reader is one person again — but the D1 write did not verify, so we must not
    // claim their Demos are merged. It is a retry, not a failure, and not a lie.
    const action = decideLinkAction({
      phase: "merge-unconfirmed",
      pending: GITHUB_PENDING,
      signedIn: true,
    })
    expect(action.kind).toBe("offer-retry")
    expect(action.copy).not.toMatch(/lost|deleted|error/i)
  })

  it("says nothing is wrong once the link has landed", () => {
    const action = decideLinkAction({
      phase: "linked",
      pending: null,
      signedIn: true,
    })
    expect(action.kind).toBe("none")
    expect(action.copy).toBe("")
  })

  it("stays silent for a Reader with no pending link at all", () => {
    const action = decideLinkAction({
      phase: "signed-out",
      pending: null,
      signedIn: false,
    })
    expect(action.kind).toBe("none")
    expect(action.copy).toBe("")
  })
})
