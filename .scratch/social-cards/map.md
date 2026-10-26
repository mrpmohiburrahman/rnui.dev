# Social Cards

Wayfinder map. Charted 2026-10-05.

## Destination

**A spec and chosen prototypes for every Open Graph card rnui.dev serves** — the default card, the
Contributor card, the Recording card and the Category card — rendered in the current Design's tokens
and type, plus the generation mechanism decided well enough to implement.

When this map is done: the maintainer has picked one design per card from real renders, every card
says a thing worth knowing, and a reader of this map could build all four without asking a question.
This map **plans**; it does not ship. The implementation is a separate effort.

## Notes

- **Domain is `CONTEXT.md`.** A **Recording**, its **Demo** and **Poster**, the person who made it a
  **Contributor**, a facet list either a **Category** or a **Contributor** is. Never "video", "clip",
  "thumbnail", "entry", "author" (ADR-0008).
- **Read `app/globals.css:203-268` before designing anything.** The card's palette and type are
  decided already: `--canvas #0A0B0D` / `#F4F4F1`, `--panel`, `--acc #6FE3CC` / `#0E7062`, `--t1/t2/t3`,
  Space Grotesk + JetBrains Mono, the seven `fontSize` steps, four `borderRadius` steps. A card that
  invents a colour or a type step is not this Design.
- **Two webfonts, and `next/font` cannot feed a card.** `app/layout.tsx:40-52` loads Space Grotesk and
  JetBrains Mono through `next/font/google`, which emits `@font-face` and CSS variables that
  `ImageResponse` never reads — font files have to be passed as bytes. Both are **variable** fonts
  (Grotesk wght 300–700, JetBrains Mono wght 100–800), so whether Satori uses the axes or needs pinned
  static instances is ticket 02's first question and bounds every card with more than one weight.
  **Answered: it hard-throws on variable fonts, so six pinned static TTFs — 490 KB. The "one file per
  family" convenience below was true of the web and false of the card.** Ticket 02.
- **Do not assume a CSS device is unavailable because it is missing from a remembered list.**
  `linear-gradient` **does** render in Satori — the current card's gradient is not silently flat. The
  Design's depth comes from `box-shadow` (`--e0`/`--e1`/`--e2`/`--media-glow`, `app/globals.css:246-268`),
  and whether *those* survive is open. Ticket 02 produces the verdict list; design inside it.
  **Answered, and the third clause was the wrong way round: `box-shadow` survives too, negative blur
  term and all, so the substitutes this note anticipated are unnecessary.** Ticket 02. The device that
  is actually missing is **AVIF**, which is every Poster in the catalogue — see Decisions so far.
- **`twitter:image` and `og:image` are different slots.** A design that fills only `og:image` leaves X on
  whatever `twitter-image.png` says. **Measured, and worse than a slot difference: they are two
  independent caches.** Production emits three `og:image` tags and one `twitter:image` pointing at a
  different file, and RFC 9111 §4 makes a different target URI a different cache entry — two URLs, two
  expiry clocks, free to disagree indefinitely. **A card is only as good as its worse slot**, so a design
  that is to be shown on X must be produced for *both* slots or `twitter:image` must be pointed at the
  same URL. **Ticket 03.**
- **No card needs a manual cache-buster.** Next already appends a content hash to metadata image URLs
  (`twitter-image.png?twitter-image.fb73fb83.png`), so editing a card changes its URL and RFC 9111 §4
  guarantees a fresh cache entry. **Do not add `?v=2`.** Corollary: a URL that never changes can never be
  re-fetched, which is why the hash is load-bearing rather than cosmetic. Measured, and *not* documented
  by Next — its reference only writes `<generated>`. **Ticket 03.**
- **Skills every session: `/grilling` and `/domain-modeling`.** `/prototype` for any card design, and
  `/research` for the questions in the open tickets. **`/research` subagent dispatch is broken in this
  environment** — the `general` agent fails with `Model not found:
  opencode/deepseek-v4-flash-free` and the task tool takes no model parameter to repoint it. Both
  research tickets so far were resolved inline instead, which worked. Do not burn a cycle on it.
- **X cannot be used to measure a card's cache.** Its Card Validator was driven in the maintainer's own
  authenticated session on 2026-10-05: it **no longer renders a card** (the preview pane holds only
  "Card preview has moved to Tweet Composer") and its whole output is four INFO lines with **no cache
  age and no timestamp**. It also flags nothing about the three competing `og:image` tags, so its silence
  is not a clean bill of health. Ticket 03.
- **`.scratch/studio-dark/spec.md` checkpoint 4 is un-cleared** and stops an agent restyling anything
  `ui-ux-overhaul` shipped. A card is new surface rather than restyled surface, but read the
  checkpoint before assuming that.
