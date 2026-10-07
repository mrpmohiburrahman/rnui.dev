// components/sign-in-control.tsx
//
// The nav's sign-in control, in both its states.
//
// sign-in-to-save ticket 06, built from ticket 04's decided prototype
// (`/prototype/sign-in?variant=W`, components/prototype/sign-in-prototype.tsx):
// a **hybrid**, and the asymmetry is the point. Signed out, a person outline
// glyph and the word "Sign in" inside a chip matching the Saved and Star chips
// — an anonymous visitor has to be told what the control does. Signed in, the
// avatar circle alone, showing the Reader's initial, with no word at any width
// and no border — a signed-in Reader recognises their own initial and a chip
// sized for a word is wasted around it.
//
// Deliberately one component for both header layouts. The word hides below
// `lg`, exactly as the Saved chip's own word does, so the phone row — which
// only ever exists below `md` — draws the glyph alone and no second spelling
// can drift from this one. The two rows are separate layouts rather than one
// wrapping cluster: measured, this row holds to 768px and the phone row takes
// over below it, identically with or without this control.
//
// The wording below is ticket 04's decided copy, kept verbatim — including
// "Account menu", which is the menu widget's name rather than the person (who
// is a Reader, CONTEXT.md). A future edit that "fixes" it into something else
// diverges from the decision, not from a typo.
"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import Link from "next/link"
import * as Dialog from "@radix-ui/react-dialog"

import { getGateRequest, getGateServerSnapshot, subscribeGateRequest } from "@/lib/pending-save"
import {
  lastUsedProvider,
  READER_PROVIDERS,
  readerInitial,
  useReader,
  type ReaderProviderId,
} from "@/hooks/use-reader"
import { useSavedDemos } from "@/hooks/use-saved-demos"
import type { LinkAction, LinkPhase } from "@/lib/reader-link"

function PersonGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="8.2" r="3.5" />
      <path d="M5 20c.6-3.7 3.5-6 7-6s6.4 2.3 7 6" strokeLinecap="round" />
    </svg>
  )
}

/** lucide dropped brand icons, so these are inline SVG (as in the prototype). */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.2c-3.34.72-4.04-1.42-4.04-1.42-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3z" />
    </svg>
  )
}

const PROVIDER_META: Record<
  ReaderProviderId,
  { label: string; Mark: (p: { className?: string }) => React.ReactNode }
> = {
  github: { label: "Continue with GitHub", Mark: GitHubMark },
  google: { label: "Continue with Google", Mark: GoogleMark },
}

/** Which door a `LinkAction` points at, as our own provider union. */
const PROVIDER_IDS: Record<string, ReaderProviderId | undefined> = {
  "github.com": "github",
  "google.com": "google",
}

/** And back again, because `onJoin` is handed Firebase's id, not ours. */
const PROVIDER_IDS_TO_ID: Record<ReaderProviderId, string> = {
  github: "github.com",
  google: "google.com",
}

/**
 * The provider choice itself: join offer, both doors, retry copy, error, and
 * the way out. One body in two shells — the nav's anchored sheet and the
 * Save gate's centered modal — so the copy and the doors cannot drift between
 * them.
 */
