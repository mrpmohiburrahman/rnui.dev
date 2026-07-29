# Rewrite git history to drop Asset blobs

Deleting the Assets from HEAD (ADR-0001) leaves every blob in history, so `git clone` still transfers 228 MB for a repo whose source is a few MB. We are rewriting history with `git-filter-repo` to strip `public/demo` and `public/thumbnails` from every commit, taking the clone to roughly 5 MB.

## Considered options

- **Delete from HEAD only.** No disruption, but the 228 MB stays forever — the stated goal was to get the binaries out of the repo, and this does not do that.
- **Git LFS.** Keeps per-Demo version history and shrinks clones, but GitHub's free LFS tier is 1 GB storage and 1 GB bandwidth/month, forks inherit the LFS requirement, and delivery would still need R2. Two systems where one will do.

## Consequences

- **Every commit SHA changes.** This is irreversible from the perspective of anyone holding a clone; they must re-clone. The repo is public with 347 stars and 11 forks at the time of writing.
- The 8 open PRs are all dependabot, which recreates its branches after a force-push. No human PR is affected, which is what made the cost acceptable.
- Tags, and any external link to a commit SHA, break.
- Take a full backup clone before running the rewrite.
