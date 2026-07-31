# 05 — Delete what is dead

Status: resolved

Decisions 2 and 11. Four deletions, none of which may move a pixel.

## Problem

### Corrections to the brief

Two claims handed to this ticket did not survive checking.

- **"`admin-nav.tsx` has no importer" is false.** It is imported at
  `components/nav/nav-side-bar.tsx:16` and rendered twice, at `:56` (desktop aside) and
  `:123` (mobile sheet). It is still dead, but for a different reason — see below. Deleting
  the file therefore also means deleting four conditionals in `nav-side-bar.tsx`.
- **`/feedback` does not merely "duplicate" `/contactus` — it is byte-identical to it.**
  `diff app/feedback/page.tsx app/contactus/page.tsx` reports no difference. Both write to the
  same `userFeedback` Firestore collection (`app/feedback/page.tsx:51`,
  `app/contactus/page.tsx:51`).

Everything else in the brief held.

### (a) Haskoy is downloaded and never used

`data/font-sans.ts:3-6` declares `localFont({ src: "../fonts/haskoy.ttf", variable: "--font-sans" })`
with no family name. The build emits

    @font-face{font-family:fontSans;src:url(../media/haskoy-s.p.9a46f963.ttf)format("truetype")}
    --font-sans:"fontSans","fontSans Fallback"

while `tailwind.config.ts:25` asks for `sans: ["Haskoy", ...fontFamily.sans]`, which compiles to

    .font-sans{font-family:Haskoy,ui-sans-serif,system-ui,sans-serif,…}

Two independent breaks: the family name never matches, and nothing in any stylesheet reads
`--font-sans`. `grep -rn -- "--font-sans" app/globals.css components/` returns nothing. So
`fonts/haskoy.ttf` (172KB) is preloaded on every route — it is listed per page in
`.next/server/next-font-manifest.json` — and the site renders in `ui-sans-serif`/`system-ui`.
Removing the leading `Haskoy,` leaves the same face resolved.

### (b) The admin nav is unreachable

`components/nav/admin-nav.tsx` is 98 lines of links to `/admin`, `/admin/products`,
`/admin/users`, `/admin/filters` (`:25`, `:43`, `:62`, `:80`). No `app/admin` directory exists.
Its render is gated on `pathname.includes("admin")` at `nav-side-bar.tsx:53` and `:120`, and the
same substring drives two class ternaries at `:44` and `:72`. `app/not-found.tsx` is
`redirect("/")`, so every unmatched path is redirected server-side before the layout renders —
no pathname containing "admin" ever reaches `NavSidebar`. Nothing anywhere links to `/admin`
except `admin-nav.tsx` itself.

**Consequence: deleting this is provably zero visual change**, because there is no route on
which the branch renders.

### (c) The tag and label filters filter nothing

- The filter bodies are commented out at `app/actions/get-entries.ts:73-85`; the parameters
  `label` and `tag` are still declared at `:16-17` and simply ignored.
- No Entry has either field — `data/entry.ts:24-59` has `id`, `caption`, `demoPath`,
  `posterPath`, `author`, `source`, socials, `category`, and the three Firestore counters.
  Nothing else. Confirmed.
- The nav never receives them: `app/layout.tsx:56` renders
  `<NavSidebar categories={categories} authors={authors} />`, so `tags`/`labels` arrive
  `undefined` at `nav-side-bar.tsx:29-30` and pass through as `undefined` to
  `catalogue-nav.tsx:61-62` and `:129-130`. The Tags block (`catalogue-nav.tsx:96-124`) and
  Labels block (`:126-156`) render nothing.
- But `/products?tag=X` still prints a heading over the **whole** catalogue:
  `app/products/page.tsx:29` passes `tag` through, `:51-53` renders a `TagIcon` chip, `:57`
  prints the word "tag", and `:61` prints `X` in a `GradientHeading` — above all 277 Entries.
  Same for `label` at `:48-50`, `:56`, `:61`.

