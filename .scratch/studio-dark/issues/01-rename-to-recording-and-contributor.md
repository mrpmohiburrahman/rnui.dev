# 01 — Rename the domain to Recording and Contributor

Status: ready-for-human

## Problem

The glossary calls a catalogue record an **Entry** and the person who made it an `author`
(`CONTEXT.md:9-11`, `data/entry.ts:29`). The design this effort builds calls neither of those
things by those names, anywhere it names them: `RN UI RECORDINGS` in the header
(`assets/new-ui/Catalogue.dc.html:16`), `CONTRIBUTORS · 24` above the rail's list (`:47`),
`All 24 contributors →` under it (`:56`), `277` `RECORDINGS` and `24` `CONTRIBUTORS` in the
stats row (`:68-69`), `Remove contributor filter` as the chip's aria-label (`:79`),
`Tap ◇ Save on any recording to keep it here.` in the empty-saved state (`:119`),
`Search 277 recordings` as the search placeholder (`:230`), `← All recordings` on the detail
(`assets/new-ui/Detail.dc.html:15`), `MORE FROM THIS CONTRIBUTOR` below it (`:80`), and
`This recording won’t play in your browser. The source is still there.` on the failed tile
(`assets/new-ui/Tile.dc.html:22`). The Specimen even names the type role `contributor, body-sm`
(`assets/new-ui/Specimen.dc.html:142`) and the E1 elevation
`emission — a playing tile, tinted by its own recording` (`:152`).

Building ten routes of that copy on top of a type called `Entry` and a field called `author`
gives the repo two vocabularies at once. That is the exact failure ADR-0004 was written to stop:
*"a reader who learns the vocabulary from `CONTEXT.md` and then opens `data/items.ts` currently
learns it twice"* (`docs/adr/0004-code-uses-the-glossarys-names.md:3`). ADR-0004 also rejected
deferring the rename into the work that rewrites those files, *"to avoid a period in which half
the codebase speaks each vocabulary"* (`:8`). Doing it after the Studio Dark build would create
exactly that period, across ten routes instead of three.

The rename is also on a clock, and two of the three names the spec calls free really are:

- **`/entry/[id]`.** 277 addresses, prerendered at build from `data/catalogue.ts`
  (`app/entry/[id]/page.tsx:21-23`, `dynamicParams = false` at `:27`).
  `git ls-tree -r --name-only main` lists no `app/entry/` path at all, so not one of the 277 has
  ever been served, shared or indexed. Renaming the segment today costs a `git mv`; renaming it
  after deploy A costs 277 redirects.
- **`entry_id`.** The property on all thirteen events (`lib/analytics.ts:36-41`).
  `lib/analytics.ts` is likewise absent from `main`, so PostHog has ingested none of them.
  Renaming an event property before its first event is a commit; afterwards it is a property
  migration against ingested data, and `posthog-expansion` ticket 09's dashboard `1937576`
  reads the old spelling as a hole rather than an error.

Measured on HEAD today, the size of the change is: 58 files under
`app/ components/ data/ hooks/ lib/ scripts/ tests/` carry an `Entry`/`entry`/`entries` token
(`grep -rlwIE 'Entry|entry|entries|Entries' --include='*.ts' --include='*.tsx' --include='*.js' app components data hooks lib scripts tests | wc -l`),
and 377 whole-word `author`/`authors` occurrences live in `*.ts`/`*.tsx`, 282 of them in
`data/`. 277 of those are one `author: "…"` field per record, over 24 distinct values — which is
exactly the `277 RECORDINGS · 24 CONTRIBUTORS · 18 CATEGORIES` the mock's header prints
(`assets/new-ui/rnui Studio Dark.dc.html:16`). The spec's checkpoint 1 quotes 57 files and 356
occurrences; the difference is a handful of commits, and it does not change what the checkpoint
is for.

**One correction to the spec, and it changes a step.** `spec.md:96` calls `?contributor=`
"new in ticket 11, not deployed". The *composition* is new; the *parameter* is not.
`main:components/nav/catalogue-nav.tsx:77` already writes
``href={`/products?author=${encodeURIComponent(author)}`}`` and `main:app/products/page.tsx:19`
already reads `author?: string` off `searchParams`. `?author=` is live on the deployed branch.
It is less exposed than `?category=` — `main:app/layout.tsx:55` wraps the sidebar in
`<Suspense fallback={<div>Loading sidebar...</div>}>` and `main:components/nav/nav-side-bar.tsx`
calls `useSearchParams()` at module top, so the served document carries the fallback and a
crawler that does not execute JavaScript never saw the 24 links. But a rendering crawler did,
and a visitor can have bookmarked one. So `?contributor=` still ships as the canonical spelling;
`?author=` is kept alive on precisely ADR-0004's reasoning for `/products` and `?category=` —
*"public links that `middleware.ts` exists specifically to keep alive"* (`:14`).

