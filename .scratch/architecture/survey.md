# Architecture survey — 2026-07-29

Status: survey complete, nothing picked yet

Produced by `/improve-codebase-architecture` against `main` @ `463521c`. Four
read-only agents mapped the Entry data flow, the render and playback path, the
client state layer, and the scripts/tests/CI layer. Every claim below was
re-verified by grep before recording.

Visual version with before/after diagrams: [report.html](./report.html) — open
it in a browser.

Related: [CONTEXT.md](../../CONTEXT.md) ·
[ADR-0001](../../docs/adr/0001-assets-served-from-object-storage-not-the-repo.md) ·
[ADR-0002](../../docs/adr/0002-rewrite-git-history-to-drop-asset-blobs.md) ·
[ADR-0003](../../docs/adr/0003-asset-paths-are-immutable.md) ·
[r2-migration spec](../r2-migration/spec.md)

Vocabulary is [CONTEXT.md](../../CONTEXT.md) for the domain (Entry, Category,
Demo, Poster, Asset, Asset path) and `/codebase-design` for the architecture
(module, interface, implementation, depth, seam, adapter, leverage, locality).

---

## Shape of the codebase

| Area | Files | Lines |
| --- | --- | --- |
| `components/` | 53 | 5,553 |
| `data/` | 23 | 4,251 |
| `app/` | 24 | 1,779 |
| `scripts/` | 17 | 1,653 |
| `hooks/` | 9 | 503 |
| `lib/` | 10 | 295 |
| `tests/` | 2 | 159 |
| `db/` | 4 | 85 |

Roughly 1,500 of those source lines have no reachable importer. Two test files
cover the whole repo. No component or hook has a unit test; no script has any
test at all.

---

## The nine candidates

Ranked by friction, not by effort.

### 1 — Delete the phantom half of the tree · **Strong**

**Problem.** Two modules export the identical symbol `ResourceCardGrid`, and
only one is reachable. `components/resource-card-grid-virtualized.tsx` (277
lines) has had zero importers for its entire git history — `git log -S` finds
exactly one commit, `76bc39d`, the one that created it.

**Deletion test.** Complexity vanishes. Nothing reappears anywhere.

**The phantom is already misleading live code.**
`components/interactive-video.tsx:99-101` and `tests/e2e/home.spec.ts:55-56`
both carry comments reasoning about *"the grid is virtualised, so a mounted card
can be handed a different Entry."* The shipped grid maps every Entry
(`components/resource-card-grid.tsx:190`). Two correct-looking comments describe
a code path that does not exist.

**Zero importers, verified by grep:**

- `components/resource-card-grid-virtualized.tsx` — 277 lines
- `components/cult/file-drop.tsx` — 315 lines, the largest component in the repo
- `components/cult/fallback-image.tsx`
- `components/featured-grid.tsx` — its `ResourceCard` props at `:19-32` are three
  `throw new Error("Function not implemented.")` stubs
- `components/empty-featured-grid.tsx` — body commented out at `:41-49`, still
  carries the template's ad copy at `:6-9`
- `components/ui/{avatar,breadcrumb,card,checkbox,command,drawer,form,popover,select,separator,table,tabs}.tsx`
- `components/ui/{dialog,progress,skeleton}.tsx` — transitively dead, their only
  importers are the above
- `hooks/use-upload-file.ts` — whole body commented out at `:15-64`
- `hooks/use-resource-click-counter.tsx` — returns `{}`, body commented out
- `hooks/use-controllable-state.ts` + `hooks/use-callback-ref.ts` — only reached
  from `file-drop.tsx:13`
- `db/supabase/{client,server,middleware,mockSupabase}.ts` — the real backend is
  Firestore (`lib/firebase.js:19-21`). `client.ts:8-11` unconditionally returns a
  mock; `server.ts:7` is an empty function; `middleware.ts` is never imported.
- `scripts/{add-all-entries.py,import-items.js,convert-to-h265.js,cleanup-backups.js,convert-to-avif.js}`
- `package.json`: `react-dropzone`, `@tanstack/react-virtual`