- **Seeded by six answers on 2026-10-05**, which are recorded below rather than left in a transcript.

## Decisions so far

- **[Which file actually serves the root card](issues/01-which-file-serves-the-root-card.md)** — three
  files claim the slot and **all three emit**. `app/opengraph-image.tsx` is the *first* `og:image` (the
  slate gradient, what most scrapers see); `app/opengraph-image.png` (a Jan 2025 photo of a phone in a
  purple room) is second and therefore dead; `app/twitter-image.png` is a separate slot X reads in
  preference — so **sharing a `/recording/<id>` link to X today shows that photo, not the demo.**
  `generateMetadata` does receive `searchParams` (so the map's central bet holds) and metadata merges
  **shallowly**, confirming the note at `app/contributors/page.tsx:32-43`. `/products` is not
  prerendered and serves the root card, filter or no filter.

- **This map produces prototypes and a spec, not the shipped change.** The ask was designs to choose
  between; the mechanism is downstream of that choice and is a build, not a decision.
- **A Contributor card hangs off `/products?contributor=<exact name>`, not off a `/contributors/[slug]`
  page** — because no such page exists and `app/contributors/page.tsx:8-16` plus ADR-0009 both refuse
  to mint one. `generateMetadata` receives `searchParams`, so one route can vary its card by filter.
  **The image key is not a Contributor slug:** keying the *filename* on a hash of the folded name
  breaks no ADR, because the *address* stays `/products?contributor=…`.
- **Cards render live at request time.** The count is the whole point of the Contributor card, and a
  number stale by a day is worse than no number. A CDN cache header buys most of the saving.
- **The Contributor card keeps its count.** Given that a scraper caches the bytes at share time and never
  re-checks, staleness is bounded to "a share from last month" — tolerable for a catalogue growing by a
  handful of Recordings a month. **Ticket 03 then tested this and the bound is optimistic, not
  established:** Slack really is 30 minutes, but LinkedIn, Apple and X publish **no** TTL at all and
  X's documentation is deleted, so "a share from last month" is the hopeful reading. The decision stands —
  and is now *better* argued, because LinkedIn documents that **an existing share is permanent**, which is
  the one fact that makes render-live worth its cost.
- **Variants are picked from a live preview route**, not from files on disk: comparison is the entire
  task, and PNGs on disk are the wrong shape for comparing. Rendered PNGs are produced only for the
  winners.
- **Four card families: default, Contributor, Recording, Category.** A Category card is the Contributor
  card with one string swapped, so it costs one ticket rather than a mechanism of its own.

- **[Can ImageResponse render this Design](issues/02-can-imageresponse-render-this-design.md)** — the
  Design survives almost intact, with one exception that decides the mechanism. Satori is **0.15.2
  compiled into Next** (`@vercel/og` 0.7.2) and cannot be pinned separately. Renders: gradients,
  **`box-shadow` including `--e0`/`--e1`/`--media-glow` with their negative blur term**,
  `border-radius`, `background-image: url()`, `filter`, absolute positioning, `gap`, `object-fit`.
  Unavailable: `mix-blend-mode`, `::before`/`::after`, `-webkit-line-clamp`, **CSS custom properties**
  (tokens must be inline literals), and — the one that matters — **every Poster, because they are all
  AVIF and AVIF is refused**. Two beliefs in the Notes above are now settled and one is **wrong**:
  `linear-gradient` **does** render (the map's flatness suspicion is unfounded), the Design's depth
  survives so the shadow substitutes are unnecessary, and **variable fonts hard-throw** so the
  "one file per family" convenience is true of the web and false of the card — six pinned static TTFs,
  490 KB. **`next/font/google` cannot feed a card**; it returns no bytes. And a rejected image
  **renders a blank card rather than throwing**, which is invisible in production.
  Verdicts were measured by RGBA-diffing two cards, not read off a list.

- **[How long a scraper holds a card](issues/03-how-long-a-scraper-holds-a-card.md)** — **one platform
  publishes a TTL and it is 30 minutes**; the other three publish none, and X's card documentation has been
  **deleted**, so the "~7 days" the map's assumption rested on survives only as a 2016 forum post citing
  the missing page. The map's "a share from last month is tolerable" is the hopeful reading, not the
  measured one. Every lever is already pulled and measured against production: images serve
  `max-age=0, must-revalidate`, and **Next already appends a content hash to the image URL**, so
  `?v=2` is unnecessary — RFC 9111 §4 makes a changed URI a fresh cache entry. **LinkedIn's hard fact is
  worse than a TTL: an existing share is permanent**, which is the whole argument for render-live. Two
  constraints handed to ticket 07: **render-live is an opt-out from Next's build-time default**, and a
  Contributor identity cannot reach a card through an `opengraph-image.tsx` `params` prop. **X's Card
  Validator was then driven with a real session: it no longer renders a card and reports only four INFO
  lines — no cache age, no timestamp — so X is closed as a measurement, not merely blocked by a login.**
  It did confirm from X's own crawler that `twitter:card = summary_large_image` reaches the parser, and
  flagged nothing about the three competing `og:image` tags. **LinkedIn's Post Inspector is now the only
  platform left where a TTL can still be measured.**

- **[Can a card show a Poster at all](issues/14-can-a-card-show-a-poster-at-all.md)** — **yes, on the
  Recording card only, and it arrives as a JPEG *Rendition* published beside the Poster rather than as
  the Poster itself.** Contributor and Category cards stay text-only, so "which of a Contributor's 1–138
  Recordings represents them" never has to be answered. Satori's allowlist is
  `[png, apng, jpeg, gif, svg+xml]` and every Poster is AVIF, so a card that composites a Poster renders
  **blank** — one colour, no 500, the rejection swallowed — which is why this could not be deferred to
  implementation. **Measured, and three of the ticket's own beliefs were wrong:** per-request `sharp`
  costs 17.9 ms *and* forces `runtime = "nodejs"` (`sharp` is a native addon, the Edge Runtime forbids
  native Node APIs, and `app/opengraph-image.tsx:3` is `edge`); `/cdn-cgi/image` on `cdn.rnui.dev` is
  **off**, answering `403 ERROR 9401` on every variant, so it is a zone setting rather than a service to
  evaluate; and **no Poster is blank** — across all 303 the flattest has 57 distinct colours, median
  1041, which retires the map's "the frame two seconds in may be a blank sheet". Chosen because the
  one-off is **4.1 s** and the recurring cost is **zero**: renditions at the only size a card uses are
  **7.3 MB total, 25 KB average**. A missing image is a **designed state**, not a hole — the grid's own
  hue-tinted fallback, which 215 of 297 Recordings already have a measured `hue` for. **No platform's
  AVIF support was measured, deliberately:** a card's `contentType` is PNG, so nobody ever sees the AVIF.
  Hands ticket 06 six constraints. **ADR-0012**, and a new term in `CONTEXT.md`.

- **[The Recording card, several ways](issues/06-the-recording-card-several-ways.md)** — five designs
  at 1200×630, rendered as real `ImageResponse` output and compared behind a preview route, across six
  real Recordings each. **Compositing the Poster is right, but it must never be cropped:**
  `object-fit: cover` keeps **25%** of a portrait Poster and cuts away the status bar, the home indicator
  and the device's corners, so it does not read as a phone — which retires the two overlay designs as
  *primary* answers. **Captions wrap into a fixed three-line box and are never truncated**, and the type
  scale is **K = 2.8**, bounded above by the catalogue's longest caption (36 chars needs 5 lines at the
  geometrically "correct" 3.16, and Satori has no line-clamp and no sibling-overlap protection).
  **The ticket's premise that every Poster is vertical is wrong** — 195 of 297 are phone-shaped and 77
  are wider than 0.8, up to **1.7778** — so the device frame is sized from `Recording.aspect` rather
  than hard-coded to a phone. Contrast was **measured, not eyeballed**, and failed twice first: an
  overlay's scrim must be sized *from the text block* (a 200px scrim under a 280px caption measured
  **1.01:1** against a white Poster), and an overlay cannot keep an 80px safe area. Worst across all 30
  renders is **8.33:1**. Also settled: Hangul and Latin-ext both render in the pinned TTFs; the widest
  name needs **543px** — wider than the longest caption's constraint, so a layout must either reserve
  it or drop the initials block — and a missing Poster is ticket 14's hue-tinted panel, occupying the
  image's own slot. Settles two fog items the map had been carrying: **whether a card ever shows a
  Poster** (yes, and never cropped) and **what it does with a non-portrait one** (the frame follows
`Recording.aspect`). **The maintainer then chose: **M2**, the no-Category card** — see the note
   below, which records four further rounds of prototypes that this answer did not anticipate.

