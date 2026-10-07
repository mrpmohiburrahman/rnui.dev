// hooks/use-reader.ts
//
// Whether a Reader is signed in, and who they are as far as the nav needs.
//
// sign-in-to-save ticket 06. A Reader (CONTEXT.md) is a person who has signed
// in through a social provider so they can save Demos — never a `user`, never
// a `member`, never an `account`. The display name below is provider-owned and
// unstable: it is shown in the account panel and its first letter is shown on
// the avatar, and it is never matched on, never persisted, never a key.
//
// The state lives in the module and every instance subscribes — the same shape
// as `hooks/use-remembered-set.ts`, for the same reason: the desktop bar and
// the phone header are two components holding the same fact, and two copies of
// it is how the Saved chip drifted once already.
//
// The flow is popup, not redirect: `signInWithPopup`, completed in-page by
// `onAuthStateChanged`. Redirect was the original mode (tickets 04, 06, 08 all
// assumed it), and it is broken for every visitor whose browser blocks
// third-party storage — which is Chrome's default. The evidence, measured in a
// real browser rather than assumed: the full OAuth round trip completes, the
// handler stores `firebase:redirectEvent` in its own origin's sessionStorage,
// the app consumes its `firebase:pendingRedirect` flag — and then nothing.
// The `signInViaRedirect` event reaches the page only through the gapi iframe,
// which reads the handler's storage as a third party; blocked, it stays silent
// forever, `getRedirectResult` never settles, and there is no error to show.
// Popup keeps the whole exchange first-party (the popup tab posts the result
// straight back to its opener), so the class of failure is gone rather than
// handled. Ticket 04's pending-save intent and ticket 08's pending-credential
// cache keep their sessionStorage design unchanged — with no navigation the
// page never unloads, so both now survive trivially instead of critically.
"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import {
  linkWithCredential,
  OAuthCredential,
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth"

import { auth, githubProvider, googleProvider } from "@/lib/firebase"
import {
  decideLinkAction,
  pendingLinkCache,
  type LinkAction,
  type LinkPhase,
  type PendingLink,
} from "@/lib/reader-link"

/** Which social door the Reader walks through. Both ship (map decision 10). */
export type ReaderProviderId = "github" | "google"

/**
 * The order the provider sheet lists them in: GitHub first.
 *
 * Ticket 01 found the Google consent screen shows the Firebase project id, not
 * `rnui.dev`, and whether renaming the project's display name propagates is an
 * unconfirmed five-minute check (ticket 06 console work). GitHub has neither
 * problem — no verification and no project-id-shaped name — so it leads until
 * that check passes. Reordering this array is the whole of the fallback; it is
 * a UI ordering change, never a provider change.
 */
export const READER_PROVIDERS: readonly ReaderProviderId[] = [
  "github",
  "google",
]

/** What the nav shows. `null` display name means "signed out". */
export type ReaderSnapshot = {
  /** `false` until the browser has answered — every caller renders signed-out. */
  ready: boolean
  displayName: string | null
  email: string | null
  /** The last sign-in failure, in the Reader's words. Cleared on retry. */
  authError: string | null
  /**
   * Where a Reader is in the join-a-second-sign-in flow. Ticket 08.
   *
   * A separate field rather than a variant of `authError` because the two are not
   * the same kind of news: an error is something that went wrong, while
   * `needs-other-door` is Firebase working correctly — it refused to make a second
   * account for one human, which is the entire point of the setting ticket 08
   * turned on. Rendering it in the error voice would teach a Reader that the site
   * is broken at the moment it is behaving best.
   */
  linkPhase: LinkPhase
}

/**
 * The letter on the avatar circle. `displayName.charAt(0)` — ticket 04's
 * prototype rule, extended to the email for a Reader whose provider gave no
 * name. Provider-owned and display-only: never a key, never matched on, never
 * persisted (CONTEXT.md, ticket 03). `tests/sign-in-control.test.ts` pins it.
 */
export function readerInitial(
  displayName: string | null,
  email: string | null
): string {
  const source = displayName ?? email ?? ""
  return source.charAt(0)
}

const INITIAL: ReaderSnapshot = {
  ready: false,
  displayName: null,
  email: null,
  authError: null,
  linkPhase: "signed-out",
}

/**
 * The pending credential's cache. One instance for the module, mirroring the
 * snapshot above: both facts are shared by every `useReader` caller, and two
 * copies is how the Saved chip drifted once already.
 *
 * `sessionStorage`, and therefore per-tab — see `lib/reader-link.ts` for why the
 * lifetime is deliberately the length of the sign-in and not longer.
 */
const linkCache = pendingLinkCache()

