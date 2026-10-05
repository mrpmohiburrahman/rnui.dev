# og-cards — the Contributor Open Graph card

**Five variants, kept so a choice can be revisited. One is live: `Deck`.**

| | | |
|---|---|---|
| **chosen** | **`Deck`** | shipped as `lib/og-contributor-card.tsx` + `app/api/og/contributor/route.ts` |
| kept | `Fan` | 5 Posters, arc — the maintainer's reference as drawn |
| kept | `Stair` | 4 Posters, climbing — the reference image's *actual* arrangement |
| kept | `Slab` | 3 Posters, loose — the most legible Posters, the smallest name |
| kept | `Drum` | 1–6 Posters, tile count follows the Recording count |

All five hold one layout, chosen by the maintainer and held across every variant: **a fan of
Posters on the left, and `rnui.dev` / the Contributor's name / the count on the right.** What
varies is the fan's geometry and the type scale, and nothing else.

## Switching to another variant

`lib/og-contributor-card.tsx` holds `Deck`'s geometry as a single exported constant, and it is
the only file that needs to change. Take `fanW`, `n`, `stepRatio` and `tilt` from
`contributor-variants.tsx`:

| | `fanW` | `n` | `stepRatio` | `tilt` | name | Posters legible |
|---|---|---|---|---|---|---|
| `Deck` | 287 | 8 | 0.129 | 4 | **64px** | 2 of 8 |
| `Fan` | 327 | 5 | 0.167 | 7 | 60px | 1 of 5 |
| `Stair` | 396 | 4 | 0.3 | 5 | 56px | 3 of 4 |
| `Slab` | 430 | 3 | 0.36 | 6 | 52px | 3 of 3 |
| `Drum` | 316 | 6 | 0.163 | 6 | 60px | 1–6, all |

**Then re-measure before shipping.** The name's size is *derived* from the column
(`ceilingFor`), and the column moves with `fanW` — so a wrong `fanW` silently ships a name at a
size no measurement covers. `pnpm ogcards:verify` is what catches it: it renders all **24**
real names × 5 variants and fails on any wrap or overflow.

## The numbers, and where they came from

Nothing here is a round number that felt right. Every one was rendered and ink-counted.

| | |
|---|---|
| `probe/fan-probe.tsx` | what Satori will do at all: `zIndex` is **ignored**, `transform-origin` works, `box-shadow` travels with a rotation |
| `probe/fan-origin.tsx` | `transform-origin: bottom center` ≡ `50% 100%`, byte-identical ink — so a fan is CSS, not trigonometry |
| `probe/fan-ramp.ts` | the right column is `1200 − 2·66 − fanW − 48`, and what that buys |
| `probe/fan-break.tsx` | four treatments of the name's break; **none of them fix both** |
| `probe/fan-ceiling.tsx` | all 24 names at 6 column widths → the ceiling table in `CEILING` |
| `probe/tiles.ts` | crops Posters to 1:1.26 from the CDN-free local `public/thumbnails/` |

## Commands

```
pnpm ogcards:tiles    # build tiles/contrib/*.jpg + index.json from local Posters
pnpm ogcards:render   # 25 cards + out/gallery.html  -> open out/gallery.html, arrow keys
pnpm ogcards:verify   # 24 names x 5 variants + edge checks; exits non-zero on failure
```

`ogcards:tiles` reads `public/thumbnails/`, which is **gitignored** — the Posters live on R2,
so this step needs a machine that has run `pnpm assets:publish` locally at least once. The 42
committed tiles in `tiles/contrib/` are why the prototypes still run on a fresh clone.

**`out/` is gitignored.** The 25 renders are 3.1MB of derived PNG and come back in about 30
seconds with `pnpm ogcards:render`; what is committed is the source for all five variants, which
is what actually makes them re-selectable. To look at them without rebuilding, run the command.

## Three findings worth keeping

1. **`zIndex` does not exist in Satori.** Overlap order comes from DOM order. A probe ordering
   three overlapping cards by `zIndex` rendered byte-identically to DOM order.
2. **The card owns the name's break.** A trailing parenthetical is an alias, so it is emitted as
   its own block and Satori never chooses a break. With `keep-all` plus a non-breaking space —
   both inherited from the earlier card — the widest name still broke as
   `Enzo Manuel Mangano (` / `Reactiive)`, orphaning the bracket. Neither setting fixes both.
3. **A rotated card's corner swings a full height, not half.** The first overhang maths halved
   it and put the fan's leftmost ink at **x=12** — 54px inside the 66px Slack crop, so the outer
   card was cut off on every share. `verify.tsx` caught it.

## What is *not* here

Renditions. `CONTEXT.md` and `docs/adr/0012` describe a pre-converted sibling asset per Poster,
which is the better shape for a card requested often. It is not built: `public/thumbnails/` is
gitignored, so renditions mean a publish step against the R2 bucket. The live route fetches
AVIF from the CDN and converts with sharp per request instead, memoised per process. See the
route's header for why that is bounded and paid rarely.