- **The chosen Recording card is **M2** — `rnui.dev`, then the caption, then the Contributor's
  name, then the Poster on its rail. **No Category.**** Four further rounds of prototypes followed
  [the Recording card, several ways](issues/06-the-recording-card-several-ways.md)
  (`preview/variants-n.tsx`, `preview/out-n/`): the initials disc was dropped from every variant;
  the **wordmark became the headline at 48px**, having been 22px behind a 44px Category; the wordmark
  is set byte-for-byte as `components/site-header.tsx:98-102` sets it (`rnui` in `--t1`, `.dev` in
  `--acc`, **weight 700**, `-0.02em`, **zero gap** between the runs); the Category was demoted to
  30px in one variant and dropped in another; and the small steps were promoted until **no type falls
  below 11px at any platform width** (14 step/platform pairs did). Two bounds came out of it, and
  both are measurements rather than taste: **the wordmark is capped at 48px** — a 92px attempt
  sheared the caption's third line mid-glyph, because it shares a column with a 3-line caption and a
  2-line byline, which is the same constraint that caps K — and **the Category and the Contributor's
  name cannot share a row** (44px tracked mono + the 543px name is over 700px of type in a 600px
  box, so every variant stacks). Contrast is unchanged at **17.58:1**, because the type sits on
  canvas rather than on the Poster, so promoting it cost nothing. **This overrides the ticket's
  "handed to ticket 10" line: the Recording card carries the caption and the Contributor's name,
  *not* the Category.** The cost is named rather than pretended away — the card no longer says which
  of 18 Categories it is.