## Work

Do all of this in one commit. A half-renamed tree is the state ADR-0004:8 refused to create.

1. **Capture the snapshot the checkpoint is judged on, before touching a file.**
   `pnpm assets:paths > /tmp/asset-paths-before.txt`. It prints 554 lines today (277 Demos +
   277 Posters) and hashes to
   `6c98ad304e952cdeea03789f772574ca83d87bb3bdf32cedb668edac10a0694d`. ADR-0004:13 says why this
   and not a read: *"the diff cannot be reviewed by reading — 558 mechanical lines all look
   correct"*. Capture it at the commit the rename starts from, not from memory of this ticket.

2. **`git mv` the ten files**, so `git log --follow` survives:
   `data/entry.ts` → `data/recording.ts`;
   `lib/entry-search.ts` → `lib/recording-search.ts`;
   `app/actions/get-entries.ts` → `app/actions/get-recordings.ts`;
   `app/entry/[id]/page.tsx` → `app/recording/[id]/page.tsx`;
   `components/entry-card.tsx` → `components/recording-card.tsx`;
   `components/entry-card-grid.tsx` → `components/recording-card-grid.tsx`;
   `components/entry-detail.tsx` → `components/recording-detail.tsx`;
   `components/entry-overlay.tsx` → `components/recording-overlay.tsx`;
   `tests/entry-search.test.ts` → `tests/recording-search.test.ts`;
   `tests/e2e/entry-route.spec.ts` → `tests/e2e/recording-route.spec.ts`.
   Remove the now-empty `app/entry/` directory. Every `@/data/entry`, `@/lib/entry-search`,
   `./entry-card` and `../actions/get-entries` import moves with them.

3. **`data/recording.ts` becomes the type home for `Recording`.** `export type Entry` → `export
   type Recording` (`data/entry.ts:24`), and the field `author: string` → `contributor: string`
   (`:29`). `getUniqueAuthors()` → `getUniqueContributors()` (`:19`), returning
   `allRecordings.map((recording) => recording.contributor)`.
   `getEntriesWithCounts()` → `getRecordingsWithCounts()` (`:61`). The comment block at `:53-54`
   stays true and stays put: `view_count`, `vote_count` and `created_at` *"are field names
   inside live Firestore documents, so they keep their stored spelling rather than the
   glossary's."* None of the three is touched by this ticket.

4. **`data/catalogue.ts`: `allEntries` → `allRecordings`** (`data/catalogue.ts:35`), and the
   header comment's *"Every Entry in the catalogue, in one array"* (`:3`) follows.
   `allAssetPaths` (`:57`) keeps its name and, critically, its output — step 1's snapshot is the
   assertion that it did.
   **Do not touch `Object.fromEntries` at `data/categories.ts:68`.** It is a JavaScript builtin,
   not this domain's noun, and it builds `LEGACY_REDIRECTS` — the table `middleware.ts:23-43`
   matches on to keep 18 legacy Category URLs alive.

5. **The 18 category data files** each change two tokens: `import type { Entry } from "./entry"`
   → `import type { Recording } from "./recording"`, and `export const buttons: Entry[]` →
   `Recording[]` (`data/buttons.ts:1,3` and the same two lines in the other seventeen). The 277
   `author: "…"` fields become `contributor: "…"`. This is the 277-line mechanical part, and it
   is the reason the review is a snapshot.

