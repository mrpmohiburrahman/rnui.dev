# How long a scraper holds a card

Research for `.scratch/social-cards/issues/03-how-long-a-scraper-holds-a-card.md`. Resolved 2026-10-05.

The short answer: **one platform publishes a TTL and it is 30 minutes; the other three publish none, and
the one number the map's assumption rests on — "about a week" for X — now survives only as a 2016 forum
post citing a documentation page that no longer exists.** Every lever the site has is already pulled, so
the residue is not ours.

---

## The map's assumption, tested

The map recorded: *"a scraper caches the bytes at share time and never re-checks — staleness is bounded to
'a share from last month' — tolerable for a catalogue growing by a handful of Recordings a month."*

That is **directionally right and quantitatively unsupported.** One platform is far fresher than "a
month", two are undocumented with no bound at all, and the fourth — the one this catalogue is most likely
to be shared to — is the one whose documentation has been deleted. "Bounded to a share from last month"
is the *hopeful* reading, not the established one.

---

## Verdicts

Evidence grade is marked on every row. **D** = documented by the platform in its own docs. **E** =
stated by a platform employee on the platform's own property. **M** = measured by me against the deployed
site or the live HTTP behaviour. **F** = folklore / secondary only, no primary source found.

| Platform | Card / metadata cache | Image cache | Documented? | What forces a re-fetch |
|---|---|---|---|---|
| **Slack** | **~30 minutes** | same cache | **D** | the ~30 min expiry alone |
| **X** | "roughly every seven days" (2016, E) | **24 hours** (D, via forum quote) | page **deleted** | a re-crawl, ~7d; or any change to the URL |
| **LinkedIn** | **undocumented** | undocumented | caching confirmed **D**, TTL **absent** | Post Inspector re-scrape — **not for existing posts** |
| **Apple Messages** | **undocumented** | undocumented | **absent** | nothing documented; folklore says device-local |

### Slack — the only hard number on the board

