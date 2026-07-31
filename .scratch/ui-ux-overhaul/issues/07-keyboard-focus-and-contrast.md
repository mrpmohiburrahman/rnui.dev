# 07 — Make the catalogue usable by keyboard, and fix the contrast failures

Status: resolved
Blocked by: 08

From `spec.md:93` ("Cards become keyboard-reachable, focus states become visible"), under
decision 1's freeze (`spec.md:20`).

## Problem

### (a) An Entry cannot be opened from the keyboard

Confirmed. `components/entry-card.tsx:131-137` is a `motion.div` carrying `onClick={handleClick}`
and no `role`, `tabIndex` or `onKeyDown`. `handleClick` (`entry-card.tsx:97-99`) is the only path
to `openModal` (`components/catalogue-page.tsx:51,75`). The one focusable element in the Poster
area is the play `<button>` at `components/interactive-video.tsx:164-179`, and it plays the Demo —
it does not open the Entry. So the detail view has no keyboard route at all.

There is no Entry route today: `find app -type f -name "*.tsx"` returns no dynamic segment.

**Correction to the brief.** "Links and buttons are nested inside a clickable ancestor" is true,
but the ancestor is a `<div>` with an `onClick`, not an `<a>` — there is no invalid nested-anchor
markup in the file today. Making the card itself a link would *create* it: the card contains three
profile links (`entry-card.tsx:201,214,226`), the Source link (`241`) and three buttons (bookmark
`146`, vote `262`, play `interactive-video.tsx:164`). "Make the card a real link" is therefore not
the cheap fix; putting **one** real link *inside* the card is. The whole-card `onClick` stays as
the mouse affordance.

`eslint.config.mjs:26-27` extends `eslint-config-next/core-web-vitals`, whose jsx-a11y subset does
not enable `click-events-have-key-events` or `no-static-element-interactions`. That is why this
has never been flagged locally.

### (b) Contrast, the search input's missing name, and its 3-second placeholder cycle

`entry-card.tsx:245` sets `text-blue-500` on the Source link. `blue` is not overridden
(`tailwind.config.ts:27-95` overrides only `base` and `gray`), so it is Tailwind's `#3b82f6`. The
card background is `bg-neutral-50` `#fafafa` / `dark:bg-neutral-800` `#262626`
(`components/cult/minimal-card.tsx:16`). `app/layout.tsx:45` is `defaultTheme="light"`, so light
is what Lighthouse audited. Measured ratios:

| foreground | background | ratio |
|---|---|---|
| `blue-500` | `neutral-50` `#fafafa` — card, light | **3.52** |
| `blue-500` | `neutral-800` `#262626` — card, dark | **4.11** |
| `blue-500` | `pink-100` `#fce7f3` — card hover, light (`entry-card.tsx:141`) | **3.13** |
| `blue-500` | `gray-900` `#3d3d3d` — card hover, dark (`tailwind.config.ts:92`) | **2.95** |

Every card renders the link (`source` is required, `data/entry.ts:30`), so all 277
(`spec.md:24`). `components/card-modal.tsx:75` is the same colour with the same defect.

**No colour change can fix this without being seen, and the arithmetic is closed.** To reach 4.5:1
against `#fafafa` the foreground's relative luminance must be ≤ 0.174; against `#262626` it must be
≥ 0.262. No single colour satisfies both, so any fix is a light/dark split. The nearest passing
pair is `text-blue-600 dark:text-blue-400` (4.95:1 and 5.95:1 on the base backgrounds; still
failing on both hover backgrounds at 4.40 and 4.27). ΔE76 from `blue-500` is 19.0 and 23.7 against
a just-noticeable difference of roughly 2.3. Per the brief, this ticket stops here and flags it —
**no colour is changed**. See Open questions.

The search input has no accessible name. Confirmed at
`components/ui/placeholders-and-vanish-input.tsx:193-208`: no `aria-label`, `aria-labelledby`,
`id`, `name`, `title`, or `placeholder` attribute. The visible placeholder is a separate `<p>`
(`247-274`) that is `pointer-events-none` and associated with the input by nothing.

That `<p>` is also the 3-second cycle. `placeholders-and-vanish-input.tsx:21-23` is a
`setInterval` at 3000ms, started from the effect at `34-44` and restarted on `visibilitychange`
(`25-32`); the `<p>` it drives animates in and out on `y` as well (`250-267`). Nothing in the file
consults `prefers-reduced-motion`, so the text rotates through all 18 Categories under a visitor
who asked for no motion. The decision record lists this under Motion → Removed (`spec.md:48`) and
no ticket picks it up. It lands here because step 4 already edits this `<input>`, and because the
string that replaces the cycle is what gives the field its name.

