# 09 — Rewrite history to drop Asset blobs

**What to build:** Cloning the repo transfers a few MB instead of 228 MB. The Asset blobs are stripped from every commit, not merely deleted from the tip.

**Blocked by:** 08

**Status:** resolved

**⚠ Irreversible and outward-facing.** This force-pushes a rewritten history over a public repo with 347 stars and 11 forks. Every commit SHA changes; every existing clone and fork must be recreated. Decided in ADR-0002 with those costs accepted. Do not start this before every other ticket is complete and pushed.

- [x] **A full backup clone is taken and verified before anything is rewritten.** Non-negotiable — this is the only recovery path.
- [x] Asset directories stripped from every commit with `git-filter-repo`.
- [x] Repository size after the rewrite is recorded and compared against the 228 MB baseline.
- [x] The working tree at the tip is byte-identical to what it was before the rewrite — the rewrite removes history, not present state.
- [x] Type check, full test suite and a production build all pass on the rewritten tree before the force-push.
- [x] Force-push completed and the remote's default branch verified.
- [x] The 8 open dependabot PRs are confirmed to recover. Dependabot recreates its branches after a force-push; no human PR exists, which is what made this cost acceptable.
- [x] A short note published for fork holders explaining that they must re-clone.

## Outcome

Done on 2026-07-29, after every other ticket was complete, pushed, deployed and
green. Authorised explicitly by the maintainer.

**A clone of `main` is 8.6 MB and takes 8 seconds. It was 228 MB.**

### Backup, taken and verified first

`~/rnui-backup-pre-rewrite-2026-07-29`, a 224 MB mirror: 642 commits, 33 refs,
`fsck` clean, tip matching. Verified as a real recovery path rather than assumed
— cloned it, checked out the pre-migration commit, and confirmed 278 Demos and
278 Posters come back and still decode as H.264.

### It took two passes, because one path was not enough

The first pass stripped `public/demo` and `public/thumbnails` and looked
finished: 632 commits preserved, tip tree byte-identical, `.git` 229 MB -> 46 MB.
But a fresh clone was still **41 MB with 146 media objects in it**.

The Assets had lived somewhere else first. Before this was a Next app it was a
Docusaurus site, and Docusaurus serves from `static/` — so history also carried
**`static/demo/`, 35.1 MB of the same Demos under their old path**. A second pass
removed `static/demo` and `static/thumbnails`.

The lesson worth keeping: "strip the Asset directories" is a statement about
*every path the Assets have ever occupied*, not about the path they occupy now.
Checking the size of a fresh clone is what caught it; the local `.git` size did
not, because it was dominated by another branch.

### Results

| | before | after |
| --- | --- | --- |
| clone of `main` | 228 MB | **8.6 MB, 8 s** |
| clone of all branches | 228 MB | 43 MB, 23 s |
| `.git` size-pack | 132.15 MiB | 8.57 MiB (main) |
| catalogue Asset objects in history | 1467 | **0** |

- Tip tree hash `bb61e126…` is **byte-identical** before and after, across both
  passes. The rewrite removed history, not present state.
- 2 commits disappeared of 632 — they touched only `static/demo`, so they became
  empty and `git-filter-repo` pruned them.
- Type check, 10 unit tests, 3 e2e tests and a production build all pass on the
  rewritten tree. CI on the rewritten `main` is green on all three jobs.
- The 556 Staging copies on disk were untouched throughout.

### The force-push

All 12 remote branches were rewritten and force-pushed, not just `main` — the
blobs were reachable from `codex-grant-prep` and from all 8 dependabot branches
too, and leaving those would have left the clone just as large.

`remote main == local main == a892ceb`. Repo intact at 347 stars and 11 forks.

**All 8 dependabot PRs are still open.** Better than ADR-0002 anticipated: rather
than deleting their branches and waiting for dependabot to recreate them, each
branch was rewritten in place and force-pushed, so the PRs survived unbroken. No
human PR existed.

Fork holders: pinned issue
[#15](https://github.com/mrpmohiburrahman/rnui.dev/issues/15).

Production was re-checked after the force-push: site 200, asset paths 404 on the
Vercel origin, 278 media requests all to `cdn.rnui.dev`, and clicking a card
still plays.

### Left alone deliberately

- **`gh-pages` still carries 439 Asset objects** and is why a full all-branch
  clone is 43 MB rather than ~9 MB. It is a *live* GitHub Pages branch — the API
  reports `status: built`, `cname: rnui.dev` — holding a generated Docusaurus
  build from 2025-01-09. Rewriting or deleting a published branch is a separate
  outward-facing decision that neither ADR-0002 nor this ticket covers, so it was
  not taken unilaterally. Raised with the maintainer.
- **12 media files under `static/img/` and `static/video/`** (~7 MB): old
  documentation illustrations of bottom sheets, not catalogue Demos or Posters.
  Out of scope by the same reasoning.
- Old commit SHAs still resolve by direct URL on GitHub for now. They are
  unreachable from any branch, so no clone fetches them; GitHub garbage-collects
  them on its own schedule.
