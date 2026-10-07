// lib/reader-link.ts
//
// Joining one human's two accounts back together.
//
// sign-in-to-save ticket 08. Ticket 06 shipped two doors — GitHub and Google —
// and, when Firebase said an email already belonged to an account under the other
// provider, it showed a sentence pointing at the other button. That sentence was
// true and useless: there was no path behind it. This module is the path.
//
// THE DEFECT THIS EXISTS TO PREVENT
//
// With Firebase's "one account per email address" **off** — the default, and what
// rnui.dev shipped with — one human who signs in with Google on a laptop and
// GitHub on a phone gets **two uids and two saved-Demos lists**. Nothing in the
// system can tell them the lists are split, because from the database's side they
// are two unrelated people. To the Reader it is indistinguishable from a site that
// lost their saves, and that is a much worse bug than a feature that is missing.
//
// Turning the setting on fixes the *cause* and creates the *case*: Firebase then
// refuses the second sign-in rather than silently making a second account, and
// hands back the credential it was about to use. That refusal is this ticket's
// input, and it is only a good outcome if every branch of handling it lands
// somewhere a Reader can act on.
//
// WHY THIS FILE HAS NO FIREBASE IMPORT
//
// `linkWithCredential` and `signInWithRedirect` need a browser, so they live in
// `hooks/use-reader.ts`. What is here is the part where a mistake costs somebody
// their Demos: the merge semantics, what the Reader is told, and the pending
// credential's storage. All three are pure or take an injected storage, so all
// three are testable in a node runner — see `tests/reader-link.test.ts`.
//
// THREE THINGS HERE ARE LOAD-BEARING
//
//   1. The merge is a **union**, never last-write-wins and never
//      "prefer the account being signed into". Every alternative deletes Demos
//      the Reader can currently see. Signing in on a fresh device with an empty
//      account must not erase the phone's list; that single case is the one a
//      naive `a.concat(b)` or an overwrite gets catastrophically wrong.
//   2. The pending credential is **never dropped on a failure**. It is only
//      consumable by a call that must be handed `linked: true`, so the bug is
//      unrepresentable rather than merely discouraged. Losing it strands a Reader
//      with two accounts and no route between them.
//   3. A failed **merge** is not a failed **link**. The Reader is one person again
//      the moment `linkWithCredential` returns; if the D1 write then fails closed,
//      telling them anything other than "we'll try again" would be a lie about
//      their own data, and claiming success would be a lie about ours.

/** A credential Firebase handed back because the email already had an account. */
export type PendingLink = {
  /** The provider that produced it, e.g. `"github.com"`. */
  providerId: string
  /** Opaque to us. Firebase matches it against its own pending record. */
  pendingToken: string
  /** Present for OIDC providers, absent for Google. */
  nonce: string | null
  /**
   * The credential exactly as Firebase serialises it — `credential.toJSON()`.
   *
   * Opaque on purpose and never read here: this module stays Firebase-free so it
   * can be tested in a node runner. It has to be carried rather than rebuilt from
   * the three fields above, because Firebase's `OAuthCredential.fromJSON` routes
   * through `_fromParams`, which only sets `pendingToken` **inside** its
   * `if (idToken || accessToken)` branch. Reconstruct from `{ pendingToken }`
   * alone and it falls to the `else` and throws `auth/argument-error` — read out
   * of @firebase/auth 1.8.1's source rather than assumed. So the id or access
   * token rides along, and `hooks/use-reader.ts` is the only place that knows
   * what they are for.
   */
  credentialJson: Record<string, unknown>
}

/** The key. Namespaced so it cannot collide with anything else in sessionStorage. */
const PENDING_LINK_KEY = "rnui:pending-link"

/**
 * `sessionStorage`, or nothing.
 *
 * `sessionStorage` rather than `localStorage` because the lifetime must match the
 * flow: a redirect sign-in is a five-second round trip, and a credential that
 * outlived it would be a credential offered days later against a Reader who has
 * forgotten why they are being asked. `localStorage` survives tab close, which
 * means a half-finished link would still be sitting there tomorrow.
 *
 * Absent under a node runner and during SSR, where there is no session at all. A
 * null storage makes every operation a no-op rather than a throw, so the nav
 * renders signed-out on the server instead of crashing.
 */
function defaultStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    // Safari in private mode throws on access rather than returning null.
    return null
  }
}

/**
 * The pending credential's storage.
 *
 * `put` and `note` are the only ways in, and neither can lose what is already
 * stored. `consume` is the only way out, and it demands proof.
 */
export type PendingLinkCache = {
  /** Store a credential, replacing any earlier one. */
  put: (link: PendingLink) => void
  /** The stored credential, or null. Never throws. */
  peek: () => PendingLink | null
  /**
   * Take the stored credential, but only once the link has actually succeeded.
   *
   * The `linked: true` literal in the argument type is the whole point: it makes
   * "drop the credential when the link failed" a type error rather than a review
   * question. `tests/reader-link.test.ts` pins that it throws when lied to and that
   * the credential is still there afterwards.
   */
  consume: (proof: { linked: true }) => PendingLink | null
  /**
   * Record that an attempt did not succeed. Deliberately writes nothing to the
   * credential — it exists so a failure path reads as deliberate at the call site
   * rather than as an omission.
   */
  note: (outcome: "refused" | "cancelled" | "unverified", detail?: string) => void
}

/** Narrow a value read back out of storage into a `PendingLink`, or reject it. */
function isPendingLink(value: unknown): value is PendingLink {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.providerId === "string" &&
    candidate.providerId !== "" &&
    typeof candidate.pendingToken === "string" &&
    candidate.pendingToken !== "" &&
    (candidate.nonce === null || typeof candidate.nonce === "string") &&
    // The opaque blob is required, because without it the credential cannot be
    // rebuilt (see `PendingLink`). A cached entry lacking it is from a shape that
    // no longer exists, and would fail at link time with an error a Reader cannot
    // act on — so it is rejected here, where the answer is simply "start again".
    typeof candidate.credentialJson === "object" &&
    candidate.credentialJson !== null
  )
}

export function pendingLinkCache(storage?: Storage | null): PendingLinkCache {
  const store = storage === undefined ? defaultStorage() : storage

  return {
    put(link) {
      if (!store) return
      try {
        store.setItem(PENDING_LINK_KEY, JSON.stringify(link))
      } catch {
        // Quota, or a storage the browser refuses. The flow still works: without a
        // cache the Reader re-enters through the other door and we notice then.
      }
    },

    peek() {
      if (!store) return null
      try {
        const raw = store.getItem(PENDING_LINK_KEY)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        return isPendingLink(parsed) ? parsed : null
      } catch {
        // Malformed JSON, or storage that throws on read. Either way the honest
        // answer is "no credential", which is the same place as never having
        // started, and never a crash in the nav.
        return null
      }
    },

    consume(proof) {
      // The type makes `linked: true` a compile-time requirement; this runtime
      // guard is for the values that arrive from `as never` in a test or from a
      // future refactor that widens the type.
      if (proof?.linked !== true) {
        throw new Error(
          "refusing to discard a pending link without proof it succeeded — " +
            "a failed link must stay retryable"
        )
      }
      const link = this.peek()
      if (link && store) {
        try {
          store.removeItem(PENDING_LINK_KEY)
        } catch {
          // Nothing to do. The entry is scoped to this tab and dies with it.
        }
      }
      return link
    },

    note() {
      // Intentionally writes nothing. See the type's doc comment: the credential
      // outlives every failure, and this exists so that reads as a decision.
    },
  }
}

/**
 * The union of two saved-Demos lists.
 *
 * Order is stable and meaningful: the first list's order, then whatever the second
 * adds. A merge that reshuffles a Reader's list on every sign-in is one they notice
 * and stop trusting.
 */
export function unionRecordingIds(
  a: readonly string[],
  b: readonly string[]
): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const id of [...a, ...b]) {
    // A Recording id is a non-empty string. Anything else came from somewhere that
    // is not this function, and letting it through would put a key in D1 that no
    // Recording answers to.
    if (typeof id !== "string" || id === "" || seen.has(id)) continue
    seen.add(id)
    merged.push(id)
  }
  return merged
}

