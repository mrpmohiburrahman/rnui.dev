# 02 — The code adopts the glossary's names

**What to build:** Anyone reading this repository — increasingly an agent, since the ingest, review and issue-tracker tooling all read it cold — learns one vocabulary rather than two.

`CONTEXT.md` names the concepts Entry, Demo, Poster and Asset path, and lists `item`, `video`, `thumbnail` and `src` as words to avoid. Every load-bearing identifier in the code is one of those avoided words. Rename them to match the glossary: the Entry type, the two Asset path fields on every Entry, and the component, prop and variable names that call an Entry a resource or a product.

The rename stops at two boundaries and must not cross them. Stored Firestore field names are records in a live database, so changing them is a data migration rather than a rename. Route paths and query parameter names are promises to people who have saved links, and the redirect middleware exists specifically to honour them.

Applied as one sweep, per ADR-0004, so there is no period in which half the codebase speaks each vocabulary.

**Review technique.** This diff cannot be reviewed by reading — several hundred mechanical lines all look correct. Capture the catalogue's full list of Asset paths before starting. After the rename, capture it again. The two must be byte-identical; a single changed character means the rename touched data rather than names.

**Blocked by:** 01. Both changes touch the publish tooling, and 01 is small — landing it after this rename would mean rebasing it through the sweep.

**Status:** resolved

- [x] The Entry type is named `Entry` everywhere it is referenced
- [x] The Demo Asset path field is named `demoPath` in every data file and every consumer
- [x] The Poster Asset path field is named `posterPath` in every data file and every consumer
- [x] Component, prop and variable names that refer to an Entry as a resource or a product adopt the glossary's terms
- [x] Types with no remaining references are deleted rather than renamed
- [x] Stored Firestore field names are unchanged
- [x] Route paths and query parameter names are unchanged, and every legacy redirect still resolves to the same destination
- [x] The catalogue's list of Asset paths captured before the change is byte-identical to the one captured after
- [x] Type check, test suite, build and end-to-end tests all pass

## Outcome

One sweep, 50 files, no behaviour changed. `ItemType` → `Entry`, `videoSrc` →
`demoPath`, `thumbnailSrc` → `posterPath`, and the modules that carried the old
vocabulary in their filenames moved with them:

| From | To |
| --- | --- |
| `data/items.ts` | `data/entry.ts` |
| `lib/codex/items.ts` (`ALL_ITEMS`) | `lib/codex/entries.ts` (`ALL_ENTRIES`) |
| `app/actions/get-products.ts` (`getProducts`) | `app/actions/get-entries.ts` (`getEntries`) |
| `components/resource-card{,-grid}.tsx` (`ResourceCard*`) | `components/entry-card{,-grid}.tsx` (`EntryCard*`) |
| `components/products-page-client.tsx` (`ProductsPageClient`) | `components/entries-page-client.tsx` (`EntriesPageClient`) |
| `components/nav/product-nav.tsx` (`ProductNav`) | `components/nav/catalogue-nav.tsx` (`CatalogueNav`) |

`getItemsWithCounts` → `getEntriesWithCounts`, `selectedProduct` →
`selectedEntry`, `ProductsPage` → `EntriesPage`, `votedItems` →
`votedEntryIds`, `EntryCard`'s `data` prop → `entry`, and the local `item`
loop variables in every file the sweep touched.

**Where the rename stopped.** The two boundaries ADR-0004 named, plus a third of
the same kind found on the way:

- `view_count`, `vote_count` and `created_at` are field names inside live
  Firestore documents. Left alone, with a comment in `data/entry.ts` saying why.
- `/products`, `?category=` and `/admin/products` are public links.
  `middleware.ts` is byte-unchanged.
- `localStorage["votedItems"]` is a record in a visitor's browser. The variables
  around it were renamed; the key was not, because renaming it would silently
  discard every vote already cast. The key now carries a comment explaining the
  asymmetry.

`ProductNav` and `ProductsPage` were renamed even though they sit next to frozen
route names, because the boundary is the *address*, not the identifier.
`components/nav/admin-nav.tsx` keeps `/admin/products` and its "Products" label:
one is a route, the other is text a user reads.

**Deleted rather than renamed.** `CategoryData`, `LabelData` and `TagData` had
no references anywhere. `app/actions/get-product-by-id.ts` had none either — a
`Product*` name for an Entry accessor whose body is entirely commented out. The
ticket's rule says unreferenced things are deleted, and that is what these are.

### Verified

| Check | Result |
| --- | --- |
| `pnpm assets:paths` before vs after | byte-identical, sha256 `6c98ad30…0694d`, 554 paths |
| `pnpm check-types` | clean |
| `pnpm test` | 10 passed |
| `pnpm build` | clean |
| `pnpm exec playwright test` | 3 passed |
| `/buttons`, `/circular-progress-bars`, `/miscellaneous`, `/bottomsheets`, `/fullapps`, `/dropdowns` | 307 to the same `/products?category=…` as before |
| `prettier --check` | same 36 files fail as at `HEAD` — no file newly non-conformant |

The asset-path snapshot is the whole review of the 554 data-file lines, per the
ticket's review technique. No new test: the spec's seam for this change is the
type checker, and there is no new behaviour to assert.

### Two things review caught

1. **`scripts/add-created-at.ts` was retargeted, not renamed.** The first pass
   pointed it at `data/catalogue.ts` on the reasoning that `data/entry.ts` no
   longer imports the eighteen data files. But the script walks its target's
   relative imports, and `entry.ts` imports `./catalogue` exactly as `items.ts`
   did — so `entry.ts` preserves the behaviour and `catalogue.ts` changes it
   from one file to eighteen. Reverted to `data/entry.ts`. The script still
   throws on its first line either way (its `path` import is commented out); the
   spec's Further Notes hold that fix for its own ticket.
2. **The `Product*` half of the rename had stopped at the three files the Entry
   type flows through.** `ProductNav`, `ProductNavProps` and `ProductsPage` were
   left behind on the grounds that they name routes. They do not — the routes
   are frozen, the identifiers were not, and ADR-0004 lists `Product*` names
   explicitly. Renamed.

### Left for later

`ALL_ENTRIES` in `lib/codex/entries.ts` is the same eighteen-way merge as
`allEntries` in `data/catalogue.ts`, and after this rename the two differ only by
case. That is survey candidate 3, which the spec holds back to its own ticket, so
the file gained a comment saying the near-identical names are a warning rather
than a coincidence.

The commented-out Supabase block in `app/actions/get-entries.ts` was swept along
with everything else and now says `filteredEntries` inside dead comments. Deleting
it is a cleanup that would have muddied a diff whose whole reviewability rests on
being mechanical.