/**
 * Pull a `PendingLink` out of a Firebase error, or null when it carries none.
 *
 * The credential comes off `OAuthProvider.credentialFromError(error)` rather than
 * off `error.credential` directly. Both work; the public static is better for two
 * reasons. It is the API Firebase documents for exactly this error, and it maps
 * `_tokenResponse`'s `oauthIdToken`/`oauthAccessToken` onto the credential's own
 * fields itself — so this file does not encode Firebase's internal error shape in
 * a hand-written cast that a minor version could invalidate. It returns null
 * rather than throwing when there is nothing usable.
 *
 * The serialised form is carried whole, because Firebase cannot rebuild a
 * credential from a bare pending token: `fromJSON` routes through `_fromParams`,
 * which sets `pendingToken` only inside its `if (idToken || accessToken)` branch,
 * so a `{ pendingToken, nonce }` object falls to the `else` and throws
 * `auth/argument-error`. See `PendingLink.credentialJson`.
 */
function pendingLinkFrom(error: unknown): PendingLink | null {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : ""
  if (code !== "auth/account-exists-with-different-credential") return null

  let credential: OAuthCredential | null = null
  try {
    credential = OAuthProvider.credentialFromError(error as Parameters<
      typeof OAuthProvider.credentialFromError
    >[0])
  } catch {
    // A malformed error object. Nothing to offer, and saying so beats offering a
    // button that cannot work.
    return null
  }
  if (!credential) return null

  const json = credential.toJSON() as Record<string, unknown>
  if (
    typeof json.providerId !== "string" ||
    typeof json.pendingToken !== "string"
  ) {
    return null
  }

  return {
    providerId: json.providerId,
    pendingToken: json.pendingToken,
    nonce: typeof json.nonce === "string" ? json.nonce : null,
    credentialJson: json,
  }
}

/**
 * Rebuild the credential a `PendingLink` stands for.
 *
 * `OAuthCredential.fromJSON` rather than `OAuthProvider.credential`: the latter is
 * not a static on the modular SDK's `OAuthProvider` (it fails to compile), and the
 * former is the public inverse of the `toJSON()` the error handed us.
 */
function credentialFrom(link: PendingLink): OAuthCredential | null {
  try {
    return OAuthCredential.fromJSON(link.credentialJson)
  } catch {
    return null
  }
}

let snapshot: ReaderSnapshot = INITIAL
const listeners = new Set<() => void>()

function publish(next: ReaderSnapshot) {
  snapshot = next
  listeners.forEach((onChange) => onChange())
}

/**
 * Ticket 07 publishes the phase ticket 08 declared but could not reach.
 *
 * A failed D1 merge is not a failed link: the Reader is one account again the
 * moment `linkWithCredential` returns. So this fires only in the post-link
 * window — while `linkPhase` is still `"linked"` — and a merge failure on an
 * ordinary sign-in leaves the phase alone (the save hook carries its own
 * retryable error there). `reportMergeConfirmed` walks it back when a later
 * merge verifies, which is what makes the account panel's retry converge
 * rather than stick.
 */
export function reportMergeUnconfirmed() {
  if (snapshot.linkPhase === "linked") {
    publish({ ...snapshot, linkPhase: "merge-unconfirmed" })
  }
}

