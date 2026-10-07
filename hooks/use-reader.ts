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
// The flow is redirect, not popup: `signInWithRedirect`, completed by
// `getRedirectResult` on the next load. Ticket 04's pending-save design and
// ticket 08's account-linking design both assume redirect mode (the Firebase
// docs specify `sessionStorage` for the pending credential in redirect mode),
// so the nav establishes that mode now rather than letting ticket 07 migrate a
// popup flow onto it.
"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import {
  getRedirectResult,
  linkWithCredential,
  OAuthCredential,
  OAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
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
 * lifetime is deliberately the length of the redirect and not longer.
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
    case "auth/network-request-failed":
      return "Sign-in could not reach Google. Check the connection and try again."
    default:
      return "Sign-in did not complete. Try again."
  }
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
 * Start the two Firebase listeners, once per page load.
 *
 * `getRedirectResult` is what completes a redirect sign-in: without it the
 * Reader leaves for Google or GitHub and comes back to a signed-out nav. Its
 * throw is also where `auth/account-exists-with-different-credential` surfaces
 * — ticket 08's whole ticket — so it is kept as message state rather than
 * swallowed: swallowing it would turn a Reader locked out of their saves into a
 * Reader silently signed out.
 */
function ensureSubscription(firebaseAuth: Auth) {
  if (subscribed) return
  subscribed = true

  onAuthStateChanged(firebaseAuth, (user) => {
    // A signed-in Reader proves the last failure is over, so it clears the
    // error. A signed-out answer does not — it also fires on first subscribe,
    // before `getRedirectResult` has answered, and clearing there would wipe
    // the redirect error that arrives after it.
    publish({
      ...snapshot,
      ready: true,
      ...fromUser(user),
      ...(user ? { authError: null } : {}),
    })

    // A signed-in Reader plus a cached credential means they have been through
    // the other door, which is the precondition for joining the two. Gated on
    // both so an ordinary page load does not attempt a link, and so a signed-out
    // answer never tries.
    if (user && linkCache.peek()) {
      void linkPendingTo(firebaseAuth, user)
    }
  })

  getRedirectResult(firebaseAuth)
    .then((result) => {
      // A completed redirect signs in, which `onAuthStateChanged` above
      // already publishes. Nothing further to do — except not to mistake "no
      // redirect happened" (the normal load) for a failure.
      if (result) {
        publish({ ...snapshot, ready: true, ...fromUser(result.user) })
      }
    })
    .catch((error: unknown) => {
      // Ticket 08. This rejection is the whole input to the join flow: Firebase
      // has refused to make a second account for one human, and handed back the
      // credential it was about to use. Cache it and offer the other door —
      // instead of the flat error ticket 06 shipped, which pointed at a button
      // with nothing behind it.
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
      // The code without a usable credential. Firebase told us an account exists
      // but gave us no way to reach it, which is the one case the other door
      // cannot fix — so it stays an error rather than becoming an offer.
      const message =
        code === "auth/account-exists-with-different-credential"
          ? "That address already has an account here, but we couldn't reach it. Try signing in again, or use the other provider."
          : readerErrorMessage(code)
      publish({ ...snapshot, ready: true, authError: message })
    })
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
   * `onAuthStateChanged` looks for, coming back through here triggers the link
   * without any further coordination.
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
      await signInWithRedirect(auth, provider)
    } catch {
      // Leaving for the provider is the success path; reaching here means the
      // redirect never started. The credential is untouched, so the offer stands.
      linkCache.note("cancelled")
      publish({
        ...snapshot,
        linkPhase: "cancelled",
        authError:
          "We couldn't reach the provider. Your account is unchanged — try again whenever you like.",
      })
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
      await signInWithRedirect(auth, providerFor(id))
      // No publish here: the browser is leaving for the provider, and the
      // answer arrives via `getRedirectResult` on return.
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : ""
      publish({ ...snapshot, authError: readerErrorMessage(code) })
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