### (c) The bookmark control is invisible but focusable

Confirmed at `entry-card.tsx:149-154`: `opacity-10 group-hover:opacity-100` (151) and
`pointer-events-none group-hover:pointer-events-auto` (152). Neither opacity nor `pointer-events`
removes an element from the tab order or blocks Enter/Space, so a keyboard visitor lands on a
control drawn at 10% — and `focus:outline-none` (150) means it draws no ring when they arrive. On
touch there is no hover, so the control is unreachable entirely. The vote button repeats
`focus:outline-none` (265), as does the play button (`interactive-video.tsx:166`).
`app/globals.css` supplies no `:focus-visible` replacement — `grep -n outline app/globals.css`
returns only 106, 181-182 and 220-221, none of which are focus styles.

## Work

1. `components/entry-card.tsx` — delete `focus:outline-none` from line 150 and from line 265, and
   from `components/interactive-video.tsx:166`. Add nothing: modern browsers draw their default
   ring on `:focus-visible` only, so this is invisible to a mouse visitor and changes no static
   pixel.

2. `components/entry-card.tsx:149-154` — reduce the bookmark `className` to
   `"absolute top-4 right-4 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md z-10"`. That
   deletes the `transition-opacity`, both `opacity` strings, both `pointer-events` strings and the
   `isBookmarked && "opacity-100"` branch. The control is `absolute`, so nothing reflows. Read the
   screenshot note in Open questions before merging.

3. `components/entry-card.tsx:188-190` — wrap whatever `MinimalCardTitle` already renders in a
   `<Link>` to the Entry's own URL. `Link` is already imported (line 4). Use the path helper ticket
   08 introduces; do not invent a path here. Move the existing child expression; do not retype it:

   ```tsx
   <MinimalCardTitle className="…unchanged…">
     <Link href={/* 08's helper */} prefetch={false} onClick={(e) => e.stopPropagation()}>
       {/* line 189 exactly as it stands, moved not rewritten */}
     </Link>
   </MinimalCardTitle>
   ```

   **Order with ticket 06.** Line 189 is `{entry.author.substring(0, 30)}` today and
   `{entry.caption}` once ticket 06 lands, which is why it is not written out above: copying it in
   would re-add a truncation 06 deletes, and 06's acceptance is that
   `rg "substring" components/entry-card.tsx` returns nothing (`06-card-headline.md:67`). The
   truncation cuts two real authors — `Enzo Manuel Mangano ( Reactiive )`, 33 characters across 124
   Entries, and `Arnaud Dellinger ( evening kid )`, 32 characters across 2. Either order is safe:
   06 first and this step wraps `{entry.caption}`; this step first and 06 swaps the two expressions
   inside the `<Link>` that is already there, which still adds and removes no JSX element in 06's
   own diff (`06-card-headline.md:68-69`).

   `prefetch={false}` because 48 cards would otherwise prefetch 48 routes on scroll, against the
   286ms mobile INP (`spec.md:106`). `stopPropagation` because the ancestor `onClick` would
   otherwise open the same Entry twice. Tailwind preflight sets `a { color: inherit;
   text-decoration: inherit }`, so an inline link inside the `<h3>` renders identically. Do not add
   an `aria-label`: the link's name is its visible text.

4. `components/ui/placeholders-and-vanish-input.tsx:193` — add
   `aria-label="Search the catalogue"` and `name="search"` to the `<input>`. Do not change
   `type="text"`: `type="search"` adds a browser-drawn clear button in WebKit.

