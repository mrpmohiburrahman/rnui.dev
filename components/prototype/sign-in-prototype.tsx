// components/prototype/sign-in-prototype.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/sign-in-to-save/`.
// Two questions at once, switchable at /prototype/sign-in?variant=A|B|C|D:
//
//   1. What is the sign-in control in the nav, signed-out and signed-in?
//   2. What happens when Save is pressed while signed out?
//
// Sub-shape B rather than A, for the same reason components/prototype/
// star-control-prototype.tsx says it is: the thing being prototyped is the
// header, and the header is rendered by app/layout.tsx, which a server component
// cannot read `?variant=` from. Gating the root layout would put a prototype
// param on every route of the site.
//
// The header shell below is a copy of components/site-header.tsx:87-204 — the real
// flex structure, the real CatalogueSearch, the real ModeToggle, the real
// useRememberedSet Saved count. Only the sign-in control varies. If the real header
// changes, this drifts, and that drift is the prototype going quietly wrong.
//
// NO FIREBASE HERE. Sign-in state is an in-memory boolean so both sides of the
// toggle can be seen without a console, an OAuth round trip, or a project. Every
// button is a no-op onClick.
"use client"

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { BOOKMARKS_KEY, useRememberedSet } from "@/hooks/use-remembered-set"
import { ModeToggle } from "@/app/providers"

import { CatalogueSearch } from "@/components/catalogue-search"

/** Stand-ins. Ticket 04 is about shape, not copy. */
const READER_NAME = "Rafiq"
const READER_EMAIL = "rafiq@fastmail.com"
const SAVED = 7

type Variant = {
  key: string
  name: string
  idea: string
  /** The nav control. `signedIn` is fake state so both sides are reachable. */
  Nav: (p: { signedIn: boolean; onSignIn: () => void; onSignOut: () => void }) => React.ReactNode
}

/* ------------------------------------------------------------------ *
 * Brand marks. lucide dropped brand icons, so these are inline SVG.    *
 * ------------------------------------------------------------------ */

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.2c-3.34.72-4.04-1.42-4.04-1.42-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3z" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Shared shells.                                                        *
 * ------------------------------------------------------------------ */

function Chip({
  className,
  onClick,
  children,
  srLabel,
  title,
}: {
  className?: string
  onClick?: () => void
  children: React.ReactNode
  srLabel?: string
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={srLabel}
      className={cn(
        "flex items-center gap-[6px] rounded-chip border px-[10px] py-[6px] text-[12.5px]",
        className
      )}
    >
      {children}
    </button>
  )
}

function Avatar({ size = 22 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-acc-soft font-mono text-[10px] font-semibold text-acc"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {READER_NAME.charAt(0)}
    </span>
  )
}

/**
 * The account panel, shared by A and B because "what happens when you click the
 * avatar" is not the variable — only *how you get to it* is.
 */
function AccountPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[232px] rounded-card border border-line bg-header p-[10px] shadow-2xl">
      <div className="border-b border-line px-[6px] pb-[9px]">
        <div className="flex items-center gap-[8px]">
          <Avatar size={30} />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-medium text-t1">{READER_NAME}</div>
            <div className="truncate text-[11px] text-t3">{READER_EMAIL}</div>
          </div>
        </div>
      </div>
      <Link href="/bookmarks" className="mt-[6px] block rounded-[6px] px-[6px] py-[7px] text-[12.5px] text-t2 hover:bg-field hover:text-t1">
        Saved Demos <span className="font-mono text-[10px] text-t3">{SAVED}</span>
      </Link>
      <button
        type="button"
        onClick={onClose}
        className="block w-full rounded-[6px] px-[6px] py-[7px] text-left text-[12.5px] text-t2 hover:bg-field hover:text-t1"
      >
        Sign out
      </button>
    </div>
  )
}

