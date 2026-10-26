# Can a card show a Poster at all

Status: resolved
Type: grilling
Blocked by:

## Question

**The catalogue's only Poster format is AVIF, and the renderer refuses AVIF. A Poster that is not
transcoded produces a completely blank card — one colour, no error, no 500 — so this decision cannot
be deferred to implementation. What does a card do about its Poster?**

Ticket 02 established the constraint and this is the consequence of it, not a fresh question:

- `lib/asset-path.ts:34` — `const POSTER_EXTENSION = ".avif"`, and
  `tests/data-integrity.test.ts:23` enforces `…\.avif$` as the **only** valid Poster path. ADR-0003
  says a path names bytes and is never reused, so the format is not incidental.
- Satori's image allowlist is `[png, apng, jpeg, gif, svg+xml]` (`@vercel/og/index.node.js:534012`).
  AVIF is detected by the magic-byte sniffer and then **explicitly declined**.
- The rejection is swallowed (`index.node.js:16093` returns `[]`), so the card renders with nothing
  where the Poster should be. Measured: 1 distinct colour versus 2 for PNG and 373 for JPEG.

So the options are real and each has a cost the maintainer should weigh, not an agent:

1. **Transcode per request with `sharp`.** Already a dependency (`package.json:101`). Adds latency
   inside a request-time render on a free-tier function, and the per-request cost is **not yet
   measured**. The image LRU is 100 entries keyed by URL (`index.node.js:533903`), so the cost is
   cold-start-shaped. Also: which format? JPEG works, PNG works and defeats the point of AVIF, WebP
   is refused too — so JPEG is the only conversion that both works and is worth making.
2. **Pre-convert a sibling asset.** Publish a `….jpg` beside each `….avif` at poster-generation
   time. No per-request cost, no runtime transcoding, but it doubles the Posters in the bucket and
   touches the Poster pipeline — which this map's **Out of scope** currently excludes. Ruling *this
   option in* would move that boundary, deliberately.
3. **Drop the Poster.** The Recording card carries the title, the Category and the Demo link. A
   text-only card is legitimate and is what the Contributor and Category cards already are.
4. **Request a format the renderer accepts.** Cloudflare R2 and Images can transform on the fly at
   the edge, which moves the cost off the function entirely. This is a service decision with a
   dependency and possibly a cost.

This ticket is **conversation** — the answer is which of these, or which combination — with three
sub-questions that only matter once that is chosen:

- **Does the Recording card show a Poster at all?** The map's fog flags this as taste, and ticket 06 will
  hit the same wall. Deciding it here first means ticket 06 designs a card that can actually be rendered.
  If the answer is *no*, tickets 06 and 04 both get simpler and the AVIF question disappears.
- **What does a card show when the Poster fetch fails?** Not only AVIF — R2 404s, a deleted
  Recording, a cold cache. The blank card is a real outcome that a shared link can hit. It needs a
  designed fallback, not a hole.
- **Does the *platform* render an AVIF Poster?** Added by ticket 03, and it is a separate question from
  whether Satori does. Slack's robots page documents that its unfurl fetcher *"will fetch that file as
  well to check validity and extract other metadata"*, and Slack proxies images through `Slack-ImgProxy`.
  So a Poster on a card is decoded by **each platform as well as by us**, and an AVIF that Satori refuses
  may also be refused by Slack's proxy, by X's card renderer, or by Messages. Nobody has tested any of
  them. It matters because it can force the same choice from the other direction: if no platform will
  render AVIF, then even option 1 or 2 leaves the *shared* card worse than the card we render — a
  conversion we skip would have made no difference to the share. Evidence:
  [`../research/how-long-a-scraper-holds-a-card.md`](../research/how-long-a-scraper-holds-a-card.md).

## Notes

Read [`../research/can-imageresponse-render-this-design.md`](../research/can-imageresponse-render-this-design.md)
first; the measurements are all there. The probe that produced them is `../probe/`. Ticket 03's findings,
including what the platforms do with a fetched image, are in
[`../research/how-long-a-scraper-holds-a-card.md`](../research/how-long-a-scraper-holds-a-card.md).

**This ticket is the entire frontier.** 04, 05 and 06 are `Blocked by: 14` and 07 is blocked by it too,
so nothing else in the effort moves until this is answered. 06 originally read `Blocked by: 02`, which is
resolved — it was re-wired to 14 on purpose so that 06 cannot start designing a card that would render
blank. Leaving 06 to rediscover the AVIF wall is how a card ships blank.

It is `Type: grilling`, so it needs the maintainer in the conversation. The four options above are a real
choice with real costs, not a question an agent should answer on its own.

Everything this ticket decides must be reachable by ticket 10 (`Write the card spec`), which is the
map's destination.

## Answer

Five questions, asked as one round and answered by the maintainer, who delegated the calls: *"I don't
really know. Choose the best option according to you."* Every number below was measured this session
against the real catalogue; the probes are in `../probe/`.

### 1. Yes — the Recording card shows a Poster, and only the Recording card does

Contributor and Category cards stay text-only. A Contributor has 1–138 Recordings (measured: min 1,
median 6, max 138), so a rule for *which* Poster represents one is a question with no good answer, and
the count plus the name is already the point of that card. This also settles the map's fog item *"whether
a card ever shows a Recording's own Poster"* — yes, but only on the card for that Recording.