**Also.** `.env.example:8-12` advertises three `SUPABASE_*` variables nothing
reads, and omits every `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_FIRESTORE_*`
the app actually needs.

---

### 2 — Give `Category` a module · **Strong**

**Problem.** A Category converts to three different strings — display name,
legacy URL slug, asset directory slug — and no module owns any of them. The
18-value set is restated in five places:

| Site | Form |
| --- | --- |
| `data/items.ts:43-61` | the union type |
| `lib/codex/schema.ts:3-22` | `CATEGORY_VALUES` const tuple |
| `lib/codex/categoryMap.ts:14-37` | `CATEGORY_META` keys |
| `middleware.ts:6-24` **and** `:42-61` | percent-encoded redirect map, then the same 18 paths again as `config.matcher` |
| `data/meta-data.ts:8` | inlined into a keywords string |

**The drift has already shipped a wrong Asset path.** `CATEGORY_META` says
`"Bottom Sheets" → bottomsheets`. `scripts/import-items.js:115` derives the same
thing with `.toLowerCase()` → `"bottom sheets"`, with a space. Eight of eighteen
Categories disagree between the two rules: Drop Down, List, Onboarding, Full
Apps, Circular Progress Bars, Bottom Sheets, Arc Sliders, Tab bars.

This is the same class of bug that r2-migration ticket 01 found the hard way —
four Entries pointing at `demo/Bottom Sheets/…`, a directory that never existed,
returning 403 in production. `tests/data-integrity.test.ts:79-83` was tightened
afterwards to catch it. The generator that produces such paths was never fixed.

**Shape of the deepened module.** One row per Category — display name, url slug,
asset slug, data file, export name — behind an interface of roughly:
`CATEGORIES`, `urlSlug(c)`, `assetSlug(c)`, `dataFile(c)`, `fromUrlSlug(s)`. A
19th Category becomes one row plus a compile error at every site that must
change.

Related but separate: `getUniqueCategories()` and `getUniqueAuthors()`
(`data/items.ts:22-31`) are the same function twice, differing only in the field
projected.

---

### 3 — One loader for the catalogue · **Strong**

**Problem.** `data/catalogue.ts:32` (`allEntries`) and `lib/codex/items.ts:21`
(`ALL_ITEMS`) perform the identical 18-way spread, in the same order, from the
same imports. Verified identical by diffing the spread lists. Consumers split
cleanly down the middle, so neither is dead:

- `allEntries` → `scripts/asset-paths.ts:12`, `scripts/publish-assets.ts:27`,
  `tests/data-integrity.test.ts:3`, `data/items.ts:6` (and so the whole site)
- `ALL_ITEMS` → `app/api/search/route.ts:7`, `scripts/codex-search-index.ts:24`

Nothing asserts they agree. `data/catalogue.ts:3-6` documents itself as the one
place the merge lives, *specifically so adding a Category is a one-line change*.
`lib/codex/items.ts` is the copy-paste that comment describes, still live.

**Three more re-implementations of "read the Entries", two silently broken:**

- `scripts/add-created-at.ts:30-50` rediscovers data files by regex over
  `data/items.ts` import declarations. Since `catalogue.ts` landed, `items.ts`
  imports only `./catalogue` (`data/items.ts:6`), so it resolves one file
  containing no Entries. Moot regardless: `path` and `fs` are used at `:17-18`
  and `:42` but their `require`s are commented out at `:5-6`, so it throws
  `ReferenceError` on the first line of work. Still wired at `package.json:19`
  and force-included in `tsconfig.json`.
- `scripts/updateChangedItems.js:11-13` filters `data/` for `.json`; Entries are
  `.ts`. The only match is `data/changedItems.json`, the empty file it writes —
  so it diffs its own output against itself, forever finding nothing. It runs on
  **every commit** via `.husky/pre-commit`, and does `git.checkout("origin/main")`
  mid-commit while doing it. Noted as out of scope in the r2-migration spec.
- `scripts/codex-ingest.ts:68-86` hand-rolls an Entry serializer duplicating the
  field order of `data/items.ts:33-66`.