/**
 * Merge two saved-Demos lists as read from D1, tolerating whatever the row holds.
 *
 * Separate from `unionRecordingIds` on purpose: that one takes two well-typed lists
 * from code we wrote, and this one takes JSON that came off the network. A row
 * written by an older deploy, or by a bug, may hold a null or a number, and one
 * bad element must not cost the Reader the rest of their list.
 */
export function mergeSavedDemos(
  a: readonly unknown[] | null | undefined,
  b: readonly unknown[] | null | undefined
): string[] {
  return unionRecordingIds(
    (a ?? []).filter((v): v is string => typeof v === "string"),
    (b ?? []).filter((v): v is string => typeof v === "string")
  )
}

/** Where a Reader is in the joining flow. */
export type LinkPhase =
  /** No link in progress. The nav draws nothing. */
  | "signed-out"
  /** Firebase refused: this email already has an account under another door. */
  | "needs-other-door"
  /** The Reader came back through the other door; we are linking now. */
  | "linking"
  /** `linkWithCredential` returned. The Reader is one account again. */
  | "linked"
  /** Linked, but the D1 merge did not verify. Retry, and claim nothing. */
  | "merge-unconfirmed"
  /** The Reader backed out. Still signed in as whoever they came in as. */
  | "cancelled"

/** What the Reader is shown, and what they can press. */
export type LinkAction = {
  kind: "none" | "offer-other-door" | "offer-retry" | "working"
  /** Reader-facing words. Empty when `kind` is `"none"`. */
  copy: string
  /** The door to point at, when `kind` is `"offer-other-door"`. */
  providerId?: string
}

/** Firebase's provider ids, as they appear on a credential. */
const PROVIDER_NAMES: Record<string, string> = {
  "github.com": "GitHub",
  "google.com": "Google",
}

/**
 * The door this credential did **not** come through.
 *
 * Both providers ship (map decision 10), so this is always the other one — but it
 * is computed from the provider list rather than hard-coded as "the other", because
 * a Reader must never be told to press a button that is not there.
 */
function otherDoor(pending: PendingLink | null): string | null {
  if (!pending) return null
  return pending.providerId === "github.com" ? "google.com" : "github.com"
}

/**
 * Decide what the Reader sees and what they can do about it.
 *
 * Every phase returns something actionable except the two that mean there is
 * genuinely nothing to say. The one that matters is `merge-unconfirmed`: it must
 * not read as an error and must not read as success either, because the link did
 * succeed and only the D1 write did not verify.
 */
export function decideLinkAction(input: {
  phase: LinkPhase
  pending: PendingLink | null
  signedIn: boolean
}): LinkAction {
  const { phase, pending } = input

  switch (phase) {
    case "needs-other-door": {
      const door = otherDoor(pending)
      const name = door ? (PROVIDER_NAMES[door] ?? "the other provider") : "the other provider"
      return {
        kind: "offer-other-door",
        providerId: door ?? undefined,
        copy: `That address already has an account here. Sign in with ${name} to join them, and both lists become one.`,
      }
    }

    case "linking":
      return {
        kind: "working",
        copy: "Joining your two sign-ins into one account…",
      }

    case "linked":
      // Nothing to say. Drawing a confirmation here would be noise on a path the
      // Reader has already seen succeed.
      return { kind: "none", copy: "" }

    case "merge-unconfirmed":
      // The link landed; the D1 write did not verify. "Try again" is the truth.
      // Anything resembling "lost", "failed" or "error" would overstate a condition
      // that is a retry, and "done" would overstate a merge that has not happened.
      return {
        kind: "offer-retry",
        copy: "You're signed in on both now. We couldn't confirm your saved Demos yet — try again in a moment.",
      }

    case "cancelled":
      // Cancelling is not a dead end. Their existing account is untouched and
      // their credential is still cached, so the other door is still offered.
      return {
        kind: "offer-retry",
        copy: "No problem — your account is unchanged. Try again whenever you like.",
      }

    case "signed-out":
    default:
      return { kind: "none", copy: "" }
  }
}
