// components/star-control.tsx
//
// github-star-button ticket 04. The header's star chip: the repository's star
// count, linking out to it in a new tab, on the live site only.
//
// **The count is inlined, not fetched.** `scripts/star-count.json` is a static
// import resolved at build time, refreshed weekly by .github/workflows, so
// GitHub is never in a visitor's request path. That is the ticket's whole
// architecture and the reason the number can never be wrong for a given deploy —
// and also the reason there is nothing to load, no empty state, no expiry and no
// error branch to write. A visitor cannot see a numberless chip, because there is
// no path that produces one.
//
// **Both header layouts render this one component.** The desktop bar and the
// phone header are separate components that already drifted once — `Saved` has
// two spellings for one fact — so the accessible name, the click handler and the
// event all live here and the two layouts differ only in which word they hide.
//
// **The date in the file never reaches the page.** No `title`, no tooltip, no
// "as of" — github-star-button ticket 03 decided the count must not advertise
// its own staleness, and a `title` attribute is the path of least resistance for
// undoing that: it looks like a nicety, every other test still passes, and a
// settled decision is reversed by someone who never read it.
"use client"

import { cn } from "@/lib/utils"
import { starClicked } from "@/lib/analytics"

import starCountFile from "@/scripts/star-count.json"

/**
 * The repository's own address, in the one spelling ticket 02 settled.
 *
 * **Why this constant and not a prop.** Four places in shipped code carried the
 * address and two of them disagreed (`components/site-footer.tsx` and
 * `components/recording-card-grid.tsx` both pointed at
 * `mrpmohiburrahman/awesome-react-native-ui`, the repository being the *old*
 * name, while `app/opengraph-image.tsx` said `mrpmohiburrahman/rnui.dev`). A
 * fifth spelling here would be the same defect one layer out, so the ticket
 * consolidated rather than added. **This is the repo, not the account** — a
 * control that links to a user's profile rather than the project is a different
 * thing from a star button.
 */
export const REPOSITORY_URL = "https://github.com/mrpmohiburrahman/rnui.dev"

/** The count, read once at module scope. A static JSON import: build-time. */
export const STAR_COUNT = starCountFile.stars

/**
 * The spoken name. **Identical at every width and on both layouts** — the word
 * is hidden visually below the breakpoint and never removed from the name.
 *
 * Matching each layout to what it draws was rejected precisely because the phone
 * form (`★ 350`) would then announce a bare number, which tells a screen-reader
 * user nothing about what the control does or where it goes.
 */
export function starControlName(count: number = STAR_COUNT): string {
  return `Star ${count} stars on GitHub`
}

export type StarControlProps = {
  /** Which layout is drawing it. The word differs; the name does not. */
  variant: "desktop" | "phone"
  className?: string
  onClick?: () => void
}

/**
 * The chip itself.
 *
 * `onClick` is accepted rather than ignored so the two call sites can be tested
 * through the browser while the real handler — which reports the event — is the
 * default. Both layouts use the default.
 */
export function StarControl({
  variant,
  className,
  onClick,
}: StarControlProps) {
  const phone = variant === "phone"

  return (
    <a
      href={REPOSITORY_URL}
      // A new tab with `noopener noreferrer`, matching the footer's convention
      // where the trailing arrow means "leaves the site". A same-tab link races
      // the page unload, so the click handler would not finish — which is why
      // this is not a matter of taste either.
      target="_blank"
      rel="noopener noreferrer"
      aria-label={starControlName()}
      onClick={() => {
        starClicked(STAR_COUNT)
        onClick?.()
      }}
      className={cn(
        phone
          ? // `min-h-[38px]` matches the phone `Saved` chip beside it, and the
            // 44×44 tap target comes from the transparent `::before` — the
            // treatment and the reason the phone's facet-remove button already
            // uses (site-header.tsx:281). Nothing in the layout moves.
            "relative ml-0 flex min-h-[38px] flex-none items-center gap-[6px] rounded-chip border border-line bg-field px-[11px] text-[12px] text-t2 before:absolute before:-inset-[3px] before:content-[''] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
          : // The `Saved` chip's own treatment, unchanged: same rounded-chip, same
            // hairline border, same secondary text. The header already speaks this
            // vocabulary and a third one would be the odd one out.
            "flex items-center gap-[6px] rounded-chip border border-line bg-transparent px-[10px] py-[6px] text-[12.5px] text-t2",
        className
      )}
    >
      <span aria-hidden="true">★</span>
      {/* The word is present at every width and hidden visually below the widest
          breakpoint, never removed — so the accessible name above is the same
          string a sighted visitor reads at the top size. `sr-only` rather than a
          conditional render, which is what keeps the two layouts from drifting. */}
      <span className={cn(phone ? "sr-only" : "hidden xl:inline")}>Star</span>
      <span className="font-mono text-[10px] text-t3 tabular-nums">{STAR_COUNT}</span>
      {/* The arrow means "leaves the site", the footer's own convention. */}
      <span aria-hidden="true" className={cn(phone && "sr-only")}>
        ↗
      </span>
    </a>
  )
}