# Spec — one owner for Category, one owner for Asset path, glossary names in code

Status: ready-for-agent

Source: [survey.md](./survey.md) candidates 2, 4 and 8, grilled 2026-07-29.
Vocabulary: [CONTEXT.md](../../CONTEXT.md).
Decisions recorded: [ADR-0004](../../docs/adr/0004-code-uses-the-glossarys-names.md) ·
[ADR-0005](../../docs/adr/0005-the-data-test-states-the-asset-path-rules-independently.md).
Constraints inherited: [ADR-0001](../../docs/adr/0001-assets-served-from-object-storage-not-the-repo.md) ·
[ADR-0003](../../docs/adr/0003-asset-paths-are-immutable.md).

---

## Problem Statement

Four things make routine catalogue work more dangerous than it looks.

**Adding a Category means editing seven files, and forgetting one is silent.** The set of eighteen Categories is written out in the Entry type, the extraction schema, the Category metadata table, the legacy redirect map, the redirect matcher, the search-engine keyword string, and the catalogue merge. The type checker links three of those. The rest are on the maintainer's memory. The expensive one is the catalogue merge: a Category whose data file is never merged contributes zero Entries to the site, with no error, no warning and no failing test.

**The shape of an Asset path is stated in nine places and defined in none.** The only formal statement of `demo/<slug>/<file>.mp4` and `thumbnails/<slug>/<file>.avif` is a pair of patterns inside a test. Everything else — the staging prefix, the content types, the cache instruction, the two directory prefixes, the extension set, an English restatement inside a review prompt — is a separate remembering of the same rule.

**The documented way to produce a Poster cannot produce a valid one.** The Poster generator writes JPG. The catalogue and its test require AVIF. The converter that used to bridge them was removed as unreachable code, correctly — it was unreachable — but it was the only bridge. A contributor who follows the printed instructions gets a file the test rejects, and no instruction anywhere tells them what to do next.

**Two publish tools must agree on which Assets to inspect, and nothing makes them.** When a publish run is narrowed to one Category, the publish tool and the codec checker each work out independently which Asset paths that means. They agree today by coincidence and a comment. If the checker ever selects fewer paths than the publisher, the gate passes, unchecked Assets upload, and — because Published Assets are immutable for a year and cannot be overwritten (ADR-0003) — the mistake cannot be corrected in place.

**Underneath all four, the code contradicts the project's own glossary.** `CONTEXT.md` names the concepts Entry, Demo, Poster and Asset path, and lists `item`, `video`, `thumbnail` and `src` as words to avoid. The code's load-bearing identifiers are exactly those avoided words. A reader — increasingly an agent, since the ingest, review and issue-tracker tooling all read this repo cold — learns the vocabulary twice and has no way to know which one is authoritative.

## Solution

One module owns Category. One module owns Asset path. The publish gate stops guessing. The code adopts the glossary's names.

**A Category module** holds one row per Category carrying every spelling that Category needs: its display name, the slug that appears in its legacy URL, the slug that appears in its Asset paths, and the data file and export it lives in. The legacy redirects and the keyword string are generated from those rows instead of restated beside them. A test walks the rows and proves each Category's Entries actually reach the catalogue, so the silent-disappearance failure becomes a loud one.

**An Asset path module** owns the shape of a path: the two directory prefixes, the two extensions, construction of a Demo path from a Category and a filename, derivation of the matching Poster path, the local staging prefix, the content types, and the cache instruction. The Poster generator writes AVIF directly through it, so the documented workflow produces a Poster that passes. The data-integrity test keeps its own independently-written patterns as a second opinion rather than importing the module's — deliberately, for the reasons in ADR-0005.

**The publish gate stops deriving twice.** The publish tool resolves the list of Asset paths it is about to upload and hands that list to the codec checker. The checker gains a mode that accepts a list; it keeps its existing self-deriving mode for the CI job that inspects Published Assets. There is no longer an agreement to maintain, so there is no longer an agreement to break.

**The code speaks the glossary.** `ItemType` becomes `Entry`, `videoSrc` becomes `demoPath`, `thumbnailSrc` becomes `posterPath`, and the `Resource*` and `Product*` component and variable names follow. The rename stops at two boundaries it must not cross: stored Firestore field names, and public web addresses.

## User Stories

### Category

