# 06 — Site reads Demos and Posters from the CDN

**What to build:** Loading the site produces media requests to the CDN and nowhere else. A visitor gets every Demo and every Poster from the edge; neither ImageKit nor the Vercel origin serves a byte of media.

**Blocked by:** 05

**Status:** resolved

- [x] A CDN URL module replaces the ImageKit module: one function, Asset path in, Published Asset URL out, tolerating a leading slash as the current helper does.
- [x] Its three unused exports — the thumbnail transform builder, the LQIP builder, and the untransformed base-URL builder — are **deleted, not ported**. R2 performs no transformations and nothing calls them.
- [x] **Poster resolution moves onto the same module.** Posters currently bypass the CDN entirely and are served as root-relative paths by Vercel; this is the single largest source of per-pageload origin traffic and is the main reason this migration touches Posters at all.
- [x] Both Demo consumers and the one Poster consumer resolve through the module. The card library's image component is never passed a Poster and is left untouched.
- [x] Resource hints in the document head point at the CDN host, not ImageKit.
- [x] Loading the site with the network panel open shows media requests only to the CDN host — no ImageKit host, no root-relative Asset paths.
- [x] Type check and the full test suite pass.

## Outcome

`lib/cdn.ts` replaces `lib/imagekit.ts`: one function, leading slash tolerated.
The thumbnail-transform, LQIP and base-URL builders were deleted, not ported.

- **Posters now resolve through the same module.** They previously bypassed the CDN entirely as root-relative paths served by Vercel.
- Both Demo consumers (`interactive-video.tsx`, `minimal-card.tsx`) and the one Poster consumer resolve through it. `MinimalCardImage` was left untouched — it is never passed a Poster.
- Resource hints in the document head are derived from `CDN_ORIGIN` rather than hardcoded, so there is one source of truth.
- ImageKit is gone: module, upload script, npm dependency, env vars in `.env`/`.env.local`/`.env.example`, CI variables and the README mention.

Measured rather than assumed — media requests on a home page load:
`[["localhost:3000", 1], ["cdn.rnui.dev", 277]]`. The single local request is
the app-shell logo. No ImageKit host, no root-relative Asset paths.

Type check, 10 unit tests, 3 e2e tests and a production build all pass.

Found in review: `CDN_ORIGIN` derived the origin with `new URL()` at module
scope, so a malformed `NEXT_PUBLIC_CDN_URL` would have thrown during import and
taken down every page to save a resource hint. Now caught and warned about.

The category merge extracted for the publish tooling landed as `data/catalogue.ts`
exporting `allEntries` — renamed from `all-items`/`allItems` after review, because
`CONTEXT.md` lists *item* under Entry's _Avoid_ words. It also replaced the
copy of that merge inside `data/items.ts`, so there is one list of Categories
rather than three.