function ProviderActions({
  authError,
  linkAction,
  lastUsed,
  signingIn,
  onPick,
  onJoin,
  onDismiss,
}: {
  authError: string | null
  linkAction: LinkAction
  /** The door that worked last time, or null. A hint, never a gate. */
  lastUsed: ReaderProviderId | null
  signingIn: ReaderProviderId | null
  onPick: (id: ReaderProviderId) => void
  onJoin: (providerId: string) => void
  onDismiss: () => void
}) {
  const joinId = linkAction.providerId
    ? PROVIDER_IDS[linkAction.providerId]
    : undefined
  const joinMeta = joinId ? PROVIDER_META[joinId] : null

  return (
    <>
      {/*
        Ticket 08. This block is the thing ticket 06's copy pointed at and could
        not reach: Firebase has refused to make a second account for one human
        and handed back the credential it was about to use. Until it renders
        here, `auth/account-exists-with-different-credential` was a sentence
        naming a button that did nothing — the exact dead end the ticket calls
        the one unacceptable outcome.

        It sits above the ordinary provider list because it is not an ordinary
        choice: the door below it would fail the same way it just did.
      */}
      {linkAction.kind === "offer-other-door" && joinId && joinMeta && (
        <div className="mb-[8px] rounded-[7px] border border-acc/40 bg-acc-soft/50 p-[9px]">
          <p className="text-[11.5px] leading-[1.45] text-t2">
            {linkAction.copy}
          </p>
          <button
            type="button"
            onClick={() => onJoin(PROVIDER_IDS_TO_ID[joinId])}
            disabled={signingIn !== null}
            className="mt-[8px] flex w-full items-center gap-[9px] rounded-[7px] border border-line bg-header px-[10px] py-[8px] text-[12.5px] text-t1 disabled:opacity-60"
          >
            <joinMeta.Mark className="size-[15px] shrink-0" />
            {signingIn === joinId ? "Waiting for the provider…" : joinMeta.label}
          </button>
        </div>
      )}

      {/* GitHub first: ticket 01's consent-screen finding (see READER_PROVIDERS). */}
      {linkAction.kind === "offer-other-door" ? (
        // While a join is pending the ordinary list is hidden rather than shown
        // disabled: pressing either door again fails identically, and a second
        // dead end is worse than an absent one.
        <div className="px-[6px] text-[11px] text-t3">
          Or start again from the top.
        </div>
      ) : (
        READER_PROVIDERS.map((id) => {
          const { label, Mark } = PROVIDER_META[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              disabled={signingIn !== null}
              className="mt-[6px] flex w-full items-center gap-[9px] rounded-[7px] border border-line px-[10px] py-[8px] text-[12.5px] text-t1 first:mt-0 hover:bg-field disabled:opacity-60"
            >
              <Mark className="size-[15px] shrink-0" />
              {signingIn === id ? "Waiting for the provider…" : label}
              {/* The familiar door, named but never forced: both doors stay
                  clickable, because hiding one is the dead end ticket 08
                  exists to prevent. */}
              {lastUsed === id && signingIn === null && (
                <span className="ml-auto shrink-0 font-mono text-[9px] tracking-[0.08em] text-t3">
                  LAST USED
                </span>
              )}
            </button>
          )
        })
      )}

      {linkAction.kind === "offer-retry" && (
        <p className="mt-[8px] px-[6px] text-[11.5px] leading-[1.45] text-t2">
          {linkAction.copy}
        </p>
      )}
      {authError && linkAction.kind !== "offer-retry" && (
        <div role="alert" className="px-[6px] pt-[8px] text-[11.5px] text-t2">
          {authError}
        </div>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-[8px] w-full rounded-[6px] py-[6px] text-[11.5px] text-t3 hover:text-t2"
      >
        Not now
      </button>
    </>
  )
}

/** The nav's anchored sheet: the same choice, hanging off the control. */
function ProviderSheet(props: {
  authError: string | null
  linkAction: LinkAction
  lastUsed: ReaderProviderId | null
  signingIn: ReaderProviderId | null
  onPick: (id: ReaderProviderId) => void
  onJoin: (providerId: string) => void
  onDismiss: () => void
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[248px] rounded-card border border-line bg-header p-[10px] shadow-2xl">
      <div className="px-[6px] pb-[8px] text-[11px] text-t3">
        Sign in to save Demos
      </div>
      <ProviderActions {...props} />
    </div>
  )
}

/**
 * The Save gate's centered modal. A Save press while signed out lands here,
 * not in the nav's dropdown: the press happened on a card in the middle of
 * the page, and answering it from the page's middle is what "in place" means.
 * Same choice as the sheet, one body, no drift — only the shell differs: a
 * scrim over the whole viewport and a centered panel carrying the press's
 * Demo by name, so the Reader sees what their sign-in is about to save.
 */
function GateModal({
  open,
  demoCaption,
  authError,
  linkAction,
  lastUsed,
  signingIn,
  onPick,
  onJoin,
  onDismiss,
}: {
  open: boolean
  /** The stashed press's caption, or null for a bare sign-in request. */
  demoCaption: string | null
  authError: string | null
  linkAction: LinkAction
  lastUsed: ReaderProviderId | null
  signingIn: ReaderProviderId | null
  onPick: (id: ReaderProviderId) => void
  onJoin: (providerId: string) => void
  onDismiss: () => void
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss()
      }}
    >
      <Dialog.Portal>
        {/* The scrim: the same canvas tint the Recording overlay dims with. */}
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-scrim backdrop-blur-[3px]" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            // Nowhere real to return to: the press was a Save button, and
            // focus lands back on the nav's sign-in control, which is where a
            // keyboard visitor reopens this from.
            e.preventDefault()
          }}
          className="fixed left-1/2 top-1/2 z-[71] w-[320px] max-w-[calc(100vw-48px)] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line2 bg-header p-[16px] shadow-2xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
        >
          <Dialog.Title className="m-0 px-[6px] text-[15px] font-medium tracking-[-0.01em] text-t1">
            Sign in to save Demos
          </Dialog.Title>
          <p className="m-0 px-[6px] pb-[10px] pt-[6px] text-[12.5px] leading-[1.5] text-t2">
            {demoCaption ? (
              <>
                “{demoCaption}” will be saved to your account once you sign
                in.
              </>
            ) : (
              <>Your saved Demos follow your account across devices.</>
            )}
          </p>
          <ProviderActions
            authError={authError}
            linkAction={linkAction}
            lastUsed={lastUsed}
            signingIn={signingIn}
            onPick={onPick}
            onJoin={onJoin}
            onDismiss={onDismiss}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * The Reader's face in the nav: the session provider's photo when there is
 * one, the initial-letter glyph otherwise. The photo is presentational —
 * never persisted, never matched on — and `referrerPolicy` keeps the page's
 * address out of the provider's logs. Same circle, same sizes, either way.
 *
 * A plain `img`, not `next/image`: provider URLs are third-party strings that
 * change per Reader, so remotePatterns would allowlist two whole avatar CDNs
 * and the optimizer would bill every avatar on every page. A 26px circle
 * needs no optimization.
 */