---

### 4 — An Asset path module · **Strong**

**Problem.** The scheme `demo/<slug>/<file>.mp4` and
`thumbnails/<slug>/<file>.avif` is stated in nine places and specified in none.
Its only formal definition is a pair of regexes inside a test
(`tests/data-integrity.test.ts:82-83`).

**Sites that build a path:**

| Site | What it builds |
| --- | --- |
| `scripts/codex-ingest.ts:120-121` | via `CATEGORY_META.assetSlug` — correct |
| `scripts/import-items.js:141-142` | via `.toLowerCase()` — wrong for 8 Categories |
| `scripts/generateThumbnails.ts:81-86` | derives Poster from Demo, writes `.jpg` |

**Sites that parse, validate, or restate it:** `tests/data-integrity.test.ts:82-83`
(regexes) · `scripts/asset-paths.ts:15` (prefix table) ·
`scripts/publish-assets.ts:30-33` (extension→content-type) ·
`scripts/check-video-codecs.sh:108` (extension set, third statement) ·
`scripts/check-video-codecs.sh:83`, `scripts/publish-assets.ts:87`,
`scripts/codex-ingest.ts:137,167` (the `public/` staging prefix, three times) ·
`scripts/codex-review-pr.ts:31` (restated in English inside an LLM prompt) ·
`lib/cdn.ts:41` (leading-slash normalisation, the only normalisation anywhere).

`lib/cdn.ts` is not the owner. It prepends a base URL and knows nothing about
prefixes, slugs, or extensions.

**The documented Poster workflow produces a Poster that fails `pnpm test`.**
`scripts/generateThumbnails.ts:81-84` writes `.jpg`. The catalogue and
`tests/data-integrity.test.ts:83` require `.avif`. The `.jpg → .avif` step lives
in `scripts/convert-to-avif.js`, which is referenced by nothing and is slated
for deletion in candidate 1. `scripts/codex-ingest.ts:138,168` and the PR
checklist both tell a contributor to run `pnpm generate-thumbnails`.

**An untested agreement guards an irreversible operation.**
`scripts/publish-assets.ts:45-47` selects paths with `path.includes(p)`;
`scripts/check-video-codecs.sh:41-46` does the same with `grep -F`. Both files
carry a comment saying the other must match. Nothing asserts it. The upload they
gate is `immutable` for a year and refuses to overwrite (ADR-0003).

**Consistent with ADR-0003, not against it.** A path module makes immutability
something a type and a parser enforce, rather than something nine call sites
remember. ADR-0001 is untouched: the module's Published-Asset adapter is
`lib/cdn.ts` as it stands.

**Two more shared constants worth folding in:** the cache header, stated at
`scripts/publish-assets.ts:29` (written) and `scripts/check-video-codecs.sh:25`
(asserted); and four identical recursive directory walkers in
`generateThumbnails.ts:22-42`, `convert-to-h265.js:7-22`,
`convert-to-avif.js:7-22`, `cleanup-backups.js:6-21`, differing only in the
final `endsWith` — three of which candidate 1 deletes.

---

### 5 — Collapse the three catalogue pages into one module · **Strong**

**Problem.** `components/directory-page-client.tsx`,
`components/products-page-client.tsx`, and `app/bookmarks/page.tsx` repeat the
same structure: the same four-hook preamble, the same
`if (bookmarks === null || votedItems === null) return <div />` guard, the same
`ResourceCardGrid` call with nine props, the same `CardModal` tail. The only
real differences are a heading, a `FadeIn`, and where the Entries come from.

| Concern | directory | products | bookmarks |
| --- | --- | --- | --- |
| four-hook preamble | `:27-31` | `:39-43` | `:20-26` |
| null guard | `:34-36` | `:52-54` | `:56-58` |
| `handleToggleVote` | — | `:46-49` | `:50-53` |
| grid + modal | `:43-62` | `:60-107` | `:62-82` |