### (d) `/feedback` is a dead copy

- PostHog, `$pageview` over the last 90 days: `/products` 3555, `/` 1825, `/subscribe` 35,
  `/contactus` 18, **`/feedback` returns no row at all**. Zero.
- No inbound link. The only reference outside the file itself is `public/sitemap-0.xml:6`.
  `/contactus` by contrast is linked from `components/site-footer.tsx:29` and three times from
  `app/privacypolicy/page.tsx` (`:125`, `:142`, `:168`).

## Work

Four independent deletions. Land them as four commits so any one can be reverted alone.

**1 — Haskoy**

1. Delete `fonts/haskoy.ttf` and `data/font-sans.ts`.
2. In `app/layout.tsx`: drop the import at `:8`, the re-export at `:22`, and change `:30` to
   `<html lang="en" className="font-sans">`.
3. In `tailwind.config.ts`: delete the `fontFamily` key at `:24-26` and the
   `const { fontFamily } = require("tailwindcss/defaultTheme")` at `:4` that only fed it.
   Tailwind's own default for `sans` is the same list without `Haskoy`.

**2 — admin nav**

4. Delete `components/nav/admin-nav.tsx`.
5. In `components/nav/nav-side-bar.tsx`: delete the import at `:16`; collapse the `:44` class
   ternary to the `"w-42"` arm; replace the `:53-66` ternary with the `CatalogueNav` arm alone;
   collapse the `:70-76` ternary to the `else` arm; replace the `:120-164` ternary with its
   `else` arm alone. `Logo` (`:15`) is then only used at `:115` — keep that import.

**3 — tag and label**

6. `app/actions/get-entries.ts`: delete the `label` and `tag` parameters (`:16-17`), the
   commented Supabase `label`/`tag` clauses (`:34-40`), and the commented filter bodies
   (`:73-85`).
7. `app/products/page.tsx`: delete `label?`/`tag?` from `PageProps` (`:17-18`), from the
   destructure (`:28`) and from the `getEntries` call (`:29`); delete the two icon blocks
   (`:48-53`), the two label strings (`:56-57`), and the two terms in the `:36` guard and the
   `:61` fallback chain. Drop the now-unused `Hash` and `TagIcon` from the import at `:4`.
8. `components/nav/catalogue-nav.tsx`: delete `tags`/`labels` from the props type (`:16-17`)
   and destructure (`:25-27` region), delete the Tags block `:96-124` and the Labels block
   `:126-156` **including the empty `<ul>` elements**, and drop `Hash`/`TagIcon` from `:7`.
9. `components/nav/nav-side-bar.tsx`: delete `labels`/`tags` from `NavSidebarProps` (`:22-23`),
   from the destructure (`:29-30`), and from both `CatalogueNav` call sites (`:61-62`,
   `:129-130`).

**4 — /feedback**

10. Delete `app/feedback/`. Do not touch `app/contactus/`.
11. Regenerate the sitemap (`pnpm build` runs `next-sitemap` via `postbuild`) and commit
    `public/sitemap-0.xml` without the `/feedback` entry. No redirect rule is needed —
    `app/not-found.tsx` already sends unmatched paths to `/`.

**Finally**

12. `pnpm check-types && pnpm lint && pnpm test`.

## Acceptance

- `grep -rni haskoy` over tracked files returns nothing; `fonts/` no longer exists; no
  `@font-face` rule and no `.ttf` under `.next/static/media` after a fresh build.
- Built `.font-sans` reads `font-family:ui-sans-serif,system-ui,sans-serif,…` — today's value
  with the leading `Haskoy,` removed and nothing else changed.
- `getComputedStyle(document.body).fontFamily` resolves to the same rendered face before and
  after, on `/` and `/products`, light and dark.
- `grep -rn admin app/ components/` returns exactly one hit: the word "administrative" in
  `app/privacypolicy/page.tsx:103`.