function ProviderSheet({
  onPick,
  onDismiss,
  heading,
}: {
  onPick: (p: string) => void
  onDismiss: () => void
  heading: string
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[248px] rounded-card border border-line bg-header p-[10px] shadow-2xl">
      <div className="px-[6px] pb-[8px] text-[11px] text-t3">{heading}</div>
      <button
        type="button"
        onClick={() => onPick("Google")}
        className="flex w-full items-center gap-[9px] rounded-[7px] border border-line px-[10px] py-[8px] text-[12.5px] text-t1 hover:bg-field"
      >
        <GoogleMark className="size-[15px] shrink-0" />
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => onPick("GitHub")}
        className="mt-[6px] flex w-full items-center gap-[9px] rounded-[7px] border border-line px-[10px] py-[8px] text-[12.5px] text-t1 hover:bg-field"
      >
        <GitHubMark className="size-[15px] shrink-0" />
        Continue with GitHub
      </button>
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

/* ------------------------------------------------------------------ *
 * A — quiet chip. A fourth chip in the row, same treatment as the     *
 *     other two. Least surprising, least loud.                         *
 * ------------------------------------------------------------------ */

function VariantA({ signedIn, onSignIn, onSignOut }: { signedIn: boolean; onSignIn: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  if (signedIn) {
    return (
      <div className="relative">
        <Chip
          className="border-line bg-transparent px-[6px]"
          onClick={() => setOpen((v) => !v)}
          srLabel={`Signed in as ${READER_NAME}. Account menu`}
        >
          <Avatar />
          <span className="hidden xl:inline">{READER_NAME}</span>
        </Chip>
        {open && <AccountPanel onClose={() => { setOpen(false); onSignOut() }} />}
      </div>
    )
  }
  return (
    <Chip
      className="border-line bg-transparent text-t2 hover:text-t1"
      onClick={onSignIn}
      srLabel="Sign in to save Demos"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-[14px]">
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.8 20c.6-3.7 3.6-6 7.2-6s6.6 2.3 7.2 6" strokeLinecap="round" />
      </svg>
      <span className="hidden lg:inline">Sign in</span>
      <span className="sr-only lg:hidden">Sign in</span>
    </Chip>
  )
}

/* ------------------------------------------------------------------ *
 * B — branded. Signed-out goes straight to Google in one click.       *
 *     Fastest path on earth, and it silently picks a provider for     *
 *     the Reader.                                                      *
 * ------------------------------------------------------------------ */

function VariantB({ signedIn, onSignIn, onSignOut }: { signedIn: boolean; onSignIn: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  if (signedIn) {
    return (
      <div className="relative">
        <Chip className="border-line bg-transparent px-[6px]" onClick={() => setOpen((v) => !v)} srLabel={`Signed in as ${READER_NAME}. Account menu`}>
          <Avatar />
          <span className="hidden xl:inline">{READER_NAME}</span>
        </Chip>
        {open && <AccountPanel onClose={() => { setOpen(false); onSignOut() }} />}
      </div>
    )
  }
  return (
    <Chip
      className="border-line bg-transparent text-t1 hover:border-t3"
      onClick={onSignIn}
      srLabel="Sign in with Google to save Demos"
      title="Signs you in with Google. GitHub is available from the Saved button."
    >
      <GoogleMark className="size-[14px] shrink-0" />
      <span className="hidden xl:inline">Google</span>
      <span className="sr-only xl:hidden">Sign in with Google</span>
    </Chip>
  )
}

/* ------------------------------------------------------------------ *
 * C — glyph only. A circle, no word at any width.                     *
 * ------------------------------------------------------------------ */

function VariantC({ signedIn, onSignIn, onSignOut }: { signedIn: boolean; onSignIn: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  if (signedIn) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Signed in as ${READER_NAME}. Account menu`}
          className="flex min-h-[38px] items-center px-[4px]"
        >
          <Avatar size={26} />
        </button>
        {open && <AccountPanel onClose={() => { setOpen(false); onSignOut() }} />}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onSignIn}
      title="Sign in to save Demos"
      aria-label="Sign in to save Demos"
      className="flex min-h-[38px] items-center px-[4px] text-t2 hover:text-t1"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="size-[19px]">
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.8 20c.6-3.7 3.6-6 7.2-6s6.6 2.3 7.2 6" strokeLinecap="round" />
      </svg>
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * D — quiet chip that opens a provider sheet. Keeps the nav weight   *
 *     at A's level while leaving the provider choice to the Reader.   *
 * ------------------------------------------------------------------ */

function VariantD({ signedIn, onSignIn, onSignOut }: { signedIn: boolean; onSignIn: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  if (signedIn) {
    return (
      <div className="relative">
        <Chip className="border-line bg-transparent px-[6px]" onClick={() => setOpen((v) => !v)} srLabel={`Signed in as ${READER_NAME}. Account menu`}>
          <Avatar />
          <span className="hidden xl:inline">{READER_NAME}</span>
        </Chip>
        {open && <AccountPanel onClose={() => { setOpen(false); onSignOut() }} />}
      </div>
    )
  }
  return (
    <div className="relative">
      <Chip
        className="border-line bg-transparent text-t2 hover:text-t1"
        onClick={() => setOpen((v) => !v)}
        srLabel="Sign in to save Demos"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-[14px]">
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.8 20c.6-3.7 3.6-6 7.2-6s6.6 2.3 7.2 6" strokeLinecap="round" />
        </svg>
        <span className="hidden lg:inline">Sign in</span>
        <span className="sr-only lg:hidden">Sign in</span>
      </Chip>
      {open && (
        <ProviderSheet
          heading="Sign in to save Demos"
          onDismiss={() => setOpen(false)}
          onPick={() => { setOpen(false); onSignIn() }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * W — THE WINNER. A's signed-out chip, C's signed-in glyph.           *
 *                                                                     *
 * Signed out: a person outline and the word "Sign in", inside a chip  *
 * that matches Saved and Star. Signed in: the avatar circle alone, no *
 * word at any width, no border.                                        *
 *                                                                     *
 * The two halves come from different variants on purpose, and the     *
 * asymmetry is the point. Anonymous visitors need to be told what the  *
 * control does; a signed-in Reader recognises their own initial and   *
 * needs no label, and a chip sized for a word is wasted around it.    *
 * ------------------------------------------------------------------ */

function VariantW({ signedIn, onSignIn, onSignOut }: { signedIn: boolean; onSignIn: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  if (signedIn) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={`Signed in as ${READER_NAME}`}
          aria-label={`Signed in as ${READER_NAME}. Account menu`}
          className="flex items-center px-[2px] py-[2px]"
        >
          <Avatar size={26} />
        </button>
        {open && <AccountPanel onClose={() => { setOpen(false); onSignOut() }} />}
      </div>
    )
  }
  return (
    <Chip
      className="border-line bg-transparent text-t2 hover:border-t3 hover:text-t1"
      onClick={onSignIn}
      srLabel="Sign in to save Demos"
      title="Sign in to save Demos"
    >
      <PersonGlyph className="size-[15px]" />
      <span className="hidden lg:inline">Sign in</span>
      <span className="sr-only lg:hidden">Sign in</span>
    </Chip>
  )
}

function PersonGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className={className}>
      <circle cx="12" cy="8.2" r="3.5" />
      <path d="M5 20c.6-3.7 3.5-6 7-6s6.4 2.3 7 6" strokeLinecap="round" />
    </svg>
  )
}

const VARIANTS: Variant[] = [
  { key: "W", name: "★ Winner: chip out, glyph in", idea: "Signed out, a chip with a person glyph and the word “Sign in”. Signed in, just the avatar circle — no word, no border.", Nav: VariantW },
  { key: "A", name: "Quiet chip", idea: "A fourth chip, same treatment as Saved and Star. Signed out it is a word; signed in it collapses to an avatar.", Nav: VariantA },
  { key: "B", name: "Branded, one click", idea: "Signed out it goes straight to Google — one click, no sheet. The cost is that it picks a provider for the Reader.", Nav: VariantB },
  { key: "C", name: "Glyph only", idea: "A person icon at every width, no word. The quietest option and the hardest to recognise as sign-in.", Nav: VariantC },
  { key: "D", name: "Chip that opens a sheet", idea: "Same nav weight as A, but the provider choice is the Reader's. Both doors stay reachable from one control.", Nav: VariantD },
]

/* ------------------------------------------------------------------ *
 * Question 2 — pressing Save while signed out.                        *
 * ------------------------------------------------------------------ */

type Gate = {
  key: string
  name: string
  idea: string
  cost: string
  Render: (p: { onSignedIn: () => void }) => React.ReactNode
}

/** G1 — sheet in place, then the Demo saves itself. Best UX, real complexity. */
function GateSheet({ onSignedIn }: { onSignedIn: () => void }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-[6px] rounded-chip border border-line px-[10px] py-[6px] text-[12.5px] text-t2 hover:text-t1"
      >
        <span aria-hidden="true">◇</span> Save
      </button>
      {saved && (
        <span className="rounded-chip border border-acc bg-acc-soft px-[10px] py-[6px] text-[12.5px] text-t1">
          <span aria-hidden="true">◆</span> Saved — signed in as {READER_NAME}
        </span>
      )}
      {open && (
        <ProviderSheet
          heading="Sign in to save this Demo"
          onDismiss={() => setOpen(false)}
          onPick={() => { setOpen(false); setSaved(true); onSignedIn() }}
        />
      )}
      {!open && !saved && (
        <span className="font-mono text-[10.5px] text-t3">
          press Save → sheet → sign in → <span className="text-acc">saves itself</span>
        </span>
      )}
    </div>
  )
}

/** G2 — inline nudge. No sheet, no redirect, sign-in happens elsewhere. */
function GateNudge({ onSignedIn }: { onSignedIn: () => void }) {
  const [nudged, setNudged] = useState(false)
  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <button
        type="button"
        onClick={() => { setNudged(true); onSignedIn() }}
        className="flex items-center gap-[6px] rounded-chip border border-line px-[10px] py-[6px] text-[12.5px] text-t2 hover:text-t1"
      >
        <span aria-hidden="true">◇</span> Save
      </button>
      {nudged && (
        <span className="rounded-chip border border-line bg-field px-[10px] py-[6px] text-[12.5px] text-t2">
          Sign in to save
        </span>
      )}
      <span className="font-mono text-[10.5px] text-t3">
        press Save → <span className="text-t2">nothing saves</span>, the nav control is the only way in
      </span>
    </div>
  )
}

/** G3 — bounce the nav. Cheapest possible, and quietly hostile. */
function GateBounce({ onSignedIn }: { onSignedIn: () => void }) {
  const [n, setN] = useState(0)
  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <button
        type="button"
        onClick={() => { setN((v) => v + 1); onSignedIn() }}
        className="flex items-center gap-[6px] rounded-chip border border-line px-[10px] py-[6px] text-[12.5px] text-t2 hover:text-t1"
      >
        <span aria-hidden="true">◇</span> Save
      </button>
      <span className="font-mono text-[10.5px] text-t3">
        press Save → {n === 0 ? "nothing visible happens except ↓" : `the nav pulsed ${n}×`}
      </span>
    </div>
  )
}

const GATES: Gate[] = [
  { key: "1", name: "Sheet, then resume the save", idea: "The Demo saves itself once you are back. Nobody re-clicks anything.", cost: "The pending-save intent has to survive a full OAuth redirect — sessionStorage or a query param. That is the real complexity, and it is what makes this option expensive.", Render: GateSheet },
  { key: "2", name: "Inline nudge", idea: "The button tells you why nothing happened and points at the nav. No redirect, no lost click.", cost: "The Demo is not saved, so the Reader must come back and press Save again after signing in. Cheapest to build, most likely to be given up on.", Render: GateNudge },
  { key: "3", name: "Pulse the nav control", idea: "Save does nothing but draw the eye to the nav control.", cost: "Least code and the worst experience — the button appears broken and nobody is told why. Included as the floor to beat.", Render: GateBounce },
]

/* ------------------------------------------------------------------ *
 * The shell — a copy of components/site-header.tsx.                    *
 * ------------------------------------------------------------------ */

function HeaderShell({
  variant,
  signedIn,
  setSignedIn,
}: {
  variant: Variant
  signedIn: boolean
  setSignedIn: (v: boolean) => void
}) {
  const searchParams = useSearchParams()
  const { ids: bookmarks } = useRememberedSet(BOOKMARKS_KEY)
  const savedCount = bookmarks?.length ?? 0
  const pathname = typeof window === "undefined" ? "/" : window.location.pathname
  const onBookmarks = pathname === "/bookmarks"

  const centerRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState("measuring…")

  useLayoutEffect(() => {
    const measure = () => {
      const center = centerRef.current
      const right = rightRef.current
      if (!center || !right || center.offsetParent === null) {
        setMetrics("phone layout — the desktop row is not rendered")
        return
      }
      const c = center.getBoundingClientRect()
      const delta = Math.round(Math.abs(c.left + c.width / 2 - window.innerWidth / 2))
      const overflow = right.scrollWidth - right.clientWidth
      setMetrics(
        `search off centre by ${delta}px · right column overflow ${overflow}px${overflow > 0 ? "  ← WRAPPING" : ""}`
      )
    }
    measure()
    window.addEventListener("resize", measure)
    const t = setInterval(measure, 900)
    return () => {
      window.removeEventListener("resize", measure)
      clearInterval(t)
    }
  }, [variant.key, signedIn])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-header backdrop-blur-[10px]">
      <div className="hidden h-[62px] items-center px-[26px] md:flex md:gap-[18px]">
        <div className="flex flex-1">
          <Link href="/" className="flex items-baseline gap-[9px]">
            <span className="text-[16px] font-bold tracking-[-0.02em] text-t1">
              rnui<span className="text-acc">.dev</span>
            </span>
          </Link>
        </div>

        <div ref={centerRef} className="w-[424px] flex-shrink-0">
          <CatalogueSearch recordingCount={277} searchParams={searchParams} />
        </div>

        <div ref={rightRef} className="flex flex-1 items-center justify-end gap-[10px]">
          <Link
            href="/bookmarks"
            aria-label={`Saved ${savedCount}`}
            className={cn(
              "flex items-center gap-[6px] rounded-chip border px-[10px] py-[6px] text-[12.5px]",
              onBookmarks ? "border-acc bg-acc-soft text-t1" : "border-line bg-transparent text-t2"
            )}
          >
            <span aria-hidden="true">
              <span>◆</span> <span className="hidden lg:inline">Saved</span>
            </span>
            <span aria-hidden="true" className="font-mono text-[10px] text-t3 tabular-nums">
              {savedCount}
            </span>
          </Link>

          <span className="flex items-center gap-[6px] rounded-chip border border-line px-[10px] py-[6px] text-[12.5px] text-t2">
            <span aria-hidden="true">★</span>
            <span className="font-mono text-[10px] text-t3 tabular-nums">350</span>
          </span>

          <variant.Nav
            signedIn={signedIn}
            onSignIn={() => setSignedIn(true)}
            onSignOut={() => setSignedIn(false)}
          />

          <ModeToggle />
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-[10px] px-[14px] pb-[8px] pt-[12px]">
          <Link href="/" className="text-[15px] font-bold tracking-[-0.02em] text-t1">
            rnui<span className="text-acc">.dev</span>
          </Link>
          <span className="ml-auto flex items-center gap-[6px] rounded-chip border border-line bg-field px-[11px] text-[12px] text-t2">
            <span aria-hidden="true">◆</span> {savedCount}
          </span>
          <variant.Nav
            signedIn={signedIn}
            onSignIn={() => setSignedIn(true)}
            onSignOut={() => setSignedIn(false)}
          />
          <ModeToggle compact />
        </div>
        <div className="flex items-center gap-[8px] px-[14px] pb-[10px]">
          <CatalogueSearch recordingCount={277} searchParams={searchParams} />
        </div>
      </div>

      <div className="border-t border-line bg-field px-[26px] py-[3px] font-mono text-[10px] text-t3">
        PROTOTYPE · nav {variant.key} {variant.name} · {signedIn ? `SIGNED IN as ${READER_NAME}` : "signed out"} · {metrics}
      </div>
    </header>
  )
}

function GateStrip({ signedIn, setSignedIn }: { signedIn: boolean; setSignedIn: (v: boolean) => void }) {
  const [gateKey, setGateKey] = useState("1")
  const gate = GATES.find((g) => g.key === gateKey) ?? GATES[0]
  return (
    <div className="border-b border-line bg-field/60 px-[26px] py-[12px]">
      <div className="flex flex-wrap items-center gap-[8px]">
        <span className="font-mono text-[10px] uppercase tracking-wide text-t3">
          Save while signed out
        </span>
        {GATES.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGateKey(g.key)}
            className={cn(
              "rounded-full border px-[10px] py-[3px] font-mono text-[10.5px]",
              g.key === gateKey
                ? "border-acc bg-acc-soft text-acc"
                : "border-line text-t3 hover:text-t2"
            )}
          >
            {g.key} · {g.name}
          </button>
        ))}
      </div>
      <div className="mt-[9px]">
        {signedIn ? (
          <span className="rounded-chip border border-acc bg-acc-soft px-[10px] py-[6px] text-[12.5px] text-t1">
            Signed in — the gate never appears. Unsign-in above to see it.
          </span>
        ) : (
          <gate.Render onSignedIn={() => setSignedIn(true)} />
        )}
      </div>
      <div className="mt-[7px] max-w-[760px] text-[11px] leading-[1.5] text-t3">
        <span className="text-t2">{gate.idea}</span> {gate.cost}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Switcher                                                              *
 * ------------------------------------------------------------------ */

function Switcher({ variants, current }: { variants: Variant[]; current: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const go = (delta: number) => {
    const next = variants[(current + delta + variants.length) % variants.length]
    const params = new URLSearchParams(searchParams.toString())
    params.set("variant", next.key)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const t = e.target as HTMLElement | null
      if (t?.closest("input, textarea, select, [contenteditable]")) return
      e.preventDefault()
      go(e.key === "ArrowRight" ? 1 : -1)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  })

  if (process.env.NODE_ENV === "production") return null
  const v = variants[current]

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full bg-neutral-900 px-4 py-2.5 font-mono text-[12px] text-neutral-100 shadow-2xl ring-1 ring-white/20">
        <button onClick={() => go(-1)} aria-label="Previous variant" className="px-1 text-[16px] leading-none">←</button>
        <span className="whitespace-nowrap">
          <span className="text-neutral-400">{v.key}</span> — {v.name}
        </span>
        <button onClick={() => go(1)} aria-label="Next variant" className="px-1 text-[16px] leading-none">→</button>
      </div>
      <div className="mx-auto mt-2 max-w-[620px] rounded-lg bg-neutral-900/95 px-4 py-2.5 text-center font-sans text-[11px] leading-[1.5] text-neutral-300 shadow-xl">
        <span className="text-neutral-100">{v.idea}</span>
        <span className="mt-1 block text-neutral-500">
          no Firebase — sign-in state is a toggle in the header strip · narrow the window to see the 768–880 wrap
        </span>
      </div>
    </div>
  )
}

// `useSearchParams` opts its subtree out of static prerendering, so the read has
// to sit below a Suspense boundary or `next build` fails this route.
function SignInByQuery() {
  const searchParams = useSearchParams()
  const key = searchParams.get("variant") ?? "W"
  const current = Math.max(0, VARIANTS.findIndex((v) => v.key === key))
  const variant = VARIANTS[current]
  const [signedIn, setSignedIn] = useState(false)

  return (
    <>
      <HeaderShell variant={variant} signedIn={signedIn} setSignedIn={setSignedIn} />
      <GateStrip signedIn={signedIn} setSignedIn={setSignedIn} />
      <Switcher variants={VARIANTS} current={current} />
    </>
  )
}

export function SignInPrototype() {
  return (
    <Suspense fallback={<HeaderShell variant={VARIANTS[0]} signedIn={false} setSignedIn={() => {}} />}>
      <SignInByQuery />
    </Suspense>
  )
}