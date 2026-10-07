// lib/saved-demos-client.ts
//
// The browser's half of a Reader's saved Demos.
//
// sign-in-to-save ticket 07. `lib/saved-demos.ts` owns every SQL statement and
// the routes in `app/api/saved-demos/` own every call to it; this module owns
// every `fetch` the browser sends those routes. One fetch per concern, each a
// named function, so the read discipline is countable: a page showing 280
// Recordings issues one GET for the saved set, never 280 reads.
//
// Nothing here touches `"bookmarkedItems"`. That key is merge input only
// (lib/pending-save.ts `readMergeInput`) and is never written to again.

/** What `GET /api/saved-demos` answers. */
type SavedDemosList = { ids: string[] }

function isSavedDemosList(value: unknown): value is SavedDemosList {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { ids?: unknown }).ids) &&
    ((value as { ids: unknown[] }).ids as unknown[]).every(
      (id) => typeof id === "string"
    )
  )
}

function authed(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

async function readList(res: Response, what: string): Promise<string[]> {
  if (res.status === 401) {
    throw new Error("signed-out")
  }
  if (!res.ok) {
    throw new Error(`${what} failed: HTTP ${res.status}`)
  }
  const body: unknown = await res.json()
  if (!isSavedDemosList(body)) {
    throw new Error(`${what} answered without a saved list`)
  }
  return body.ids
}

/**
 * A Reader's saved Demos, newest last. One D1 row read, however many Demos.
 *
 * Throws `"signed-out"` (as the message, deliberately matchable) when the
 * token is missing or rejected, so the caller can fall back to the browser's
 * merge input rather than treating an auth failure as an empty list — an
 * empty list is what the merge must never mistake a failure for.
 */
export async function fetchSavedDemos(token: string): Promise<string[]> {
  const res = await fetch("/api/saved-demos", { headers: authed(token) })
  return readList(res, "Reading saved Demos")
}

/**
 * Save Recording ids to a Reader's account — one save, a resumed pending save,
 * or the first-sign-in merge, which are all the same call. Answers the merged
 * list, computed server-side from the read the write already did, so the
 * caller converges without a second GET.
 */
export async function persistSavedDemos(
  token: string,
  ids: readonly string[]
): Promise<string[]> {
  const res = await fetch("/api/saved-demos", {
    method: "POST",
    headers: { ...authed(token), "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [...ids] }),
  })
  return readList(res, "Saving")
}

/** Remove one Demo from a Reader's saved Demos. A no-op server-side when absent. */
export async function removeSavedDemo(
  token: string,
  recordingId: string
): Promise<void> {
  const res = await fetch("/api/saved-demos", {
    method: "DELETE",
    headers: { ...authed(token), "Content-Type": "application/json" },
    body: JSON.stringify({ recordingId }),
  })
  if (res.status === 401) {
    throw new Error("signed-out")
  }
  if (!res.ok) {
    throw new Error(`Removing a saved Demo failed: HTTP ${res.status}`)
  }
}

// One load per Reader per page load.
//
// Every `useSavedDemos` instance on the page — the header chip, the catalogue
// grid, the detail body — asks for the same list. Without this guard each
// instance's effect would fire its own GET, and the discipline above would be
// true per caller but false per page. The in-flight promise is shared too, so
// three mounts in the same tick still cost one request.

const inFlight = new Map<string, Promise<string[]>>()
const settled = new Map<string, string[]>()

/** Forget a Reader's loaded list, so the next load reads again. For retry. */
export function forgetSavedDemos(uid: string): void {
  inFlight.delete(uid)
  settled.delete(uid)
}

export function peekSavedDemos(uid: string): string[] | null {
  return settled.get(uid) ?? null
}

/**
 * The cached load: the settled list when there is one, the in-flight request
 * when there is one, otherwise exactly one `fetchSavedDemos`. A rejection
 * clears the in-flight entry so a later retry can try again.
 */
export function loadSavedDemos(uid: string, token: string): Promise<string[]> {
  const done = settled.get(uid)
  if (done) return Promise.resolve(done)
  const flying = inFlight.get(uid)
  if (flying) return flying
  const request = fetchSavedDemos(token).then(
    (ids) => {
      inFlight.delete(uid)
      settled.set(uid, ids)
      return ids
    },
    (error: unknown) => {
      inFlight.delete(uid)
      throw error
    }
  )
  inFlight.set(uid, request)
  return request
}

/** Replace the cached list after a confirmed write, so every instance converges. */
export function replaceSavedDemos(uid: string, ids: string[]): void {
  settled.set(uid, ids)
}