6. **`lib/analytics.ts` — the one file where a rename is also a wire-format change.** All of it
   is free because none of the thirteen events exists on `main`.
   - `export type Facet = "category" | "author"` → `"category" | "contributor"` (`:29`).
   - `EntryFacts` → `RecordingFacts` (`:36`), with `entry_id` → `recording_id` and `author` →
     `contributor` (`:37-40`).
   - `entryFacts(entry: Entry)` → `recordingFacts(recording: Recording)` (`:48`).
   - `entryOpened(facts, source: "card" | "url")` → `recordingOpened(facts, openedFrom)`, firing
     `posthog.capture("recording_opened", { ...facts, opened_from: openedFrom })` (`:105-107`).
     Two changes, not one: the event name, and `source` → `opened_from`.
     `posthog-expansion/issues/03-instrument-catalogue-events.md:121-125` raised the collision as
     a question the agent would not answer unilaterally — in this repo `source` is a Recording's
     outbound Source link (`data/entry.ts:30`, and `repo_clicked` is about following it), so an
     `entry_opened.source` of `card` means something else entirely.
     `posthog-expansion/spec.md:92-95` is the maintainer's answer: rename it here.
   - `repoClicked` (`:114-121`) spells its four properties out longhand; they become
     `recording_id`, `caption`, `contributor`, `surface`. It still carries no `category`, for the
     reason at `:111-112`.
   - `idAndCaption` (`:58-61`) destructures `recording_id`.
   - `loadMoreClicked(page, entriesShown)` → `loadMoreClicked(page, recordingsShown)`, capturing
     `{ page, recordings_shown: recordingsShown }` (`:181-182`).
   - The module header's own example — *"thirteen near-synonyms of `entryId` / `entry_id` / `id`
     spread over eight files"* (`:7`) — and the `Surface` doc at `:26` both say Entry. Update
     them; a file whose whole point is one spelling per name cannot document the wrong one.
   - **Twelve of the thirteen event names do not change.** Only `entry_opened` carries the noun.
     `demo_played`, `demo_watched`, `demo_load_failed`, `repo_clicked`, `filter_applied`,
     `filter_cleared`, `search_performed`, `sort_changed`, `bookmark_added`, `bookmark_removed`,
     `vote_cast` and `load_more_clicked` keep their spelling exactly.

7. **The five call sites of the analytics types** follow the rename and nothing more:
   `components/entry-card.tsx:12-13,74,132`, `components/entry-detail.tsx:17,53,64`,
   `components/playback-owner.tsx:25,69,162`, `components/demo-tile.tsx:15,66`,
   `components/interactive-video.tsx:10,22`.

8. **`?author=` → `?contributor=`, with the old spelling kept alive.**
   In `components/nav/catalogue-nav.tsx`: `FACETS: Facet[] = ["category", "author"]` →
   `["category", "contributor"]` (`:74`), the prop `authors?: string[]` → `contributors?:
   string[]` (`:15`), and the three uses of the string `"author"` in the list body at
   `:192,194,199` become `"contributor"`. `facetHref` (`:58-67`) is generic over the key and
   needs no edit; its comment about the 18 legacy redirects landing on the display name (`:53-56`)
   is about `category` and stays.
   `components/nav/nav-side-bar.tsx:18,21,40,99,103` renames the same prop through.
   `app/layout.tsx:6,24,74` calls `getUniqueContributors()` into a `contributors` const.
   `app/actions/get-recordings.ts` renames the third argument `author` → `contributor` and the
   filter at `:57-62` reads `recording.contributor`.
   `app/products/page.tsx` reads `contributor` from `searchParams` (`:16,25,26`) — **and keeps
   `author` in the type as a legacy alias**, redirecting once rather than serving the same
   Recordings at two addresses:

   ```tsx
   // ?author= shipped on main (main:components/nav/catalogue-nav.tsx:77) and can be
   // bookmarked or already indexed by a rendering crawler, so it is kept alive the way
   // ADR-0004:14 keeps /products and ?category= alive. A permanent redirect rather than a
   // second reader, so there is one canonical spelling of a filtered catalogue.
   if (params.author && !params.contributor) {
     const next = new URLSearchParams(params as Record<string, string>)
     next.delete("author")
     next.set("contributor", params.author)
     permanentRedirect(`/products?${next}`)
   }
   ```

   `permanentRedirect` comes from `next/navigation`; no new dependency, and no `middleware.ts`
   change — adding `/products` to the matcher at `middleware.ts:24-43` would run middleware on
   the busiest route to serve a case that should be rare.

9. **`/entry/<id>` → `/recording/<id>`** wherever the string is written:
   `components/entry-card.tsx:114` (``const href = `/entry/${entry.id}` ``),
   `components/catalogue-page.tsx:63-64` (the `pathname.startsWith("/entry/")` test and the
   `pathname.slice("/entry/".length)` that pairs with it — both, or the overlay stops opening),
   plus the comments at `:53,128-129`, `components/entry-detail.tsx:6,28,30,46`,
   `components/interactive-video.tsx:61` and `lib/analytics.ts:101`.
   Nothing is needed in `next-sitemap.config.js` — it names only `siteUrl` and
   `generateRobotsTxt`, and reads routes out of the build.

