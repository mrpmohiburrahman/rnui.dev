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

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import {
  READER_PROVIDERS,
  readerInitial,
  useReader,
  type ReaderProviderId,
} from "@/hooks/use-reader"

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

function ProviderSheet({
  authError,
  signingIn,
  onPick,
  onDismiss,
}: {
  authError: string | null
  signingIn: ReaderProviderId | null
  onPick: (id: ReaderProviderId) => void
  onDismiss: () => void
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[248px] rounded-card border border-line bg-header p-[10px] shadow-2xl">
      <div className="px-[6px] pb-[8px] text-[11px] text-t3">
        Sign in to save Demos
      </div>
      {/* GitHub first: ticket 01's consent-screen finding (see READER_PROVIDERS). */}
      {READER_PROVIDERS.map((id) => {
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
            {signingIn === id ? "Leaving for the provider…" : label}
          </button>
        )
      })}
      {authError && (
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
    </div>
  )
}

function AccountPanel({
  displayName,
  email,
  onSignOut,
}: {
  displayName: string | null
  email: string | null
  onSignOut: () => void
}) {
  const name = displayName ?? email ?? "Reader"
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[232px] rounded-card border border-line bg-header p-[10px] shadow-2xl">
      <div className="border-b border-line px-[6px] pb-[9px]">
        <div className="flex items-center gap-[8px]">
          <span
            className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-acc-soft font-mono text-[10px] font-semibold text-acc"
            aria-hidden="true"
          >
            {readerInitial(displayName, email)}
          </span>
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

export function SignInControl() {
  const { reader, authError, beginSignIn, endSession, dismissError } =
    useReader()
  const [open, setOpen] = useState(false)
  const [signingIn, setSigningIn] = useState<ReaderProviderId | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Outside click and Escape close whichever surface is open. Closing clears
  // the error: a failure that reappears on every open is nagging, and the
  // retry is one click away.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setSigningIn(null)
        dismissError()
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setSigningIn(null)
        dismissError()
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, dismissError])

  // Compared as a boolean for the sheet below: a redirect sign-in always
  // reloads the page, so there is no in-page transition from signed-out to
  // signed-in to chase with an effect — and an effect that closes on `reader`
  // would close the account panel on every render, since `reader` is a fresh
  // literal each time. `open && !signedIn` is the whole of the close-on-return
  // behaviour: on the fresh load after the redirect the sheet is simply gone.
  const signedIn = reader !== null

  if (reader) {
    const label = reader.displayName ?? reader.email ?? "Reader"
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={`Signed in as ${label}`}
          aria-label={`Signed in as ${label}. Account menu`}
          aria-expanded={open}
          className="flex items-center px-[2px] py-[2px]"
        >
          <span
            className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-acc-soft font-mono text-[10px] font-semibold text-acc"
            aria-hidden="true"
          >
            {readerInitial(reader.displayName, reader.email)}
          </span>
        </button>
        {open && (
          <AccountPanel
            displayName={reader.displayName}
            email={reader.email}
            onSignOut={() => {
              setOpen(false)
              void endSession()
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
          signingIn={signingIn}
          onPick={(id) => {
            setSigningIn(id)
            void beginSignIn(id).finally(() => {
              // A redirect leaves the page; reaching here means it did not
              // (an error, already published as `authError`), so re-arm.
              setSigningIn((current) => (current === id ? null : current))
            })
          }}
          onDismiss={() => {
            setOpen(false)
            dismissError()
          }}
        />
      )}
    </div>
  )
}