5. `components/ui/placeholders-and-vanish-input.tsx` — delete the 3-second cycle. Out go
   `currentPlaceholder` (17), `intervalRef` and `startAnimation` (19-24), `handleVisibilityChange`
   (25-32), the effect that starts them (34-44), and the hint at `247-274` — its wrapper `<div>`,
   the `AnimatePresence` and the `motion.p`. What replaces all of it is one attribute on the same
   `<input>` as step 4:

   ```tsx
   placeholder="Search the catalogue"
   ```

   Deliberately the same string as step 4's `aria-label`. A non-empty `placeholder` is itself a
   naming mechanism, so the field is named even if step 4 is reverted; the `aria-label` is the name
   that survives the visitor typing, when the placeholder disappears. Keep the two identical — a
   voice-control visitor says what they can see (WCAG 2.5.3). Two knock-ons, both checked:

   - The `placeholders: string[]` prop (9, 13) then has no reader. Drop it, and with it
     `components/catalogue-search.tsx:38`, the module-scope `getUniqueCategories()` at `9` and its
     import at `5` — the only value import of `@/data/*` left in any client component, so
     `data/catalogue.ts` stops being pulled into a client chunk. That closes 03's open question
     (`03-cache-counts-and-debounce-search.md:108-109`). Ticket 03's step 3 edits the same file at
     `31-33`, the two edits do not overlap, and either order works. The component keeps its name
     and path: renaming it is churn in a file two tickets already touch.
   - `framer-motion` (line 4) then has no live reference — the only `motion` left in the file is
     inside the commented-out block at `210-245`. Delete the import.

   **This is a visible change, and it is authorised by Motion, not by an appearance exception.**
   The field reads `Search for Accordions` at first paint today and rotates through all 18
   Categories; afterwards it reads `Search the catalogue` and stands still. Decision 14
   (`spec.md:33`) puts motion in scope while the still screenshot stays frozen, and `spec.md:48`
   names this cycle as removed — so this does not consume one of decision 1's two permitted
   exceptions. Two pixel consequences come with it and should be seen before merge: the hint keeps
   the `<p>`'s colour only if it is carried over as
   `placeholder:text-neutral-500 dark:placeholder:text-zinc-500`, because `app/globals.css:138`
   sets a global `::placeholder { color: #a0aec0 }` that otherwise wins; and at `sm` and up the
   hint moves 8px left, because the `<p>` is `sm:pl-12` (268) while the input is `sm:pl-10` (205)
   and `::placeholder` takes the input's own padding. Below `sm` both are `pl-4` and nothing moves.
   Do not close those 8px by changing the input's padding — that moves the typed value too.

6. Add `tests/e2e/keyboard.spec.ts`, shaped like `tests/e2e/home.spec.ts` including its PostHog
   `route` abort. No new dependency — plain locator assertions. Assert: `page.locator("a a")` has
   count 0; the first card exposes a link whose activation by `Enter` changes the URL; the
   bookmark control is visible with no pointer over the card;
   `getByRole("textbox", { name: /search/i })` resolves.

## Acceptance

- Tabbing through `/` reaches, per card, exactly one link that opens the Entry, and pressing Enter
  on it changes the URL and shows the detail view.
- `document.querySelectorAll("a a").length` is `0` on `/`, `/products` and `/bookmarks`.
- Every focusable control inside a card draws a visible ring when reached by Tab: headline link,
  three profile links, Source, bookmark, vote, play.
- Clicking those same controls with a mouse draws no ring.
- With no pointer anywhere on the page, every card shows its bookmark control at full opacity; a
  single touch tap on it toggles the bookmark and does not open the Entry.
- Every card's bounding box is identical before and after — the only pixels that differ anywhere on
  `/` are the bookmark control's opacity (step 2) and the search field's hint (step 5).
- `grep -n "setInterval\|framer-motion" components/ui/placeholders-and-vanish-input.tsx` returns
  nothing.
- The search field's hint text is byte-identical at first paint, 10 seconds later, and after the
  tab has been hidden and re-shown in between.
- Lighthouse no longer lists the search input under "Form elements do not have associated labels".
- Lighthouse **still** reports the Source-link contrast failure. That is expected; do not silence
  it by changing the colour.
- `pnpm build`, `pnpm test` and `pnpm exec playwright test` pass.

## Open questions

- **The Source link colour.** A maintainer call, because it is provably a visible change
  (arithmetic above). Three options: (i) leave it and accept a permanent Lighthouse contrast
  failure on 277 cards; (ii) `text-blue-600 dark:text-blue-400`, which passes on the base
  backgrounds and still fails on both hover backgrounds; (iii) also change the two hover
  backgrounds, which is a much larger visual change. Whatever is chosen applies equally to
  `components/card-modal.tsx:75`.
- **Step 2 is a third exception to the appearance freeze.** Decision 1 allows two (the layout
  bugs). Making the bookmark control always visible puts one 20px icon on a white pill at full
  opacity on every card where the frozen screenshot shows it at 10%. There is no version of "usable
  on touch" that is invisible, so the cost is unavoidable — but it should be seen and accepted, not
  discovered in a diff. Nothing moves; opacity only. Step 5 is **not** a fourth exception: it is
  authorised by decision 14 and `spec.md:48`, which put motion in scope on their own terms.
