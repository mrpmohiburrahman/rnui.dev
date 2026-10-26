# How a card is addressed and generated

Status: open
Type: grilling
Blocked by: 01, 02, 03, 14

## Question

**Every design is chosen by now. This decides the route that serves them: one handler taking a query
string, or Next's file conventions, or a build step. The constraint that makes it non-obvious is that
a Contributor's only address is a query string.**

The map settled *live at request time* and *`/products?contributor=` with `generateMetadata` reading
`searchParams`*. It did not settle how the image itself is reached, and there are three shapes:

- **(a) A route handler** — `app/og/route.tsx` or similar, `GET /og?type=contributor&name=<folded>`,
  returning an `ImageResponse`. One file, every family, one place where the Design lives. Next's file
  conventions stay unused for cards.
- **(b) File conventions per route** — `app/products/opengraph-image.tsx` and friends. These are
  static per segment: Next emits one hashed URL, and the URL **cannot vary by `searchParams`**. So this
  cannot serve a per-Contributor card at all. Worth confirming rather than assuming, because ticket 01
  is reading Next's precedence rules and may already have the answer.
- **(c) Generate at build or publish time**, write to R2, serve as a static file. Contradicts the
  live-at-request-time decision, but only the *Contributor* card genuinely needs liveness, and a
  build-time card is free to serve forever. The split is possible and nobody has priced it.

Then settle, because each is a decision rather than a detail:

- **The image key.** A hash of `foldContributorName(name)` is safe (an image key is not a slug; the
  address is untouched), but a *human-readable* key leaks a Contributor's name into a URL that a
  crawler will fetch, and names contain Hangul and spaces. Which, and does the Recording card key on
  `Recording.id` — which is already URL-safe and stable?
- **Caching headers.** Live at request time does not mean uncached. What does the card route send, and
  does a shared card then pin a count for its cache lifetime — re-introducing exactly the staleness
  ticket 03 measures?
- **Which runtime.** `app/opengraph-image.tsx:3` declares `export const runtime = "edge"`. A handler
  that imports `data/catalogue.ts` (297 Recordings) to compute a count may not fit the edge bundle.
  Node runtime instead, and what that costs? **Ticket 14 settled half of this and handed it over:** a
  card that composites a Rendition does an in-render network fetch, so it is `runtime = "nodejs"`;
  cards that composite no image may stay `edge`. `sharp` is no longer a factor at all — renditions are
  pre-converted, so no native addon enters the bundle. What remains here is the catalogue-import
  question and the cost of being on `nodejs`. See
  [Can a card show a Poster at all](14-can-a-card-show-a-poster-at-all.md) and ADR-0012.
- **The failure mode.** A card route that throws returns no image, and the share falls back to
  `<title>` and `<meta name="description">`. Is that acceptable, or does the route need a
  last-resort plain card so a link never renders bare?
- **What a card costs per share.** Vercel function invocations and duration against the free tier
  (`.scratch/notify-and-preview/map.md` records a free-tier project), given a card is a render per
  share and a share is rare but not that rare.

## Notes

- `/products` has no `generateMetadata` today — `app/products/page.tsx` exports none, so it inherits the
  root card. Adding one is where the `searchParams`-varying card lands, and ticket 01's last question
  is exactly what that costs the inherited image.
- **ADR-0004** keeps `/products` and `?category=` alive as public links, so a card behind them is
  reachable by anyone. The 309/308 and the `?author=` → `?contributor=` permanent redirect
  (`app/products/page.tsx:39-46`) both already resolve before metadata is read, which is worth
  confirming rather than assuming.
- Invoke `/grilling` and `/domain-modeling`. This is the ticket where a wrong answer is expensive:
  it decides the shape of every card the site will ever serve.
- **Two constraints ticket 02 measured, which this ticket inherits rather than re-derives** (full
  findings in `../research/can-imageresponse-render-this-design.md`):
  - **Fonts.** `next/font/google` returns `{ className, style, variable }` — no bytes, no path — so the
    mechanism must supply TTF bytes from somewhere. Variable fonts hard-throw, so it is **six pinned
    static TTFs, 490 KB**, and the `fonts` array must be **hoisted to module scope**: the font-engine
    cache is a `WeakMap` keyed on the array *identity*, and reusing one array measured 17 ms against
    21–26 ms for a fresh one per request. Three sourcing options are laid out in the research note;
    one of them makes `fonts.gstatic.com` a runtime dependency of a public route, which is a
    reliability decision this ticket owns.
  - **The edge gap.** `app/opengraph-image.tsx:3` sets `runtime = "edge"`, which loads
    `index.edge.js`. **Every ticket-02 probe ran on the Node bundle.** The image allowlist and the
    `fvar` bug are the same Satori and almost certainly shared, but this is **unverified** and is one
    check before implementing.