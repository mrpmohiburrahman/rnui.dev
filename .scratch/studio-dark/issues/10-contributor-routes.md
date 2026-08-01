# 10 — Contributor routes

Status: ready-for-agent
Blocked by: 01, 02, 05

Line numbers in `app/`, `components/`, `data/` and `lib/` were read before ticket 01 ran. The
rename moves `data/entry.ts` to `data/recording.ts`, `components/entry-detail.tsx` to
`components/recording-detail.tsx` and `app/actions/get-entries.ts` to
`app/actions/get-recordings.ts`, so expect a rebase in those files. The vocabulary below is the
post-rename one throughout.

## Problem

The mock draws two links that go nowhere, and this repo has nothing for either of them to point
at.

The first is in the rail. `assets/new-ui/Catalogue.dc.html:56` draws
`<a href="#" …>All 24 contributors →</a>` under a list that shows four of them
(`hint-placeholder-count="4"` at `:49`, under the heading `CONTRIBUTORS · 24` at `:47`). The
second is in the Recording detail. `assets/new-ui/Detail.dc.html:61` draws
`148 of the 277 recordings here are theirs. <a href="#" …>See all 148 →</a>` inside the
contributed-by panel that starts at `:51`.

Both are `href="#"` in the mock because a mock has no router. `spec.md:113` decision 2 says what
happens next: *"The mock ships as drawn, and gains whatever features make it work … `See all
148 →` is drawn, so it has a destination. Nothing on screen lies."*

**There is no Contributor route.** `find app -name page.tsx` returns exactly nine files —
`app/aboutus/page.tsx`, `app/bookmarks/page.tsx`, `app/contactus/page.tsx`,
`app/entry/[id]/page.tsx`, `app/page.tsx`, `app/privacypolicy/page.tsx`,
`app/products/page.tsx`, `app/subscribe/page.tsx`, `app/termsofservice/page.tsx`. (`app/actions/`
is the only other directory under `app/` and holds `"use server"` modules, not a route.) Nothing
addresses a Contributor, and nothing lists them.

**A Contributor is not even a link today, outside the rail.**
`components/entry-detail.tsx:101` renders the whole of it:
`<p className="text-gray-700 dark:text-gray-300">{entry.author}</p>` — plain text. The only place
in the site that links a Contributor at all is `components/nav/catalogue-nav.tsx:191`, and that
link is one of the four the rail draws.

**Half of the second link already exists, and that changes what this ticket has to build.** After
ticket 01, `?contributor=` is the canonical spelling of a Contributor filter:
`app/products/page.tsx` reads it off `searchParams` and `app/actions/get-entries.ts:57-62` applies
it with `entry.author.toLowerCase() === author.toLowerCase()` — becoming
`recording.contributor.toLowerCase() === contributor.toLowerCase()`. So *"all of a Contributor's
Recordings"* is already a working address. What does not exist is the index: the 23 (see below)
Contributors with their Recording counts, in one place.

**And one measured data defect that this ticket is the first surface to expose.** Counted over
`data/*.ts` on HEAD, the 277 `author: "…"` fields hold 24 distinct strings — but two of them are
the same person:

- `data/buttons.ts:8` and `data/misc.ts:130` say `author: "Pushkar Tandon"`.
- `data/fullapps.ts:23` says `author: "Pushkar Tandon "`, with a trailing space.

`getUniqueAuthors()` (`data/entry.ts:19-22`) does `Array.from(new Set(...))` on the raw strings, so
it returns both, and the mock's `24` is that inflated count. The rail never showed it — ticket 05
draws the top four, and Pushkar Tandon is not among them — but an index that lists all of them
draws two rows reading `Pushkar Tandon`, side by side, pointing at two different addresses and
holding two different numbers. That is precisely the lie decision 2 forbids, and it is also why
this ticket cannot dodge the question of what identifies a Contributor.

## Work

### Decide the two destinations first, because everything else follows from them

**The index is `/contributors`.** Ticket 05 step 9 already fixed that string into the rail's link
(`05-rail-categories-and-contributors.md:214-217`), so it is settled, and it is right: it is the
plural of the `?contributor=` parameter, it is flat like `/bookmarks`, and it collides with none of
the 18 legacy paths in `middleware.ts:24-43`.

**`See all 148 →` points at `/products?contributor=…`. There is no `/contributors/[slug]`.** Four
reasons, in the order they killed the idea:

1. **A slug cannot identify a Contributor in this data.** `Pushkar Tandon` and `Pushkar Tandon `
   collapse to the same slug under every slugifier, because the only thing separating them is
   trailing whitespace. Three more names have no lossless Latin form: `Daehyeon Mun (문대현)`
   loses `문대현` entirely under NFKD-then-strip, `Epicode | 0xV` contains a pipe, and
   `Kacper Kapuściak` and `Enes Öztürk` need transliteration. `Enzo Manuel Mangano ( Reactiive )` —
   the name this ticket was asked about — slugs cleanly to `enzo-manuel-mangano-reactiive`, but a
   scheme that works for 22 of 23 names and silently merges the 23rd is not a scheme. Every one of
   those names is exact and unambiguous inside `?contributor=`:
   `/products?contributor=Enzo+Manuel+Mangano+%28+Reactiive+%29`,
   `/products?contributor=Daehyeon+Mun+%28%EB%AC%B8%EB%8C%80%ED%98%84%29`,
   `/products?contributor=Epicode+%7C+0xV`.
2. **A second address for the same Recordings is a canonicalisation problem, and ticket 01 already
   refused to create one.** `01-rename-to-recording-and-contributor.md:158-172` chose a
   `permanentRedirect` over serving the same filtered catalogue at both `?author=` and
   `?contributor=`, *"so there is one canonical spelling of a filtered catalogue"*. A dedicated
   route would put that back.
3. **Public URLs are expensive to keep.** ADR-0004:14 names `/products` and `?category=` as
   *"public links that `middleware.ts` exists specifically to keep alive"*, and `spec.md:143-144`
   restates it as a constraint. A dedicated route means 23 more of those, plus its own
   `generateMetadata`, its own `generateStaticParams`, its own sitemap entries and a slug→name map
   that has to stay in step with the data — all so a visitor can reach a filter they can already
   reach.
4. **It buys one thing, and this effort is not chasing it.** A static `/contributors/[slug]` would
   land in the sitemap; `/products?contributor=…` never will, because `/products` itself is not in
   the sitemap today (see step 5). Discoverability is not among `spec.md:125-129`'s four goals, and
   `/products` — the whole catalogue — has been absent from the sitemap all along.

So this ticket builds one new route. `/contributors` is the eleventh route in a site
`spec.md:112` counted as ten, and the mock does not draw it, so its layout is derived rather than
ported and checkpoint 3's rule applies to it by construction — see step 10.

### The steps

1. **Delete one space: `data/fullapps.ts:23`, `contributor: "Pushkar Tandon "` →
   `contributor: "Pushkar Tandon"`.** Fix it at the source rather than trimming in three
   derivations — `getUniqueContributors()`, `RECORDINGS_PER_CONTRIBUTOR` and the filter comparison
   in `app/actions/get-recordings.ts:57-62` would each need their own `.trim()`, and any fourth
   reader added later would need a fourth.

   **This makes the derived Contributor total 23, not 24, and that is a real consequence to carry
   rather than hide.** Counted after the fix, the 277 Recordings distribute over 23 Contributors,
   in `contributorsByCount()` order (count descending, `localeCompare` tie-break — ticket 05
   step 2): `Enzo Manuel Mangano ( Reactiive )` 124, `Hewad Mubariz` 31, `Daniel Friyia` 19,
   `Arunabh Verma` 16, `Konstantinos Efkarpidis` 11, `William Candillon` 10, `Alireza Hadjar` 8,
   `Kacper Kapuściak` 8, `Thomino` 7, `Aashu Dubey` 6, `Alek Mikucki` 6, `Aswin C` 5,
   `Daehyeon Mun (문대현)` 4, `Andreev Danila` 3, `Lucas Lima` 3, `Pushkar Tandon` 3,
   `Yassire Mtioui` 3, `Arnaud Dellinger ( evening kid )` 2, `Enes Öztürk` 2, `Epicode | 0xV` 2,
   `Zakaria Kerkeb` 2, `Hubert Ryan` 1, `Wahab Balogun` 1. They sum to 277, and the rail's top four
   are unchanged.

   The rule that settles this is ticket 05's own, written for the same rail:
   *"Take the shape from the mock and the numbers from `allEntries`"*
   (`05-rail-categories-and-contributors.md:38-39`). The mock's `24` is a number, and the data says
   23. It also does not touch the inner spaces of `Enzo Manuel Mangano ( Reactiive )`, which ticket
   05 established are load-bearing because that string is the filter key (`:40-42`) — trailing
   whitespace is the only thing removed.

   Four follow-on edits belong to this step, because leaving them makes the site contradict itself:
   `05-rail-categories-and-contributors.md`'s acceptance bullet asserting `CONTRIBUTORS · 24`,
   `06-hero-stats-and-headings.md`'s `24 CONTRIBUTORS` stats figure,
   `04-shell-header-and-footer.md`'s counter line (`277 recordings · 24 contributors · updated 13h
   ago`, and its `277 · 24 · 13H AGO` phone form) and
   `11-mobile-bottom-sheet-and-header.md`'s `CONTRIBUTOR · 24` sheet label all become 23. No ticket
   hardcodes
   the number — 05 step 3 says *"`contributors.length` is the `24` in both the section label and
   the link, so no separate total prop can drift from the list"* — so only the assertions move, not
   the code. If the maintainer would rather keep `24`, the only way to do it is to keep two rows
   both reading `Pushkar Tandon`; say so and stop, rather than restoring the space quietly.

   `pnpm assets:paths` must be byte-identical across this change. The edited field is a
   Contributor name, not an Asset path; `demoPath` and `posterPath` on that record are untouched,
   and ADR-0003 keeps them so.

2. **Pin the whitespace rule in `tests/data-integrity.test.ts`.** Add one `it()` beside the
   required-fields case at `:35-42` asserting that no Recording's `contributor` differs from its
   own `.trim()`, listing the offenders in the failure message the way `:30` and `:44-46` do. ADR-
   0005 makes this suite the independent statement of the data rules, so the guard goes here rather
   than in the route: a submission PR that reintroduces a padded name should fail the data suite,
   not silently split a Contributor in two on a page nobody is looking at.

3. **`app/contributors/page.tsx` — the index, as a server component that touches no Firestore.**
   Import `contributorsByCount()` from `data/recording.ts` (ticket 05 step 2) and `allRecordings`
   for the 277. Do **not** call `getRecordings()` — the counts it
   merges are irrelevant to a directory, it is a whole-collection Firestore read
   (`app/actions/get-entries.ts:13-16`), and awaiting anything request-scoped is what keeps `/` and
   `/products` out of the sitemap. This page reads module-scope arrays only, so it prerenders.

   Layout, every value taken from a drawn element:

   - **Heading row**, the catalogue's own (`Catalogue.dc.html:87-90`):
     `display:flex; align-items:baseline; justify-content:space-between; gap:16px;
     padding-bottom:14px`. On the left an `<h1>` — the element differs from the catalogue's `<h2>`
     because this is the document's only top-level heading — styled
     `margin:0; font-size:17px; font-weight:500; letter-spacing:-0.01em; color:t1`
     (`headSize: 17` at `Catalogue.dc.html:251`, and the Specimen's `17 / 500 · section head`),
     reading `Contributors`. On the right, mono
     `font-size:10px; letter-spacing:0.1em; color:t3; min-width:180px; text-align:right;
     font-variant-numeric:tabular-nums`, reading
     `${contributors.length} CONTRIBUTORS · ${allRecordings.length} RECORDINGS` — `23
     CONTRIBUTORS · 277 RECORDINGS` today. Both numbers derived, never typed; caps because it is a
     mono counter, per ticket 01 step 13's casing rule.
   - **One sentence under it**, in the hero paragraph's type
     (`margin:9px 0 0; font-size:13px; line-height:1.5; color:t2; max-width:520px`,
     `Catalogue.dc.html:64`): `Every recording here belongs to its contributor. Open a name to see
     all of theirs.` This copy is invented, not ported — it is the only invented string on the page
     and it is what step 10's checkpoint is mostly for.
   - **The list**, `display:flex; flex-direction:column; gap:6px; max-width:720px`. The gap is the
     mobile sheet's Contributor list (`CatalogueMobile.dc.html:65`); the 720px bound is the mock's
     own bound for a block of prose-width content inside `main` (`Catalogue.dc.html:97`).
   - **A row** is the mobile sheet's Contributor row (`CatalogueMobile.dc.html:67`), which is the
     only full-width Contributor row the mock draws:
     `display:flex; align-items:center; gap:8px; min-height:38px; padding:0 11px;
     border-radius:9px; border:1px solid line; font-size:12.5px; color:t2`. The name takes
     `overflow-wrap:anywhere` — the rail's rule for a Contributor (`Catalogue.dc.html:51`), and
     ticket 05 (d) rejected truncating these names on the evidence that
     `Enzo Manuel Mangano ( Reactiive )` and `Konstantinos Efkarpidis` are unreadable when cut. The
     count sits at `margin-left:auto; flex:none`, mono `font-size:10px; color:t3`
     (`CatalogueMobile.dc.html:67`).

   | | rest | hover | focus-visible |
   |---|---|---|---|
   | border | `line` — `rgba(255,255,255,0.11)` dark / `rgba(16,18,22,0.13)` light | `acc` — `#6FE3CC` / `#0E7062` | unchanged |
   | background | `transparent` | `accSoft` — `rgba(111,227,204,0.13)` / `rgba(14,112,98,0.09)` | unchanged |
   | name | `t2` — `#B2B8C2` / `#4F545C` | `t1` — `#F1F2F4` / `#14161A` | unchanged |
   | count | `t3` — `#8E949F` / `#666B74` | `acc` | unchanged |
   | outline | `none` | `none` | `3px solid acc`, `outline-offset:2px` |

   The hover treatment is the sheet's own selected row (`CatalogueMobile.dc.html:66`) reused for
   hover, because this page has no applied state — nothing is filtered here, every row is just a
   link. Transition `120ms ease-out` on `background-color`, `border-color` and `color`, the
   Specimen's figure for *"Filter chip add / remove"* (`Specimen.dc.html:163`); a directory row is
   that control. `:focus-visible` and not `:focus`, and the ring is
   `Catalogue.dc.html:78`'s `outline:3px solid acc; outline-offset:2px` — the same rule ticket 05
   step 11 applies to a rail row, so tabbing between the rail and this page does not change what a
   focus ring looks like.

   No avatars, no social links and no sort control. The socials in the data (`twitterId`,
   `linkedInId`, `githubId` at `data/entry.ts:31-33`) are per Recording, not per Contributor, so a
   Contributor-level social link would have to pick one of their Recordings arbitrarily; the detail
   panel is where those belong and ticket 09 owns it.

4. **The row's href and its event.** Each row links to
   `` `/products?${new URLSearchParams({ contributor: name })}` `` — one `URLSearchParams`, no
   helper, and it produces byte-for-byte what `facetHref` (`components/nav/catalogue-nav.tsx:58-67`)
   produces for a visitor arriving with no other filter, so the rail and the index cannot drift.
   For the four largest that is `/products?contributor=Enzo+Manuel+Mangano+%28+Reactiive+%29`,
   `/products?contributor=Hewad+Mubariz`, `/products?contributor=Daniel+Friyia`,
   `/products?contributor=Arunabh+Verma`.

   The click fires `filterApplied("contributor", name, 1)` (`lib/analytics.ts:129-139`, `facet`
   becoming the `Facet` union's second member after ticket 01 step 6). `active_filter_count` is
   literally `1`, not a computed value: a link from this page always lands on a URL whose only
   parameter is `contributor`. Without the event, every Contributor filter set from the index would
   be invisible to `posthog-expansion` ticket 09's dashboard `1937576`, which reads `filter_applied`
   by name — a filter arriving with no event is worse than no page, because it makes the funnel
   wrong rather than merely incomplete.

   `posthog-js` cannot be called from a server component, so the rows live in one small
   `"use client"` component in the same file or beside it. Keep the page itself a server component:
   the 23 names and counts then stay in the HTML rather than in the bundle.

5. **Metadata, Open Graph and the sitemap — most of which is already handled, and the ticket says
   so rather than adding files.**

   `export const metadata: Metadata` on the route, with `title` and `description` and an
   `openGraph: { title, description }` carrying the same two strings. Root metadata
   (`data/meta-data.ts`, re-exported at `app/layout.tsx:20`) sets `metadataBase` and a site-wide
   title, and its `socialMediaTags` key is not part of Next's `Metadata` type and is ignored — so a
   route that wants its own card has to say so, exactly as `app/entry/[id]/page.tsx:29-42` does.

   **No new OG image.** `app/opengraph-image.tsx` is a root file-convention image and applies to
   every descendant route that does not override it, so `/contributors` inherits it without a line
   of code. Note in passing, and do not fix here: that image's own copy reads
   `343+ animations across Reanimated, Skia, Moti, Gesture Handler, and Lottie`
   (`app/opengraph-image.tsx:47`), which is neither 277 nor true. It is a decision-2 violation on
   every route at once and belongs with whoever next opens that file, not with this ticket.

   **Nothing to configure in `next-sitemap.config.js`.** It names only `siteUrl` and
   `generateRobotsTxt` and reads routes out of the build; `postbuild` runs `next-sitemap`
   (`package.json:18`). The measured behaviour: the generated `public/sitemap-0.xml` on this branch
   holds 285 `<loc>` entries — 277 `/entry/<id>` plus `/aboutus`, `/bookmarks`, `/contactus`,
   `/privacypolicy`, `/subscribe`, `/termsofservice`, `/opengraph-image.png` and
   `/twitter-image.png` — and neither `/` nor `/products`, both of which `await searchParams`
   (`app/page.tsx:9-11`, `app/products/page.tsx:24`) and so are rendered on demand. `/bookmarks` is
   in it and is `"use client"`, which is why step 4's client rows cost nothing here. A statically
   rendered `/contributors` therefore lands in the sitemap for free, and step 3's "no Firestore
   call" is what keeps it that way.

   Do not edit the committed `public/sitemap-0.xml` or `public/sitemap.xml` by hand. They are build
   artefacts that happen to be tracked, and they are already stale: `git show
   main:public/sitemap-0.xml` still lists `/feedback`, a route with no `page.tsx` in the tree.
   (The 277 `/entry/` entries exist only in this branch's copy, which is consistent with ticket 01's
   finding that `main` has never served one.)

   **Nothing in `middleware.ts`.** Its `matcher` (`:24-43`) is a statically-parsed list of the 18
   legacy Category paths and exists solely to serve `LEGACY_REDIRECTS` (`data/categories.ts:68-70`).
   `/contributors` is a new address with no legacy spelling to redirect from, and adding it would
   run middleware on a route that only ever renders itself. Ticket 01 step 8 refused to add
   `/products` to that matcher for the same reason.

6. **The detail sentence, in `components/recording-detail.tsx`.** Beside the Contributor's name —
   `components/entry-detail.tsx:100-102` today, inside the panel ticket 09 builds from
   `Detail.dc.html:51-62` — render the mock's sentence with real numbers:

   > `{n} of the {total} recordings here are theirs.` followed by a link reading
   > `See all {n} →`

   styled as drawn at `Detail.dc.html:61`:
   `padding-top:8px; font-size:11.5px; line-height:1.45; color:t2`, with the link
   `color:acc; text-decoration:underline; text-underline-offset:3px` and
   `:focus-visible { outline:3px solid acc; outline-offset:3px; border-radius:3px }`
   (`Detail.dc.html:57` — 3px offset here, not the row's 2px, because this is an inline text link
   and that is what the mock draws on every one of them).

   `n` is `RECORDINGS_PER_CONTRIBUTOR[recording.contributor]` and `total` is
   `allRecordings.length`. Both are module-scope lookups in a module already in the client graph
   (`app/actions/get-entries.ts:18-22` records that `data/entry.ts` is), so this adds no fetch and
   no prop. The mock's own numbers are `148` and `277`; the real ones for that Recording's
   Contributor are **124** and 277, and the data wins for the same reason as step 1.

   The href is step 4's, and the click fires the same `filterApplied("contributor", …, 1)`.
   `components/entry-detail.tsx` is already `"use client"` (`:12`) and already imports from
   `lib/analytics` (`:17`), so this is one import and one handler.

7. **A Contributor with one Recording.** Two of the 23 have exactly one — `Hubert Ryan` and
   `Wahab Balogun` — so `1 of the 277 recordings here are theirs. See all 1 →` is a sentence the
   site would print today. It reads as broken English and as a broken link. The singular wording is
   ticket 09's, written once at `09-detail-overlay-and-shared-link.md:262-264`; step 6 renders
   whatever 09 specifies for `n === 1` and this ticket writes no rule of its own. For `n > 1` the
   mock's sentence stands unchanged.

   Nothing special is needed on the index — the count column simply reads `1` — and nothing is
   needed for `n === 0`, which cannot occur: the Contributor list is derived from the Recordings
   themselves (`data/entry.ts:19-22`), so a Contributor with no Recordings has no row.
   `/products?contributor=Wahab+Balogun` renders one tile through the ordinary grid.

   The related gap is ticket 09's, not this one's: `MORE FROM THIS CONTRIBUTOR`
   (`Detail.dc.html:80`) draws two tiles, and for these two Contributors there is nothing to put
   there. Name it in 09; do not solve it here.

8. **One Playwright spec, `tests/e2e/contributors.spec.ts`.** It asserts the three things that
   would otherwise regress silently: that `/contributors` renders one row per Contributor with the
   counts summing to `allRecordings.length`; that clicking `Hewad Mubariz` lands on
   `/products?contributor=Hewad+Mubariz` with 31 cards; and that no two rows carry the same
   accessible name, which is the assertion that catches step 1 being reverted. Follow
   `tests/e2e/filters.spec.ts`'s existing shape for the count assertion rather than inventing a
   helper.

9. **Record why there is no `/contributors/[slug]`, in a comment at the top of
   `app/contributors/page.tsx`.** Two or three sentences: that a Contributor's identity is the
   exact string in `contributor`, that a slug cannot carry it (name `Pushkar Tandon` and
   `Daehyeon Mun (문대현)` as the two failure modes), and that `?contributor=` is therefore the only
   address for one Contributor's Recordings. A comment rather than an ADR: ticket 01 step 16 is
   already writing `docs/adr/0008-the-domain-is-recording-and-contributor.md`, and if the maintainer
   wants this recorded formally it is a paragraph in that ADR's Consequences rather than an
   `0009`.

10. **Stop before shipping the layout.** `/contributors` is not one of the five routes
    `spec.md:112` names as undrawn, but the mock does not draw it either, and `spec.md:164-166`
    checkpoint 3 exists for exactly this: *"Their designs are invented rather than ported. Present
    them; do not ship them unreviewed."* Present the page in both modes, together with step 1's
    23-versus-24 consequence, and get both signed off before deploy B. The code, the tests and the
    data fix can all land first — this is a review gate, not a build gate.

## Acceptance

- `grep -c 'contributor: "Pushkar Tandon "' data/fullapps.ts` returns 0, and
  `getUniqueContributors()` returns 23 strings. `pnpm test` passes, including the new
  `data-integrity` case, which fails if the trailing space is restored.
- `pnpm assets:paths` is byte-identical to its output before step 1's edit.
- `/contributors` renders 23 rows in the order `Enzo Manuel Mangano ( Reactiive )` 124,
  `Hewad Mubariz` 31, `Daniel Friyia` 19, `Arunabh Verma` 16, `Konstantinos Efkarpidis` 11,
  `William Candillon` 10, `Alireza Hadjar` 8, `Kacper Kapuściak` 8, `Thomino` 7, `Aashu Dubey` 6,
  `Alek Mikucki` 6, `Aswin C` 5, `Daehyeon Mun (문대현)` 4, `Andreev Danila` 3, `Lucas Lima` 3,
  `Pushkar Tandon` 3, `Yassire Mtioui` 3, `Arnaud Dellinger ( evening kid )` 2, `Enes Öztürk` 2,
  `Epicode | 0xV` 2, `Zakaria Kerkeb` 2, `Hubert Ryan` 1, `Wahab Balogun` 1. The counts sum to 277
  and no two rows carry the same text.
- The heading reads `Contributors` in a single `<h1>`, and the mono line beside it reads exactly
  `23 CONTRIBUTORS · 277 RECORDINGS`.
- No Contributor name on `/contributors` is rendered with a trailing `...`, and
  `Enzo Manuel Mangano ( Reactiive )` renders in full at 1440px.
- Each row's `href` is `/products?contributor=<value>` and nothing else. Specifically
  `/products?contributor=Enzo+Manuel+Mangano+%28+Reactiive+%29`,
  `/products?contributor=Daehyeon+Mun+%28%EB%AC%B8%EB%8C%80%ED%98%84%29` and
  `/products?contributor=Epicode+%7C+0xV` each load and show 124, 4 and 2 cards respectively.
- Clicking a row fires one `filter_applied` with `facet: "contributor"`, the exact name as `value`
  and `active_filter_count: 1`. Verified in the PostHog debug view or a network capture, not by
  reading the code.
- Tab reaches all 23 rows in document order and each draws a 3px accent ring at 2px offset;
  clicking a row with a mouse draws no ring. Hovering a row moves its border to `acc`, its
  background to `accSoft`, its name to `t1` and its count to `acc`, over 120ms.
- The rail's `All 23 contributors →` link (ticket 05 step 9) resolves — no 404 — and its count
  matches the number of rows on the page it lands on.
- On the detail for a Recording by `Enzo Manuel Mangano ( Reactiive )` the sentence reads
  `124 of the 277 recordings here are theirs.` and the link reads `See all 124 →`. That link lands
  on `/products?contributor=…` and fires `filter_applied` with `active_filter_count: 1`.
- `pnpm build` lists `/contributors` as `○` (prerendered) in the route table, and after `postbuild`
  the regenerated `public/sitemap-0.xml` contains `<loc>https://www.rnui.dev/contributors</loc>`.
  The committed sitemap files carry no hand edits.
- The built HTML of `/contributors` carries a route-specific `<title>` and
  `<meta name="description">`, and an `og:image` inherited from `app/opengraph-image.tsx`.
- `git diff middleware.ts next-sitemap.config.js` is empty.
- `app/contributors/page.tsx` carries the comment from step 9, naming the slug collision.
- `pnpm check-types`, `pnpm lint` and `pnpm test:e2e tests/e2e/contributors.spec.ts` all exit 0.

## Depends on

**01**, hard. Every identifier and every string here is post-rename: the route is `/contributors`,
the parameter is `?contributor=`, the field is `recording.contributor`, the analytics facet is
`"contributor"` (`lib/analytics.ts:29`, whose union reads `"category" | "author"` today), and the
detail file is `components/recording-detail.tsx`. Building this before 01 means writing `author` in
all of them and rewriting it days later — and it would mint `/contributors` as a public URL in the
old vocabulary's site, which is the thing `spec.md:94-100` sequenced the rename first to avoid.

**02**, hard. The page's every colour is a token that does not exist yet — `line`, `accSoft`,
`acc`, `t1`, `t2`, `t3` — and both the heading's 17px and the count's 10px are in the mono and sans
faces 02 registers. `app/globals.css` today defines a neutral shadcn palette and
`tailwind.config.ts` has no `fontFamily` override, so building this first means hard-coding
`#6FE3CC` and `rgba(111,227,204,0.13)` into a route and giving the site a second source of truth
for its palette.

**05 is a coupling in both directions and, strictly, the spec's table is wrong to leave this row
blank.** Ticket 05 step 2 adds `contributorsByCount()` and `RECORDINGS_PER_CONTRIBUTOR` to
`data/recording.ts`; this ticket's index and its detail sentence read both. 05 writes them and this
ticket only reads them, so 05 lands first and they are never written twice. In the other
direction, 05 step 9
hardcodes `/contributors` as the rail's only link to this route and says *"ticket 10 must land
before deploy B or decision 2 is broken by the one link the mock draws to it"*, and step 1 here
changes the number in 05's own `CONTRIBUTORS · 24` label and its acceptance.

**06** shares step 1's consequence and nothing else: its stats row reads `24 CONTRIBUTORS` and
becomes 23. The value is derived from `contributors.length`, so only the assertion moves. **04**
and **11** share it too, in their counter line and their sheet label — step 1 names all four.

**09 renders the panel this ticket's sentence sits in**, and is not a blocker in either order. If
09 lands first, step 6 edits the styled contributed-by block; if 10 lands first, the sentence goes
in beside `components/entry-detail.tsx:101`'s bare `<p>{entry.author}</p>` as plain content and 09
restyles around it. The one thing 09 must pick up separately is the empty
`MORE FROM THIS CONTRIBUTOR` strip for the two Contributors with a single Recording.

**11 owns the only reachability gap.** `CatalogueMobile.dc.html:64-68` draws the phone sheet's
`CONTRIBUTOR · 24` section with two rows and **no** `All … contributors →` link, so as drawn there
is no route to `/contributors` on a phone at all. That is ticket 11's call — the sheet's own list
may be judged enough — but it should be a decision rather than an oversight, and the count in that
label is 23 as well.

## Comments
