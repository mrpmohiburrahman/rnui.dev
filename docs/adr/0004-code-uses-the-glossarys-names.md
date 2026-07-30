# Code uses the glossary's names

`CONTEXT.md` names the four load-bearing concepts Entry, Demo, Poster and Asset path, and lists `item`, `video`, `thumbnail` and `src` under *avoid* — yet the code called them `ItemType`, `videoSrc` and `thumbnailSrc`, so every one of its identifiers was on its own avoid list. We are renaming in code to match the glossary (`ItemType` → `Entry`, `videoSrc` → `demoPath`, `thumbnailSrc` → `posterPath`, and the `Resource*`/`Product*` component and variable names alongside them), because this repo is read by agents at least as often as by people — the `docs/agents/` skills read it cold, as did two ingest scripts since deleted (ADR-0006) — and a reader who learns the vocabulary from `CONTEXT.md` and then opens `data/items.ts` currently learns it twice.

## Considered options

- **Rename the type only.** One word, 33 files, near-zero risk. Rejected: `videoSrc` and `thumbnailSrc` are the names a reader meets most, appearing twice per Entry in the data files, so the cheapest change leaves the most-read names wrong.
- **Defer the component names to the page-module work.** That work rewrites `resource-card*.tsx` and the three page clients anyway, so renaming them now is partly redundant. Rejected to avoid a period in which half the codebase speaks each vocabulary; the redundancy is a few identifiers in files that are being rewritten regardless.

## Consequences

- One commit changes roughly 558 lines across `data/*.ts` and alters no behaviour. `git blame` on those lines points at the rename rather than at the submission that added the Entry. Accepted: the data files are append-only lists, where blame carries little.
- The diff cannot be reviewed by reading — 558 mechanical lines all look correct. The review is a snapshot instead: `pnpm assets:paths` is captured before and must be byte-identical after. A single changed character means the rename touched data, not names.
- The rename stops at two boundaries. `view_count` and `vote_count` are field names inside live Firestore documents, and `/products` plus `?category=` are public links that `middleware.ts` exists specifically to keep alive. Changing either is a migration, not a rename, and neither is in scope.
- Sequenced immediately after the publish-gate fix and before the new modules, so that those modules are written once in the new vocabulary. The ordering is also opportunistic: the rename conflicts with every open submission PR, and the queue currently holds only Dependabot bumps.