The reason it is worth doing: the site's proposition is moving pictures, and a share is the only moment
a stranger sees one. No other card in the set has a visual.

### 2. Pre-convert a JPEG **Rendition** beside each Poster

Rejected, with the measurements that decided it:

- **Per-request `sharp`** — 17.9 ms per Poster, and the image LRU is 100 entries keyed by URL against
  297 Recordings, so the cost is cold-start-shaped and recurs. Worse, `sharp` is a native addon and
  Vercel's Edge Runtime forbids native Node APIs (Vercel's own Edge Runtime docs), while
  `app/opengraph-image.tsx:3` is `runtime = "edge"`. It would force `nodejs`.
- **Cloudflare `/cdn-cgi/image`** — **measured off.** Every variant against the live CDN returns
  `403 ERROR 9401: Transformation origin is not in allowed origins list`. This is a zone setting, not a
  service to evaluate, and it is currently closed.
- **Drop the Poster** — collapses into answer 1.

Chosen because the one-off is trivial and the recurring cost is **zero**: the whole catalogue transcodes
serially in **4.1 s**. Storage, measured at the size a card actually uses — **1200×630 cover = 7.3 MB
total, 25 KB average**, against 4.5 MB for the AVIFs themselves. Full-size 1108×2410 renditions would be
24.1 MB and are not needed, since a card composites into 1200×630.

### 3. Domain: a Rendition is a derived Asset, not a second Poster

The mechanism forced a vocabulary decision, so this is the load-bearing part of the answer. A **Poster**
is one specific thing — the still frame at two seconds — and `lib/asset-path.ts:34` plus
`tests/data-integrity.test.ts:23` both make `.avif` the *only* valid Poster path, restated
independently on purpose (ADR-0005). Adding `.jpg` as a second Poster extension would contradict the
glossary, which says every Demo has exactly one Poster.

So a new term, and it is **derived**: a Poster's bytes → a JPEG at a card-usable size. Recorded in
`CONTEXT.md` as **Rendition**. Four properties, each load-bearing:

- **Derived from a Poster's bytes, so it is not an Asset the catalogue names.** `allAssetPaths`
  (`data/catalogue.ts:62`) is `demoPath` + `posterPath`; a Rendition is not in it, and must not be, or
  every tool that walks `allAssetPaths` starts handling a second kind of thing.
- **Immutable like any Asset** (`public, max-age=31536000, immutable`, ADR-0003) — it is published once
  and never rewritten, because the byte-identical rule is what makes caching safe.
- **Regenerable, not authored.** A Re-record yields a new Poster, which yields a new Rendition beside it;
  the old one stays as an orphan, exactly like a superseded Poster.
- **Never fetched by a page.** Only a card reads one. A page keeps reading the AVIF Poster — smaller,
  and 297 renditions of them would be a pointless egress bill.

### 4. A missing Poster becomes the grid's own fallback, not a hole

The failure is invisible — no 500, no throw, one flat colour — so it needs a designed state. The fallback
is a **hue-tinted panel with a device outline**, which is not a new idea: `app/globals.css:226` already
defines `--tile-hue: 175` as *"an unmeasured Recording glows the site's own green"*, and that is exactly
what the grid shows today for a Recording it has no hue for. **215 of 297 Recordings already carry a
measured `hue`** (`lib/poster-hue.ts`); the remainder take the site's green. A share degrades to a
coloured card with the title, which is the same degradation the grid already ships.

This covers every failure, not only AVIF: an R2 404, a deleted Recording, a cold cache.

### 5. A constraint ticket 07 inherits: a card with a Poster is `runtime = "nodejs"`

Even though renditions remove the transcoding cost, a card that fetches a Rendition over the network is
doing I/O inside the render, and the edge runtime's constraints make that a deliberate choice rather than
a default. Cards that composite no image may stay `edge`. Stated here because ticket 07 owns the
mechanism and would otherwise rediscover it from a blank card.

### 6. Platform AVIF support is settled by irrelevance — not measured, deliberately

The map's sub-question was whether Slack, X or Messages can decode an AVIF. It does not need answering:
**a card's `contentType` is PNG**, so no platform ever sees the AVIF. The Poster is composited by us
before the bytes leave. Slack proxies images through `Slack-ImgProxy` and AVIF appears in no published
format list, but that is a fact about a path we do not take. Measuring it would cost a share-test cycle
and buy nothing. Recorded so nobody re-opens it.

### One map belief this ticket kills

The map and ticket 06 both worried that a Poster *"is the frame two seconds into the Demo, which may be
a blank sheet."* **Measured across all 303 Posters: the flattest has 57 distinct colours, the median has
1041, the maximum 12688.** Not one is a flat fill. 64 of them (21%) are more than 90% near-white or
near-black app chrome — pale, not empty. A Poster is always worth showing.

### Handed to ticket 06

Six ways, established here so ticket 06 designs inside them: the Poster **is** shown on the Recording
card; it arrives as a **JPEG Rendition**, never as AVIF; the **hue-tinted panel** is the designed
failure state; the capture ratio is **0.4598** (measured, matching the documented 0.459954) against a
**1.91** card; captions run **5 to 36 characters**, median 15; and a Poster must never be trusted to be
present.