# MEMORY

Handoff notes. Written 2026-10-05, updated 2026-10-05 after ticket 03. Read this file first in a new session.

## Where things stand

**One active effort is mid-charting: `.scratch/social-cards/`.** Nothing from it is implemented, nothing
is committed. `git status` on `main` shows `.scratch/social-cards/` and this `MEMORY.md` as untracked,
alongside two pre-existing untracked directories (`.scratch/encode-alternates/`, `.scratch/poster-review/`)
and a modified `.scratch/enzo-demos-progress.md` — **none of those three are mine, do not commit or
revert them.** Never `git add -A` in this repo.

**To continue this work:** `/wayfinder` with the map — `.scratch/social-cards/map.md`. These are
**decision** tickets, not build tickets. **The frontier is ticket 14 and nothing else.**

**One ticket per session.** Ticket 03 is spent, so ticket 14 starts a **fresh session**. `/clear` is the
right boundary here, not continue: the map, `MEMORY.md` and ticket 14's own file carry everything that
matters, and the grilling in 14 is dense enough to deserve a clean window.

**When the map clears it hands off — it does not build.** Merge onto the main flow at **`/to-spec`**,
which collapses the map's linked decisions into a buildable plan, then `/to-tickets`, then `/implement`
per ticket with `/clear` between each. This effort has 11 tickets, so it is **not** one of the small
efforts that may skip straight to `/implement`; looping the map into `/implement` throws the linked
detail away.

## The effort: Social Cards

The ask was three things: replace the Open Graph card everyone dislikes (with several versions to
choose from), auto-generate a card per link, show a Contributor's name and live animation count on
their card, and show a Demo's Poster with text on a pasted demo link.

**Read `.scratch/social-cards/map.md` first.** It holds the destination, six settled answers from the
maintainer, the binding domain constraints, the fog and the out-of-scope list. The map **plans; it does
not build** — implementing it is a separate effort that starts from the prototypes chosen here.

## Six answers the maintainer gave (all settled — do not reopen)

1. This map produces **prototypes and a spec**, not the shipped change.
2. The Contributor card hangs off `/products?contributor=<exact name>`, **not** a minted
   `/contributors/[slug]` page.
3. Cards render **live at request time**. **Ticket 03 sharpened this: this is an opt-out from Next's
   default, not the default.** See "Two constraints handed to ticket 07".
4. The Contributor card **keeps its count**, accepting a bounded staleness window. **Ticket 03 tested
   that window and it is optimistic** — see its findings below. The decision stands and is now better
   argued.
5. Variants are picked from a **live preview route**, not files on disk.
6. **Four card families**: default, Contributor, Recording, Category.

## Ticket 01 — which file serves the root card (resolved — don't redo it)

- **Three files claim the root OG slot and all three emit.**
  `app/opengraph-image.tsx` is the **first** `og:image` (the slate gradient); `app/opengraph-image.png`
  (a Jan 2025 photo of a phone in a purple room) is second and therefore dead; `app/twitter-image.png`
  is a separate slot X reads in preference.
- **Live bug:** `app/recording/[id]/page.tsx:41-50` sets `openGraph.images` but never
  `twitter.images`, so **sharing a demo link to X shows the purple photo, not the demo.**
  *Ticket 03 confirmed this empirically: the two static files serve a byte-identical `etag` and
  `content-length: 447624`.*
- **`generateMetadata` does receive `searchParams`** (Next docs) — the map's central bet holds. Only in
  a `page.js` segment.
- **Metadata merges shallowly**, so a segment declaring any `openGraph` loses the parent's images. The
  note at `app/contributors/page.tsx:32-43` is correct and current.
- **`/products` is not prerendered** and serves the root card, filter or no filter.
- **Correction to the map's own earlier claim:** `linear-gradient` **does** render in Satori. Ticket 02
  must not assume any device is unavailable because it is missing from a remembered list.

## Ticket 02 — can ImageResponse render this Design (resolved — don't redo it)

Findings file: `.scratch/social-cards/research/can-imageresponse-render-this-design.md`. Verdicts were
measured by RGBA-diffing two cards, **not** read off a list. The probe is `.scratch/social-cards/probe/`.

- Renders: `linear-gradient`, **`box-shadow` including `--e0`/`--e1`/`--media-glow` and their negative
  blur term**, `border-radius`, `background-image: url()`, `filter`, absolute positioning, `gap`,
  `object-fit`.
- Unavailable: `mix-blend-mode`, `::before`/`::after`, `-webkit-line-clamp`, and **CSS custom properties**
  — so every token in a card is an inline literal and can drift from the Design with nothing catching it.
- **Variable fonts hard-throw.** Satori is 0.15.2 compiled into Next (`@vercel/og` 0.7.2) and cannot be
  pinned. Six pinned static TTFs, 490 KB. The "one file per family" convenience is true of the web and
  **false of the card**.