1. As a catalogue maintainer, I want to add a new Category by adding one row to one table, so that I am not hunting through seven files for lists I half-remember.
2. As a catalogue maintainer, I want the test suite to fail loudly when a Category's data file is not merged into the catalogue, so that a whole Category's Entries can never silently vanish from the site.
3. As a catalogue maintainer, I want the failure message to name the Category and the Entries that did not arrive, so that I can fix it without bisecting.
4. As a catalogue maintainer, I want to create a Category before its first Entry exists, so that I can prepare a Category in one change and fill it in another.
5. As a site visitor, I want a Category with no Entries to be absent from the navigation, so that I never follow a link to an empty page.
6. As a site visitor, I want every legacy Category URL I have bookmarked to keep redirecting, so that links I saved before the redesign still work.
7. As a catalogue maintainer, I want a new Category's legacy redirect to exist automatically from its row, so that I cannot ship a Category whose old URL 404s.
8. As a catalogue maintainer, I want the search-engine keyword list to include every Category without my editing a comma-separated string, so that a new Category is discoverable the day it ships.
9. As a coding agent, I want one place that answers "what Categories exist and how is each one spelled", so that I do not have to reconcile five partial lists to answer a question.
10. As a catalogue maintainer, I want the compiler to reject a Category name that is not in the table, so that a typo fails at build rather than at runtime.
11. As a catalogue maintainer, I want the Category table to live in the data layer rather than inside the tooling folder named after the ingest script, so that its ownership matches its scope.
12. As a catalogue maintainer, I want the display name to be the one canonical spelling and every slug to derive from the table, so that there is never a question about which spelling is authoritative.

### Asset path

13. As a catalogue maintainer, I want one module to answer "where does this Category's Demo live", so that the rule is defined once rather than remembered nine times.
14. As a catalogue maintainer, I want to derive a Poster path from a Demo path in one call, so that the two can never disagree about the Category directory or the filename.
15. As a contributor, I want the documented Poster command to produce a Poster that passes the test suite, so that following the instructions is enough to get my submission merged.
16. As a contributor, I want the Poster produced in one step with no intermediate file, so that I cannot accidentally commit a half-finished image.
17. As a catalogue maintainer, I want Posters to be AVIF and verified as AVIF, so that Poster bandwidth stays low, which is the reason Assets moved to object storage at all (ADR-0001).
18. As a catalogue maintainer, I want the local staging prefix defined once, so that a change to where Staging copies live is one edit rather than four.
19. As a catalogue maintainer, I want content types and the cache instruction defined once, so that a Published Asset cannot be uploaded with the wrong type or a revalidating cache header.
20. As a pull request reviewer, I want the review prompt's description of Asset paths to come from the module, so that the automated review cannot be checking a rule the code no longer follows.
21. As a catalogue maintainer, I want the data test to judge Asset paths using its own independently-written patterns, so that a bug in the path module is caught rather than ratified.
22. As a coding agent tidying the repo, I want the deliberate duplication between the module and the test to be explained in an ADR, so that I do not helpfully merge them and remove the guard.
23. As a catalogue maintainer, I want the module to stay out of the business of turning a path into a public URL, so that the Published Asset adapter keeps its single job (ADR-0001).

### The publish gate

24. As a catalogue maintainer, I want the codec checker to inspect exactly the Assets the publish tool is about to upload, so that narrowing a publish run cannot leave Assets unchecked.
25. As a catalogue maintainer, I want it to be structurally impossible for the checker and the publisher to disagree about scope, so that I am not relying on two comments staying true.
26. As a catalogue maintainer, I want an Asset that browsers cannot decode to be impossible to publish, so that I never have to correct something that is immutable for a year (ADR-0003).
27. As a catalogue maintainer, I want the checker to keep its standalone mode, so that the CI job that inspects live Published Assets keeps working unchanged.
28. As a catalogue maintainer, I want a narrowed run to demand only the Staging copies it will actually touch, so that publishing one new Entry does not require all 558 Assets on disk.

### Names

29. As a coding agent, I want the code and the glossary to use one vocabulary, so that reading either one teaches me the right words.
30. As a contributor, I want the fields in a data file to be called `demoPath` and `posterPath`, so that I can tell what they hold without reading the type.
31. As a catalogue maintainer, I want the Entry type to be called `Entry`, so that the most-referenced type in the repo matches the glossary's most important term.
32. As a catalogue maintainer, I want proof that the rename changed no data, in the form of a byte-identical before-and-after list of every Asset path, so that a 558-line diff does not need to be read line by line.
33. As a catalogue maintainer, I want stored Firestore field names left alone, so that this work needs no data migration and no dual-read period.
34. As a site visitor, I want every existing web address to keep working, so that the rename is invisible to me.
35. As a catalogue maintainer, I want the rename to land while no submission pull requests are open, so that it conflicts with nothing.

### The work itself

36. As a catalogue maintainer, I want this delivered as four separately reviewable changes, so that I can stop after any one of them and still be better off.
37. As a catalogue maintainer, I want the publish-gate fix first, so that the change protecting an irreversible operation is not waiting behind a large cosmetic one.

## Implementation Decisions

### Ordering