function ReaderAvatar({
  photoURL,
  displayName,
  email,
  sizeClass,
}: {
  photoURL: string | null
  displayName: string | null
  email: string | null
  sizeClass: string
}) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full object-cover ${sizeClass}`}
      />
    )
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-acc-soft font-mono font-semibold text-acc ${sizeClass} text-[10px]`}
      aria-hidden="true"
    >
      {readerInitial(displayName, email)}
    </span>
  )
}

function AccountPanel({
  displayName,
  email,
  photoURL,
  linkPhase,
  linkAction,
  onRetryMerge,
  onSignOut,
}: {
  displayName: string | null
  email: string | null
  photoURL: string | null
  linkPhase: LinkPhase
  linkAction: LinkAction
  onRetryMerge: () => void
  onSignOut: () => void
}) {
  const name = displayName ?? email ?? "Reader"
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[232px] rounded-card border border-line bg-header p-[10px] shadow-2xl">
      <div className="border-b border-line px-[6px] pb-[9px]">
        <div className="flex items-center gap-[8px]">
          <ReaderAvatar
            photoURL={photoURL}
            displayName={displayName}
            email={email}
            sizeClass="size-[30px]"
          />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-medium text-t1">
              {name}
            </div>
            {email && (
              <div className="truncate text-[11px] text-t3">{email}</div>
            )}
          </div>
        </div>
      </div>
      <Link
        href="/bookmarks"
        className="mt-[6px] block rounded-[6px] px-[6px] py-[7px] text-[12.5px] text-t2 hover:bg-field hover:text-t1"
      >
        Saved Demos
      </Link>
      {/*
        Ticket 07 publishes the phase ticket 08 declared: the link landed but
        the D1 merge did not verify. This is the only surface that can reach a
        signed-in Reader about it — the provider sheet only opens while signed
        out — so the retry lives here, in the copy ticket 08 wrote for it
        (`decideLinkAction`, single-sourced, not reworded). Shown only in this
        phase: a cancelled link is a different offer with its own door.
      */}
      {linkPhase === "merge-unconfirmed" && (
        <div className="mt-[6px] rounded-[6px] border border-acc/40 bg-acc-soft/50 p-[9px]">
          <p className="text-[11.5px] leading-[1.45] text-t2">
            {linkAction.copy}
          </p>
          <button
            type="button"
            onClick={onRetryMerge}
            className="mt-[8px] w-full rounded-[6px] border border-line bg-header px-[10px] py-[7px] text-[12.5px] text-t1"
          >
            Try again
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onSignOut}
        className="block w-full rounded-[6px] px-[6px] py-[7px] text-left text-[12.5px] text-t2 hover:bg-field hover:text-t1"
      >
        Sign out
      </button>
    </div>
  )
}