[`api.slack.com/robots`](https://api.slack.com/robots), first party, verbatim:

> Responses to these requests are cached globally across the service for around 30 minutes. You should
> not be seeing more than one request for the same URL from us more frequently than that.

`Slackbot-LinkExpanding 1.0` is the unfurl fetcher. Same page, also verbatim: it *"fetches as little of
the page as it can (using HTTP Range headers) to extract meta tags"*, looking for **oEmbed and Twitter
Card / Open Graph tags**, and *"If a page's tags refer to an image, video, or audio file, we will fetch
that file as well to check validity and extract other metadata."*

Three consequences:

- **30 minutes is short enough that the map's staleness worry does not apply to Slack at all.** A count
  wrong at 09:00 is right by 09:31. This platform needed no thought and the map gave it one.
- **Slack validates the image by fetching it.** That is a live input to ticket 14: whether Slack's
  `Slack-ImgProxy` can decode an **AVIF** Poster is a separate question from whether Satori can, and it
  has not been asked yet.
- Slack states it **does not honour `robots.txt`**: *"We do not currently honor robots.txt files… As we
  are not a crawler (we don't follow links and we're acting on behalf of a human)."* No lever there.

### X — documented in 2016, deleted since

The whole of X's first-party position now lives in one thread on X's own forum:
[devcommunity.x.com/t/how-to-clear-twitter-card-cache-with-api/62974](https://devcommunity.x.com/t/how-to-clear-twitter-card-cache-with-api/62974).
Four verbatim statements, by `@andypiper` (then a Twitter employee):

> There is no API for clearing the card crawler cache, and the card validator is not intended to be used
> in this manner. Simply re-submitting the same URL to the validator will not refresh the cache.

> **Yes, there's a re-crawl roughly every seven days** — this is covered on the Troubleshooting page.

> There are some suggestions for how to do this in the troubleshooting docs, but there are no additional
> features planned.

> [Use junk parameters] to cause the crawler to revisit the page. This is not intended as a way to
> regularly update the images, just to assist you while troubleshooting — **the crawler delay and cache
> are not designed to be dynamically updated.**

That last clause is the most important sentence in this file. It is X saying, in its own words, that
**per-share freshness is not something the publisher can buy.**

**The cited page is gone.** Measured 2026-10-05: `developer.x.com/en/docs/cards/*` and
`developer.twitter.com/en/docs/twitter-for-websites/cards/*` both return `307 → docs.x.com/` — the docs
root, not a cards page. X's published [`docs.x.com/llms.txt`](https://docs.x.com/llms.txt) index lists the
X API, Ads API, Enterprise APIs and SDKs and contains **no cards section at all**. So "roughly every seven
days" is an *employee recollection from 2016, pointing at a page that has since been removed*. Later
replies in the same thread asking whether seven days still holds received no answer.

Separately, a *different* X forum thread quotes X's own cards help page:

> We cache files (including robots.txt and **images**) for **24 hours**.

Followers of the same forum ask the obvious question — card data ~7 days, files 24 hours, which is it?
— and it is never resolved. **Treat both numbers as D-grade-but-stale:** the 24-hour file figure is a
quotation of a page that no longer exists, and the 7-day card figure is an engineer's "roughly". Neither
was measured by me.

**The X Card Validator now requires an X account.** Measured: `cards-dev.twitter.com/validator` returns
`200` after redirecting to
`x.com/login?redirect_after_login=https%3A%2F%2Fcards-dev.twitter.com%2Fvalidator`. The tool the ticket
asks us to test is no longer an anonymous tool.

### Measured in an authenticated X session, 2026-10-05

Run against the deployed `https://www.rnui.dev/`, in the maintainer's own logged-in session, via the
`browser-skill` browser automation. The URL bar shows the `x.com/login` redirect throughout — the
client-side app renders the validator anyway, which is why the login requirement is easy to miss.

**The validator no longer renders a card.** The "Card preview" pane is a dead box containing the signed-in
account's name and avatar and one blue link: **"Card preview has moved to Tweet Composer."** There is no
card image. Confirmed by screenshot, not just the accessibility tree.

**Its entire output is four lines.** Fully expanded, the Log contains exactly:

```
INFO: Page fetched successfully
INFO: 22 metatags were found
INFO: twitter:card = summary_large_image tag found
INFO: Card loaded successfully
```

That is the complete report. **No cache age, no timestamp, no HTTP status, no resolved image URL, no
warnings.** So the ticket's own test plan — that the validator's behaviour "on an uncached first share is
what a card is judged on, so this is measurable rather than theoretical" — **cannot be carried out**. The
tool that was supposed to make it measurable has been reduced to a metadata parser. This is a stronger
negative than "requires a login".

**It independently confirms the `twitter:card` provenance.** X's own crawler reports
`twitter:card = summary_large_image tag found`, which settles from the platform side — not merely by
observing our own HTML — that `data/meta-data.ts`'s `socialMediaTags` key, which sits outside Next's
`Metadata` type, **does reach X's parser**. That half of the map's fog item is now closed by measurement
rather than inference.

**It flags nothing about the three competing `og:image` tags.** No warning, no error, no complaint about
duplicate `og:image`. Worth stating plainly: **X's silence here is not evidence the duplication is
harmless — the tool does not check.**

**A page-level `?v=2` changes nothing.** Validating `https://www.rnui.dev/?v=2` returned byte-identical
output (same four lines, same "22 metatags"). Expected, and it locates the lever precisely: the query
parameter that matters is on the **image** URL, which is exactly what Next's content hash already varies.

**The one route left is Tweet Composer**, which is where previews moved. Testing it means composing a
draft in the maintainer's account, and a *single* fresh composer preview would show the live card and say
nothing about the cached one — the informative version is composing the same URL twice a week apart. That
is a decision for the maintainer, not an agent, and not something to do inside a session.

### LinkedIn — caching confirmed, lifetime withheld, and one fact that is worse than a TTL

[linkedin.com/help/linkedin/answer/a6233775](https://www.linkedin.com/help/linkedin/answer/a6233775),
first party:

> When you post, message, or write an article with a URL, the preview window may show an old image that
> is cached.

So caching is documented. **No TTL appears anywhere in LinkedIn's documentation.** The widely repeated
"LinkedIn caches for 7 days" traces only to Quora, fidforward, prelinq and salesrobot — all **F**.

[linkedin.com/post-inspector](https://www.linkedin.com/post-inspector/) is first party and does two
useful things: it *"shows when we last updated our data on it"*, and it can *"request a re-scrape"*. That
makes the cache age **observable**, which is more than any other platform offers.

But the help page's closing note is the real finding, and it is a hard one:

> **The changes you make will only affect the URL's preview image and information for new posts that
> include it. The preview for any existing posts with this URL will remain the same.**

**A LinkedIn share is permanent.** No header, no TTL, no re-scrape and no amount of live rendering
reaches a post that already exists. This is bounded only by the fact that a *new* share re-reads
whatever the card says at that moment — which is exactly the property the map's "render live at request
time" decision buys, and the reason that decision survives this ticket.

### Apple Messages — no TTL, and two guidance lines that bind the card designs

[developer.apple.com TN3156](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages)
(first published 2017 as TN2444, republished 2024-04-30) documents the preview protocol and **no cache
behaviour whatsoever**. So Apple is **undocumented**. A secondary source claims previews are *"cached
locally on the sender's device"* — plausible and consistent with TN3156's insistence that previews *"do not
follow meta redirects, nor run JavaScript"* — but it is **F** and I could not confirm it first-party.

Two TN3156 lines are decisions in disguise and belong in the prototype tickets, not here:

> **Avoid text in preview images.** Images may be displayed at varying sizes depending on context and
> device, potentially making text unreadable. For best results, keep the image graphical and use other
> metadata tags for text.

That is a direct warning against a card that leads with a large numeral — i.e. against the obvious
Contributor-card layout. And:

> Do not put the site name or other branding in the `og:title`. Doing so often leads to duplication of
> information between the title and other parts of the rich preview, and is semantically incorrect.

which bears on the map's fog note about the two competing spellings of the site's own name.

Also binding, as a budget rather than a cache: *"The main resource located at the previewed link is
limited to 1 MB"* and *"The total size of associated resources (icons, images, and videos, etc) is limited
to 10 MB"*, with *"Images should be at least 900 pixels in width."*

---

## Can the page influence it? — the levers, one by one

The ticket's framing is right that a `Cache-Control` header on the **page** is not the lever, because the
**image URL** is what is cached. Measured against the deployed site, all four levers are already in the
strongest available position.

### Lever 1 — image response headers. Already maximal. **M**

Measured 2026-10-05 against `www.rnui.dev`:

| URL | `cache-control` | validators |
|---|---|---|
| `/` (page) | `private, no-cache, no-store, max-age=0, must-revalidate` | — |
| `/opengraph-image?a54b8d10928c19e1` | `public, max-age=0, must-revalidate` | **none** (no `etag`, no `last-modified`) |
| `/twitter-image.png?twitter-image.fb73fb83.png` | `public, max-age=0, must-revalidate` | `etag: "e83dab8…d511"`, `last-modified: Sun, 04 Oct 2026 21:44:48 GMT` |
| `/opengraph-image.png?opengraph-image.fb73fb83.png` | `public, max-age=0, must-revalidate` | `etag: "e83dab8…d511"`, `last-modified: Sun, 04 Oct 2026 21:44:48 GMT` |

`max-age=0, must-revalidate` is the tightest instruction HTTP permits while staying cacheable at all: per
RFC 9111 §4.2.1 `max-age` of `0` means `freshness_lifetime` is zero, so a conforming cache **must
validate on every use**, and §4 forbids reusing a stored response that is not fresh, not allowed-stale
and not validated. There is nothing stronger to send. The generated route carries no validators *at all*,
so a revalidating cache has nothing to compare and must re-download the body.

The two static files also share an **identical `etag` and identical `content-length: 447624`** — they are
the same bytes, which independently confirms ticket 01's finding that `opengraph-image.png` is a dead
duplicate of `twitter-image.png`.

### Lever 2 — the image URL. Already automatic, and undocumented. **M**

Measured, and the most useful thing in this file: **Next.js already appends a content hash as a query
parameter to metadata image URLs.**

```
twitter:image  https://www.rnui.dev/twitter-image.png?twitter-image.fb73fb83.png
og:image       https://www.rnui.dev/opengraph-image.png?opengraph-image.fb73fb83.png
og:image       https://www.rnui.dev/opengraph-image?a54b8d10928c19e1
```

So the `?v=2` trick X's engineer recommends is **already in place, keyed on content identity rather than a
manual counter** — edit the file, the hash changes, the URL changes, the cache key changes. Note this is
**measured, not documented**: the [Next.js `opengraph-image` reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
only ever writes `<generated>` in its `<head>` examples and never mentions the parameter.

That the standards permit this is not folklore. RFC 9111 §4:

> a cache MUST NOT reuse a stored response unless: **the presented target URI (Section 7.1 of [HTTP]) and
> that of the stored response match**, and …

Different target URI ⇒ different entry ⇒ guaranteed miss. Note the flip side: **a URL that never changes
is a URL that can never be re-fetched**, which is why the hash is load-bearing rather than cosmetic.

### Lever 3 — `twitter:image` vs `og:image`. Two independent caches. **M**

Measured: `www.rnui.dev` emits **three separate `og:image` tags** plus one `twitter:image`, the latter
pointing at a different file. Two distinct URLs are two distinct cache keys under RFC 9111 §4, so these
are cached **independently**, expire **independently**, and can disagree indefinitely. This is the
mechanism behind ticket 01's finding that sharing a `/recording/<id>` link to X shows the old photo. It
also means a card is only as good as its *less* lucky slot, and fixing `og:image` while leaving
`twitter:image` on a stale file fixes nothing on X.

### Lever 4 — `robots.txt`. No lever. **M**

`www.rnui.dev/robots.txt` is fully permissive (`User-agent: *` / `Allow: /`). Nothing is blocked, and
there is nothing to gain: Slack documents that it ignores `robots.txt` anyway.

---

## A finding that hands a decision to ticket 07

Next.js's own documentation contradicts the map's mechanism default. From the
[`opengraph-image` reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image):

> By default, generated images are **statically optimized** (generated at build time and cached) unless
> they use Request-time APIs or uncached data.

> `opengraph-image.js` and `twitter-image.js` are special Route Handlers that are **cached by default**
> unless it uses a Request-time API or dynamic config option.

**"Cards render live at request time" is not the framework default — it is an opt-out that must be taken
deliberately** (a Request-time API, or a dynamic route-segment config). The deployed card already behaves
this way (no validators, `max-age=0`), so the current file takes the opt-out; a card added for
`/products?contributor=…` would have to as well, or it would be baked at build and the count would be
frozen — which would silently undo the decision the map made.

A second constraint from the same page, for whoever implements the Contributor card: the generated-image
function's `params` prop carries **dynamic route params only** — the docs' own table gives
`app/shop/opengraph-image.js` at `/shop` a `params` of `undefined`. It does **not** receive
`searchParams`. The map's central bet is unaffected, because `generateMetadata` *does* receive
`searchParams` and can point `openGraph.images` at a card URL that carries the contributor — but a
Contributor identity cannot reach a card through an `opengraph-image.tsx` `params` prop.

---

## The debuggers — one driven, two still open

**X has been driven and is closed.** In the maintainer's authenticated session the Card Validator proved
unusable for this purpose: it renders no card and reports no age. Details in the X section above. **Do not
spend another session on it.**

| Tool | Access | Reveals cache age? | Forces a re-fetch? |
|---|---|---|---|
| **X Card Validator** | X account required; **driven 2026-10-05** | **No** — measured, four INFO lines | **No** — it does not render a card at all |
| **LinkedIn Post Inspector** | login required (LinkedIn's own help links route through `/checkpoint/lg/login`) | **Yes** — "when we last updated our data on it" | Yes, for *future* posts. **No** for existing ones |
| **Slack** | no debugger; paste a URL in a channel | No, but the 30 min TTL is documented so timing is inferable | implicitly, after 30 min |

Two measurements a human can still make, and what each would settle:

1. **LinkedIn Post Inspector on a deployed URL** — read the reported "last updated" age, then re-scrape.
   This is the **last remaining platform TTL anyone can still measure**, and it takes about a minute.
2. **Slack, no tool needed** — paste the same URL into a channel twice, 40 minutes apart, and see whether
   the unfurl changes. This also tests whether **Slack decodes an AVIF Poster**, which is ticket 14's
   question, not this ticket's.

A third, only if the maintainer wants it: compose the same URL in **Tweet Composer** twice, weeks apart.
That is the sole remaining route to an X observation, it writes to their account, and a single fresh
preview would show the live card and say nothing about the cached one — so the useful version costs days.

---

## What remains unmeasured

- **Every actual TTL.** Slack's 30 minutes is the only figure a platform published. X's ~7 days and 24
  hours are 2016-vintage; LinkedIn's and Apple's do not exist. **No platform here publishes a TTL you can
  rely on for a Content-Security-Policy-grade guarantee.** X's own validator cannot help — measured, it
  reports four INFO lines and no cache data, and no longer renders a card at all.
- **Whether the 7-day X re-crawl is still true in 2026.** Unanswerable from public sources, and now also
  unanswerable from X's tooling, because the validator that used to be cited as covering it no longer
  renders a card or reports an age. The only remaining route is composing the same URL in Tweet Composer
  twice, weeks apart — the maintainer's call, and days of waiting.
- **LinkedIn's true cache lifetime.** Post Inspector *reports the age*, so this is measurable in one
  minute by a human with a login; it is the cheapest remaining unknown on the board, and it is now the
  **only** platform where a measurement is still possible at all.
- **Apple's caching layer.** Whether the cache is Apple's or the sender's device is folklore here.
- **Slack's `Slack-ImgProxy` and AVIF.** Slack fetches the image to validate it; whether it can decode an
  AVIF Poster is untested and feeds ticket 14.
- **Whether the content-hash parameter is stable across deploys.** It is present and content-derived in
  this measurement; whether a rebuild that does not change the file preserves the hash is not established.
- **Whether any platform renders an AVIF Poster.** Nobody has tested X, Slack's proxy or Messages. Also
  ticket 14's.

---

## Sources

**Primary — platform documentation**
- Slack robots, unfurl cache and user-agents: https://api.slack.com/robots
- Slack classic unfurling (OpenGraph + X Card metadata): https://docs.slack.dev/messaging/unfurling-links-in-messages
- LinkedIn, Post Inspector refresh: https://www.linkedin.com/help/linkedin/answer/a6233775
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Apple TN3156, rich previews for Messages: https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages
- X cards docs, **removed** (307 → https://docs.x.com/), confirmed via https://docs.x.com/llms.txt

**Primary — first-party engineering statements**
- X employee on cache re-crawl, no purge API, and junk parameters: https://devcommunity.x.com/t/how-to-clear-twitter-card-cache-with-api/62974
- X on card caching and cache-busting parameters: https://devcommunity.x.com/t/twitter-summary-cards-are-they-cached/18345

**Primary — standards and framework**
- RFC 9111 HTTP Caching §4, §4.2.1, §4.2.2: https://www.rfc-editor.org/rfc/rfc9111.html
- Next.js `opengraph-image` / `twitter-image`: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
- Next.js `generateMetadata`: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

**Measured against production, 2026-10-05** — `https://www.rnui.dev/` and its three image URLs, requested
as `Twitterbot/1.0`; `https://www.rnui.dev/robots.txt`; `https://cards-dev.twitter.com/validator`
redirect target.

**Measured in the maintainer's authenticated X session, 2026-10-05** — `cards-dev.twitter.com/validator`
against `https://www.rnui.dev/` and `https://www.rnui.dev/?v=2`, via browser automation on the logged-in
profile; validator Log read in full, preview pane confirmed by screenshot.

**Secondary, cited only to be labelled as folklore** — "LinkedIn caches 7 days" (Quora, fidforward,
prelinq, salesrobot); "X caches ~7 days" (opentweet.io, missinglinkz.io); "Apple caches on-device"
(opengraphplus.com). None of these is load-bearing above.