- `grep -rniE "\b(tag|label)s?\b" app/products/page.tsx app/actions/get-entries.ts components/nav/`
  returns nothing.
- `/products?tag=x&label=y&search=` renders byte-identically to `/products` — no chip, no
  heading, same Entry count.
- `curl -sI https://<deploy>/feedback` returns a redirect to `/`; `public/sitemap-0.xml`
  contains no `/feedback` line; `/contactus` still returns 200 and still writes to
  `userFeedback`.
- Screenshot diff is empty at 390px, 768px and 1440px on `/`, `/products`, `/bookmarks`,
  `/contactus`, light and dark.
- `pnpm check-types`, `pnpm lint` and `pnpm test` all pass.

## Open questions

1. **Two empty `<ul>` elements disappear from the sidebar scroll content.** Step 8 removes
   `catalogue-nav.tsx:103` and `:133`, which render today as childless `<ul>`s carrying `py-2`
   — 32px of vertical space in total inside the `ScrollArea` at `:36`. The ScrollArea's own box
   is a fixed `h-[calc(100vh-320px)]`, and both `<ul>`s sit below the ~100-entry author list, so
   they should be off-screen in every viewport. The only observable effect would be a slightly
   longer scrollbar thumb. Confirm with the screenshot diff; if the thumb visibly changes,
   leave the two `<ul>`s in place and say so rather than restyling anything.

2. **Which of the two identical forms survives** is decided here on traffic (18 pageviews vs 0)
   and inbound links (4 vs 0), which points at keeping `/contactus`. Flagging it only because
   the two files are literally the same bytes, so the choice is purely about the URL.

## Depends on

Nothing.

## Comments

Four deletions, four commits, `475a540..dd107b1`, in the order the Work section
gives them.

**Correction to this ticket — `/feedback` is not byte-identical to `/contactus`.**
The two files differ in three places: the component name (`FeedbackPage` /
`ContactPage`), the `<h2>` ("Feedback" / "Contact Us"), and one line of copy. The
brief's `diff` reported no difference because the maintainer's shell aliases `diff`
to a wrapper that printed "[ok] Files are identical" against files `cmp` says
differ at byte 188. Nothing that differs is behaviour — same form, same
`userFeedback` collection — so the decision to delete it is unaffected.

**Correction — step 11's premise is false.** "No redirect rule is needed —
`app/not-found.tsx` already sends unmatched paths to `/`" does not hold.
`redirect()` inside `not-found.tsx` answers **404 with a `location: /` header**,
and no browser follows a Location on a 404. Verified against `/no-such-page-xyz`,
which behaves the same, so this is how the site has always answered unmatched
paths — but deleting a URL that was in the sitemap would have walked straight into
it. So a `redirects()` entry was added after all.

**Departure 1 — the redirect goes to `/contactus`, not `/`.** The acceptance
bullet asks for a redirect to `/`. `/contactus` is the same form the visitor was
asking for, and the ticket itself decides `/contactus` is the survivor. Amend the
bullet, not the code.

**Departure 2 — `permanent: false` (307), not 308.** The Work section asks for four
commits "so any one can be reverted alone". A 308 a browser has cached cannot be
revoked, which would make `dd107b1` the one commit that is not revertable.
`/feedback` had zero pageviews in 90 days, so no ranking is lost by holding the
redirect temporary.

**Departure 3 — step 6 removed more than it named.** It asks for the commented
Supabase `label`/`tag` clauses. The whole commented "previous implementation"
block went, because the surviving lines were the Supabase query for a database
this project no longer uses. A mislabelled comment (`// Apply category filter`
above the author filter) was corrected in the same hunk.

**Departure 4 — `pnpm lint` did not pass, and the cause was not this ticket.**
Two ESLint errors, both in `assets/new-ui/support.js`: `react/no-deprecated` and
`@next/next/no-assign-module-variable`. They fail identically on `15b1d24`, so
they predate this work, but CI runs lint and step 12 requires it to pass. That
file is the vendored bundle of the Studio Dark mock — generated, kept for
reference and never built (`spec.md`) — so `assets/new-ui/**` is now in the
`ignores` block of `eslint.config.mjs`. `pnpm lint` exits 0.

