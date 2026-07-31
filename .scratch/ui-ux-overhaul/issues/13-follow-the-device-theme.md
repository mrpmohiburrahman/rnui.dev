# 13 — Follow the device's light/dark setting on a first visit

Status: resolved

Decision 9 (`.scratch/ui-ux-overhaul/spec.md:28`).

## Problem

Both halves of the brief's description are true, verified by reading the file. `app/layout.tsx:44`
is `// defaultTheme="system"`, commented out. `app/layout.tsx:45` is `defaultTheme="light"`. The
two lines that follow are `enableSystem` at `:46` — bare, so `true` — and `disableTransitionOnChange`
at `:47`, inside a `ThemeProvider` given `attribute="class"` at `:43`.

**`enableSystem` is inert on a first visit, and the device setting is never read.** next-themes
0.4.4 (`package.json:55`, and 0.4.4 is what is installed) inlines a blocking script whose whole
first-load decision is three lines of `node_modules/next-themes/dist/index.js`:

```js
let c = localStorage.getItem(storageKey) || defaultTheme
let y = enableSystem && c === "system" ? systemTheme() : c
apply(y)
```

`systemTheme()` is the only call to `matchMedia("(prefers-color-scheme: dark)")` on that path, and
it is reached only when the resolved name is the literal string `"system"`. With
`defaultTheme="light"` and no stored key, `c` is `"light"`, the `matchMedia` branch never runs, and
the device is not consulted. `enableSystem` today buys exactly two things: `"system"` joins the
`themes` array, and the third item in the toggle (`app/providers.tsx:42`) works.

**So: a visitor whose device is in dark mode gets light, and there is no flash.** The wrong answer
is the steady state, not a flicker. The script commits `class="light"` before first paint — it is
synchronous, inline, and next-themes renders it ahead of `children`, so it executes while the app
markup is still being parsed — and React's own state initialises from the same
`localStorage.getItem(key) || defaultTheme` expression, so nothing corrects it a moment later. The
page is light for that session and every session after it.

**"No stored key" is not only first-timers.** next-themes writes to `localStorage` from `setTheme`
and nowhere else; it never persists the default. Every visitor who has never opened the toggle is
on the default path, however many times they have been here. All of them move to their device
setting when this lands. That is the decision, and it is not a restyling: dark is already built —
`tailwind.config.ts:7` is `darkMode: ["class"]`, `app/globals.css:38-65` carries the full `.dark`
token set, `app/globals.css:75` gives `body` its `dark:bg-background`, and 92 `dark:` utilities are
spread over 20 files in `app/` and `components/`. This ticket picks which of two finished
appearances is shown first. It adds no colour, no token and no rule.

**`suppressHydrationWarning` is needed, and it is absent.** `app/layout.tsx:30` is
`<html lang="en" className={...}>` with no such attribute, and grep over `app/`, `components/` and
`lib/` finds it nowhere in the repo. The inlined script mutates `documentElement.classList` and
`documentElement.style.colorScheme` (`enableColorScheme` defaults to `true` and is not overridden)
before React hydrates, so the served `<html>` and the hydrated `<html>` cannot match. **That is
already true today** — the script already adds `light` and `color-scheme: light` to an `<html>` the
server sent without either — so the attribute is a pre-existing omission this ticket clears rather
than a cost it introduces. What changes is that the mismatch stops being constant and starts
depending on the visitor's device.

## Work

Two attributes, one file. Nothing else.

1. `app/layout.tsx:44-45` — delete the commented line and make the live one `defaultTheme="system"`.
   Leave `attribute="class"` (`:43`), `enableSystem` (`:46`) and `disableTransitionOnChange` (`:47`)
   exactly as they are. `disableTransitionOnChange` in particular stays: it suppresses transitions
   during a theme swap, so removing it would *add* motion, which decision 14 forbids.
2. `app/layout.tsx:30` — add `suppressHydrationWarning` to the `<html>` tag. It emits no attribute
   into the DOM and moves no pixel.

Do not touch `app/providers.tsx`. The toggle already offers Light, Dark and System
(`app/providers.tsx:36,39,42`) and already persists the choice; this ticket only changes what the
absence of a choice means.

## Acceptance

