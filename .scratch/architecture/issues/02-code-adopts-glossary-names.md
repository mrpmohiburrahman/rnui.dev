# 02 — The code adopts the glossary's names

**What to build:** Anyone reading this repository — increasingly an agent, since the ingest, review and issue-tracker tooling all read it cold — learns one vocabulary rather than two.

`CONTEXT.md` names the concepts Entry, Demo, Poster and Asset path, and lists `item`, `video`, `thumbnail` and `src` as words to avoid. Every load-bearing identifier in the code is one of those avoided words. Rename them to match the glossary: the Entry type, the two Asset path fields on every Entry, and the component, prop and variable names that call an Entry a resource or a product.

The rename stops at two boundaries and must not cross them. Stored Firestore field names are records in a live database, so changing them is a data migration rather than a rename. Route paths and query parameter names are promises to people who have saved links, and the redirect middleware exists specifically to honour them.

Applied as one sweep, per ADR-0004, so there is no period in which half the codebase speaks each vocabulary.

**Review technique.** This diff cannot be reviewed by reading — several hundred mechanical lines all look correct. Capture the catalogue's full list of Asset paths before starting. After the rename, capture it again. The two must be byte-identical; a single changed character means the rename touched data rather than names.

**Blocked by:** 01. Both changes touch the publish tooling, and 01 is small — landing it after this rename would mean rebasing it through the sweep.

**Status:** ready-for-agent

- [ ] The Entry type is named `Entry` everywhere it is referenced
- [ ] The Demo Asset path field is named `demoPath` in every data file and every consumer
- [ ] The Poster Asset path field is named `posterPath` in every data file and every consumer
- [ ] Component, prop and variable names that refer to an Entry as a resource or a product adopt the glossary's terms
- [ ] Types with no remaining references are deleted rather than renamed
- [ ] Stored Firestore field names are unchanged
- [ ] Route paths and query parameter names are unchanged, and every legacy redirect still resolves to the same destination
- [ ] The catalogue's list of Asset paths captured before the change is byte-identical to the one captured after
- [ ] Type check, test suite, build and end-to-end tests all pass