export function reportMergeConfirmed() {
  if (snapshot.linkPhase === "merge-unconfirmed") {
    publish({ ...snapshot, linkPhase: "linked" })
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function getSnapshot(): ReaderSnapshot {
  return snapshot
}

/** Firebase's error codes, in the Reader's words. Codes are for logs, not UI. */
export function readerErrorMessage(code: string): string {
  switch (code) {
    case "auth/account-exists-with-different-credential":
      // Ticket 08 owns the linking path that resolves this. Until it lands,
      // the honest answer is that the other door holds their saves — which is
      // also the instruction that gets them back in today.
      return "That address already signed in with the other provider. Try the other sign-in button."
    case "auth/unauthorized-domain":
      return "This site is not on the sign-in allowlist yet. The maintainer is confirming the authorised domains."
    case "auth/popup-blocked":
    case "auth/cancelled-popup-request":
      return "The sign-in window was blocked. Allow popups for this site and try again."
    case "auth/popup-closed-by-user":
      // Closing the popup is a dismissal, not a failure. Handled by
      // `isSilentSignInDismissal` below rather than rendered as an error.
      return ""
    case "auth/network-request-failed":
      return "Sign-in could not reach Google. Check the connection and try again."
    default:
      return "Sign-in did not complete. Try again."
  }
}

/**
 * Whether a sign-in failure should stay silent. Closing the popup — or a
 * redirect-era leftover resolving to nothing — is the Reader changing their
 * mind, and an error toast for that is nagging. Everything else is said aloud
 * through `readerErrorMessage`.
 */
export function isSilentSignInDismissal(code: string): boolean {
  return code === "auth/popup-closed-by-user"
}

function providerFor(id: ReaderProviderId) {
  return id === "github" ? githubProvider : googleProvider
}

function fromUser(
  user: User | null
): Pick<ReaderSnapshot, "displayName" | "email"> {
  if (!user) return { displayName: null, email: null }
  return { displayName: user.displayName, email: user.email }
}

/**
 * Join the Reader's two accounts, once they have arrived through the other door.
 *
 * Called from `onAuthStateChanged` when a signed-in Reader and a cached pending
 * credential coincide — which is exactly the moment the Reader comes back from
 * the second provider. `linkWithCredential` then makes both doors one uid, and
 * their two saved-Demos lists become one Reader's to merge.
 *
 * The credential is consumed only on success, and `consume` will not compile
 * without `linked: true` — so the failure branch below cannot drop the only route
 * back to the Reader's other Demos.
 */
async function linkPendingTo(firebaseAuth: Auth, user: User) {
  const pending = linkCache.peek()
  if (!pending) return

  const credential = credentialFrom(pending)
  if (!credential) {
    // The cache's validator already guarantees a well-formed blob, so this is
    // "cannot link" rather than "try later". The credential stays put either way.
    linkCache.note("refused", "credential-unreadable")
    publish({
      ...snapshot,
      linkPhase: "cancelled",
      authError:
        "We couldn't finish joining the two sign-ins. Your account is unchanged — try again whenever you like.",
    })
    return
  }

  publish({ ...snapshot, linkPhase: "linking" })

  try {
    await linkWithCredential(user, credential)
    linkCache.consume({ linked: true })
    publish({ ...snapshot, linkPhase: "linked" })
  } catch (error: unknown) {
    // Every branch lands somewhere. The Reader stays signed in on the account they
    // came through, their Demos are untouched, and the credential survives so the
    // offer can be made again. This is the failure the ticket called the one
    // unacceptable outcome, and the reason it does not happen is that it is not a
    // state the code can reach with their credential discarded.
    linkCache.note("refused", (error as { code?: string } | null)?.code)
    publish({
      ...snapshot,
      linkPhase: "cancelled",
      authError:
        "We couldn't join the two sign-ins yet. Your account is unchanged — try again whenever you like.",
    })
  }
}

let subscribed = false

/**
 * Start the Firebase listener, once per page load.
 *
 * Popup sign-ins complete in-page: `onAuthStateChanged` below is the whole of
 * the return leg, for first sign-ins and second-door joins alike. Its throw
 * has nowhere to surface — Firebase reports popup failures by rejecting the
 * `signInWithPopup` promise, which `beginSignIn`/`beginJoin` catch into
 * `handleSignInFailure`, never here.
 */
function ensureSubscription(firebaseAuth: Auth) {
  if (subscribed) return
  subscribed = true

  onAuthStateChanged(firebaseAuth, (user) => {
    // A signed-in Reader proves the last failure is over, so it clears the
    // error.
    //
    // A signed-out answer also ends any link accounting: ticket 07's
    // `reportMergeUnconfirmed` fires only while the phase is `"linked"`, and
    // without this reset a link from a previous session would still be the
    // phase on the next sign-in, mislabelling an ordinary merge failure as a
    // post-link one. The cached credential is untouched — this resets what the
    // Reader is told, not their route back.
    publish({
      ...snapshot,
      ready: true,
      ...fromUser(user),
      ...(user ? { authError: null } : { linkPhase: "signed-out" as const }),
    })

    // A signed-in Reader plus a cached credential means they have been through
    // the other door, which is the precondition for joining the two. Gated on
    // both so an ordinary page load does not attempt a link, and so a signed-out
    // answer never tries.
    if (user && linkCache.peek()) {
      void linkPendingTo(firebaseAuth, user)
    }
  })
}

/**
 * What a failed sign-in means, published once. Ticket 08's whole input lives
 * here: Firebase has refused to make a second account for one human, and
 * handed back the credential it was about to use. Cache it and offer the
 * other door — instead of the flat error ticket 06 shipped, which pointed at
 * a button with nothing behind it. A silent dismissal publishes nothing at
 * all: the Reader changed their mind, and an error toast for that is nagging.
 */
function handleSignInFailure(error: unknown) {
  const pending = pendingLinkFrom(error)
  if (pending) {
    linkCache.put(pending)
    publish({
      ...snapshot,
      ready: true,
      authError: null,
      linkPhase: "needs-other-door",
    })
    return
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : ""
  if (isSilentSignInDismissal(code)) {
    publish({ ...snapshot, authError: null })
    return
  }
  // The code without a usable credential. Firebase told us an account exists
  // but gave us no way to reach it, which is the one case the other door
  // cannot fix — so it stays an error rather than becoming an offer.
  const message =
    code === "auth/account-exists-with-different-credential"
      ? "That address already has an account here, but we couldn't reach it. Try signing in again, or use the other provider."
      : readerErrorMessage(code)
  publish({ ...snapshot, ready: true, authError: message })
}

/**
 * The Reader, for the nav. Renders signed-out until the browser answers, so
 * the served HTML and the first client pass agree and hydration cannot
 * mismatch — the same contract `useRememberedSet` keeps with its `null`.
 */
export function useReader() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!auth) {
      // No API key in this environment (lib/firebase.js): sign-in is
      // unavailable, and the nav stays honestly signed-out rather than
      // crashing. The sheet says so when opened.
      publish({ ...snapshot, ready: true })
      return
    }
    ensureSubscription(auth)
  }, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, () => INITIAL)

  /**
   * Sign in through the door a pending credential did *not* come from.
   *
   * This is the second half of ticket 08's flow. Firebase refused the first door,
   * we cached the credential, the Reader presses the button this returns — and
   * because a signed-in Reader plus a cached credential is exactly what
   * `onAuthStateChanged` looks for, signing in through here triggers the link
   * without any further coordination. Same page throughout: the popup posts
   * its result straight back, so there is no return trip to coordinate.
   *
   * Takes a provider *id* rather than a `ReaderProviderId`, because the id comes
   * off a credential Firebase wrote (`"google.com"`), not off our own union.
   */
  const beginJoin = useCallback(async (providerId: string) => {
    publish({ ...snapshot, authError: null, linkPhase: "needs-other-door" })
    if (!auth) {
      publish({
        ...snapshot,
        authError: "Sign-in is not configured in this build yet.",
      })
      return
    }
    const provider =
      providerId === "google.com" ? googleProvider : githubProvider
    try {
      const result = await signInWithPopup(auth, provider)
      // `onAuthStateChanged` publishes this too; saying it here as well answers
      // the press at once instead of a tick later.
      publish({ ...snapshot, ready: true, ...fromUser(result.user) })
    } catch (error: unknown) {
      // The popup is the whole trip: reaching here means it never completed.
      // A dismissal stays silent; anything else goes through the shared
      // failure path, which keeps the cached credential retryable.
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : ""
      if (isSilentSignInDismissal(code)) {
        publish({ ...snapshot, authError: null })
        return
      }
      linkCache.note("cancelled")
      handleSignInFailure(error)
    }
  }, [])

  const beginSignIn = useCallback(async (id: ReaderProviderId) => {
    publish({ ...snapshot, authError: null })
    if (!auth) {
      publish({
        ...snapshot,
        authError: "Sign-in is not configured in this build yet.",
      })
      return
    }
    try {
      const result = await signInWithPopup(auth, providerFor(id))
      // `onAuthStateChanged` publishes this too; saying it here as well answers
      // the press at once instead of a tick later.
      publish({ ...snapshot, ready: true, ...fromUser(result.user) })
    } catch (error: unknown) {
      handleSignInFailure(error)
    }
  }, [])

  const endSession = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
  }, [])

  const dismissError = useCallback(() => {
    publish({ ...snapshot, authError: null })
  }, [])

  // Ticket 08. `decideLinkAction` is pure and lives in lib/reader-link.ts, so
  // every string a Reader can read about joining their two sign-ins is testable
  // without a browser. This hook's job is only to supply the three inputs.
  const linkAction: LinkAction = decideLinkAction({
    phase: state.linkPhase,
    pending: linkCache.peek(),
    signedIn: state.displayName !== null || state.email !== null,
  })

  return {
    reader:
      state.displayName || state.email
        ? { displayName: state.displayName, email: state.email }
        : null,
    ready: state.ready,
    authError: state.authError,
    linkAction,
    /** Ticket 07: the account panel offers a merge retry only in this phase. */
    linkPhase: state.linkPhase,
    beginSignIn,
    beginJoin,
    endSession,
    dismissError,
  }
}

/**
 * A current Reader's ID token, for the authenticated routes ticket 07 builds.
 * `null` when nobody is signed in — which the caller treats as unauthenticated,
 * never as anonymous (lib/firebase-token.ts: no anonymous fallback).
 */
export async function getReaderToken(): Promise<string | null> {
  const current = auth?.currentUser ?? null
  if (!current) return null
  return current.getIdToken()
}