A returning visitor with a stored preference is unaffected — the first two checks are the ones that
prove it.

- `localStorage.theme === "light"` and the device emulated dark → the site renders light. The
  stored value wins.
- Toggle to Dark, reload → still dark, `localStorage.theme === "dark"`. Toggle behaviour is
  byte-identical to today.
- Fresh context with no `theme` key, `prefers-color-scheme: dark` emulated → `<html>` carries the
  `dark` class and `style="color-scheme: dark"` on first paint, and the catalogue is dark. Same run
  with light emulated → `light`.
- No flash under dark emulation: capture the load and confirm no frame paints the light body
  `#FAFAFA` (`app/globals.css:75`) before the dark one.
- Pick "System" in the toggle, then flip the OS/emulated setting with the tab open → the page
  follows without a reload (next-themes keeps a `matchMedia` listener).
- The browser console shows no hydration warning on `/` under either emulation.
- `grep -n defaultTheme app/layout.tsx` returns one line, `defaultTheme="system"`, with no
  commented sibling left behind.
- A screenshot of `/` in light mode is pixel-identical before and after. The dark screenshot has no
  before-and-after to compare against — nobody was being shown it by default — which is why
  decision 1 is not breached: no rule changed, only which built appearance starts.

### How to actually test this

`prefers-color-scheme` is a device setting, so the in-page toggle cannot exercise it. Picking
"Dark" in the toggle writes `theme=dark` to `localStorage`, which is the *returning visitor* path —
the opposite of what is being tested. Emulate the media feature and clear the key between runs.

- Playwright: `test.use({ colorScheme: "dark" })` or `page.emulateMedia({ colorScheme: "dark" })`.
  A fresh browser context starts with empty `localStorage`, which is exactly "first visit". For the
  returning-visitor checks, seed it with `context.addInitScript`.
- By hand: DevTools → Rendering → "Emulate CSS media feature prefers-color-scheme", then
  `localStorage.removeItem("theme")` and hard-reload.
- `tests/e2e/` has no theme spec and this ticket does not require one. If one is added, two
  assertions cover the whole decision: dark emulation + empty storage → `html.dark`; dark emulation
  + `theme=light` seeded → no `html.dark`.

## Open questions

Neither is decided here.

1. **`/contactus` was never built for dark.** `app/contactus/page.tsx` contains zero `dark:`
   utilities, and its four inputs are `border-black … text-black` (`:105,118,133,146`), which in
   dark is black text on the near-black `--background` of `app/globals.css:39`. It is linked from
   `components/site-footer.tsx:29`, so it is reachable. `defaultTheme="light"` hides this from
   everyone who has not toggled; after this ticket every dark-device visitor who opens it sees it.
   Not fixed here — it is neither decision 9 nor this ticket's file. Ticket 05 deletes the
   byte-identical twin `/feedback`, which removes the same defect from that route by removing the
   route; `/contactus` survives and needs a decision.
2. **Whether the maintainer wants to review the dark rendering before this lands.** Dark goes from
   opt-in to the default for a share of visitors, and nobody has audited it at that exposure. That
   is a look call, not a code one.

Not an open question, recorded so nobody re-opens it: ticket 07 already measured the Source-link
contrast in *both* modes and found `blue-500` failing in dark as well (4.11 on the card, 2.95 on
hover), noting it audited light because `app/layout.tsx:45` is `defaultTheme="light"`. This ticket
changes none of those ratios, only how many people meet the dark ones. 07 has already flagged them.

## Depends on

Nothing.

Collision, not a dependency: ticket 05 step 2 rewrites the same `app/layout.tsx:30` to
`<html lang="en" className="font-sans">`. Whichever of the two lands second must keep both the new
`className` and `suppressHydrationWarning`. Tickets 11 and 12 also edit this file (12 step 7 at
`:53`), so match on the `<html …>` tag and the `ThemeProvider` prop list, not on line numbers.
Ticket 07's prose cites `app/layout.tsx:45` as evidence for auditing in light; if this lands first
that sentence goes stale, but its measurements stand either way.

## Comments

Both steps landed as written: `defaultTheme="system"` with the commented sibling deleted, and
`suppressHydrationWarning` on the `<html>` tag. `grep -n defaultTheme app/layout.tsx` returns one
line. `app/providers.tsx` untouched.

