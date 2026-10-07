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
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from "firebase/auth"

import { auth, githubProvider, googleProvider } from "@/lib/firebase"

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
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : ""
      publish({ ...snapshot, ready: true, authError: readerErrorMessage(code) })
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

  return {
    reader:
      state.displayName || state.email
        ? { displayName: state.displayName, email: state.email }
        : null,
    ready: state.ready,
    authError: state.authError,
    beginSignIn,
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