- **The default card is not changing — the maintainer's decision, 2026-10-05.**
  `app/opengraph-image.tsx` stays as it is: the slate gradient, `system-ui`, and the claim
  **"343+ animations"** against a catalogue of **298 Recordings**. None of the twenty-three
  designs [the default card, several ways](issues/04-the-default-card-several-ways.md)
  produced will be built. Stated rather than buried: the number is 45 high and the noun is
  wrong twice — the domain is **Recording**, and 6 of the 298 are Full Apps — so this is a
  **standing decision, not an oversight**. It was raised twice and answered. The blast radius
  is also wider than `/`: ticket 01 established `/products` is not prerendered and serves
  the root card, filter or no filter. **It does not touch the other three families** —
  Contributor, Recording and Category are separate routes. And it settles the map's open
  question about the fate of `app/opengraph-image.png` and `app/twitter-image.png`: **they
  stay too.** What survives from the ticket is the *measurements*, which were made about
  the catalogue rather than about any layout: dark-not-light, the 37px floor, the
  permanence of a count, 18 Categories not fitting, Satori's real limits, and the skeleton
  test.

- **[The default card, several ways](issues/04-the-default-card-several-ways.md)** — six designs,
  each rendered in **both** modes, thirteen renders including the incumbent for comparison
  (`preview/gallery-default.html`). The site's own hero turned out to be the strongest raw material:
  the claim is `components/hero.tsx:23`'s h1 verbatim and the counts are that hero's own stat row, so
  **Hero needs no new copy at all**. **Wall** (eight real Posters, cropped to tiles, wordmark on a
  chip) is the better card and the only one that shows the catalogue. **Facets is dead on arithmetic,
  not taste: 18 Categories do not fit a 1200×630 card at a readable size** — four columns leave 116px
  of name budget and 6 of 18 names truncate; at the floor, height binds and one column holds 11.
  Four findings that carry past this ticket:

  1. **The shipped count is wrong — "343+ animations" against 298 Recordings** (and the noun is wrong
     twice: the domain is Recording, and 6 of the 298 are Full Apps). But the deeper cost is that
     **ticket 03 measured LinkedIn shares as permanent**, so a count on a card is a claim a cache
     cannot revisit: a card carrying 298 is wrong in every share made after the 299th Recording.
     **Whether any card carries a count is a live decision for ticket 10, not a settled one.**
  2. **Dark versus light, answered by measurement rather than by asking.** The site cannot answer it
     — `app/layout.tsx:92-93` sets `defaultTheme="system"`, so the site is *two* appearances and a
     server-rendered card has nothing to match. Both modes clear AA on every token pair (`t3` is the
     tightest at 4.86:1 in light). **The catalogue's own imagery decides it: the same eight tiles
     measure worst 2.27:1 on the dark canvas and 1.06:1 on the light one** — 1.06 is invisible, and
     ticket 14 already found 64 of 297 Posters are >90% near-white. **Light can render text about the
     catalogue; only dark can render the catalogue.**
  3. **The platform floor is arithmetic: >= 37 card px.** A card is 1200px wide and Slack shows it at
     360, so anything below 37px lands under 11px on the reader's screen. This is the same constraint
     ticket 06 found from the other end — there it bounded the caption's scale from *above*, here it
     bounds the small steps from *below*, and **the two pull in opposite directions in the same
     column.** It caught a real defect: the stat labels were at 16px, i.e. 4.8px at Slack.
  4. **`flexWrap` does not grid in Satori** — a limitation ticket 02 did not list and the cause of
     this ticket's worst defect. `marginLeft: auto` pushed each count into the *next* cell
     ("161BUTTONS") and the third column ran off the card. **A multi-column list must be nested
     `flexDirection: column` boxes, with widths derived from the space left over.**

  Also settled: **the incumbent's composition was never the problem** — Hero is the same layout in the
  Design's tokens with the right number, so "I don't like it at all" indicts the palette, the type and
  the count rather than the arrangement. A **cropped Poster grid is viable and its bound is 57–76% of
  each Poster's height** — far better than a single Poster's 25%, and defensible only because no tile
  is read as a device.