**The triplication is already miscounting views.** On `/products` and
`/bookmarks`, one vote fires `incrementViewCount` twice — once at
`components/resource-card.tsx:87`, and again in the local `handleToggleVote`
(`products-page-client.tsx:47`, `bookmarks/page.tsx:51`). On `/` the grid gets
the raw `toggleVote` from `useVotes`, so it fires once. Same card, different
view count depending on route. A third copy of the same line sits inside
`hooks/use-votes.ts:83` — see candidate 7.

**Prop drilling.** `toggleBookmark`, `toggleVote` and `openModal` travel four
hops: hook → page client → grid → card. `filteredFeaturedData` is declared in
both grid prop interfaces and passed by two callers, but **neither grid
destructures it** — a dead prop drilled two levels. `app/page.tsx:12` sets
`FEATURED_IDS = []`, so it is always empty anyway.

`components/resource-card.tsx:256-264` memoises on five fields and ignores
`onClick`, `toggleBookmark`, `toggleVote`, `order` and `trim` — each a new
identity every render, since `handleToggleVote` is unmemoised. That comparator
is what makes the drilling survivable, and also what makes stale closures
possible.

---

### 6 — Give the view and vote counters a seam · **Worth exploring**

**Problem.** A count lives in three places at once:

- `data/items.ts:71-117` — authoritative, merged from Firestore
- `components/resource-card.tsx:45-46` — local copy, seeded from props, never
  resynced when `data` changes
- `components/card-modal.tsx:18-20` — seeded from `selectedProduct?.view_count`
  in a `useState` initializer, so it holds the **first** Entry ever opened for
  the component's life. Incremented at `:25`, then never rendered.

`incrementViewCount` is called from six sites across five modules:
`interactive-video.tsx:75` (the only playback-triggered one),
`resource-card.tsx:77,87,98`, `card-modal.tsx:24`,
`products-page-client.tsx:47`, `bookmarks/page.tsx:51`, `use-votes.ts:83`.
Three of those are floating promises with no catch.

Vote membership lives in localStorage while the count lives in Firestore, so the
two can disagree with no reconciliation. `COLLECTION_NAME` with its
`|| "rnui"` fallback is redeclared five times: `data/items.ts:69`,
`app/actions/{increment-view-count:10,increment-vote-count:9,decrement-vote-count:10,get-view-count:8}.ts`.

None of it is testable without Firestore. A counter module with an in-memory
adapter gives two adapters, so the seam is real rather than hypothetical.

**Adjacent, cheap:** exactly one PostHog event exists in the whole app —
`interactive-video.tsx:90`, `demo_load_failed`. No successful-playback event is
captured anywhere. `app/actions/increment-view-count.ts:11-12` logs to console
on every invocation.

---

### 7 — One marked-set module for bookmarks and votes · **Worth exploring**

**Problem.** `hooks/use-votes.ts` is `hooks/use-bookmarks.ts` with identifiers
renamed. The structure is line-for-line parallel at a constant `+2` offset
caused only by one extra import — same hydration guard, same `Array.isArray`
validation, same persist-after-mount ref, same add/remove/toggle/has, down to
the emoji log prefixes (`📄`, `📁 ~`, `✅`, `❌`, `ℹ️`).

The one non-cosmetic divergence is the smell: `hooks/use-votes.ts:83` calls
`incrementViewCount(id)` inside `toggleVote` — a Firestore write leaking across
the seam of what is otherwise a localStorage set, unawaited and uncaught.

Both log to console on every state write in production
(`use-bookmarks.ts:49`, `use-votes.ts:51`).

One module parameterised by storage key; the vote-specific side effect moves to
candidate 6.

---

### 8 — Make the code say `Entry`, `Demo`, `Poster` · **Worth exploring**

**Problem.** Every load-bearing identifier is on the CONTEXT.md *avoid* list.

| Glossary term | Avoid list | What the code uses |
| --- | --- | --- |
| Entry | item, card, component | `ItemType` (`data/items.ts:33`) |
| Demo | video, clip, preview | `videoSrc` |
| Poster | thumbnail, placeholder, cover | `thumbnailSrc` |
| Asset path | src, url, filename | `videoSrc` / `thumbnailSrc` |

