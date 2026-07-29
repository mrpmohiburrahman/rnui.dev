# 03 — One table owns Category

**What to build:** Adding a Category becomes one row in one table, and forgetting to wire a Category into the catalogue becomes a loud failure instead of a silent one.

The set of eighteen Categories is currently written out in seven places. The compiler links three of them. The remaining four are on the maintainer's memory, and one of those is expensive: a Category whose data file is never merged into the catalogue contributes zero Entries to the site with no error, no warning and no failing test. That is the failure this ticket exists to kill.

Give Category a table in the data layer with one row per Category, carrying every spelling that Category needs — its display name, the slug in its legacy URL, the slug in its Asset paths, and the data file and exported array it lives in. The existing metadata table is most of this already; it moves out of the folder named after the ingest tooling, because the whole site needs it rather than one script, and gains the legacy-URL column. Generate the redirect map, the redirect matcher and the search-engine keyword string from those rows instead of restating them alongside.

The catalogue merge keeps its literal import statements — the framework requires them to be written out statically, so no table can generate them. That is what the wiring test is for.

The display name is canonical; every slug derives from the row, never the reverse. Empty Categories are legal, so navigation continues to derive its Category list from the Entries actually present rather than from the table — otherwise an empty Category would offer visitors an empty page.

**Blocked by:** 02. This ticket creates a new module; writing it in the old vocabulary and sweeping it days later is the thing the sequencing in ADR-0004 exists to avoid.

**Status:** ready-for-agent

- [ ] One table in the data layer holds a row per Category with its display name, legacy URL slug, Asset directory slug, data file and exported array name
- [ ] It no longer lives inside the folder named after the ingest tooling
- [ ] The legacy redirect map and the redirect matcher are both derived from the table rather than typed out
- [ ] Every legacy Category URL still redirects to exactly the destination it did before
- [ ] The search-engine keyword string includes every Category's display name, derived from the table
- [ ] A test loads each row's data file and asserts every Entry in it reached the merged catalogue
- [ ] That test's failure message names the Category and the Entry IDs that did not arrive
- [ ] A Category with no Entries passes the test
- [ ] A Category whose data file is not merged into the catalogue fails the test
- [ ] Navigation and the search placeholder still derive their Category list from the Entries present, with a comment recording that empty Categories are legal and why that matters
- [ ] The compiler still rejects a Category name that is not in the table
- [ ] Type check, test suite, build and end-to-end tests all pass
