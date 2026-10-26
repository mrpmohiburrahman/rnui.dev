# Which file actually serves the root card

Status: resolved
Type: research
Blocked by:

## Question

**Three files claim the same slot. `app/opengraph-image.png` and `app/twitter-image.png` are
byte-identical (447624 bytes, both dated Jan 10 2025), and `app/opengraph-image.tsx` is a fourth
candidate Next may or may not be reading.**

What does `https://www.rnui.dev/` actually serve today as `og:image` — the flat-slate `ImageResponse`
in `app/opengraph-image.tsx`, or the purple-room photo in `app/opengraph-image.png`?

The precedence is Next's, not this repo's, so it has to be read rather than assumed:

- When a static file and a same-named `.tsx` route both exist in a segment, which wins, and does the
  loser emit a warning or fail the build?
- Do `opengraph-image.png` and `twitter-image.png` need not be byte-identical, and are they separate
  slots a card design must therefore fill twice?
- `app/recording/[id]/page.tsx:41-50` sets `openGraph.images` explicitly, overriding the root file
  convention for that segment. The comment at `app/contributors/page.tsx:32-43` already records the
  other half of this: a segment declaring *any* `openGraph` of its own loses the inherited image
  wholesale. Establish whether that is still true in Next 16.1.1, because ticket 08's mechanism turns
  on it.

Then answer the two questions the map cannot phrase yet, which this investigation unblocks:

- Is the shipped card the purple photo or the slate gradient? If the photo, the maintainer's
  "I don't like it at all" is about a design nobody here has looked at in production.
- What does `/products` serve with no filter — the root card, or nothing?

## Notes

Answer with the precedence rule **cited**, not paraphrased — Next's file-convention docs, or the
built output if reading the source is ambiguous. `node_modules/next/dist` is available locally and
`.next/server/app/opengraph-image*/route.js` from a prior build is on disk, both of which answer this
without the network.

Record the finding here. Do not change any of the three files — what replaces them is ticket 10.
## Answer

Resolved 2026-10-05 from the built output in `.next/` (a prior `pnpm build`) plus the Next.js
`generateMetadata` reference. No file was changed; the loser's fate is ticket 10's.

### 1. Which file wins — **both emit, and the `.tsx` goes first**

`app/aboutus` and `app/contributors` carry **two** `og:image` tags, in this order:

```
<meta property="og:image:alt"   content="rnui.dev: Curated React Native UI & Animation Catalog"/>
<meta property="og:image"       content="http://localhost:3000/opengraph-image?a54b8d10928c19e1"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image"       content="http://localhost:3000/opengraph-image.png?opengraph-image.fb73fb83.png"/>
```

So `app/opengraph-image.tsx` is **first** and the Jan 2025 PNG is second. There is no conflict error
and no build warning — Next treats them as two separate metadata-image entries and emits both.

**A scraper takes the first `og:image`.** The purple photo is dead weight on every share today, and
`app/opengraph-image.tsx` is what everyone actually sees. The maintainer's "I don't like it at all" is
about the flat slate gradient, not the photo — but the photo is also wrong and also shipped.

The `alt` text, `1200×630` and `image/png` on the first entry all come from the `.tsx`'s own `alt` /
`size` / `contentType` exports, confirming the first tag is the generated route.

### 2. `twitter-image` is a separate slot — and it is currently the only live card on a Recording page

`twitter:card` is `summary_large_image` (from `data/meta-data.ts:35`) and `twitter:image` resolves to
the static `twitter-image.png`. On `/aboutus` and `/contributors` that means **X shows the purple
photo while every other platform shows the gradient** — the two are genuinely serving different
bytes to different platforms today.

Worse, on a Recording page:

```
<meta property="og:image"     content="https://cdn.rnui.dev/thumbnails/tabbars/direction_aware_tabs_hewad_mubariz.avif"/>
<meta name="twitter:image"    content="http://localhost:3000/twitter-image.png?twitter-image.fb73fb83.png"/>
```