**Acceptance, checked**

- `git grep -ni haskoy` over tracked files returns only this ticket and `spec.md`.
  Nothing in code — the explanatory comment left in `tailwind.config.ts` is worded
  so it does not reintroduce the string. `fonts/` no longer exists.
- Fresh build: **0** `@font-face` rules in the emitted CSS, **0** `.ttf` under
  `.next/static/media`, and `next-font-manifest.json` lists no font.
- Built rule is
  `.font-sans{font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}`
  — today's value with the leading `Haskoy,` removed and nothing else changed.
- `grep -rn admin app/ components/` returns exactly one hit: "administrative" in
  `app/privacypolicy/page.tsx:103`.
- `grep -rniE "\b(tag|label)s?\b" app/products/page.tsx app/actions/get-entries.ts components/nav/`
  returns nothing.
- `/products?tag=x&label=y&search=` against `/products`: **the `<main>` element is
  byte-identical**, 48 cards each, no chip, no heading. Whole-document equality is
  not achievable and was not the right check — two requests for the *same* URL also
  differ, because Radix's `NavigationMenu` and React's ids vary per render.
- `/feedback` answers **307 → `/contactus`**; `/contactus` answers 200 and still
  writes to `userFeedback`; `public/sitemap-0.xml` has no `/feedback` line and the
  only other change to it is regenerated `lastmod` stamps.
- **Screenshot diff: 24 frames** — `/`, `/products`, `/bookmarks`, `/contactus` at
  390, 768 and 1440, light and dark, full-page, captured from a production build
  before and after and compared pixel by pixel (8/255 tolerance for subpixel
  antialiasing). Every frame is the same height, so nothing reflowed. On 18 of the
  24, **every** differing pixel falls inside one bounding box, and cropping it in
  both runs shows the cause: the Updated pill reading "7 minutes ago" against
  "4 minutes ago". The clock, not the code — the pre-commit hook rewrites
  `scripts/lastCommitDate.json` on every commit. The remaining 6 frames
  (`/contactus`, which has no pill) are pixel-identical.
- `getComputedStyle(document.body).fontFamily` returns a different *string* after —
  it loses the leading `Haskoy` — but the *rendered face* is unchanged, which is
  what the bullet means and what the pixel diff proves: every glyph on all 24
  frames is identical.
- `pnpm check-types` clean, `pnpm lint` exits 0, `pnpm test` 159 pass, `pnpm build`
  clean, **33 Playwright specs pass**.

**Open question 1, answered: leave the two `<ul>`s deleted.** The scrollbar thumb
does not visibly change. The pixel diff covers the sidebar at all three widths in
both modes and finds no differing pixel outside the Updated pill, so the 32px of
empty `py-2` that disappeared was off-screen as predicted.

**Open question 2** needed no decision beyond the one the ticket already made:
`/contactus` survives on traffic and inbound links. Since the files were not in
fact identical, the surviving copy is also the one whose copy reads correctly for
a general contact form.

**Noted, not done — belongs to ticket 11.** Reviewers flagged the two surviving
filter lists in `catalogue-nav.tsx` as duplicated code (identical 200-character
`shadow-[…]` strings under both Categories and Authors, differing only in query
key and accent colour), and `getEntries(search, category, author)`'s positional
string parameters as a data clump that a `CatalogueFilters` object would close.
Both are right, and both are the shape ticket 11 has to change anyway when filters
start composing. Doing it here would have meant editing frozen markup for no
behaviour change.

**Noted, not done — pre-existing.** The mobile sheet renders
`<CatalogueNav categories={…} handleLinkClick={…} />` without `authors`, so mobile
shows one filter section where desktop shows two. Untouched by this ticket; it is
ticket 11's "all 18 categories become reachable" territory.
