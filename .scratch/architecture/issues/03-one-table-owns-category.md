# 03 — One table owns Category

**What to build:** Adding a Category becomes one row in one table, and forgetting to wire a Category into the catalogue becomes a loud failure instead of a silent one.

The set of eighteen Categories is currently written out in seven places. The compiler links three of them. The remaining four are on the maintainer's memory, and one of those is expensive: a Category whose data file is never merged into the catalogue contributes zero Entries to the site with no error, no warning and no failing test. That is the failure this ticket exists to kill.

Give Category a table in the data layer with one row per Category, carrying every spelling that Category needs — its display name, the slug in its legacy URL, the slug in its Asset paths, and the data file and exported array it lives in. The existing metadata table is most of this already; it moves out of the folder named after the ingest tooling, because the whole site needs it rather than one script, and gains the legacy-URL column. Generate the redirect map, the redirect matcher and the search-engine keyword string from those rows instead of restating them alongside.

The catalogue merge keeps its literal import statements — the framework requires them to be written out statically, so no table can generate them. That is what the wiring test is for.

The display name is canonical; every slug derives from the row, never the reverse. Empty Categories are legal, so navigation continues to derive its Category list from the Entries actually present rather than from the table — otherwise an empty Category would offer visitors an empty page.

**Blocked by:** 02. This ticket creates a new module; writing it in the old vocabulary and sweeping it days later is the thing the sequencing in ADR-0004 exists to avoid.

**Status:** resolved

- [x] One table in the data layer holds a row per Category with its display name, legacy URL slug, Asset directory slug, data file and exported array name
- [x] It no longer lives inside the folder named after the ingest tooling
- [~] The legacy redirect map and the redirect matcher are both derived from the table rather than typed out — **map derived; matcher cannot be, see comment below**
- [x] Every legacy Category URL still redirects to exactly the destination it did before
- [x] The search-engine keyword string includes every Category's display name, derived from the table
- [x] A test loads each row's data file and asserts every Entry in it reached the merged catalogue
- [x] That test's failure message names the Category and the Entry IDs that did not arrive
- [x] A Category with no Entries passes the test
- [x] A Category whose data file is not merged into the catalogue fails the test
- [x] Navigation and the search placeholder still derive their Category list from the Entries present, with a comment recording that empty Categories are legal and why that matters
- [x] The compiler still rejects a Category name that is not in the table
- [x] Type check, test suite, build and end-to-end tests all pass

## Comments

**2026-07-29 — resolved.** `data/categories.ts` holds the eighteen rows. `lib/codex/categoryMap.ts` is deleted; `slugify` moved to its one caller in `scripts/codex-ingest.ts` with a pointer to ticket 04, which is where the spec puts it. The redirect map and the keyword string are now derived. The wiring test lives in `tests/data-integrity.test.ts`.

**The one deviation: the middleware matcher is still typed out.** Next.js parses `export const config` out of the middleware source at build time and refuses anything it cannot read statically — `matcher: Object.keys(LEGACY_REDIRECTS)` fails the build outright with *"`matcher` needs to be a static string or array of static strings or array of static objects."* This is the same class of constraint the ticket already carves out for the catalogue merge, so it got the same remedy: the literal stays, and a test asserts it equals the table's derived paths.

The alternative that would have satisfied the criterion literally is deleting `config` entirely — the map lookup already guards, so the redirects would still work — at the cost of running the middleware on every request rather than eighteen paths. Not worth it for a list a test now pins.

That test is a deliberate departure from the spec's *"The redirect middleware gets no test."* The spec's reason was that both of the middleware's lists would be generated; one of them cannot be, so the premise no longer holds.

**Evidence.** All eighteen legacy paths were curled against `pnpm start` and return `307` to byte-identical destinations, `/miscellaneous` → `Misc` included. The wiring test was checked by mutation: removing `...pickers` from `data/catalogue.ts` fails one test with *"Pickers: 1 Entries in data/pickers.ts never reached data/catalogue.ts — 01G8YVZ8XY1G8VZ8XY1G8VZ8XY"*. Type check, 29 tests, build and the three end-to-end tests all pass.

**Left alone on purpose.** `CATEGORY_VALUES` in `lib/codex/schema.ts` keeps its own tuple — the spec says so, and the uncovered case degrades to "the extractor never suggests that Category". The duplicate catalogue merge in `lib/codex/entries.ts` is still out of scope (survey candidate 3).