- **`next/font/google` cannot feed a card** — it returns no bytes.
- **Every Poster is AVIF and AVIF is refused.** A rejected image renders a **blank card rather than
  throwing**, which is invisible in production. This is ticket 14.
- Two beliefs in the map's Notes were wrong: `linear-gradient` does render, and `box-shadow` survives, so
  the shadow substitutes the Notes anticipated are unnecessary.

## Ticket 03 — how long a scraper holds a card (resolved — don't redo it)

Findings file: `.scratch/social-cards/research/how-long-a-scraper-holds-a-card.md`. **The map's staleness
assumption was optimistic, not established.**

- **Only Slack publishes a cache lifetime: ~30 minutes** (`api.slack.com/robots`, verbatim). LinkedIn,
  Apple and X publish **none**. The "LinkedIn caches 7 days" figure that circulates traces only to Quora
  and marketing blogs.
- **X's card documentation has been deleted.** Both legacy card URLs 307 to `docs.x.com/`, whose
  published `llms.txt` has no cards section. The "~7 days" survives only as a 2016 forum post by a then-
  Twitter employee, *citing the page that is now gone*.
- **LinkedIn's hard fact is worse than a TTL: an existing share is permanent.** Officially documented —
  a refresh reaches new posts only. This is the whole argument for render-live.
- **Every lever we control is already pulled.** Images serve `public, max-age=0, must-revalidate` — the
  tightest thing RFC 9111 permits — and the generated route carries **no `etag` and no `last-modified`**.
- **Do not add a manual cache-buster.** Next already appends a content hash to metadata image URLs
  (`twitter-image.png?twitter-image.fb73fb83.png`), and RFC 9111 §4 makes a different target URI a
  different cache entry. Measured, and **not documented** by Next.
- **`og:image` and `twitter:image` are two independent caches.** A card is only as good as its worse
  slot, so a design bound for X must exist for both.
- **`twitter:card = summary_large_image` reaches X** — confirmed from X's own crawler, not inferred from
  our HTML. `socialMediaTags` works despite being outside Next's `Metadata` type. This fog patch is
  closed.

### X is closed as a measurement — do not retry