Four changes, in this order, each independently reviewable and independently valuable:

1. **Publish gate.** Smallest, and it protects the one operation that cannot be undone.
2. **The rename.** Second, because it conflicts with every open submission and the queue is currently empty of them. Landing it before the new modules also means those modules are written once, in the final vocabulary.
3. **Category module.**
4. **Asset path module**, which reads the Category module's asset slug, plus the Poster generator fix.

Rationale is recorded in ADR-0004.

### Category module

- A new module in the data layer owns an ordered table with one row per Category. Each row carries: display name, legacy URL slug, Asset directory slug, data file name, exported array name. It replaces the existing metadata table, which currently lives inside the ingest tooling folder despite the whole site needing it.
- The Entry type's Category union remains the root of truth for the set of names; the table is keyed exhaustively against it, so the compiler already prevents the two from diverging. Inverting the relationship — deriving the union from the table — was considered and rejected as surgery on the repo's most-imported type for a gap the compiler nearly closes already.
- The legacy redirect map and the middleware matcher are both generated from the table's rows. Two hand-maintained lists of eighteen become two derivations.
- The search-engine keyword string is assembled from the table's display names rather than typed out.
- The extraction schema's Category tuple stays as it is. It is already constrained to a subset of the union by the compiler; the one uncovered case — a Category omitted from the tuple — degrades to "the extractor never suggests that Category", which is visible and cheap.
- The catalogue merge keeps its literal import statements. The framework requires them to be statically written, so no table can generate them. This is covered by a test rather than by construction, and it is the only part of the Category problem that a module cannot solve.
- Navigation and the search placeholder continue to derive their Category list from the Entries present in the data, not from the table. With empty Categories now legal, this behaviour is load-bearing rather than incidental and gains a comment saying so.
- The display name is canonical; every slug derives from the table row, never the other way round. Recorded in `CONTEXT.md`.

### Asset path module

- A new module owns: the `demo` and `thumbnails` directory prefixes; the `.mp4` and `.avif` extensions; construction of a Demo path from a Category and a filename base; derivation of the matching Poster path from a Demo path; the local staging prefix that marks an Asset not yet published; the extension-to-content-type mapping; and the immutable cache instruction.
- It also owns the narrowing rule — given a set of Asset paths and a set of user-supplied fragments, which paths are selected. This moves out of the publish tool so that it becomes a pure function with a single definition, testable without credentials.
- It does not absorb the Published Asset adapter. Turning an Asset path into the URL a visitor fetches is a separate job with its own ADR, and it stays a separate module.
- Naming: singular `asset-path`, because a script with the plural name already exists and does something different — it prints the catalogue's full list of Asset paths. Two modules differing only by an `s` would be worse than the slight awkwardness of the singular.
- The filename-slug helper currently used by the ingest script moves into this module, since it exists to produce the filename portion of an Asset path.
- The ingest script, the Poster generator and the publish tool all construct paths through this module. The review prompt's English description of the path shape is assembled from the module rather than typed into the prompt.

### Poster generation

- The Poster generator writes AVIF directly using the AV1 encoder already present in the project's ffmpeg dependency. The intermediate JPG step and the separate converter are not reinstated.
- It derives each Poster's destination by asking the Asset path module, rather than by replacing the file extension itself.
- Accepted cost: AVIF encoding takes seconds per image rather than being instantaneous. The generator runs once per new recording, so this is not on any hot path.

### Publish gate

- The publish tool resolves its list of Asset paths first, then hands that resolved list to the codec checker rather than passing along the user's narrowing fragments.
- The checker gains a mode that reads a supplied list. Its existing mode — deriving the list itself from the catalogue — is retained unchanged, because the CI job that inspects live Published Assets runs the checker on its own.
- The checker gains one assertion: every Poster is genuinely AVIF. It already verifies that every Demo is H.264 and that every referenced Asset has a Staging copy on disk; Poster format is the same class of fact and the same seam.
- The cache instruction and extension set that the checker states in shell are left as they are. Both fail loudly on divergence — a wrong cache assertion fails CI, a wrong extension set is visible in the checker's own output — and neither is worth a code-generation step. The narrowing rule was the only one of the shell's restatements that could fail silently, and it is the one being removed.

### The rename

- `ItemType` → `Entry`. `videoSrc` → `demoPath`. `thumbnailSrc` → `posterPath`. The `Resource*` and `Product*` component, prop and variable names follow the same glossary.
- Applied in a single change so that no period exists in which half the codebase speaks each vocabulary.
- Stops at two boundaries. Stored Firestore field names are records in a live database, not code. Public web addresses are promises to people who have saved links, and the redirect middleware exists specifically to honour them.
- Dead types carrying no references are removed in the same pass rather than being renamed.

