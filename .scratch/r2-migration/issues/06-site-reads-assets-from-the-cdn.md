# 06 — Site reads Demos and Posters from the CDN

**What to build:** Loading the site produces media requests to the CDN and nowhere else. A visitor gets every Demo and every Poster from the edge; neither ImageKit nor the Vercel origin serves a byte of media.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] A CDN URL module replaces the ImageKit module: one function, Asset path in, Published Asset URL out, tolerating a leading slash as the current helper does.
- [ ] Its three unused exports — the thumbnail transform builder, the LQIP builder, and the untransformed base-URL builder — are **deleted, not ported**. R2 performs no transformations and nothing calls them.
- [ ] **Poster resolution moves onto the same module.** Posters currently bypass the CDN entirely and are served as root-relative paths by Vercel; this is the single largest source of per-pageload origin traffic and is the main reason this migration touches Posters at all.
- [ ] Both Demo consumers and the one Poster consumer resolve through the module. The card library's image component is never passed a Poster and is left untouched.
- [ ] Resource hints in the document head point at the CDN host, not ImageKit.
- [ ] Loading the site with the network panel open shows media requests only to the CDN host — no ImageKit host, no root-relative Asset paths.
- [ ] Type check and the full test suite pass.