- **Round 2 of [the default card, several ways](issues/04-the-default-card-several-ways.md): the
  wordmark stays the hero, and six devices make it not plain.** The maintainer's verdict on round 1 was
  that every design was "only text" and that the wordmark-only card — though liked — was "really
  plain… no fun", so all six keep `rnui.dev` as the hero and differ in the **device**: a ring of 21
  real Posters each lit by its own hue (**Halo**), five Posters uncropped in device frames on a shelf
  (**Deck**), eleven real captions as a credit roll (**Marquee**), a diagonal cascade (**Ramp**), a
  hairline ellipse (**Orbit**), and a four-hue radial bloom (**Bloom** — recommended). Twelve renders,
  both modes, `preview/gallery-mark.html`. **Everything on them is real**: Posters from
  `data/catalogue.ts` picked by greedy farthest-point on the hue circle, captions from the catalogue,
  counts from `allRecordings`.
  - **Three devices Satori had never been asked for all work, and one throws:**
    `radial-gradient` (218k px), `transform: rotate` (181k px) and `border-radius: 50%` (213k px) all
    render, measured by RGBA-diffing against the element-free render; **`conic-gradient` throws**.
  - **A wash changes a type's contrast, so type over a wash must be measured against the wash.**
    `--t3` is 6.46:1 on the flat dark canvas and a comfortable 4.86:1 on the flat light one — but
    **4.80:1 dark and 4.44:1 light on a radial wash**, i.e. **under AA in light mode**. Type over a
    wash now takes `--t2` and measures 7.34:1 / 6.31:1.
  - **Small tiles are what make a composed card affordable:** 22 tiles at 92×116 are **39 KB total,
    2.7 KB the largest**, which is less than the Wall's eight big tiles cost together.
  - **Round 1's light-mode failure is now visible rather than measured:** in Halo-light, Orbit-light
    and Deck-light the near-white Posters disappear into the `#F4F4F1` canvas.
  - **`public/logo.png` is not used anywhere.** It is a red-and-white paintbrush and the Design's
    accent is green; using it would break the palette the map is bound to.
  - **A rule for ticket 10, earned three times over:** *a check that must guess where the thing it
    measures is will keep guessing wrong.* Two audits on this ticket inferred geometry they did not
    know and blamed the card — the Wall chip's box, and a "plate opacity" check that reported 16 then
    68 false leaks — after round 1's "AA ok" that had measured zero pixels. **Derive the geometry from
    the constants the card lays out with, or do not run the check.**

- **Round 3 of [the default card, several ways](issues/04-the-default-card-several-ways.md):
  ramp-dark chosen, and impeccable.style's 61-rule catalogue applied by hand — which is severe about
  round 2.** The detector's CLI cannot read a Satori card (it parses `className` and CSS;
  `ImageResponse` uses `createElement` with inline styles), though it did flag **`overused-font` on
  `app/globals.css` — Space Grotesk, the site's actual typeface.** Applied by hand it produced real
  hits: `radial-gradient-background-halo` (*"a familiar AI background effect… remove the glow when it
  has no role"*), `dark-mode-with-glowing-accents` (*"a wall of neon"*),
  `hairline-border-with-wide-shadow` (round 2's `glow()` was the rule's own example),
  `hero-metric-layout`, `extreme-border-radius-on-cards`, `monotonous-spacing`. **So the washes came
  out and the hero-metric stat triple went with them** — six new ramps (`Ramp` cleaned, `Ribbon`,
  `Aperture`, `Echo`, `Stack`, `Ladder`), `preview/gallery-ramp.html`.
  - **The resolution to a real tension, and it is the most transferable thing here:**
    `ai-color-palette` and `cream-beige-palette` indict **this Design's own tokens** (`--acc #6FE3CC`,
    `--canvas #F4F4F1`), and the map binds every card to `app/globals.css`. The rule asks for
    restraint — *"reduce the glow so useful information stands out"* — and **that is available
    without touching a token: `--media-glow` is the tile's own treatment, so a card may use it three
    times instead of twenty-two.** The glow became an accent rather than a texture, and that one
    change is what these look better than round 2.
  - **`overflow: hidden` clips a container's positioned children but NOT their `box-shadow`** —
    measured: 0px for a child's background, **0px for a flat hairline shadow, 20px for a blurred
    glow, and 43px for a blurred glow on a *rotated* child** (a shadow follows the rotated bounding
    box). **So "the tile field is clipped" is not by itself a safety argument**, and the clearance a
    card needs is 43px. Also found by the probe failing: **Satori requires an explicit
    `display: flex` on any div with more than one child** — a hard error, not a default.
  - **Checking a card for text overflow means testing contrast against that card's own canvas**
    (threshold 90), not absolute luminance and not "any non-background pixel". The simpler tests were
    each wrong on half the set: one counted a clip's antialiased edge as text, the next counted a
    tile's halo as text on Ramp, and a third reported **all six light variants** as overflowing
    because on `#F4F4F1` the *background* is the bright thing.
  - **Echo costs one image instead of twenty-eight** and says "animation" through repetition, which
    is the only device in the set that does — round 2's diagonal implied motion with a graphic
    gesture that says nothing about time.

