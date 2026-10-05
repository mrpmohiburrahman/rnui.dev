// components/prototype/star-control-prototype.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 01, `.scratch/github-star-button/`.
// Five directions for a third control in the site header, switchable via
// ?variant=, with the real header shell and the real catalogue underneath so the
// judgement is made against actual density. Delete once a direction wins.
//
// The shell below is a faithful copy of components/site-header.tsx:87-204 — the
// real flex structure, the real `CatalogueSearch`, the real `ModeToggle`, the
// real `useRememberedSet` Saved count. Only the third control is the variable,
// which is the whole point: everything else must stay identical across variants
// or the comparison is meaningless. If the real header changes, this drifts.
"use client"

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { BOOKMARKS_KEY, useRememberedSet } from "@/hooks/use-remembered-set"
import { ModeToggle } from "@/app/providers"

import { CatalogueSearch } from "@/components/catalogue-search"

/**
 * PROTOTYPE. Provisional: ticket 04 has not ruled on the canonical URL. This is
 * the spelling that matches the domain, the OG image and metrics-update.ts, and
 * GitHub redirects the legacy alias here anyway.
 */
const REPO_URL = "https://github.com/mrpmohiburrahman/rnui.dev"
/** The truth today. The shipped number would come from metrics/weekly.json. */
const STARS = 350

type Variant = {
  key: string
  name: string
  idea: string
  /**
   * Render the Saved chip without its "Saved" word below `lg`. The phone header
   * already does this — site-header.tsx:175 draws `◆ 0`, not `◆ Saved 0` — so
   * the wordless form is an existing shape, not a new one.
   */
  savedWordlessBelowXl?: boolean
  Desktop: (p: { savedCount: number }) => React.ReactNode
  Phone: (p: { savedCount: number }) => React.ReactNode
}

/* ------------------------------------------------------------------ *
 * The shared bits. A shared shell is fine — the variable is one slot.  *
 * ------------------------------------------------------------------ */

function StarLink({
  className,
  label,
  children,
  srLabel,
}: {
  className?: string
  label: string
  children: React.ReactNode
  srLabel: string
}) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={srLabel}
      // Throwaway: no navigation out of the prototype.
      onClick={(e) => e.preventDefault()}
      className={cn(
        "relative flex items-center gap-[6px] rounded-chip border px-[10px] py-[6px] text-[12.5px]",
        className
      )}
    >
      {children}
      <span className="sr-only">{srLabel}</span>
    </a>
  )
}

function GlyphStar({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      ★
    </span>
  )
}