/**
 * The gate modal's owner. Mounted ONCE — in the root layout, beside the shell
 * rather than inside either header layout — because the header renders the
 * sign-in control twice (desktop bar, phone row) and two modals hide each
 * other with `aria-hidden`: each twin treats the other as background. One
 * owner also covers routes with no sign-in control at all (the standalone
 * Recording page), where a gated press would otherwise stash an intent nobody
 * ever answers. Owns its own flow state; the control keeps only its dropdown.
 */
export function SaveGateModal() {
  const { reader, authError, linkAction, beginSignIn, beginJoin } = useReader()
  const [signingIn, setSigningIn] = useState<ReaderProviderId | null>(null)
  const signedIn = reader !== null

  const gateRequest = useSyncExternalStore(
    subscribeGateRequest,
    getGateRequest,
    getGateServerSnapshot
  )
  const [seenGateEpoch, setSeenGateEpoch] = useState(0)
  const gateModalOpen = !signedIn && gateRequest.epoch > seenGateEpoch

  const dismissGate = useCallback(() => {
    setSeenGateEpoch(getGateRequest().epoch)
    setSigningIn(null)
  }, [])

  // One pair of hands, same as the control's: the sheet and the modal offer
  // the same doors and run the same flow.
  const handlePick = (id: ReaderProviderId) => {
    setSigningIn(id)
    void beginSignIn(id).finally(() => {
      setSigningIn((current) => (current === id ? null : current))
    })
  }
  const handleJoin = (providerId: string) => {
    const id = PROVIDER_IDS[providerId] ?? null
    if (id) setSigningIn(id)
    void beginJoin(providerId).finally(() => {
      setSigningIn((current) => (current === id ? null : current))
    })
  }

  return (
    <GateModal
      open={gateModalOpen}
      demoCaption={gateRequest.caption || null}
      authError={authError}
      linkAction={linkAction}
      // Read during render, not subscribed: any change that matters (a sign-in)
      // re-renders this host through `useReader` first, so the badge is fresh
      // whenever the modal can be open. SSR-safe — no window, no value.
      lastUsed={lastUsedProvider()}
      signingIn={signingIn}
      onPick={handlePick}
      onJoin={handleJoin}
      onDismiss={dismissGate}
    />
  )
}