New spec `tests/e2e/theme.spec.ts`, 8 tests, one per acceptance line:

- dark device + empty storage → `html.dark` and `style="color-scheme: dark"`; light device → light.
  Also asserts nothing was written to `localStorage`, so the visitor has still made no choice.
- `theme=light` seeded + dark device → light. The stored value wins.
- toggle to Dark, reload → still dark, `localStorage.theme === "dark"`.
- pick System, then flip the emulated setting with the tab open → follows without a reload.
- no hydration warning under either emulation.
- nothing light has been painted by first contentful paint.

`pnpm check-types`, `pnpm lint`, `pnpm test` (166) and the Playwright suite (118) pass, the suite
three times consecutively.

### The no-flash check was measuring the wrong thing at first

The first version sampled `getComputedStyle(document.body).backgroundColor` every
`requestAnimationFrame` from an init script, and reported one light frame. That is a false
positive: a rAF callback runs *before* the paint of its own frame, so the first one reads the
document before next-themes' blocking script has run — a frame that is never painted. It now reads
the background at `first-contentful-paint` via `PerformanceObserver`, which is the first moment a
visitor could have seen anything. At FCP under dark emulation the body is already `rgb(10,10,10)`
and `<html>` already carries `dark`.

### `suppressHydrationWarning` deleted a link from the header, and why

Adding the attribute — on its own, with `defaultTheme` untouched — removed the "Star us on GitHub"
item from the server-rendered header. The `<li>` was emitted **empty**. Verified on `rm -rf .next`
clean production builds, both directions, several times; present without the attribute, absent
with it. Not hydration: it is already missing from the `curl` HTML.

It is not really about that attribute. The extra props lengthen the RSC Flight payload, and past a
row-size threshold React stops inlining an element into the parent row and emits a lazy reference
to a row of its own. Radix's `asChild` renders through `Slot`, which reads `children.props`; a lazy
reference has none, so the child is silently erased. The third nav item was hit because it sits
furthest down the row — the other two were only ever lucky. A parallel investigation reached this
from two independent directions (reading the installed React server bundles, and an empirical
bisect that pinned it to a ~32-byte payload shift moving a Flight row boundary).

Fix: `"use client"` at the top of `components/nav/top-nav-bar.tsx`. The header then crosses the
boundary as a single client reference, nothing inside it is Flight-serialized, and no `asChild`
child in it can be outlined. It costs almost nothing — every Radix primitive in that file was
already a client component. Verified: with the attribute *and* the fix, the link is back in the
served HTML.

Audited the rest of the exposure. `asChild` appears in six files; `entry-overlay.tsx`,
`top-nav-bar.tsx` and `nav-side-bar.tsx` are client components already. Of the two server files,
`logo.tsx` is only ever rendered from the two nav components, so it is inside a client boundary
either way, and `cult/gradient-heading.tsx`'s single caller (`app/products/page.tsx:48`) does not
pass `asChild`, so it renders an `h3` rather than a `Slot`. Nothing else is on the knife edge
today — but it is a size threshold, so growth can trip it again, and it fails silently.
`tests/e2e/theme.spec.ts` asserts the link is in the served markup, which is the guard.

### Open questions and one thing left for the maintainer

1. **`/contactus` in dark.** Still unfixed, as the ticket says. It has zero `dark:` utilities and
   four `border-black … text-black` inputs, so it is now black-on-near-black for every dark-device
   visitor rather than only for those who had opted in. This ticket raised its exposure; it did not
   cause it. Needs its own ticket.
2. **Reviewing dark before this ships.** Unchanged — it is a look call. Dark is now the default for
   a share of visitors and nobody has audited it at that exposure.
3. **An intermittent hydration mismatch in `next dev` only.** 1 in 8 loads under dark emulation,
   0 in 8 under light. Zero in 16 loads against a production build, and the suite's own
   no-hydration-warning test passes every run. When it does fire the diff points at a missing
   wrapper `<div>` in the server HTML around `entry-card-grid.tsx`'s children — the same
   "element missing from SSR" family as the nav link above, which is why it is recorded here
   rather than dismissed. Not reproducible in production, so not blocking.