## Testing Decisions

### What makes a good test here

Test the observable rule, not the shape of the code that implements it. A good test in this repo states an independent expectation about the catalogue or about the Assets, in terms a maintainer would recognise, and fails with a message naming the offending Entry. The prior art is the existing data-integrity suite: it asserts things like "no two Entries share a Demo path" and "every Asset path is printable ASCII", each failing with the specific Entry IDs at fault. Follow that shape.

### Seams

No new seams. Three existing ones carry all of it.

**The data-integrity suite** is the primary seam and carries most of the work. It runs over the merged catalogue with no filesystem, no network and no Firestore, so it stays fast and deterministic. It gains:

- **Catalogue wiring.** For every row in the Category table, load its data file, read its exported array, and assert every Entry in it reached the merged catalogue. This catches the expensive silent failure and tolerates a Category that is legitimately empty. The failure message names the Category and the missing Entry IDs.
- **Path construction.** Constructing a Demo path for a Category produces something the suite's own hand-written pattern accepts, and the derived Poster path likewise. The patterns are not imported from the module — see ADR-0005, and carry a comment at both sites saying the duplication is deliberate.
- **Poster derivation.** A Poster path derived from a Demo path shares its Category directory and filename base and differs only in prefix and extension.
- **The narrowing rule.** Now a pure function: given a list of Asset paths and a fragment, the selected subset is exactly what is expected, including that a Category fragment selects both the Demo and the Poster directories.
- Its ten existing assertions must keep passing throughout, with only the field-name change from the rename.

**The codec checker** is the binary-content seam, already wired into CI as the assets job. It gains the assertion that every Poster is genuinely AVIF. This is the only place that can verify the Poster fix actually holds, because it is a fact about bytes rather than about strings.

**The type checker** is the rename's seam. A clean type check plus a green test suite plus a successful build is the proof that the rename compiled. Correctness of the *data* is proven separately, by capturing the catalogue's full list of Asset paths before the rename and after, and requiring the two to be byte-identical. That comparison is a one-off review step, not a retained test.

### Two deliberate non-tests

- **The publish tool gets no new test.** The agreement it used to maintain with the checker is deleted rather than verified — once it hands over a resolved list, there is no second derivation to disagree with. The rule it used to own moves to the Asset path module, where the data-integrity suite covers it as a pure function. Writing an integration test that needs live object-storage credentials to assert something that is now structurally guaranteed would cost more than it protects.
- **The redirect middleware gets no test.** Its two lists are generated from the Category table, so there is nothing left that can drift. A test would be asserting that a map function works.

## Out of Scope

- **The duplicate catalogue loader** (survey candidate 3). Two modules perform the same eighteen-way merge and nothing asserts they agree. Nearly mechanical once the Category table exists; a separate ticket.
- **The three near-identical catalogue pages** (candidate 5), including the double view-count they cause.
- **The view and vote counters** (candidate 6) and **the bookmark and vote hooks** (candidate 7).
- **Search** (candidate 9), which is blocked on a product question rather than an architectural one.
- **Firestore field names.** `view_count` and `vote_count` are stored records; changing them is a data migration.
- **Public web addresses.** Route paths and query parameter names stay exactly as they are.
- **The duplicated unique-value helpers** for Categories and authors, which are the same function twice. Cosmetic, unrelated to any failure described here.
- **Inverting the Category union** so the table becomes the type's root. Considered and rejected above.

## Further Notes

**Two live hazards found during the grilling, both outside this spec, both worth their own tickets:**

- The changed-items script runs on **every commit** via the pre-commit hook. It scans the data directory for JSON files; Entries are TypeScript. The only file it ever matches is the empty output it writes itself, so it compares that file against itself and always finds nothing. While doing this it performs a git checkout of the main branch in the middle of a commit. It does no useful work and it moves the working tree at a dangerous moment.
- The created-at backfill script cannot run at all: it uses the path and filesystem modules after the lines importing them were commented out, so it throws on its first line of work. It is still wired into the package scripts and force-included in the TypeScript config.

**A stale pull request.** The open dependency bump for the virtualisation library targets a package the previous session deleted. It can be closed.

**Timing.** The rename's cost is proportional to the number of open submission pull requests, and that number is currently zero. It will not stay zero.

**On the survey's stale claims.** Three of the survey's findings were overtaken by the dead-code deletion that landed before this grilling. The generator that derived Asset slugs by lowercasing — the headline evidence for the Category work — no longer exists. The JPG-to-AVIF converter no longer exists either, which is why the Poster pipeline is now broken end to end rather than merely awkward. And the codec checker already sources its Asset list from the catalogue rather than restating it, so it was never one of the nine restatement sites. The reasoning in this spec is built on the code as it stands today, not as the survey described it.
