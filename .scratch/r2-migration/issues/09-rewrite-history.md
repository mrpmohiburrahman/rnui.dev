# 09 — Rewrite history to drop Asset blobs

**What to build:** Cloning the repo transfers a few MB instead of 228 MB. The Asset blobs are stripped from every commit, not merely deleted from the tip.

**Blocked by:** 08

**Status:** ready-for-agent

**⚠ Irreversible and outward-facing.** This force-pushes a rewritten history over a public repo with 347 stars and 11 forks. Every commit SHA changes; every existing clone and fork must be recreated. Decided in ADR-0002 with those costs accepted. Do not start this before every other ticket is complete and pushed.

- [ ] **A full backup clone is taken and verified before anything is rewritten.** Non-negotiable — this is the only recovery path.
- [ ] Asset directories stripped from every commit with `git-filter-repo`.
- [ ] Repository size after the rewrite is recorded and compared against the 228 MB baseline.
- [ ] The working tree at the tip is byte-identical to what it was before the rewrite — the rewrite removes history, not present state.
- [ ] Type check, full test suite and a production build all pass on the rewritten tree before the force-push.
- [ ] Force-push completed and the remote's default branch verified.
- [ ] The 8 open dependabot PRs are confirmed to recover. Dependabot recreates its branches after a force-push; no human PR exists, which is what made this cost acceptable.
- [ ] A short note published for fork holders explaining that they must re-clone.
