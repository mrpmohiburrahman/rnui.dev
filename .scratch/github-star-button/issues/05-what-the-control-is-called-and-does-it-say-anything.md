# What the control is called, and does it say anything

Status: resolved
Type: grilling
Blocked by: 01, 02

## Question

**A control that leaves the site is three obligations at once, and the third is easy to forget.**

It is an **accessible name**. The header's own comments treat a11y as load-bearing —
`site-header.tsx:270-274` records that the two chip rows remove the same facet and that an accessible
name drifting between them is drift `catalogue-nav.tsx:76-78` names. This control has the same problem
in a new form: its name must carry the action *and* the number, and it must not drift between the
desktop bar and the phone header the way the `Saved` chip's two spellings nearly do. Decide the exact
string, including how the count reads aloud — "350" as a bare number is not the same as "350 stars" to
a screen reader, and `tabular-nums` (`:139`) is a visual instruction with no spoken equivalent.

It is an **exit affordance**. The footer already has a convention for this: the Repository link
carries a trailing `<span aria-hidden="true">↗</span>` and `target="_blank" rel="noopener noreferrer"`
(`site-footer.tsx:51-58`), and its comment records that the arrow means "leaves the site". Does the
star control follow that convention, and does it open a new tab or navigate away? A nav-bar control
that navigates away from `rnui.dev` is a heavier gesture than a footer link to the same place, and the
Preview (see the surfaces ticket) makes leaving expensive to undo.

It is a **hit target**. The phone header's `◆` chip is 38px and its comment (`:167-168`) records why
it is not the mock's 36px. A third control on a 390px phone, with a 320px floor, is where a hit target
gets quietly cut. Decide the minimum and whether it is met by padding or by the transparent `::before`
trick the `✕` uses (`:281`).

And it is **analytics, or it is not**. The repo has a PostHog setup (`lib/analytics.ts`,
`lib/posthog-provider.tsx`) and a call-site convention (`reportFacetClick` in
`components/nav/catalogue-nav.tsx`). ADR-0008 governs event naming and this repo takes it seriously —
`entry_id` and `entry_opened` must never be emitted. Decide whether the press is captured at all, and
if so: the event name, its properties (does it carry the count? the stale-or-not state?), and whether
a click that opens a new tab is reliably capturable before navigation.

**The answer is the accessible name verbatim, the exit behaviour, the hit-target minimum, and a
yes/no on the event with its name and properties if yes.** Depends on 01 for what the control is
called and on 02 for whether a count exists to include.

## Answer

Resolved 2026-10-05. Ticket 01 settled the shapes (`★ Star 350` at `xl`, `★ 350` below it, `★ 350` on
the phone) and ticket 03 settled the number. This ticket settled the four things around them.

### 1. The accessible name — one string, spoken on both layouts

**One string, on every layout: `"Star {count} stars on GitHub"`.** The word is hidden *visually* below
`xl`; it is never removed from the accessible name.

This is not a preference. The sibling chip already has the fault this rule exists to prevent:

| Layout | Rendered | Accessible name today |
|---|---|---|
| Desktop bar | `◆ Saved 12` | "Saved 12" |
| Phone header | `◆ 12` | **"12"** |

`site-header.tsx:177` hides the `◆` from screen readers and the phone form has no word to replace it,
so the phone chip is announced as a bare number with nothing to attach it to. Matching each layout to
what is drawn was rejected for exactly that reason: the phone shape would announce "350".

**Also fixed, in the same change:** the phone `Saved` chip gets its word back as an `aria-label`, so both
layouts announce "Saved 12". This is a change to an existing control, deliberately kept small — it adds
no visible word, only the spoken one.

**Carried forward, not settled here:** ticket 07 drops the desktop `Saved` chip's word below `xl`. That
would strip the accessible name on the desktop bar between `md` and `xl` and produce the same bare-number
fault the phone has today. Whatever ticket 07 decides about the visible word, **the accessible name must
stay "Saved {count}" at every width.** Noted on ticket 07; this ticket does not decide it.

### 2. Exit behaviour — new tab, matching the footer

`target="_blank" rel="noopener noreferrer"` with a trailing `<span aria-hidden="true">↗</span>`, exactly
as `site-footer.tsx:51-58` does. The arrow is the site's existing "leaves the site" convention.

The second reason is reliability: a new tab does not navigate this page away, so the click handler runs
to completion. A same-tab link would race the unload.

### 3. Hit target — 44px on the phone, by the `✕`'s method

**44×44 on the phone**, achieved the way the phone chips row already does it: a transparent `::before`
at `-inset-[12px]` over a smaller glyph, the treatment and reason recorded at `site-header.tsx:281-285`.

The phone chip is currently `min-h-[38px]` (`site-header.tsx:171`) — 38, not the mock's 36, because the
1px border is content-box. 44 is reached by expansion, not by growing the painted chip, so nothing
moves in the layout.

**The desktop chips are left alone.** They measure about 33px today and are already under 44; raising them
is a different piece of work and the width budget at `md`–`lg` has zero headroom (see ticket 01's
measurement table). Not this ticket's business.

### 4. Analytics — PostHog, one new event

**Yes, PostHog.** The repo's existing mechanism, through a named export in `lib/analytics.ts` beside the
other fourteen. The nearest analogue is `loadMoreClicked(page, recordingsShown)` at `:199` — a chrome
click carrying plain numbers, with no `RecordingFacts` behind it, which is also what this control is.

```
export function starClicked(starsShown: number)
  → posthog.capture("star_clicked", { stars_shown: starsShown })
```

Called from `onClick` on the control in **both** layouts, through one shared handler, so the desktop bar
and the phone header cannot drift apart the way the two `Saved` spellings did.

**Why not `repo_clicked`.** It already exists (`lib/analytics.ts:133`) and means *a Recording's outbound
Source link was followed* — it carries `recording_id`, `caption`, `contributor`, `surface` and is
ADR-0008's example of a name that means something specific. The star control has no Recording behind it,
so reusing the name would either require null recording fields or quietly give an existing event a second
meaning.

**Why there is no staleness property.** Ticket 03 settled that the number always renders with no date and
no expiry, so nothing at runtime knows or cares how old it is. There is no such state to send. The file
carries a date, but 03 deliberately kept that out of the render, and leaking it into PostHog would
reintroduce the one thing the maintainer decided against.

**`stars_shown` is the whole property set**, and it earns its place: it is a time series of the number as
real visitors saw it, which is how a rendered-versus-actual discrepancy would be noticed.

**ADR-0008:** `entry_id` and `entry_opened` are never emitted. This event emits neither.

### Two notes for whoever reads the dashboard

- **PostHog autocapture is on** — `lib/posthog-provider.tsx` sets `person_profiles` and
  `capture_exceptions` but never `autocapture: false`, so these clicks also land in PostHog's own
  `$autocapture`. Count on `star_clicked`. Do not add the two together.
- **This is the site's first tracked chrome link.** The footer's Repository link
  (`site-footer.tsx:51-58`) carries no `onClick` and fires nothing, so there is no existing baseline for
  outbound clicks from the header or footer to compare against.

### Naming, flagged and not overridden

`star_clicked` was chosen over `site_star_clicked`. The ambiguity is real: this site already has
`vote_cast` for rating a Recording, so "star" is now two different kinds of approval — one toward a
Recording, one toward the repository. They are separate events with separate names, so nothing collides
in the data. The maintainer accepted the shorter name with the collision noted rather than avoided.

## Comments