`app/recording/[id]/page.tsx:41-50` sets `openGraph.images` and **never sets `twitter.images`**, so
`twitter:image` keeps inheriting the root file. **Sharing a demo link to X shows the purple photo of a
phone in a room, not the demo.** A design must fill both slots or delete `twitter-image.png` and let
X fall back to `og:image`.

### 3. `generateMetadata` **does** receive `searchParams` — the map's central bet holds

From the Next.js reference: `generateMetadata` takes `props` containing both `params` and
`searchParams`, both `Promise`s, with this table verbatim:

| URL | `searchParams` |
| --- | --- |
| `/shop?a=1` | `{ a: '1' }` |
| `/shop?a=1&b=2` | `{ a: '1', b: '2' }` |
| `/shop?a=1&a=2` | `{ a: ['1', '2'] }` |

One caveat, stated in the same page and load-bearing for ticket 07: **"`searchParams` are only
available in `page.js` segments."** It is `page.tsx`, not a layout — fine here.

So `/products?contributor=<name>` **can** serve a different `og:image` per query value. This is the
mechanism the map was written around, and it is real.

### 4. The `contributors/page.tsx` inheritance claim **still holds**

Next's merging rule, from the same reference: *"Metadata objects exported from multiple segments in
the same route are **shallowly** merged… Duplicate keys are **replaced**… metadata with nested fields
such as `openGraph` … defined in an earlier segment are **overwritten** by the last segment to define
them."*

Shallow, not deep — so a segment declaring `openGraph: { title, description }` drops the parent's
`openGraph.images`. `app/contributors/page.tsx:32-43` is **correct and current for Next 16**.

The fix is documented in the same section: pull the shared value out and spread it back in, i.e.
`openGraph: { ...openGraphImage, title }`. Ticket 07 should not rediscover this.

Note the same rule explains the Recording page: it sets `openGraph` and therefore loses the *root*
`og:image`, replacing it with the CDN Poster — and, having never set `twitter`, keeps the root
`twitter:image`.

### 5. `/products` with no filter serves **the gradient, and it is not prerendered**

`/products` is **absent from `prerender-manifest.json`'s `routes`** (only `/aboutus`, `/bookmarks`,
`/contactus`, `/contributors`, `/privacypolicy`, `/submit`, `/subscribe`, `/termsofservice`,
`/_not-found` and the 277 `/recording/*` are there). It awaits `searchParams` and Firestore, so it
renders per request and inherits the root file-convention image — the gradient, first tag.

`?category=foo` gets the same thing: no `generateMetadata` on the route, so the query is invisible to
metadata. **Today no filtered link shares anything but the default card.**

### Two further findings for the spec

- **`data/meta-data.ts:32-36` is dead.** `socialMediaTags` is not a field of Next's `Metadata` type —
  `app/contributors/page.tsx:30-32` already says so. Yet `twitter:card=summary_large_image` *does*
  appear in the built HTML, so it is arriving from somewhere else (Next's default for a present image).
  Worth confirming where, because ticket 09's `/bookmarks` decision turns on which platform gets told
  what.
- **Both hashes are build-stable** (`a54b8d10928c19e1`, `opengraph-image.fb73fb83.png`), which is how
  the `.tsx` route is cached. A live-rendered card route should expect the same treatment and the
  same invalidation question.

### Corrected premises elsewhere on this map

- `app/opengraph-image.tsx:14`'s `linear-gradient` **does** render — Satori supports linear gradients.
  Ticket 02's gradient premise is wrong as written; it must test whether Satori's gradient support
  covers what the Design needs, not whether gradients work.
- The claim in `app/opengraph-image.tsx:4` that `alt` is "Curated React Native UI & Animation Catalog"
  is what scrapers read as the image's description, and it names a *different* catalogue than
  `data/meta-data.ts:21` ("A list of community made animations"). Two spellings of this site, and the
  card carries the one that is not the current title.