Also `getProducts`, `selectedProduct`, `ProductsPageClient`, `ResourceCard`,
`ResourceCardGrid` — all typed as `ItemType`, none matching the glossary. There
is no second Entry type; the shapes at `lib/codex/schema.ts:24-33`,
`app/search/page.tsx:6` and the various `*Props` are all subsets or wrappers.

An agent reading `data/items.ts` and an agent reading `CONTEXT.md` learn two
different vocabularies for the same thing. Mechanical to fix — the type checker
finds every site — and it pairs naturally with candidate 4's interface.

Dead types worth removing in the same pass: `CategoryData`, `LabelData`,
`TagData` (`data/items.ts:9-19`, imported by nothing) and `FilterData`
(`app/actions/cached_actions.ts:10-14`, whose `getFilters()` returns three empty
arrays and whose `displayFilters()` is a floating promise executing at module
import, `:54`).

---

### 9 — Search is a second catalogue that shows no Demos · **Speculative**

**Problem.** `/search` renders its own markup (`app/search/page.tsx:70-87`),
never reaches `ResourceCard`, and never calls `getCdnUrl` — so a catalogue of
Demos displays no Demo. It is not linked from `NavSidebar` or `ProductNav`. Its
whole data path is disjoint from the site's: `lib/codex/items.ts` →
`app/api/search/route.ts` → the page.

**It returns 503 today.** `data/embeddings.json` is gitignored
(`.gitignore:56`), absent from the tree, and built by no workflow — so
`app/api/search/route.ts:47` returns *"Embedding index missing"*
unconditionally. `APPLICATION.md:83-91` describes this path as shipped.

Other route facts, if it does ship: `loadIndex()` (`:15-21`) memoises a
`readFileSync` in a module-level variable that is never invalidated, so a
regenerated index needs a process restart; `cosine()` (`:23-34`) has no length
guard, so a dimension mismatch scores against the shorter array; the `byId` map
(`:67`) is rebuilt on every request; there is no try/catch around `embed()`
(`:62`), so an OpenAI failure surfaces as an unhandled 500.

Marked speculative because the prior question is a product one: does search
ship at all? If yes, it should be a ranking that feeds the same view module as
candidate 5, and candidate 3 falls out for free.

---

## Test coverage, for reference

Two test files.

- `tests/data-integrity.test.ts` — 10 assertions over `allEntries`. Pure data,
  no filesystem, no network. Covers duplicate IDs, required fields, source URL
  shape, unique Asset paths, printable ASCII, Demo and Poster path
  well-formedness.
- `tests/e2e/home.spec.ts` — 3 Playwright tests: home renders, clicking a card
  advances `video.currentTime`, an aborted CDN request shows the error state and
  leaves the rest of the grid working.
- `scripts/check-video-codecs.sh` — a third seam, run in CI as the `assets` job.

**Untested:** all 17 scripts, including `publish-assets.ts` — the one operation
in this repo that is irreversible for a year. Every component and hook. All
seven server actions. `data/items.ts:71-117`. `lib/codex/categoryMap.ts`.
`app/api/search/route.ts`. Every route except home. The prefix-selection
agreement between `publish-assets.ts` and `check-video-codecs.sh`. That
`allEntries` and `ALL_ITEMS` are equal.

`pnpm lint` and `pnpm format:check` are defined in `package.json` but no
workflow calls them.

---

## Recommended order

1. **Candidate 1** — no design decisions, so no grilling. Do it first: it
   changes the answers to the rest, and until the unreachable code is gone every
   later survey is surveying a phantom.
2. **Candidates 2, 4, 8 together** — one coupled idea. The Category module owns
   the slug the Asset path module needs; the renames land in both interfaces.
   This is the one to grill.
3. **Candidate 3** — nearly mechanical once 2 exists.
4. **Candidate 5** — fixes the double view-count as a consequence of having one
   module rather than three.
5. **Candidates 6 and 7** — 7 depends on 6 to take the leaked side effect.
6. **Candidate 9** — park until the product question is answered.