10. **The identifiers around the three stored keys change; the three stored strings do not.**
    `hooks/use-remembered-set.ts:16` `BOOKMARKS_KEY = "bookmarkedItems"` and `:25`
    `VOTED_ENTRY_IDS_KEY = "votedItems"` keep both string values — `:15` says why in one line:
    *"Renaming this silently discards every bookmark a visitor has already made."* The constant
    `VOTED_ENTRY_IDS_KEY` becomes `VOTED_RECORDING_IDS_KEY` (and at
    `components/catalogue-page.tsx:51`).
    `lib/view-signal.ts:76` `VIEWED_ENTRY_IDS_KEY = "viewedEntryIds"` becomes
    `VIEWED_RECORDING_IDS_KEY` with the string `"viewedEntryIds"` untouched: it is
    sessionStorage rather than a Remembered set (`:71-75`), but ADR-0007:19 calls the
    once-per-Recording-per-session cap load-bearing, and changing the string means every tab
    open at deploy bills a second view for everything already watched.
    `countedThisSession(entryId)` → `countedThisSession(recordingId)` (`:103`).

11. **`lib/counters.ts` renames identifiers only.** `CountsByEntry` → `CountsByRecording`
    (`:23`), the `entryId` parameter through `addOrCreate`, `recordView` and `changeVote`
    (`:39,41,48,64,75`), and the comments at `:3-4,22`. The Firestore field names `view_count`
    and `vote_count` passed to `addTo` are untouched, and so is the collection name.

12. **`lib/recording-search.ts`** renames its type and its field: `searchableText` joins
    `[recording.caption, recording.contributor, recording.category]` (`:29`). The worked example
    in the comment at `:24-25` — *"an Entry captioned '…goes split' by an author 'button
    Person'"* — is the file's justification for `FIELD_SEPARATOR` being a newline, so rewrite it
    in the new nouns rather than deleting it.

13. **Swap the noun in visible copy. Do not rewrite the sentences.** Tickets 05, 06 and 08 own
    the mock's actual strings; this ticket only stops the site saying Entry and Author:
    `components/nav/catalogue-nav.tsx:152` `All Entries` → `All recordings` (the mock spells it
    that way at `assets/new-ui/Detail.dc.html:15`);
    `components/nav/catalogue-nav.tsx:185` `Authors` → `Contributors`
    (`assets/new-ui/Catalogue.dc.html:47`);
    `app/products/page.tsx:46` `{author && "Author"}` → `{contributor && "Contributor"}`;
    `components/catalogue-page.tsx:93` `No Entries match the current search or filters.` →
    `No recordings match the current search or filters.`;
    `components/catalogue-page.tsx:95` `No bookmarked Entries yet. …` →
    `No bookmarked recordings yet. …`, the rest of that sentence unchanged;
    `app/actions/get-recordings.ts:66` and `app/bookmarks/page.tsx:40` console messages;
    `app/recording/[id]/page.tsx:35-36`, where the shared-link title and description read
    `${recording.caption} — ${recording.contributor}` and
    `${recording.caption}, a ${recording.category} demo by ${recording.contributor}.`
    Casing rule for everything downstream, taken from the mock rather than invented: sentence
    copy uses lowercase (`All 24 contributors →` at `Catalogue.dc.html:56`, `Search 277
    recordings` at `:230`); mono labels and counters use caps (`CONTRIBUTORS · 24` at `:47`,
    `277 RECORDINGS` at `:68`, `MORE FROM THIS CONTRIBUTOR` at `Detail.dc.html:80`).