- **The search input has no focus indicator either** (`placeholders-and-vanish-input.tsx:205`,
  `focus:outline-none focus:ring-0`). Not fixed here: the form wrapper is `overflow-hidden
  rounded-full` (line 181), so restoring the default outline yields a ring clipped at the pill's
  edges. That is a visual decision, so it is not taken here.

Step 2 also resolves half of ticket 04's open question: with the bookmark control at a constant
opacity, the post-hydration pop it describes is reduced to the vote star filling.

## Depends on

08, for step 3 only. Steps 1, 2, 4, 5 and step 6's non-link assertions can land before it.
Step 3 is order-independent with respect to ticket 06 (see the note in that step); step 5 is
order-independent with respect to ticket 03.

## Comments

All six steps done. `pnpm check-types`, `pnpm lint` and `pnpm build` are clean, `pnpm test`
is 159/159 and `pnpm exec playwright test` is 46/46 — seven new assertions in
`tests/e2e/keyboard.spec.ts` and two existing locators updated, both forced by steps 4-5.

### Measured, not read

| Claim | Measurement |
|---|---|
| Card bounding boxes unchanged | 12 cards at 1440×900, baseline build vs this one: the two JSON dumps are byte-identical |
| Only the two authorised regions differ | **7,047 of 1,296,000 pixels**, in exactly three places: the five bookmark icons, the search hint, and `Updated: 10 → 11 minutes ago` (a clock, not a code change) |
| The hint keeps the `<p>`'s colour | computed `::placeholder` is `rgb(115,115,115)` light / `rgb(113,113,122)` dark — `neutral-500` and `zinc-500`, so the global `#a0aec0` at `globals.css:138` loses, as the ticket predicted |
| The hint moves 8px left at `sm`+ | measured: text starts at x+49 before, x+41 after. Exactly the `sm:pl-12` → `sm:pl-10` difference. Left alone per the ticket |
| Lighthouse "Form elements have associated labels" | **passes** (was the failure step 4 exists to fix) |
| Lighthouse contrast | **still fails, 48 items**, every one `text-blue-500` on a Source link. No colour changed |
| Accessibility score | 0.96, contrast the only remaining failure |

### Two places the ticket's instructions did not survive contact

1. **There is no path helper.** Step 3 says "use the path helper ticket 08 introduces; do
   not invent a path here" — 08 introduced none and its own Comments record the helper as
   raised and declined. The literal is now bound once as `const href` at
   `entry-card.tsx:94` and read by both `handleClick` and the `<Link>`, so the file has one
   address expression rather than the two it would otherwise have had.

2. **The sample `onClick={(e) => e.stopPropagation()}` would have opened the wrong thing.**
   With only `stopPropagation`, the `<Link>` navigates — so the headline would have sent a
   visitor to the standalone page while the card body next to it opened the overlay, and
   `?page=` would have been dropped. Decision 5 (`spec.md:24`) is explicit that an Entry
   opens "as an overlay from the grid and as a page cold". A plain click is therefore
   intercepted (`preventDefault` + the card's own `handleClick`), while cmd/ctrl/shift/alt
   are left to the browser so the real `href` still opens a new tab. `tests/e2e/entry-route.spec.ts`
   would have caught the other version: it clicks the `<h3>` and asserts zero navigation
   requests.

   The `href` itself carries no query string and cannot — it renders on the server, where
   `window.location` does not exist, so appending one would be a hydration mismatch on every
   card. `handleClick` reads `window.location.search` at click time instead.

### For the maintainer, before merge

Both were flagged in Open questions as things to see rather than discover in a diff.
Screenshots in this session's scratchpad: `before.png`, `after.png`, `diff.png`.

- **The bookmark control at rest** (step 2, the third exception to decision 1). It is now a
  20px outline icon on a white pill at full opacity on every card, where the frozen
  screenshot shows it at 10%. Nothing moves; opacity only. Pre-authorised by decision 19
  (`spec.md:38`), but this is what it looks like.
- **The search hint** reads `Search the catalogue` and stands still, where it read
  `Search for Accordions` and rotated through all 18 Categories. 8px further left at `sm`
  and up, for the reason measured above.

### Left as the ticket asks

The Source-link colour is untouched, so Lighthouse still reports 48 contrast failures. The
first Open question is still open and still a maintainer call. The search input's own
`focus:outline-none focus:ring-0` also stays — the pill is `overflow-hidden rounded-full`,
so a restored outline would be clipped.

Half of ticket 04's open question closes with step 2: the post-hydration pop is now just the
vote star filling.