- **Round 4: the first default-card round with a point of view, and it exists because rounds 1–3 were
  subtraction.** The maintainer caught it — *"did you used https://impeccable.style/ … the open graph
  image that you generated is not good at all."* **Partly, and not the part that mattered:** the npm
  package ships only the **detector** CLI (which found `overused-font` in `app/globals.css` and nothing
  on a card, since it parses `className` and `ImageResponse` uses inline styles), and the **skill** —
  *"the missing design vocabulary for agents"* — lives in the repo and had not been read. It says the
  opposite of what rounds 1–3 did:
  - **`bolder.md`: *"The reflex answer, reaching for more effects, is the opposite of bold; reject it
    first."* Round 3 removed the glow and the washes and got **quieter** — the same failure from the
    other side: nothing louder to commit to.
  - **The skeleton test** (*"strip the copy out … does the skeleton still say what this section is?"*)
    **failed on all of rounds 1–3.** They were one skeleton six times: wordmark, claim, counts, Posters
    on the right. Strip the words and they are indistinguishable — which is why "make it less plain"
    kept producing plainer cards.
  - **The tiles were decoration.** `bolder.md` requires an image to carry *a job, an anchor and a piece
    of evidence*; the job here is *"real, running, community-made interfaces you can see working"*, and
    at 92px a Poster is a postage stamp that proves nothing. **The system already owned the decisive
    move and I had been spending it on thumbnails — the site shows Demos full-bleed.**
  - Six variants with **six different skeletons and one decisive move each**: `Vitrine` (scale — one
    Poster at 700px where the UI is readable), `Contact` (subordination — `rnui.dev` typeset *inside* a
    20-frame contact sheet as one cell), `Specimen` (**the crop, on purpose** — 3.23:1, which qualifies
    ticket 06's "never cropped" rule), `Foreshorten` (depth), `Set` (type as image), `Field`
    (completeness — the chosen ramp committed at 180px, edge to edge, no gaps).
  - **Two Satori layout rules, both learned the hard way:** a child wraps at its **parent's** width,
    not the width it was handed (a 500px column with a 520px claim stranded *"of"* alone on a line), and
    **`flexGrow` hands out *remaining* space, so a fixed-width sibling silently starves whatever
    follows it** (a 255px credit line received ~150px and clipped to the letter D).
  - **Space Grotesk measures 0.515em per glyph at weight 300**, rendered and ink-counted — and lines
    differ by 12%, so **type must be measured per line, never averaged over the claim.**


- **[The Contributor card, several ways](issues/05-the-contributor-card-several-ways.md)** — five
  designs, **fifty renders** (5 × 5 real Contributors × both modes), `preview/gallery-contrib.html`.
  The cast spans every axis: 138 Recordings / 11 Categories / the widest name · 31 / 12 Categories /
  the broadest spread · `Daehyeon Mun (문대현)` · `Aswin C`, the shortest name · `Hubert Ryan`, the
  one-Recording minimum. **Initials is what I would build** — it reuses `lib/contributor-initials.ts`
  unchanged and its skeleton says what the card is before a word is read. Four questions settled:

  1. **The name never truncates, and the bound is arithmetic.** All 24 real names ink-counted at
     five sizes: the spread is **4.4×** (`Aswin C` 211px vs `Enzo Manuel Mangano (Reactiive)` 930px at
     60px), so no single size suits every name — but Slack crops 66px off each side, leaving
     **1068px of safe width**, which the widest name clears up to **68px**. This is the opposite of
     ticket 06, where the name shared an 860px column with a caption and 543px forced a decision.
     **The ceiling is a function of the column:** 68px name-only, 55px beside a 176px Poster, 29px
     beside a 460px grid. **Every card must now size a name with `fitName(columnWidth)`** rather than
     choosing a size — which is the only reason it stopped being a recurring bug.
  2. **The count says "N Recordings", singular for one.** Hubert Ryan has exactly one Recording and
     that is a real render, not a nicety — "1 Recordings" would be visibly machine-made on a share.
  3. **Which Poster: their most recent**, because `data/recording.ts:122` already sorts `created_at`
     descending — so it needed no invention. Most-viewed needs live Firestore at request time.
  4. **The initials block is reused unchanged.** A pure function with no catalogue import, so a card
     route can call it.

  - **The finding that outranks the design: a newest-first Poster makes the card's bytes mutable,
    and the image key cannot be the Contributor's name alone.** Ticket 03 measured LinkedIn shares as
    **permanent**; RFC 9111 §4 makes a *changed URI* a fresh cache entry and an unchanged one a cache
    hit. The map keys the image on a hash of the folded name (no slug — ADR-0009), so when that
    Contributor's next Recording lands **the render changes and the URL does not**, and every share
    made before it keeps the old Poster forever. **The chosen Recording's id must go in the key.
    Ticket 07 did not know it needed to.**
  - **Chosen: Initials, minus the disc** — the maintainer took the Initials skeleton and removed the
    190px circle, so three replacements were built (`Plain` 36px name, `PlainGrid` 27px, **`PlainShelf`
    68px**). Removing the disc is a **trade, not a subtraction**: the disc anchored the left column, so
    the name becomes that anchor and costs size. **PlainShelf recovers nearly all of it** by giving the
    name the full card with the work beneath, landing at the same 68px the disc version fought for.
    The disc was also the site's existing mark for a person — `contributorInitials` is what the
    Recording detail and About page draw — so the chosen card stops looking like those two. Real loss,
    maintainer's call.
  - **The Contributor card must be regenerated when a Recording is added, and three repo facts make the
    obvious implementation wrong.** **Next already hashes the image URL** (measured:
    `/opengraph-image?ad14766c…`, `app/contributors/page.tsx:41`), so changed bytes do **not** imply a
    changed address. **A route declaring its own `openGraph` block loses the inherited image entirely** —
    measured on the same file: `/aboutus` exports no metadata and carries `og:image` plus its four
    attributes; `/contributors` declares `openGraph: { title, description }` and carries **none of the
    five**. And **ADR-0009 forbids minting a slug**, so `/products?contributor=<exact name>` is a stable
    URL forever. **Therefore the chosen Recording ids must be part of the image key** — with a key of the
    folded name alone, a Contributor's next Recording changes the render but not the URL and every
    existing share keeps the old bytes permanently. **Ticket 07 now carries a hard requirement it did not
    have when written: the image key is not the page key.** And `/products` must not declare a partial
    `openGraph` block, or the card this map is designing disappears.
  - **One Contributor is 46% of the catalogue** — 138 of 298, the next has 31, then a tail to 1 — so
    any density that scales with the count is scaling mostly for one person. Bears on whether the card
    is worth building at all, which the count answers better than a design does.
  - **Three Satori defects recorded, all of them costs twice on this map:** `maxWidth` does not stop
    clipping at the **resolved** width (asked 852, got 560, cut a name mid-word);
    **`width: "100%"` inside a `flexGrow: 1` parent resolves against the parent's free width** and
    swallowed a four-tile shelf (ticket 06's second occurrence); and **a bare `\u00b7` renders as the
    literal text** on all fifty renders.

## Not yet specified

- **Whether the cards should be held to `app/globals.css` at all.** Ticket 02 established that CSS
  custom properties do not resolve in `ImageResponse`, so every token a card uses is an inline
  literal and the card's palette can drift from the Design with nothing to catch it. A shared token
  module or a lint rule is the obvious answer but is an implementation decision, and the map's
  Destination is a spec. Revisit when ticket 10 writes down what each card says and notices how many
  literals that is.
- **Per-request transcoding cost and the cold path.** Ticket 14 measured it and then chose not to pay it:
  **17.9 ms** per Poster, cold-start-shaped against a 100-entry URL-keyed LRU, and it would force
  `nodejs`. The cost is zero because renditions are pre-converted, so this is settled rather than open —
  **see the ticket's answer, and ADR-0012**, where it survives as the trigger for revisiting Cloudflare's
  closed edge transform.

- **Per-Category and per-Contributor cards both carry a count and a name; what a card carries when it
  carries neither** — the ~10 routes in `app/` that are neither Recording, Contributor nor Category.
  Probably the default card, but the map has not established what a share of `/aboutus` or
  `/termsofservice` should say. **Ticket 09.**
- **Which name a card carries, and where `twitter:card = summary_large_image` comes from.**
  **Ticket 03 settled this from both ends — it is closed.** Production emits
  `<meta name="twitter:card" content="summary_large_image">`, and X's own crawler, driven through the Card
  Validator in an authenticated session, reports `twitter:card = summary_large_image tag found`. So
  `data/meta-data.ts:32-36`'s `socialMediaTags` reaches X **despite sitting outside Next's `Metadata`
  type** — Next serializes it, and X reads it. Not an inference any more. Still open, and it is a copy
  decision for **ticket 10**: the site has **two spellings of its own name** and the card carries the one
  that is **not** the current title — `og:image:alt` reads
  `"rnui.dev: Curated React Native UI & Animation Catalog"` while title and description say
  `"Awesome React Native UI - A list of community made animations"`. Apple's TN3156 argues against
  branding in `og:title` at all.
- **What "live" costs.** Per-request rendering at Vercel's function limits, and whether the free tier
  absorbs a card render per share. **Sharper since ticket 03:** the cost is not only Vercel's — Next's
  documented default is the *opposite* of this map's decision, since generated images are *"statically
  optimized (generated at build time and cached)"* unless a Request-time API or a dynamic config option
  opts out. Render-live must therefore be **taken deliberately** by every card, or its count silently
  freezes at build. **Ticket 07.**
- **The catalogue at large.** Whether `?category=` cards are worth building given there are 18
  Categories and the traffic distribution is unknown. **Ticket 04 sharpened this from the other
  side:** it proved 18 Category *names* cannot share one card at a readable size, which is an
  argument that a `?category=` card must name exactly one — the opposite of a list, and the reason
  the Category card (ticket 08) is cheap rather than expensive.

### Surfaced by ticket 04, still too coarse to ticket

- **Whether the default card is one card or several.** Ticket 04's own question, and its prototypes
  did **not** answer it: all six designs are a single static card. The question underneath is real —
  the root URL is shared both by people who mean "look at this site" and people who mean "find my
  animation", and a `Referer`-varying card would make the answer depend on a header a scraper may not
  send. It cannot be phrased sharply until someone decides whether the default card may read request
  context at all, which is the same question **ticket 07** answers for every card.
- **Whether the Wall's eight tiles are fixed or chosen per share.** A fixed set is deterministic,
  cacheable and honest about what it shows; a per-share set is a better advert and a worse cache. It
  is also the question that decides whether the Wall is one card or a family, and the "one or
  several" ambiguity above is the same ambiguity. Not sharp enough to ticket until the default card's
  identity is settled.
- **Whether a card carrying a count should render live or be dropped.** Ticket 04 made this concrete
  — a count is a claim a cache cannot revisit, per ticket 03's permanent-share finding — but the
  answer is not a design question. It belongs to whatever decides the mechanism, so it rides with
  **ticket 07** and is written down by **ticket 10**.

## Out of scope

- **Minting `/contributors/[slug]` pages.** Refused by ADR-0009 and by `app/contributors/page.tsx:8-16`.
  A slug cannot carry `Daehyeon Mun (문대현)`; a scheme that handles 22 of 23 names and silently
  merges the 23rd is not a scheme. If per-Contributor URLs are ever wanted, that is a fresh effort.
- **Replacing the Poster pipeline or the Demo/Poster asset model.** A card reads an existing Published
  Poster; it never transcodes one, and ADR-0003 (a path names bytes, never reused) is untouched.
  **Ticket 14 reopened this and moved the boundary:** the AVIF wall left no third option, because Satori
  *detects* AVIF and declines it, so one of *transcode per request*, *pre-convert beside the Poster* or
  *drop the Poster* was forced. Pre-conversion won, and it is now in scope by that resolution rather
  than by this map. What it did **not** touch: the Poster stays AVIF, `.avif` remains the only valid
  Poster extension in `lib/asset-path.ts:34` and `tests/data-integrity.test.ts:23`, and a **Rendition** is
  deliberately *not* in `allAssetPaths` — a tool that walks it should not acquire a second kind of thing.
  A Re-record still yields a new Poster, which yields a new Rendition beside it. **ADR-0012.**
- **Making a cached card live on a platform that already cached it.** Not ours. Bounded and accepted —
  see the second answer under Decisions so far.
- **Building the cards into the site.** This map decides and prototypes. It does not write
  `app/opengraph-image.tsx` or any route. The implementation effort is separate and starts from the
  prototypes chosen here.