14. **Update the tests in the same commit — `tests/analytics.test.ts` is the pin.** It exists so
    a renamed property is loud rather than silent (`:27-31`), and it spells every property twice
    on purpose (`:90-92`). Change: the `Recording` fixture (`:33-41`); the key-set assertion at
    `:66-71`, which must read `["caption", "category", "contributor", "recording_id"]`; the
    `spelled` object at `:94-99`; the funnel's second step at `:109-115`, now
    `["recording_opened", { ...spelled, opened_from: "url" }]`; `repo_clicked` at `:121-129`;
    `demo_watched` at `:136-147`; `filter_applied("contributor", …)` at `:172-176`; and
    `load_more_clicked` at `:194-200`, now `{ page: 2, recordings_shown: 96 }`.
    Also `tests/data-integrity.test.ts:35`, whose required-field list names `"author"` and must
    name `"contributor"` — ADR-0005 makes that suite the independent statement of the data
    rules, so it is not a follow-on edit.
    In Playwright: `tests/e2e/filters.spec.ts:28,30,50,61,70,196,200` assert on
    `author=Hewad+Mubariz` and `a[href*="author="]`; `tests/e2e/view.spec.ts:109` and
    `tests/e2e/recording-route.spec.ts:177,187` navigate to `/entry/…`. All become the new
    spellings. Add one case to `tests/e2e/filters.spec.ts` covering step 8's alias:
    `/products?author=Hewad+Mubariz` lands on `/products?contributor=Hewad+Mubariz` with the
    same result count.

15. **`CONTEXT.md` gains the renamed glossary.** Rename the **Entry** definition (`:9-11`) to
    **Recording** — *"One catalogue record — a Contributor, a caption, source links, a Category,
    and the paths to its Demo and Poster. Recordings live in `data/<category>.ts`."* — and add
    `entry` to its _Avoid_ line beside item, card, component and animation. Add a new
    **Contributor** entry under *The catalogue*: the person whose work a Recording shows, and
    the value of a Recording's `contributor` field; _Avoid_: author, creator, owner, submitter,
    user. Then fix every other definition that says Entry: **Category** (`:14`), **Demo**
    (`:19`), **Poster** (`:23`), **Catalogue page** (`:28-32`), **Remembered set** (`:36-39` —
    keep its sentence about the stored key never being renamed, which step 10 obeys), **Asset**
    (`:45`) and **Asset path** (`:49`).
    `Surface`, `Facet` and `RecordingFacts` stay out of the glossary; the request to add them is
    already recorded at `posthog-expansion/issues/03-instrument-catalogue-events.md:132-134` and
    belongs to `/domain-modeling`, not to a rename.

16. **Write `docs/adr/0008-the-domain-is-recording-and-contributor.md`.** `ls docs/adr/` runs
    `0001`–`0007`, so `0008` is the next free number. Follow the house shape — a title
    sentence, a paragraph of reasoning, `## Considered options`, `## Consequences`. It must
    record, at minimum: that Studio Dark's own copy is the reason the vocabulary moved; that it
    landed *before* deploy A because `/entry/[id]` and `entry_id` are absent from `main` and stop
    being free the day they are not; that `/products`, `?category=`, `view_count` and
    `vote_count` were deliberately **not** renamed, on ADR-0004:14's boundary, and neither were
    the three stored keys `"bookmarkedItems"`, `"votedItems"` and `"viewedEntryIds"`; that
    `?author=` turned out to be already live and therefore keeps a permanent redirect rather
    than being a free rename, correcting `spec.md:96`; and that `git blame` on 277 data lines
    now points at this commit, which ADR-0004:12 already accepted once for the same files.

17. **Run the checkpoint.** `pnpm assets:paths > /tmp/asset-paths-after.txt` and
    `diff /tmp/asset-paths-before.txt /tmp/asset-paths-after.txt`. Then `pnpm check-types`,
    `pnpm lint`, `pnpm test`, `pnpm build`, and the Playwright suite. Then stop: spec checkpoint
    1 is *before the rename is committed*, and the maintainer reviews the snapshot, not the diff.

## Acceptance

- `diff` between the `pnpm assets:paths` capture taken at step 1 and the one taken at step 17
  exits 0 — 554 identical lines. A single changed character means the rename reached data rather
  than names, which is the only failure mode this diff cannot show by reading.
- `grep -rwIE 'Entry|entry|entries|Entries' --include='*.ts' --include='*.tsx' --include='*.js' app components data hooks lib scripts tests`
  returns hits in exactly three places and nowhere else: `Object.fromEntries` at
  `data/categories.ts:68`, the `"viewedEntryIds"` string literal in `lib/view-signal.ts`, and
  the `author` alias plus its comment in `app/products/page.tsx`.
- `grep -rwIE 'authors?' --include='*.ts' --include='*.tsx' app components data hooks lib scripts tests`
  returns only the `app/products/page.tsx` alias. `class-variance-authority` imports do not
  match `-w` and are not exceptions.
