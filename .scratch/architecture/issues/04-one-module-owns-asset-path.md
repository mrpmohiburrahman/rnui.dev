# 04 — One module owns the shape of an Asset path

**What to build:** The shape of an Asset path is defined in one place and read from there, instead of being remembered separately in nine.

Today the only formal statement of that shape is a pair of patterns inside a test. Everything else — the two directory prefixes, the two extensions, the local staging prefix, the content types, the cache instruction, the narrowing rule, and an English restatement inside an automated review prompt — is an independent remembering of the same rule.

Give it a module. It owns the prefixes and extensions, constructs a Demo path from a Category and a filename base, derives the matching Poster path from a Demo path, knows the staging prefix that marks an Asset not yet published, and holds the content types and the cache instruction. The narrowing rule moves in from the publish tool, where it becomes a pure function with one definition, testable without credentials. The filename-slug helper moves in too, since it exists to produce the filename portion of a path.

It does **not** absorb the Published Asset adapter. Turning an Asset path into the URL a visitor fetches is a separate job with its own ADR (ADR-0001), and it stays a separate module.

**On the duplication you are about to see.** The data suite keeps its own hand-written patterns for the path shape rather than importing the module's, and this is deliberate — a test that takes its expectation from the code under test cannot catch that code being wrong, and these patterns are what caught a Category directory containing a space that returned 403 in production. Do not merge them. Both sides carry a comment; the reasoning is ADR-0005.

**Naming.** Singular. A script with the plural name already exists and does something different — it prints the catalogue's full list of Asset paths.

**Blocked by:** 03. The module reads the Category table's Asset directory slug.

**Status:** ready-for-agent

- [ ] One module owns the two directory prefixes, the two extensions, the local staging prefix, the content types and the cache instruction
- [ ] It constructs a Demo path from a Category and a filename base
- [ ] It derives a Poster path from a Demo path
- [ ] The narrowing rule lives in the module as a pure function, and the publish tool calls it rather than defining it
- [ ] The filename-slug helper lives in the module
- [ ] The ingest script builds both Asset paths through the module
- [ ] The automated review prompt's description of the path shape is assembled from the module rather than typed into the prompt
- [ ] The Published Asset adapter is untouched
- [ ] The data suite covers construction, Poster derivation and narrowing, using patterns written independently of the module
- [ ] Both the module and the data suite carry a comment explaining the deliberate duplication and pointing at ADR-0005
- [ ] Every Asset path in the catalogue is unchanged
- [ ] Type check, test suite, build and end-to-end tests all pass
