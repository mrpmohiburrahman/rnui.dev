# 01 — Catalogue Asset path invariants

**What to build:** The test suite refuses a catalogue in which an Asset path could ever point at the wrong bytes. Running the tests fails loudly if two Entries share an Asset path, if any Asset path contains a non-ASCII character, or if a path is malformed for its kind.

This is the prefactor for the whole migration. Once Assets are published under immutable, un-overwritable keys, a duplicated or mis-encoded path is unfixable — so the invariant has to hold before anything is uploaded.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] No two Entries share a Demo path; no two Entries share a Poster path. Failure message names the offending Entry IDs.
- [x] Every Asset path is pure ASCII.
- [x] Every Demo path and Poster path is well-formed for its kind: correct root directory and correct file extension.
- [x] Assertions live at the existing catalogue-data seam and extend the array it already builds. No new test file, no filesystem access, no network.
- [x] Each new assertion proven red before acceptance.

## Outcome

Five assertions added at the existing catalogue-data seam. 10 tests pass; type check and the Asset check both clean.

Each assertion was proven red by temporary mutation and reverted:

| Mutation | Assertion that fired |
| --- | --- |
| Two Entries given the same Demo path | no two entries share a Demo path |
| Two Entries given the same Poster path | no two entries share a Poster path |
| `ś` inserted into a Demo path | printable ASCII **and** well-formed Demo path |
| `Bottom Sheets/` (pre-existing, see below) | well-formed Demo path **and** well-formed Poster path |

### Live bug found and fixed

Four Entries in the Bottom Sheets category referenced `demo/Bottom Sheets/…` and `thumbnails/Bottom Sheets/…` — a directory that has never existed. The real Assets sit under `bottomsheets/` with identical basenames. ImageKit returned **403** for the spaced path, so those four Demos were broken in production.

Repointed all eight paths at `bottomsheets/`. The category *display* name `"Bottom Sheets"` is unchanged — only the Asset paths moved.

The well-formedness rule was deliberately tightened to require a lowercase, space-free category directory rather than merely "two segments". A space survives the local filesystem, needs percent-encoding in a URL, and fails at the CDN — the same class of byte-exactness hazard as the NFD/NFC problem that broke 16 Assets earlier.

### Counts, for ticket 05

- 277 Entries, each with a unique Demo path and a unique Poster path → **554 referenced Assets**.
- **0** referenced Assets missing on disk, after the fix above (was 8).
- **561** Asset files on disk → **7 unreferenced orphans**. Publish referenced Assets only.