function Count({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-mono text-[10px] tabular-nums", className ?? "text-t3")}
    >
      {STARS}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * A — third chip. Sibling of the Saved chip, same treatment, last.   *
 * ------------------------------------------------------------------ */

const VariantA: Variant = {
  key: "A",
  name: "Third chip",
  idea: "Same shape as ◆ Saved, third in the row. The least surprising addition.",
  Desktop: () => (
    <StarLink
      label="Star rnui.dev on GitHub"
      srLabel={`Star rnui.dev on GitHub, ${STARS} stars`}
      className="border-line bg-transparent text-t2"
    >
      <GlyphStar />
      <span className="text-[12.5px]">Star</span>
      <Count />
    </StarLink>
  ),
  Phone: () => (
    <StarLink
      label="Star rnui.dev on GitHub"
      srLabel={`Star rnui.dev on GitHub, ${STARS} stars`}
      className="min-h-[38px] border-line bg-field px-[11px] text-[12px]"
    >
      <GlyphStar />
      <Count />
    </StarLink>
  ),
}

/* ------------------------------------------------------------------ *
 * B — bare. No chip, no border. The quietest of the three.            *
 * ------------------------------------------------------------------ */

const VariantB: Variant = {
  key: "B",
  name: "Bare count",
  idea: "No container at all. A glyph and a number that read as text.",
  Desktop: () => (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Star rnui.dev on GitHub"
      aria-label={`Star rnui.dev on GitHub, ${STARS} stars`}
      onClick={(e) => e.preventDefault()}
      className="flex items-center gap-[5px] px-[2px] text-[12.5px] text-t2 hover:text-t1"
    >
      <GlyphStar className="text-[13px]" />
      <Count className="text-t2" />
    </a>
  ),
  Phone: () => (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Star rnui.dev on GitHub"
      aria-label={`Star rnui.dev on GitHub, ${STARS} stars`}
      onClick={(e) => e.preventDefault()}
      className="flex min-h-[38px] items-center px-[6px] text-[12px] text-t2"
    >
      <GlyphStar />
    </a>
  ),
}

/* ------------------------------------------------------------------ *
 * C — split. "How many" and "add me" are two intents, two targets.  *
 * ------------------------------------------------------------------ */

const VariantC: Variant = {
  key: "C",
  name: "Split control",
  idea: "The count links to the stargazer list; the star is a separate target.",
  Desktop: () => (
    <div className="flex items-center gap-[9px]">
      <a
        href={`${REPO_URL}/stargazers`}
        target="_blank"
        rel="noopener noreferrer"
        title="Who has starred rnui.dev"
        onClick={(e) => e.preventDefault()}
        className="flex items-center gap-[5px] text-[12.5px] text-t2 hover:text-t1"
      >
        <span className="font-mono text-[10px] tabular-nums text-t3">
          {STARS}
        </span>
        <span className="underline decoration-line underline-offset-3">
          stars
        </span>
      </a>
      <span aria-hidden="true" className="h-[16px] w-px bg-line" />
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Star rnui.dev on GitHub"
        aria-label="Star rnui.dev on GitHub"
        onClick={(e) => e.preventDefault()}
        className="flex items-center gap-[6px] rounded-chip border border-line bg-transparent px-[10px] py-[6px] text-[12.5px] text-t2 hover:border-t3 hover:text-t1"
      >
        <Star aria-hidden="true" className="size-[13px]" strokeWidth={2} />
        Star
      </a>
    </div>
  ),
  Phone: () => (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Star rnui.dev on GitHub"
      aria-label={`Star rnui.dev on GitHub, ${STARS} stars`}
      onClick={(e) => e.preventDefault()}
      className="flex min-h-[38px] items-center gap-[5px] rounded-chip border border-line bg-field px-[10px] text-[12px] text-t2"
    >
      <Star aria-hidden="true" className="size-[13px]" strokeWidth={2} />
      <Count className="text-t2" />
    </a>
  ),
}

/* ------------------------------------------------------------------ *
 * D — leads. Accented, first. The primary action of the three.        *
 * ------------------------------------------------------------------ */

const VariantD: Variant = {
  key: "D",
  name: "Leads, accented",
  idea: "Accent treatment, first in the row. Reads as the thing to do.",
  Desktop: () => (
    <StarLink
      label="Star rnui.dev on GitHub"
      srLabel={`Star rnui.dev on GitHub, ${STARS} stars`}
      className="border-acc bg-acc-soft text-t1"
    >
      <GlyphStar className="text-acc" />
      <span>Star</span>
      <Count className="text-t2" />
    </StarLink>
  ),
  Phone: () => (
    <StarLink
      label="Star rnui.dev on GitHub"
      srLabel={`Star rnui.dev on GitHub, ${STARS} stars`}
      className="min-h-[38px] border-acc bg-acc-soft px-[11px] text-[12px] text-t1"
    >
      <GlyphStar className="text-acc" />
      <Count className="text-t2" />
    </StarLink>
  ),
}

/* ------------------------------------------------------------------ *
 * E — deliberately awkward. A primary CTA living in the nav bar.     *
 * ------------------------------------------------------------------ */

const VariantE: Variant = {
  key: "E",
  name: "Awkward: CTA",
  idea: "On purpose wrong. A marketing pill above every page, legal pages included.",
  Desktop: () => (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Star rnui.dev on GitHub"
      aria-label={`Star rnui.dev on GitHub, ${STARS} stars`}
      onClick={(e) => e.preventDefault()}
      className="flex items-center gap-[8px] rounded-chip border border-acc bg-acc px-[13px] py-[7px] text-[12.5px] font-medium text-canvas"
    >
      <Star aria-hidden="true" className="size-[14px]" strokeWidth={2} />
      Star rnui.dev — {STARS}
    </a>
  ),
  Phone: () => (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Star rnui.dev on GitHub"
      aria-label={`Star rnui.dev on GitHub, ${STARS} stars`}
      onClick={(e) => e.preventDefault()}
      className="flex min-h-[38px] items-center gap-[6px] rounded-chip border border-acc bg-acc px-[11px] text-[12px] font-medium text-canvas"
    >
      <Star aria-hidden="true" className="size-[13px]" strokeWidth={2} />
      {STARS}
    </a>
  ),
}

/* ------------------------------------------------------------------ *
 * F — A's shape at md too, paid for out of the Saved chip. The star   *
 *     control never changes shape; the Saved chip drops its word      *
 *     below lg and gets it back at lg. Pure CSS, the phone's own      *
 *     treatment, and it also repairs the wrapping that ships at 768.   *
 * ------------------------------------------------------------------ */

const VariantF: Variant = {
  key: "F",
  name: "A's chip, paid from Saved",
  idea: "A's chip at every desktop width. Both words — Saved's and Star's — appear only from xl, which is the first width with room for them. Chip shape never changes.",
  savedWordlessBelowXl: true,
  Desktop: ({ savedCount }) => (
    <StarLink
      label="Star rnui.dev on GitHub"
      srLabel={`Star rnui.dev on GitHub, ${STARS} stars`}
      className="border-line bg-transparent text-t2"
    >
      <GlyphStar />
      {/* The word is what the narrow bands cannot spare, twice over. `sr-only`
          below xl keeps the accessible name whole — the same trick the Saved
          chip uses, and the reason this is not a label change. */}
      <span className="hidden xl:inline">Star</span>
      <span className="sr-only xl:hidden">Star</span>
      <Count />
    </StarLink>
  ),
  Phone: VariantA.Phone,
}

const VARIANTS: Variant[] = [
  VariantA,
  VariantB,
  VariantC,
  VariantD,
  VariantE,
  VariantF,
]

/* ------------------------------------------------------------------ *
 * The shell — a faithful copy of components/site-header.tsx.          *
 * ------------------------------------------------------------------ */

function HeaderShell({ variant }: { variant: Variant }) {
  const searchParams = useSearchParams()
  const { ids: bookmarks } = useRememberedSet(BOOKMARKS_KEY)
  const savedCount = bookmarks?.length ?? 0
  const pathname = typeof window === "undefined" ? "/" : window.location.pathname
  const onBookmarks = pathname === "/bookmarks"
  const facetsApply = pathname === "/" || pathname === "/products"

  const centerRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<string>("measuring…")

  useLayoutEffect(() => {
    const measure = () => {
      const center = centerRef.current
      const right = rightRef.current
      if (!center || !right || center.offsetParent === null) {
        setMetrics("phone layout — the desktop row is not rendered")
        return
      }
      const c = center.getBoundingClientRect()
      const delta = Math.round(
        Math.abs(
          c.left + c.width / 2 - (window.innerWidth / 2)
        )
      )
      const overflow = right.scrollWidth - right.clientWidth
      setMetrics(
        `search off viewport centre by ${delta}px · right column overflow ${overflow}px`
      )
    }
    measure()
    window.addEventListener("resize", measure)
    const t = setInterval(measure, 1000)
    return () => {
      window.removeEventListener("resize", measure)
      clearInterval(t)
    }
  }, [variant.key])

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
          <CatalogueSearch
            recordingCount={277}
            searchParams={searchParams}
          />
        </div>

        <div
          ref={rightRef}
          className="flex flex-1 items-center justify-end gap-[10px]"
        >
          {variant.key === "D" && (
            <>
              {variant.Desktop({ savedCount })}
              <SavedChip
                savedCount={savedCount}
                on={onBookmarks}
                wordlessBelowXl={variant.savedWordlessBelowXl}
              />
            </>
          )}
          {variant.key !== "D" && (
            <>
              <SavedChip
                savedCount={savedCount}
                on={onBookmarks}
                wordlessBelowXl={variant.savedWordlessBelowXl}
              />
              {variant.Desktop({ savedCount })}
            </>
          )}
          <ModeToggle />
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-[10px] px-[14px] pb-[8px] pt-[12px]">
          <Link
            href="/"
            className="text-[15px] font-bold tracking-[-0.02em] text-t1"
          >
            rnui<span className="text-acc">.dev</span>
          </Link>
          {variant.key === "D" && (
            <>
              {variant.Phone({ savedCount })}
              <SavedChipPhone savedCount={savedCount} on={onBookmarks} />
            </>
          )}
          {variant.key !== "D" && (
            <>
              <SavedChipPhone savedCount={savedCount} on={onBookmarks} />
              <span className="ml-auto">{variant.Phone({ savedCount })}</span>
            </>
          )}
          <ModeToggle compact />
        </div>
        <div className="flex items-center gap-[8px] px-[14px] pb-[10px]">
          <CatalogueSearch recordingCount={277} searchParams={searchParams} />
        </div>
        {facetsApply && (
          <div className="px-[14px] pb-[10px] text-[10px] text-t3">
            (phone filter chips row — not part of this question)
          </div>
        )}
      </div>

      <div className="border-t border-line bg-field px-[26px] py-[3px] font-mono text-[10px] text-t3">
        PROTOTYPE · {variant.key} {variant.name} · {metrics}
      </div>
    </header>
  )
}

function SavedChip({
  savedCount,
  on,
  wordlessBelowXl,
}: {
  savedCount: number
  on: boolean
  wordlessBelowXl?: boolean
}) {
  return (
    <Link
      href="/bookmarks"
      className={cn(
        "flex items-center gap-[6px] rounded-chip border px-[10px] py-[6px] text-[12.5px]",
        on
          ? "border-acc bg-acc-soft text-t1"
          : "border-line bg-transparent text-t2"
      )}
    >
      <span>
        <span aria-hidden="true">◆</span>{" "}
        {/* Variant F: the word is the width this band cannot spare, and the
            phone header at site-header.tsx:175 already drops it. The count
            keeps its tabular figures either way. */}
        {wordlessBelowXl ? (
          <>
            <span className="hidden xl:inline">Saved</span>
            <span className="sr-only xl:hidden">Saved</span>
          </>
        ) : (
          "Saved"
        )}
      </span>
      <span className="font-mono text-[10px] text-t3 tabular-nums">
        {savedCount}
      </span>
    </Link>
  )
}

function SavedChipPhone({
  savedCount,
  on,
}: {
  savedCount: number
  on: boolean
}) {
  return (
    <Link
      href="/bookmarks"
      className={cn(
        "ml-auto flex min-h-[38px] items-center gap-[6px] rounded-chip border px-[11px] text-[12px]",
        on ? "border-acc bg-acc-soft text-t1" : "border-line bg-field text-t2"
      )}
    >
      <span aria-hidden="true">◆</span> {savedCount}
    </Link>
  )
}

/* ------------------------------------------------------------------ *
 * Switcher + state readout                                          *
 * ------------------------------------------------------------------ */

function Switcher({
  variants,
  current,
}: {
  variants: Variant[]
  current: number
}) {
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

  const v = variants[current]
  if (process.env.NODE_ENV === "production") return null

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full bg-neutral-900 px-4 py-2.5 font-mono text-[12px] text-neutral-100 shadow-2xl ring-1 ring-white/20">
        <button
          onClick={() => go(-1)}
          aria-label="Previous variant"
          className="px-1 text-[16px] leading-none"
        >
          ←
        </button>
        <span className="whitespace-nowrap">
          <span className="text-neutral-400">{v.key}</span> — {v.name}
        </span>
        <button
          onClick={() => go(1)}
          aria-label="Next variant"
          className="px-1 text-[16px] leading-none"
        >
          →
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-[560px] rounded-lg bg-neutral-900/95 px-4 py-2.5 text-center font-sans text-[11px] leading-[1.5] text-neutral-300 shadow-xl">
        <span className="text-neutral-100">{v.idea}</span>
        <span className="mt-1 block text-neutral-500">
          count {STARS} (stand-in) · href {REPO_URL} · deep link, opens a new tab
          · {v.key === "E" ? "deliberately awkward" : "honest-label candidate"}
        </span>
      </div>
    </div>
  )
}

// `useSearchParams` opts its subtree out of static prerendering, so the read has
// to sit BELOW a Suspense boundary or `next build` fails prerendering this route
// ("should be wrapped in a suspense boundary"). The boundary that used to wrap
// only HeaderShell was one level too low to help this component's own read, so
// the read moved into this inner component and the boundary moved up to it. The
// fallback still renders the A header, which is the default variant.
function StarControlByQuery() {
  const searchParams = useSearchParams()
  const key = searchParams.get("variant") ?? "A"
  const current = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === key)
  )
  const variant = VARIANTS[current]

  return (
    <>
      <HeaderShell variant={variant} />
      <Switcher variants={VARIANTS} current={current} />
    </>
  )
}

export function StarControlPrototype() {
  return (
    <Suspense fallback={<HeaderShell variant={VariantA} />}>
      <StarControlByQuery />
    </Suspense>
  )
}
