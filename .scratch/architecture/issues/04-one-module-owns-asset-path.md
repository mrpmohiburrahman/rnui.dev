# 04 — One module owns the shape of an Asset path

**What to build:** The shape of an Asset path is defined in one place and read from there, instead of being remembered separately in nine.

Today the only formal statement of that shape is a pair of patterns inside a test. Everything else — the two directory prefixes, the two extensions, the local staging prefix, the content types, the cache instruction, the narrowing rule, and an English restatement inside an automated review prompt — is an independent remembering of the same rule.

Give it a module. It owns the prefixes and extensions, constructs a Demo path from a Category and a filename base, derives the matching Poster path from a Demo path, knows the staging prefix that marks an Asset not yet published, and holds the content types and the cache instruction. The narrowing rule moves in from the publish tool, where it becomes a pure function with one definition, testable without credentials. The filename-slug helper moves in too, since it exists to produce the filename portion of a path.

It does **not** absorb the Published Asset adapter. Turning an Asset path into the URL a visitor fetches is a separate job with its own ADR (ADR-0001), and it stays a separate module.

**On the duplication you are about to see.** The data suite keeps its own hand-written patterns for the path shape rather than importing the module's, and this is deliberate — a test that takes its expectation from the code under test cannot catch that code being wrong, and these patterns are what caught a Category directory containing a space that returned 403 in production. Do not merge them. Both sides carry a comment; the reasoning is ADR-0005.

**Naming.** Singular. A script with the plural name already exists and does something different — it prints the catalogue's full list of Asset paths.

**Blocked by:** 03. The module reads the Category table's Asset directory slug.

**Status:** resolved

- [x] One module owns the two directory prefixes, the two extensions, the local staging prefix, the content types and the cache instruction
- [x] It constructs a Demo path from a Category and a filename base
- [x] It derives a Poster path from a Demo path
- [x] The narrowing rule lives in the module as a pure function, and the publish tool calls it rather than defining it
- [x] The filename-slug helper lives in the module
- [x] The ingest script builds both Asset paths through the module
- [x] The automated review prompt's description of the path shape is assembled from the module rather than typed into the prompt
- [x] The Published Asset adapter is untouched
- [x] The data suite covers construction, Poster derivation and narrowing, using patterns written independently of the module
- [x] Both the module and the data suite carry a comment explaining the deliberate duplication and pointing at ADR-0005
- [x] Every Asset path in the catalogue is unchanged
- [x] Type check, test suite, build and end-to-end tests all pass

## Comments

**2026-07-29 — resolved.** `lib/asset-path.ts` holds the shape: the two prefixes, the two extensions, the `public` staging prefix, the content types, the cache instruction, `filenameSlug`, `demoPathFor`, `posterPathFor`, `narrow` and `stagingCopy`. ADR-0005 already named that path, so the module went where the ADR says it lives rather than beside the plural script.

Four callers now read it instead of remembering: `scripts/publish-assets.ts` (content types, cache instruction, narrowing, staging copy), `scripts/codex-ingest.ts` (both paths and the slug), `scripts/codex-review-pr.ts` (the prompt's `ASSET_PATH_SHAPE`) and `scripts/asset-paths.ts` (the two prefixes). `lib/cdn.ts` is untouched.

`posterPathFor` throws on anything that is not a Demo path rather than deriving a plausible-looking key: a Poster published under a wrong key cannot be corrected for a year (ADR-0003).

The data suite gained the construction, derivation and narrowing tests, plus one the module made cheap — every Entry's Poster path is the derivation of its Demo path, which holds for all 277 today. Its hand-written patterns moved to file scope so the new block can use them; they are still written independently of the module, and both sides now say why (ADR-0005).

Verified: `pnpm check-types`, `pnpm test` (73), `pnpm build`, `pnpm exec playwright test` (3). `pnpm assets:publish accordions --dry-run` still selects all four Assets — the Demos and the Posters — and the catalogue's 554 Asset paths are byte-identical.

**From the review.** Five fixes. `narrow` returns a new array rather than the caller's, because the publish tool sorts what it gets back and what it passes in is `allAssetPaths` itself. The prompt's shape says `<slug>` rather than `<category>`, since the directory is the lowercase asset slug and `Bottom Sheets` is the exact string ADR-0005 exists about. The publish tool's `prefixes` is now `fragments`, which is what the rule actually matches. The three constants nobody imports lost their `export`. And the module header no longer claims every caller reads from it — `scripts/generateThumbnails.ts` still builds its own directories until ticket 05 moves it.