Driven in the maintainer's authenticated session with the `browser-skill` on 2026-10-05. The Card
Validator **no longer renders a card** (the preview pane holds only "Card preview has moved to Tweet
Composer") and its entire output is four INFO lines — **no cache age, no timestamp, no image URL.** It
also flags nothing about the three competing `og:image` tags, so its silence is not a clean bill of
health. The only route left is composing a URL in Tweet Composer twice, weeks apart: the maintainer's
call, and not do-able in a session.

**LinkedIn's Post Inspector is now the only platform where a TTL can still be measured** — it reports
"when we last updated our data on it", one minute with a login. Slack needs no tool: paste a URL in a
channel twice, 40 minutes apart, which also tests whether Slack decodes an AVIF Poster.

## Two constraints handed to ticket 07

1. **Render-live is an opt-out, not the default.** Next's docs: generated images are *"statically
   optimized (generated at build time and cached) unless they use Request-time APIs or uncached data."*
   A card that forgets to opt out **freezes its count at build** and silently undoes maintainer answer 3.
2. **A Contributor identity cannot reach a card through an `opengraph-image.tsx` `params` prop** — the
   docs' own table gives `app/shop/opengraph-image.js` a `params` of `undefined`, and it carries route
   params only, never `searchParams`. The bet survives because `generateMetadata` *does* receive
   `searchParams` and can point `openGraph.images` at a card URL carrying the Contributor.

## The frontier — ticket 14, and nothing else

| # | Ticket | Status |
| --- | --- | --- |
| 01 | Which file actually serves the root card | `resolved` (research) |
| 02 | Can ImageResponse render this Design | `resolved` (research) |
| 03 | How long a scraper holds a card | `resolved` (research) |
| **14** | **Can a card show a Poster at all** | **`open`, unblocked — the whole frontier** |

**14 is `Type: grilling`, which is HITL.** It cannot be resolved by an agent alone: the answer is which of
*transcode per request* / *pre-convert a sibling asset* / *drop the Poster* / *ask Cloudflare to transform
at the edge* the maintainer prefers, plus two sub-questions — does the Recording card show a Poster at
all, and what does a card show when the Poster fetch fails. It also now carries a third, added by ticket
03: **whether the platforms can decode AVIF at all**, since Slack's unfurl fetcher downloads the image to
validate it and X and Messages decode it independently of Satori.

Everything else is blocked on it: **04, 05, 06** (prototype, `Blocked by: 14`), then **08** (Category,
`Blocked by: 05`), **09** (`Blocked by: 04`), **07** (grilling, `Blocked by: 01, 02, 03, 14` — only 14
outstanding), and **10** (write the spec, blocked by all six).

## Constraints any session must respect

- **`CONTEXT.md` glossary.** Recording, Demo, Poster, Contributor, Category. Never "video", "clip",
  "thumbnail", "entry", "author" (ADR-0008).
- **The Design's tokens are already decided** — `app/globals.css:203-268` for the palette, the seven
  `fontSize` steps in `tailwind.config.ts`. A card that invents a colour or a type step is not this
  Design. Ticket 02's consequence: tokens must be written as inline literals, so nothing catches drift.
- **ADR-0009:** a Contributor has no slug and no id. The name string *is* the identity. An *image key*
  may be a hash of the folded name — that is not a slug and breaks no ADR, because the page address
  stays `/products?contributor=…`.
- **`.scratch/studio-dark/spec.md` checkpoint 4 is un-cleared** and stops an agent restyling anything
  `ui-ux-overhaul` shipped.
- Every card design session: `/grilling`, `/domain-modeling`, `/prototype`. Mechanism session:
  `/grilling` + `/domain-modeling`.
- Nothing in this effort edits a file under `app/`. Prototypes live on a preview route; the
  implementation is a later effort.
- **Measure, do not read off a list.** Both research tickets were settled by RGBA-diffing renders and
  by curling production, and both produced results that contradicted the map's own prior beliefs.
- **Subagent dispatch is broken in this environment** — the `general` agent fails with
  `Model not found: opencode/deepseek-v4-flash-free`, and the task tool takes no model parameter to
  repoint it. **Run research inline.**

## Added 2026-10-06 — the Fan card (ticket 05, round 2)

**The maintainer supplied a reference image and asked to invert the settled Contributor card:**
fan of Posters **left**, type block **right** (`rnui.dev` / name / count), saying twice to keep
that arrangement. Built, five variants rendered, **none chosen yet** — it needs a maintainer
decision, so it is `open` in the ticket, not resolved.

- Preview `gallery-fan.html`, renders `preview/out-fan/`, guard `preview/verify-fan.tsx`.
- **The settled card is untouched.** `variants-contrib.tsx` and `render-contrib.tsx` have no
  diff. The Fan is an *option*, not a replacement.
- **The big win was not the fan.** Letting the card own the name's break — the alias is emitted
  as its own block, so Satori never picks the break — took a 560px column from the settled 36px
  to 48px, and 733px to 64px. Every ceiling is bound by `Konstantinos Efkarpidis`, the only long
  name with no parenthetical.
- **`zIndex` does not exist in Satori**; `transform-origin` does. Both measured.
- Run `verify-fan.tsx` after touching the fan. It caught a card whose leftmost ink sat at x=12,
  inside Slack's 66px crop, and its own first version passed while detecting no ink at all.

## Shipped 2026-10-06 — the Contributor OG card (`Deck`)

**The Fan card is live.** `Deck` was chosen out of five; `lib/og-contributor-card.tsx` +
`app/api/og/contributor/route.ts`, wired from `app/products/page.tsx`'s `generateMetadata` only
when `?contributor=` is present. Verified against a production build: `ƒ` (Dynamic) in the build
output, both `og:image` and `twitter:image` emitted, no `etag`, unknown name `404`. Unfiltered
`/products`, `/`, `/recording/[id]` and `/contributors` are byte-identical to before.

**All five variants are kept and re-selectable at `prototypes/og-cards/`** — committed, with
`pnpm ogcards:render` / `ogcards:verify` and a README table of what to change to switch. The
`.scratch/` copy was deleted because TypeScript's `**` glob **skips dot-directories**, so
nothing there was ever type-checked; moving it surfaced eight real type errors and a font loader
duplicated eight times, now one.

Three things a future session must not re-learn:
- **`zIndex` does not exist in Satori.** Overlap order is DOM order.
- **ADR-0009's name folding already exists** as `lib/contributor-match.ts`
  (`existingContributor`). Do not write a fourth copy — a third one shipped a cache key that
  could never move.
- **`pnpm check-types` can lie.** `incremental: true` plus a stale `tsconfig.tsbuildinfo` skips
  unchanged files. Delete the buildinfo before believing a clean run.

**Renditions are still not built** (ADR-0012 describes them): they need an R2 publish step. The
route converts AVIF per request with sharp instead.

## Report in English only

The maintainer asked for every report in English. A block of Chinese appeared appended to one message
in the session that charted this map; it was not written deliberately and must not be reproduced.

## If context is tight

Read, in this order, and nothing else: `MEMORY.md` → `.scratch/social-cards/map.md` → the frontier
ticket's own file. The map's Decisions-so-far is the index; each closed ticket holds its own detail.