export function SignInControl() {
  const {
    reader,
    authError,
    linkAction,
    linkPhase,
    beginSignIn,
    beginJoin,
    endSession,
    dismissError,
  } = useReader()
  const { retry: retryMerge } = useSavedDemos()
  const [manualOpen, setManualOpen] = useState(false)
  const [signingIn, setSigningIn] = useState<ReaderProviderId | null>(null)
  // Read during render, like `SaveGateModal`: a sign-in writes a new value and
  // re-renders this control through `useReader` in the same beat, so a
  // mount-time snapshot would show the previous door after a logout — exactly
  // the staleness a maintainer caught. SSR-safe: no window, no value.
  const lastUsed = lastUsedProvider()
  const rootRef = useRef<HTMLDivElement>(null)

  // Compared as a boolean for the sheet below: a popup sign-in completes
  // in-page, and the moment it does this component renders the account branch
  // instead — so there is no signed-out-to-signed-in transition to chase with
  // an effect, and an effect that closes on `reader` would close the account
  // panel on every render, since `reader` is a fresh literal each time.
  // `open` is the dropdown and nothing else now: the Save gate owns a modal
  // of its own (`SaveGateModal`, mounted once in the root layout), because
  // this control renders twice per page and two modals hide each other.
  const signedIn = reader !== null
  const open = manualOpen

  // Every close path — the chip, outside click, Escape, "Not now" — lands
  // here: the dropdown shuts. (The gate modal dismisses itself through
  // `SaveGateModal`; this control no longer answers gate requests at all.)
  const dismiss = useCallback(() => {
    setManualOpen(false)
    setSigningIn(null)
    dismissError()
  }, [dismissError])

  // Outside click and Escape close the dropdown. Closing clears
  // the error: a failure that reappears on every open is nagging, and the
  // retry is one click away.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        dismiss()
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss()
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, dismiss])

  if (reader) {
    const label = reader.displayName ?? reader.email ?? "Reader"
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          title={`Signed in as ${label}`}
          aria-label={`Signed in as ${label}. Account menu`}
          aria-expanded={open}
          className="flex items-center px-[2px] py-[2px]"
        >
          <ReaderAvatar
            photoURL={reader.photoURL}
            displayName={reader.displayName}
            email={reader.email}
            sizeClass="size-[26px]"
          />
        </button>
        {open && (
          <AccountPanel
            displayName={reader.displayName}
            email={reader.email}
            photoURL={reader.photoURL}
            linkPhase={linkPhase}
            linkAction={linkAction}
            onRetryMerge={() => {
              void retryMerge()
            }}
            onSignOut={() => {
              setManualOpen(false)
              void endSession()
            }}
          />
        )}
      </div>
    )
  }

  // One pair of hands for both shells: the sheet and the modal offer the same
  // doors and run the same flow, so their handlers live here rather than one
  // apiece.
  const handlePick = (id: ReaderProviderId) => {
    setSigningIn(id)
    void beginSignIn(id).finally(() => {
      // Success flips the branch (see above); reaching here with the
      // press still pending means it failed — already published as
      // `authError` — so re-arm.
      setSigningIn((current) => (current === id ? null : current))
    })
  }
  const handleJoin = (providerId: string) => {
    const id = PROVIDER_IDS[providerId] ?? null
    if (id) setSigningIn(id)
    void beginJoin(providerId).finally(() => {
      setSigningIn((current) => (current === id ? null : current))
    })
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setManualOpen((v) => !v)}
        title="Sign in to save Demos"
        aria-label="Sign in to save Demos"
        aria-expanded={open}
        className="flex items-center gap-[6px] rounded-chip border border-line bg-transparent px-[10px] py-[6px] text-[12.5px] text-t2 hover:border-t3 hover:text-t1"
      >
        <PersonGlyph className="size-[15px]" />
        <span className="hidden lg:inline">Sign in</span>
        <span className="sr-only lg:hidden">Sign in</span>
      </button>
      {open && !signedIn && (
        <ProviderSheet
          authError={authError}
          linkAction={linkAction}
          lastUsed={lastUsed}
          signingIn={signingIn}
          onPick={handlePick}
          onJoin={handleJoin}
          onDismiss={() => {
            dismiss()
          }}
        />
      )}
    </div>
  )
}
