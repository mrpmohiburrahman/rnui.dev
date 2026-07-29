# The data test states the Asset path rules independently

`lib/asset-path.ts` owns the shape of an Asset path — the `demo/` and `thumbnails/` prefixes, the Category directory slug, the `.mp4` and `.avif` extensions — and builds every path from it. `tests/data-integrity.test.ts` keeps its own hand-written patterns for that same shape rather than importing them, and this duplication is deliberate: a test that takes its expectation from the code under test can no longer catch that code being wrong, because both sides are reading one sentence. These patterns are what caught `demo/Bottom Sheets/…` — four Entries pointing at a directory that has never existed, 403 in production — and they caught it precisely because they were written independently of the generator that produced those paths.

## Consequences

- Two statements of one rule read as an oversight. Anyone tidying up, human or agent, will be tempted to merge them; doing so silently removes the only guard against a whole class of Asset path defect, and that class of defect is unfixable once published (ADR-0003). Both files carry a comment pointing here.
- Divergence between the module and the patterns is the mechanism, not a risk to be managed. If the two disagree, `pnpm test` fails loudly before anything is uploaded, which is the entire purpose of the arrangement.
- The same reasoning does not extend to the shell. `scripts/check-video-codecs.sh` takes the list of paths to check from `scripts/asset-paths.ts` rather than restating it, and takes the narrowed selection from `publish-assets.ts` rather than re-deriving it — there the duplication guarded nothing and one direction of drift was silent.
