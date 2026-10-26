# How long a scraper holds a card

Status: resolved
Type: research
Blocked by:

## Question

**The Contributor card shows a count that changes, and X, Slack, LinkedIn and iMessage fetch
`og:image` once at share time and cache the bytes on their side. How long, and can anything in the
markup make them re-fetch?**

The map accepted the staleness — "a share from last month" is tolerable for a catalogue growing by a
handful of Recordings a month — but accepted it on the map-maker's say-so, not on evidence. Establish:

- **The actual cache lifetimes**, per platform, cited. Are they days, weeks, or indefinite? Is there a
  documented TTL at all, or only folklore?
- **Can the page influence it?** A `Cache-Control` header on the *page* is not the lever — the
  *image* URL is what is cached. Does appending a query parameter to the image URL (`?v=2`) make a
  scraper re-fetch, and at what cost, given it is a URL the site would have to change?
- **Does X in particular behave differently**, since `app/twitter-image.png` is a separate slot and X
  is the platform most likely to be shared to from this catalogue?
- **What do the scraper debuggers report** — which of them re-fetch, which serve a cache? Their
  behaviour on an uncached first share is what a card is judged on, so this is measurable rather than
  theoretical.

This ticket answers "how wrong can a card be". Ticket 08 answers "how is it generated", and the
generation choice in the map's Decisions — live at request time — is only right if this ticket says
the platform cache is long enough to make our own cache setting irrelevant.

## Notes

X's card validator, Slack's unfurl behaviour and LinkedIn's Post Inspector are the three to test. Use
the deployed `www.rnui.dev`, not `preview.rnui.dev` — the latter is `noindex` by a `headers()` rule
(`next.config.ts`), which is correct for the site and wrong for this measurement.

Cite per platform. Do not report a TTL nobody documented.

## Answer

Full findings with citations: [`../research/how-long-a-scraper-holds-a-card.md`](../research/how-long-a-scraper-holds-a-card.md).

**Only one platform publishes a cache lifetime, and it is 30 minutes.** Slack's own robots page
(`api.slack.com/robots`), verbatim: *"Responses to these requests are cached globally across the service for
around 30 minutes."* The other three publish nothing. **The map's assumption — staleness bounded to "a
share from last month" — is the hopeful reading, not the established one.** It is right in direction and
unsupported in quantity, and it is unsupported precisely where this catalogue is most likely to be shared.

### Per platform

| Platform | Lifetime | Documented? | What forces a re-fetch |
|---|---|---|---|
| Slack | **~30 min** | **yes**, `api.slack.com/robots` | the expiry alone |
| X | "roughly every seven days"; files 24 h | **the page is deleted** — see below | a re-crawl, or any change to the URL |
| LinkedIn | **undocumented** | caching confirmed, TTL absent | Post Inspector — **never for existing posts** |
| Apple Messages | **undocumented** | absent | nothing documented |

**X's documentation no longer exists.** `developer.x.com/en/docs/cards/*` and
`developer.twitter.com/en/docs/twitter-for-websites/cards/*` both 307 to `docs.x.com/`, and X's published
`docs.x.com/llms.txt` index contains no cards section at all. The "seven days" survives only as a 2016
post by `@andypiper` (then a Twitter employee) on X's own forum, *citing the page that has since been
removed*. The most useful sentence in it is his, on cache-busting: **"the crawler delay and cache are not
designed to be dynamically updated."** X's forum also quotes its (now deleted) help page: *"We cache files
(including robots.txt and images) for 24 hours."* Card data and files are cached differently and the
discrepancy was never resolved.

**X's Card Validator can no longer answer the question — measured, in the maintainer's own session.** It
now redirects to `x.com/login` (the client app still renders the validator, so the login wall is easy to
miss), and once in:

- **It does not render a card at all.** The "Card preview" pane is a dead box holding the signed-in
  account's avatar and one link, *"Card preview has moved to Tweet Composer."* Confirmed by screenshot.
- **Its entire output is four lines:** `Page fetched successfully` / `22 metatags were found` /
  `twitter:card = summary_large_image tag found` / `Card loaded successfully`. **No cache age, no
  timestamp, no status, no image URL.** So this ticket's own test plan — that the validator's behaviour
  "is what a card is judged on, so this is measurable rather than theoretical" — **is not performable**.
  The tool has been reduced to a metadata parser. That is a stronger negative than "needs a login".