- `pnpm check-types` and `pnpm lint` both exit 0.
- `pnpm test` passes, and `tests/analytics.test.ts` asserts the literal strings `recording_id`,
  `contributor`, `recording_opened`, `opened_from` and `recordings_shown`. Grepping the file for
  `entry_id`, `entry_opened` or `entries_shown` returns nothing.
- Exactly one of the thirteen event names differs from `posthog-expansion` ticket 03's table:
  `entry_opened` is now `recording_opened`. The other twelve are byte-identical strings.
- `pnpm build` prerenders 277 pages under `/recording/`, `app/entry/` does not exist, and
  `git log --follow app/recording/\[id\]/page.tsx` shows the history from before the move.
- Playwright passes, including a new case asserting that `/products?author=Hewad+Mubariz`
  redirects to `/products?contributor=Hewad+Mubariz` and yields the same number of cards.
- The three stored strings `"bookmarkedItems"`, `"votedItems"` and `"viewedEntryIds"` are
  byte-identical to their values before this commit. `git diff` on
  `hooks/use-remembered-set.ts` and `lib/view-signal.ts` touches no string literal.
- `CONTEXT.md` defines **Recording** and **Contributor**, and contains no `Entry` or `author`
  outside those definitions' _Avoid_ lines.
- `docs/adr/0008-the-domain-is-recording-and-contributor.md` exists and names all four of
  `/products`, `?category=`, `view_count` and `vote_count` as deliberately unrenamed, and
  `?author=` as renamed-with-a-redirect.
- The rename and the ticket's own `Status:` change land in one commit; no intermediate commit
  leaves the tree speaking both vocabularies.

## Depends on

Nothing blocks this. It blocks everything, in two different ways.

Tickets 02 through 13 are written in the post-rename vocabulary — they say Recording,
Contributor, `/recording/[id]`, `?contributor=` and `recording_id` — so any of them started
first would be written against identifiers that do not exist, or would have to be rewritten
after this lands. `spec.md:175` says the same thing.

It also blocks deploy A, and that is the harder constraint. `spec.md:94-100` puts the rename
first because two of its three public names are free *only* until deploy A ships: `app/entry/` and
`lib/analytics.ts` are both absent from `main`, so `/entry/<id>` has never been crawled and
`entry_id` has never been ingested. Deploy A carries the `ui-ux-overhaul` behaviour work and the
thirteen events together; the moment it lands, the same two renames cost 277 redirects and a
PostHog property migration on live data.

The coupling that runs the other way is `posthog-expansion` ticket 09 rather than a code
dependency: its dashboard `1937576` reads these thirteen events by name, and its step 4 — the
success criteria agreed in writing, `posthog-expansion` spec checkpoint 5 — is what actually
gates deploy A (`spec.md:160-162`). This ticket changes one event name and three property names
that dashboard reads, and it must land before the dashboard's tiles are pointed at anything.

## Comments

### 2026-08-01 — Rename complete and verified. Uncommitted, at spec checkpoint 1.

All seventeen steps done. Nothing is committed: spec checkpoint 1 is *before the rename is
committed*, and step 17 says to stop there.

**The checkpoint passes.** `pnpm assets:paths` before and after are byte-identical — 554 lines,
both hashing to `6c98ad304e952cdeea03789f772574ca83d87bb3bdf32cedb668edac10a0694d`. That is the
one assertion the diff cannot make by reading, and it is what says the rename reached names
rather than data.

