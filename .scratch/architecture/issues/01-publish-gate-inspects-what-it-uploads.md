# 01 — The publish gate inspects exactly what it will upload

**What to build:** A maintainer who narrows a publish run to one Category can be certain the codec checker inspected precisely the Assets that are about to be uploaded — not a set it worked out separately and might have got wrong.

Today the publish tool and the codec checker each derive that set independently, in two different languages, from the same user-supplied fragment. They agree by coincidence and a comment in each file. If the checker ever selects fewer Asset paths than the publisher, the gate passes, unchecked Assets are published, and — because a Published Asset is immutable for a year and cannot be overwritten (ADR-0003) — the mistake cannot be corrected in place.

Replace the agreement with a handover. The publish tool resolves its list of Asset paths first and passes that resolved list to the checker. The checker gains a mode that accepts a supplied list, and keeps its existing self-deriving mode untouched for the CI job that inspects live Published Assets.

The narrowing rule itself stays where it is in this ticket. It relocates into the Asset path module in ticket 04.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The publish tool resolves the Asset paths it will consider, then hands that resolved list to the codec checker, rather than passing along the user's narrowing fragments
- [x] The codec checker accepts a supplied list of Asset paths and inspects exactly those — no more, no fewer
- [x] The checker's existing self-deriving mode is unchanged, and the CI job that inspects Published Assets still passes
- [x] A narrowed run demands Staging copies only for the Assets it will actually touch
- [x] A failing check still aborts before a single byte is uploaded
- [x] The comments in both tools asserting that the two selections must agree are replaced by an explanation of why they can no longer disagree
- [x] A dry run narrowed to one Category shows the checker inspecting exactly the Assets the publisher then reports on
- [x] Type check, test suite and build all pass

## Outcome

`--paths-from FILE` on `scripts/check-video-codecs.sh`. `scripts/publish-assets.ts`
writes its resolved list to a temp file and passes that, instead of forwarding
the fragments the user typed.

**Why a file and not argv or stdin.** The checker reads its two path lists
separately — `asset-paths.ts demo` and `asset-paths.ts posters` — so the
supplied set is consumed twice and cannot come down a pipe. A file also keeps
the list off the command line, which a full-catalogue publish would fill with
554 arguments.

**The kind split stays in `asset-paths.ts`.** The supplied list is applied as a
whole-line intersection (`grep -Fx -f`) over each list the catalogue already
produced, rather than being split into Demos and Posters by the shell. Had the
shell split it, `demo/` and `thumbnails/` would have become a tenth restatement
of the Asset path shape — and a wrong split would have routed a Demo into the
Poster set, where nothing codec-checks it. Silent, in the dangerous direction.

**The intersection can only lose paths, so it is guarded.** Anything supplied
that the catalogue does not list means the two sides are reading different data;
the checker prints those paths and exits 1 rather than quietly inspecting a
smaller set. That is what makes "no more, no fewer" a mechanism rather than an
assumption.

**The vacuous-green guard moved up a level.** It used to ask "did this run select
both kinds of Asset", which only worked on the run that narrows nothing — and
once the publish tool always supplies a list, no publish is that run. It now asks
"does the catalogue list both kinds", before any narrowing, which is the question
it was always really asking. Every mode is covered by it now rather than one, and
each run separately asserts that its own selection is non-empty.

Fragment mode is retained for a human at a terminal, and `--production` is
untouched. `--paths-from` refuses to be combined with fragments; a resolved list
is not a thing to narrow further.

### Three defects found in review and fixed

1. **`--paths-from` with no FILE silently widened the run.** `shift` past the
   last argument left the variable empty, which is indistinguishable from the
   flag being absent, so the checker inspected the whole catalogue and exited 0
   — the exact silent-in-the-dangerous-direction failure this ticket exists to
   remove, reintroduced by the flag meant to remove it. Now refused outright.
2. **The un-narrowed publish lost the vacuous-green guard.** Described above:
   passing a list on every run moved every publish onto the subset branch, where
   a catalogue that had stopped listing Posters would have reported "all 0
   Posters are present" and exited 0. Verified by stubbing out the Poster half of
   the catalogue: caught now, on both the no-argument run and the supplied-list
   run, where previously it was checked on neither.
3. **The ASCII filename check ignored the narrowing entirely.** It walked all of
   `public/`, so any stray non-ASCII file anywhere on disk aborted a publish
   narrowed to one Category. Now walked per Category directory of the selected
   Assets.

   It still reads the filesystem rather than the catalogue, and deliberately.
   The check exists because macOS stores filenames decomposed while the data
   files are composed, so the defect is a difference between the two — reading
   the catalogue strings here would inspect the wrong bytes and find nothing,
   and the data suite already asserts those strings are printable ASCII.
   Regression-tested by planting a decomposed filename inside the narrowed
   Category (caught) and outside it (ignored).

### Verified

| Run | Result |
| --- | --- |
| `--paths-from` with 4 accordions paths | inspects 2 Demos + 2 Posters, exit 0 |
| supplied list with one path not in the catalogue | names it, exit 1 |
| supplied list of Demos only | 2 Demos, 0 Posters, exit 0 |
| supplied list, nonexistent / empty / relative / no value | exit 1, 1, 0, 1 — each distinctly worded |
| `--paths-from` plus a fragment | refused, exit 1 |
| fragment mode `buttons` | 20 + 20, exit 0 |
| fragment matching nothing | exit 1 |
| no arguments, whole catalogue | 277 + 277, exit 0 |
| catalogue stubbed to list no Posters | exit 1, with and without a supplied list |
| decomposed filename in / outside the narrowed Category | exit 1 / exit 0 |
| `--production accordions` | 4 Published Assets checked at the CDN, exit 0 |
| `assets:publish --dry-run accordions` | gate reports 4, publisher reports 4 |
| `assets:publish --dry-run zzzz` | no match, aborts before the gate |

`pnpm check-types`, `pnpm test` (10 passed) and `pnpm build` all pass. No new
test, per the spec's deliberate non-test: once the list is handed over there is
no second derivation left to assert against, and the narrowing rule itself moves
to the Asset path module in ticket 04, where the data suite covers it as a pure
function.

### Left for later

`PREFIXES` in the shell and `prefixes` in the publish tool both match by
substring, so neither is a prefix. Renaming them to `fragments` is churn that
ticket 04 would redo when the narrowing rule moves into the Asset path module,
so the identifiers are left alone and only the prose says "fragments".
