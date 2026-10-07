// lib/pending-save.ts
//
// The save that is waiting for a sign-in.
//
// sign-in-to-save tickets 04 and 07. Ticket 04 decided the behaviour: pressing
// Save while signed out opens the provider sheet in place, and the Demo saves
// itself once the Reader is signed in — rather than losing the click. This module
// is the intent that makes that possible, and the reason it is one small helper
// rather than each ticket reaching for storage directly. Sign-in is a popup now,
// so the page never unloads; the intent design below is retained unchanged, and
// now survives trivially instead of critically.
//
// THE LIFETIME IS THE FLOW, NOT THE BROWSER
//
// `sessionStorage`, deliberately (ticket 04). A sign-in is a five-second
// round trip, and an intent that outlived it would re-save days later against
// a Reader who has forgotten why. `localStorage` survives tab close, which is
// exactly the wrong durability here.
//
// That choice answers map.md's open question about the closed tab, and the
// answer is the gap, not a fix: a Reader who closes the tab mid-flow loses the
// pending save, and nothing tells them. The mitigation ticket 04 accepted is
// the timestamp below — dismissal and failure leave the key in place but
// unconsumed, and the timestamp is what stops it resurrecting on some later
// unrelated sign-in. A `localStorage` intent with the same timestamp would
// survive the closed tab, but ticket 04 rejected that durability on purpose and
// this ticket does not re-decide it without the maintainer.
//
// THREE RULES, EACH WITH A TEST
//
//   1. The key names one Recording, so at most one save is pending: the last
//      press wins and the others are forgotten. A queue with its own semantics
//      for a five-second flow is how a later reader "fixes" this into a bug.
//   2. `consume` clears on read. A save that fired once must not fire again on
//      the next sign-in.
//   3. Freshness is checked at both ends. `put` stamps the time, `peek` and
//      `consume` refuse a stale intent, so a dismissal that leaves the key in
//      place (ticket 04: dismissal is not an error) still cannot save a Demo a
//      week later.
//
// The intent carries the Recording's facts, not just its id. The analytics
// events `bookmark_added` / `bookmark_removed` keep their exact names (ADR-0008)
// and fire only when a save actually happens — the press itself fires nothing,
// because an abandoned sign-in is not a save. On resume the facts are what the
// event reports, and they are public catalogue data printed on the card, so
// nothing visitor-owned crosses the popup.

import type { RecordingFacts } from "@/lib/analytics"

/** How long a stashed intent stays resumable. The flow takes seconds. */
export const PENDING_SAVE_TTL_MS = 30 * 60 * 1000

/** The key. Namespaced so it cannot collide with anything else in storage. */
export const PENDING_SAVE_KEY = "rnui:pending-save"

/** A save waiting for its Reader to come back through sign-in. */
export type PendingSave = {
  /** The Recording to save on return. */
  recordingId: string
  /** The facts `bookmark_added` reports with, stashed at press time. */
  facts: RecordingFacts
  /** `Date.now()` at stash time. Checked on every read. */
  at: number
}

function isPendingSave(value: unknown): value is PendingSave {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  const facts = candidate.facts as Record<string, unknown> | null
  return (
    typeof candidate.recordingId === "string" &&
    candidate.recordingId !== "" &&
    typeof candidate.at === "number" &&
    typeof facts === "object" &&
    facts !== null &&
    typeof facts.recording_id === "string" &&
    typeof facts.caption === "string" &&
    typeof facts.category === "string" &&
    typeof facts.contributor === "string"
  )
}

/** `sessionStorage`, or nothing under a node runner and during SSR. */
function defaultSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    // Safari in private mode throws on access rather than returning null.
    return null
  }
}

/** `localStorage`, or nothing. The merge input lives here, not in the session. */
function defaultLocalStorage(): Pick<Storage, "getItem"> | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function defaultStorage(): Storage | null {
  return defaultSessionStorage()
}

type IntentStore = Pick<Storage, "getItem" | "setItem" | "removeItem"> | null

/**
 * Read the stashed intent without taking it. Stale and malformed intents read
 * as absent — which is the same place as never having pressed Save, and never
 * a crash in the nav.
 */