| Check | Result |
|---|---|
| `pnpm check-types` | clean |
| `pnpm test` | 184 / 184 |
| `pnpm lint` | 5 issues, byte-identical to the count on the pre-rename tree — none introduced |
| `pnpm build` | 290 static pages, `● /recording/[id]` prerendering 277 |
| Playwright | **119 / 119** (118 before; the extra is step 14's alias case) |

**Three things this ticket got right that were worth the trouble.**

`?author=` really was already live, as the Problem section argued against `spec.md`. `curl` on the
rebuilt server returns **308** for `/products?author=Hewad%20Mubariz` and 200 for
`/recording/<id>`, so the redirect works and the new route exists.

Exactly one of the thirteen event names changed. `recording_opened` carries `opened_from`;
`demo_played`, `demo_watched`, `demo_load_failed`, `repo_clicked`, `filter_applied`,
`filter_cleared`, `search_performed`, `sort_changed`, `bookmark_added`, `bookmark_removed`,
`vote_cast` and `load_more_clicked` are byte-identical strings.

The three stored keys survived: `"bookmarkedItems"`, `"votedItems"` and `"viewedEntryIds"` are
unchanged while their constants became `BOOKMARKS_KEY`, `VOTED_RECORDING_IDS_KEY` and
`VIEWED_RECORDING_IDS_KEY`. No visitor loses a bookmark and no tab re-bills a view.

**Four things the ticket did not anticipate, all found by a failing check rather than by reading.**

1. **Two JavaScript builtins were caught by the word-boundary pass.** `Map.prototype.entries()` in
   `tests/data-integrity.test.ts` became `.recordings()`, and
   `PerformanceObserverEntryList.getEntries()` in `tests/e2e/theme.spec.ts` became
   `.getRecordings()`. `tsc` caught both. `Object.fromEntries` was safe only because no word
   boundary falls inside it. ADR-0008 records this so the next rename of a common word expects it.
2. **Fifteen camelCase compounds have no word boundary at the noun** and needed naming
   individually — `getEntries`, `filteredEntries`, `votedEntryIds`, `setEntries`, `openEntry`,
   `findEntry`, `byAuthor`, `readEntriesWithCounts`, `EntryCardProps`, `EntryCardComponent`,
   `EntriesPage`, `EntryPage`, `entriesWithCounts`, `entriesWithIsNew`, `expectOneEntryTargeted`.
3. **The rename produced `an Recording` in 13 files.** Mechanically correct, ungrammatical.
   Swept to `a Recording`.
4. **`tests/analytics.test.ts` failed exactly as designed.** Its key-set assertion is `.sort()`ed,
   so `author` → `contributor` moved a key alphabetically and the expected array no longer
   matched; and it pinned `source: "url"`. Two failures, both the file doing its stated job of
   making a renamed property loud rather than silent.

One more trap, not in the code: Playwright's `reuseExistingServer: !process.env.CI`
(`playwright.config.ts:16`) silently reused a `pnpm start` left over from an earlier session, so
the first full run reported 40+ failures across every spec while serving the *pre-rename* build.
Kill anything on port 3000 before believing an e2e result here.

**What is left, and who does it.** The maintainer reviews the snapshot — not the 800-line diff —
and then this commits. That is the whole of spec checkpoint 1. `git log --follow` on
`app/recording/[id]/page.tsx` returns nothing until the commit exists, so that acceptance bullet
is checkable only afterwards; the ten moves are all staged as `R` renames, which is what makes it
work.

Set `resolved` once it is committed.

### One acceptance bullet is not met, and cannot be met as written

*"`git log --follow app/recording/[id]/page.tsx` shows the history from before the move."*

Seven of the ten moves are detected as renames by `git diff -M` at similarity 55–92%. Three are
not, because they are small files in which the noun occupies a large fraction of every line:

| Move | Similarity |
|---|---|
| `app/actions/get-entries.ts` → `get-recordings.ts` | 46% (72 lines) |
| `app/entry/[id]/page.tsx` → `app/recording/[id]/page.tsx` | 43% (63 lines) |
| `tests/entry-search.test.ts` → `tests/recording-search.test.ts` | 46% (120 lines) |

Git's default rename threshold is 50%, and `--follow` recomputes similarity when the log is read
rather than reading a decision stored in the commit — so this is not fixable by how the commit is
made. `git log --follow -M40% -- 'app/recording/[id]/page.tsx'` finds the history; plain
`--follow` does not.

Three ways out, and this is the maintainer's call rather than an agent's:

1. **Accept it and set `diff.renames = copies` / a lower threshold in `.gitconfig`.** Costs
   nothing, and the history is reachable by anyone who knows the flag.
2. **Split into two commits** — a pure `git mv` with no content change, then the content. Recovers
   `--follow` exactly, at the cost of one intermediate commit whose tree does not compile.
   ADR-0004:8 objected to *"a period in which half the codebase speaks each vocabulary"*, which is
   about a released state rather than an intermediate commit, so this may be within its spirit.
3. **Drop the bullet**, on the grounds that these three files are being rewritten by tickets 04,
   09 and 12 within this same effort anyway.

Recommended: **2**, because it is free after the fact — the two commits can be made now and the
result is identical to what is staged. Say which and it will be done before this commits.