- **It closes the `twitter:card` provenance question from the platform side.** X's crawler reports
  `twitter:card = summary_large_image tag found`, so `data/meta-data.ts`'s `socialMediaTags` — outside
  Next's `Metadata` type — **does** reach X. No longer an inference from our own HTML.
- **It flags nothing about the three competing `og:image` tags.** No warning, no error. X's silence is not
  evidence the duplication is harmless; the tool does not check.
- **`?v=2` on the page URL changed nothing** — byte-identical output. Which locates the lever exactly: it
  belongs on the **image** URL, which is what Next's content hash already varies.

**LinkedIn's hard fact is worse than a TTL.** Its help page: *"The changes you make will only affect the
URL's preview image and information for new posts that include it. The preview for any existing posts with
this URL will remain the same."* **A LinkedIn share is permanent.** No header and no amount of live
rendering reaches a post that already exists — only a *new* share re-reads the card, which is exactly the
property the map's render-live decision buys. The "LinkedIn caches 7 days" figure that circulates traces
only to Quora and marketing blogs.

**Apple documents the protocol and no cache behaviour.** TN3156 (first published 2017 as TN2444). No TTL.
Its *"Avoid text in preview images… potentially making text unreadable"* and *"Do not put the site name
in the `og:title`"* are decisions in disguise and belong to tickets 05 and 10.

### Every lever is already pulled — measured against production

- **Image headers are maximal.** All three card URLs serve `public, max-age=0, must-revalidate`. Per RFC
  9111 §4.2.1 that is a `freshness_lifetime` of zero, so a conforming cache must validate every time. The
  generated route carries **no `etag` and no `last-modified`**, so there is nothing to compare and the body
  must be re-downloaded. Nothing stronger exists to send.
- **The `?v=2` trick is already automatic, keyed on content identity.** Next.js appends a content hash to
  metadata image URLs: `twitter-image.png?twitter-image.fb73fb83.png` and
  `opengraph-image?a54b8d10928c19e1`. RFC 9111 §4 makes a different target URI a different entry, so
  editing a card changes its URL and guarantees a miss. Note this is **measured, not documented** — the
  Next.js reference only writes `<generated>`. The flip side is that a URL that never changes can never be
  re-fetched, so the hash is load-bearing. **No manual cache-buster is needed and none should be added.**
- **`twitter:image` and `og:image` are two independent caches.** Production emits three `og:image` tags
  plus one `twitter:image` pointing at a different file — two URLs, two cache entries, two expiry clocks,
  free to disagree indefinitely. **A card is only as good as its worse slot.**
- **`robots.txt` is no lever** (permissive; and Slack documents that it ignores it anyway).

### Two things this hands forward

- **Next.js's default is the opposite of the map's decision.** Its docs: generated images are *"statically
  optimized (generated at build time and cached) unless they use Request-time APIs or uncached data."*
  **Render-live is an opt-out that must be taken deliberately**, or a `/products?contributor=…` card gets
  baked at build and its count silently freezes — undoing the decision the map made. The current card
  already takes the opt-out; a new one must too. **Ticket 07.**
- **A Contributor identity cannot reach a card through an `opengraph-image.tsx` `params` prop** — the
  docs' own table gives `app/shop/opengraph-image.js` a `params` of `undefined`, and it carries route
  params only, never `searchParams`. The map's bet survives because `generateMetadata` *does* receive
  `searchParams` and can point `openGraph.images` at a card URL carrying the contributor. **Ticket 07.**

Also newly measured: `opengraph-image.png` and `twitter-image.png` serve a **byte-identical `etag` and
`content-length: 447624`** — confirming ticket 01's dead-duplicate finding empirically.

### What a human must still do

X is **now closed as a measurement**, and this is the finding rather than an excuse: its validator neither
renders a card nor reports an age. The only remaining route is Tweet Composer — composing the same URL
twice, weeks apart — which is the maintainer's call, needs their account, and cannot be done in a session.
**A single fresh composer preview would show the live card and say nothing about the cached one.**

Two are still cheap and are not in this session's reach:

- **LinkedIn's Post Inspector** reports *"when we last updated our data on it"* and can re-scrape. One
  minute with a login measures the one TTL nobody publishes — and after X, **it is the only platform where
  a measurement remains possible at all.**
- **Slack** needs no tool: paste a URL in a channel twice, 40 minutes apart, and see whether the unfurl
  changes. That also tests whether Slack decodes an AVIF Poster, which feeds ticket 14.