export function peekPendingSave(
  storage: IntentStore = defaultStorage(),
  now: number = Date.now()
): PendingSave | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(PENDING_SAVE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isPendingSave(parsed)) return null
    if (now - parsed.at > PENDING_SAVE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Stash a Save press for after sign-in. Replaces any earlier intent —
 * last press wins, by ticket 04's decision, not by accident.
 */
export function stashPendingSave(
  intent: Omit<PendingSave, "at">,
  storage: IntentStore = defaultStorage(),
  now: number = Date.now()
): void {
  if (!storage) return
  try {
    const pending: PendingSave = { ...intent, at: now }
    storage.setItem(PENDING_SAVE_KEY, JSON.stringify(pending))
  } catch {
    // Quota, or a storage the browser refuses. The gate still opens the sheet;
    // the save itself just will not resume, which is the same place as a
    // dismissal.
  }
}

/**
 * Take the stashed intent, clearing it so it can never fire twice. Returns
 * null when there is nothing fresh — no intent, a malformed one, or one the
 * TTL has expired.
 */
export function consumePendingSave(
  storage: IntentStore = defaultStorage(),
  now: number = Date.now()
): PendingSave | null {
  const pending = peekPendingSave(storage, now)
  if (pending && storage) {
    try {
      storage.removeItem(PENDING_SAVE_KEY)
    } catch {
      // Nothing to do. The entry is scoped to this tab and dies with it.
    }
  }
  return pending
}

/**
 * The browser's saved Demos as merge input, read and never written.
 *
 * ADR-0013: the stored key `"bookmarkedItems"` survives so a browser's
 * existing list can be merged once, on first sign-in, and is never written to
 * again. This is the read half of that promise. Writing is simply absent —
 * there is no function here that writes it, so the rule is structural rather
 * than a comment asking nobody to write.
 */
export function readMergeInput(
  storage: Pick<Storage, "getItem"> | null = defaultLocalStorage()
): string[] {
  if (!storage) return []
  try {
    const raw = storage.getItem("bookmarkedItems")
    if (raw === null || raw.trim() === "") return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === "string")
  } catch {
    return []
  }
}

// The gate request bus.
//
// A Save press happens on a card or in the detail body; the provider sheet
// lives in the nav's sign-in control. The press cannot open the sheet by
// prop — they share no ancestor that owns both — so it publishes a request
// here and the control subscribes, the same module-snapshot shape as
// `hooks/use-reader.ts` and `hooks/use-remembered-set.ts`.

type GateRequest = {
  /** Bumped on every request; the control opens on change. */
  epoch: number
  /** The Recording the press was on. Empty for a bare "sign in" request. */
  recordingId: string
}

let gate: GateRequest = { epoch: 0, recordingId: "" }
const gateListeners = new Set<() => void>()

/** The server's answer: no request has ever been published during SSR. */
const INITIAL_GATE: GateRequest = { epoch: 0, recordingId: "" }

function publishGate(next: GateRequest) {
  gate = next
  gateListeners.forEach((onChange) => onChange())
}

export function getGateServerSnapshot(): GateRequest {
  return INITIAL_GATE
}

export function subscribeGateRequest(onChange: () => void): () => void {
  gateListeners.add(onChange)
  return () => {
    gateListeners.delete(onChange)
  }
}

export function getGateRequest(): GateRequest {
  return gate
}

/**
 * A Save press while signed out. Stashes the intent for the return trip, then
 * asks the nav control to open its provider sheet.
 */
export function requestSaveGate(
  intent: Omit<PendingSave, "at">,
  storage?: IntentStore,
  now?: number
): void {
  stashPendingSave(intent, storage, now)
  publishGate({ epoch: gate.epoch + 1, recordingId: intent.recordingId })
}

/**
 * A bare sign-in request with no Demo behind it — the empty panel's button.
 * Opens the same sheet, stashing nothing.
 */
export function requestSignIn(): void {
  publishGate({ epoch: gate.epoch + 1, recordingId: "" })
}
