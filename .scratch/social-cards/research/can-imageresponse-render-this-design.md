# Can ImageResponse render this Design

Research for `.scratch/social-cards/issues/02`. Charted 2026-10-05, run 2026-10-05.

**Method note.** Every verdict below marked *probe* was measured by rendering two cards that differ
**only** in the device under test and diffing the decoded RGBA with `sharp` — not by comparing PNG
byte length, which says nothing about what changed, and not by trusting documentation. Satori never
warns on an unsupported property; it silently drops it, so a byte-length check would have called a
dropped `mix-blend-mode` "different" for the wrong reason. Verdicts marked *source* are read out of
the shipped bundle at a cited line. Probe and sources are in `.scratch/social-cards/probe/`.

## What is actually installed

| | |
|---|---|
| Next | `16.1.1` (`package.json:65`) |
| `@vercel/og` | `0.7.2`, **compiled into Next**, not a direct dependency |
| Satori | `0.15.2` (from the bundle's own module banner) |
| opentype.js | `@shuding/opentype.js@1.4.0-beta.0` (bundle banner) |
| resvg | `resvg.wasm`, 1.38 MB, shipped in the bundle |
| yoga | `yoga.wasm` |

Bundle root for every citation below:

```
node_modules/next/dist/compiled/@vercel/og/index.node.js
```

`satori` and `opentype.js` are **not** separately installable here — `require.resolve('satori')`
returns nothing. They are only reachable inside Next's compiled copy. This matters for ticket 07:
there is no supported way to pin or upgrade Satori without patching Next.

## Verdicts

| Design device | Verdict | Substitute / note |
|---|---|---|
| **Space Grotesk + JetBrains Mono** | **renders — but only as pinned static TTFs** | Variable TTFs **hard-throw**. See below. |
| **`next/font/google`** | **does not work with `ImageResponse`** | Bytes must be fetched separately. See below. |
| **`linear-gradient`** | **renders** | The map's belief that it renders flat is **wrong**. |
| **`radial-gradient`** | renders (same code path) | — |
| **`box-shadow`, incl. `--e0`/`--e1`/`--media-glow`** | **renders**, negative blur term included | The Design's depth survives. Not a rebuild. |
| **`background-image: url()`** | renders (fetched, wrapped in an SVG `<pattern>`) | — |
| **`backgroundImage: linear/radial-gradient()`** | renders | — |
| **`border-radius`** — all four steps | renders | — |
| **`filter`** | **renders** (passed through to SVG `style="filter:…"`) | — |
| **`mix-blend-mode`** | **unavailable — silently dropped** | No substitute. |
| **`::before` / `::after`** | **unavailable** | No selector surface in Satori's JSX at all; build with a sibling element. |
| **Poster AVIF** | **unavailable — silently produces a blank card** | Every Poster in the catalogue is AVIF. See below. |
| **WebP** | unavailable — blank card | — |
| PNG, JPEG, GIF, APNG, SVG | render | — |
| `position: absolute` | renders | — |
| `gap` | renders | — |
| `margin: auto` as a flex push | renders | — |
| `object-fit: cover` / `contain` | renders | — |
| `overflow: hidden` + `maxHeight` | renders (clips) | — |
| **`-webkit-line-clamp`** | unavailable | Use `maxHeight` + `overflow: hidden`. Clips mid-line, so size the box in whole lines. |
| CSS custom properties (`var(--canvas)`) | **do not resolve** | Every token must be inlined as a literal. |

## The three findings that decide the mechanism

### 1. A variable font hard-throws. Static instances are mandatory.

This inverts the map's own assumption. The Notes read "one file per family covers every weight a
card needs" as a convenience; it is in fact unusable.

Passing a real variable TTF (`SpaceGrotesk[wght].ttf`, 136,676 bytes, with a genuine `fvar`/`gvar`
table pair — table list read straight out of the sfnt directory) to `ImageResponse`:

```
TypeError: Cannot read properties of undefined (reading '256')
    at parseFvarAxis  index.node.js:11891
    at Object.parseFvarTable [as parse]  index.node.js:11921
    at Object.parseBuffer [as parse]  index.node.js:12961
    at Bt.addFonts  index.node.js:17231
```

**Root cause, read from source.** `parseBuffer` parses `fvar` at `index.node.js:12959-12966` and
passes `font.names` as the name table:

```js
if (fvarTableEntry) {
  var fvarTable = uncompressTable(data, fvarTableEntry);
  font.tables.fvar = fvar.parse(fvarTable.data, fvarTable.offset, font.names);
}
```

`parseFvarAxis` then does `axis.name = names[p.parseUShort()]` at line 11891. **`font.names` is never
assigned** — grepping the whole bundle for `case "name"` in the sfnt table-directory switch returns
nothing, and there is no `font.names =` assignment anywhere. The opentype build Next ships
(`@shuding/opentype.js@1.4.0-beta.0`) parses `fvar` but not `name`, so any font carrying an `fvar`
table crashes the render. This is not a weight-matching limitation; it is an unconditional throw on
variable fonts.

Consequence: **each weight a card needs must be a separate pinned static TTF.** The Design needs
Space Grotesk 300/400/500/700 and JetBrains Mono 400/700 — six files, **490 KB** total, measured.

`woff2` is refused outright and separately: `Unsupported OpenType signature wOF2`. This is why the
probe's `fetch-fonts.sh` takes static TTFs from the legacy-UA path of `fonts.googleapis.com/css2`
rather than the variable `woff2` a modern UA is served.

### 2. `next/font/google` cannot feed a card. The bytes must come from somewhere else.

`ImageResponse`'s `fonts` option takes `{ data: ArrayBuffer; name: string; weight?: 100…900 }` —
`node_modules/next/dist/compiled/@vercel/og/types.d.ts`, the `fonts?:` field. What `next/font/google`
returns is a different shape entirely
(`node_modules/next/dist/compiled/@next/font/dist/types.d.ts`):

```ts
export type NextFont = {
    className: string;
    style: { fontFamily: string; fontWeight?: number; fontStyle?: string };
};
export type NextFontWithVariable = NextFont & { variable: string };
```

No `data`, no bytes, no file path — a class name and a `fontFamily` string. That is all it can
return, because the actual font file is downloaded and hashed **at build time** by
`node_modules/next/dist/compiled/@next/font/dist/google/loader.js` and emitted as a CSS `@font-face`
plus a CSS custom property. `ImageResponse` reads neither. `app/layout.tsx:40-52` gets
`{ className, style, variable }` and hands `variable` to `<html>`; there is nothing on that object a
card can consume.

**So a card route must fetch the TTF bytes itself** — at module scope, memoised, or from a build
asset. Three real options, all of which belong to ticket 07:

1. `fetch` the static TTF from `fonts.gstatic.com` at module scope, memoised. Cost per cold start:
   one 490 KB fetch. **This makes `fonts.gstatic.com` a runtime dependency of a public route**, which
   is a reliability decision, not just a cost one.
2. Copy the six static TTFs into the repo (`public/fonts/` or imported as assets) and read them at
   module scope. No third-party runtime dependency, deterministic, but ~490 KB in the bundle.
3. Convert to static instances at build time with `next/font/local`, which points at local files
   and could emit the bytes — but the emitted shape is still `@font-face`, so the card would still
   need its own path to the files.

**Cost per render, measured** (Node 22, this machine, 5 runs, warm):

| | median |
|---|---|
| 6 static TTFs, **same array instance** reused | **17 ms** |
| 6 static TTFs, **fresh array each call** | **21–26 ms** |
| no `fonts` option (Noto Sans default) | 17 ms |

There is a font-engine cache keyed on the `fonts` **array identity** — a `WeakMap`
(`Do.has(t.fonts) ? … : Do.set(t.fonts, new Bt(t.fonts))`, around `index.node.js:18090`). Reusing one
module-scope array is measurably cheaper than building a new one per request; the delta is ~5 ms and
the parse is the whole of it. **Practical instruction for ticket 07: hoist the array to module
scope.**

Omitting `fonts` entirely does **not** fall back to Noto for an arbitrary family — it throws
`No fonts are loaded. At least one font is required to calculate the layout`
(`index.node.js:17242`). The Noto default only applies when the `fonts` key is absent *and* the
default font list is injected, which `@vercel/og` does for its own default path; passing `fonts: []`
throws.

### 3. Every Poster is AVIF, and Satori refuses AVIF. The card renders blank.

`lib/asset-path.ts:34` — `const POSTER_EXTENSION = ".avif"`, with
`".avif": "image/avif"` at line 41. `tests/data-integrity.test.ts:23` enforces
`/^thumbnails\/[a-z0-9_-]+\/[A-Za-z0-9._-]+\.avif$/` as the **only** valid Poster path. So the
Recording card's subject matter is in a format the renderer rejects.

The rejection is in `us()` (`index.node.js:16020-16033`), which sniffs the magic bytes and then checks
membership in a hardcoded allowlist:

```js
if (!ef.includes(n)) throw new Error(`Unsupported image type: ${n || "unknown"}`);
```

`ef` is `[$r, Wr, qr, Br, On]` — **png, apng, jpeg, gif, svg+xml** (`index.node.js:534012`). AVIF and
WebP are both explicitly detected by the sniffer `nf()` (they have their own magic-byte branches at
lines 537683 and 537835) and then rejected by the allowlist. AVIF is not an unknown format to this
code; it is a known one it declines.

**The failure mode is the dangerous part.** A remote fetch that throws is swallowed
(`index.node.js:16093`):

```js
.catch((i) => (console.error(`Can't load image ${n}: ` + i.message), Re.set(n, []), []))
```

It returns `[]`. **The card still renders — with nothing where the image should be.** Measured, by
counting distinct colours in the output:

| Poster served as | distinct colours in output | mean RGB |
|---|---|---|
| AVIF (correct bytes, correct content-type) | **1** | 10, 11, 13 (= `--canvas`) |
| WebP | **1** | 10, 11, 13 |
| PNG | 2 | 37, 68, 63 |
| JPEG | 373 | 37, 68, 63 |

AVIF produces a **completely blank card**: one colour, the canvas. No 500, no thrown error, no
visible failure — just a card with the Recording missing. A 404 on the Poster behaves identically
(`Unsupported image type: unknown`, same blank result).

This is the single most important thing on this ticket, and it is the opposite of the ticket's own
guess ("a blank card, or a thrown 500"). **It is a blank card, and the failure is invisible in
production.** Any card that composites a Poster must convert it, or the failure ships silently.

**The conversion is cheap and works.** Transcoding the AVIF to PNG or JPEG at request time with
`sharp` (already a dependency, `package.json:101`, v0.34.5) makes the Poster render. Probe-measured
cost of one 600×400 AVIF → JPEG at q82 is not recorded — *not established*, see below. Converting to
PNG and serving it defeats the point of AVIF on the CDN; JPEG is the format that works. **Whether to
convert per request, to pre-convert a sibling asset, or to drop the Poster is a decision this map has
not yet made** — it belongs to ticket 06 (does a card show a Poster at all) and ticket 07 (the
mechanism). Flagged below.

## Verdicts on the map's own beliefs

Two notes in the map are now settled, and one is **wrong**:

- **"`linear-gradient` **does** render in Satori — the current card's gradient is not silently flat."
  Probe: 74.9% of pixels change, max channel delta 18, and the rendered image shows a visible
  top-left-to-bottom-right wash. The dispatch is
  `index.node.js:586458` (`if (o.startsWith("linear-gradient(")) return Os(...)`). The map's
  suspicion that a designer might build against a feature that does nothing is unfounded.
- **"The Design's depth comes from `box-shadow`, and whether those survive is open."** They survive.
  `--e0`, `--e1` and `--media-glow` all render, **including the negative blur-spread term**
  (`0 20px 44px -22px hsla(…)`) — 2.5% of pixels change at `--e1`, 5.0% at `--media-glow`, and the
  rendered glow is visibly there. Satori compiles shadows to an SVG `<feDropShadow>` filter
  (`index.node.js:562897`). **The ticket's suggested substitutes — stacked borders, offset solid
  rectangles — are not needed.**
- **"Both are variable fonts, so one file per family covers every weight a card needs."** True of the
  *web*, false of the *card*. See finding 1.

## What the probe dropped

Nothing in the Design's palette, type scale or elevation had to be rebuilt. The Design is unusually
well-matched to Satori: flexbox, four `border-radius` steps, four `fontSize` steps, `letterSpacing`
(the 9px mono `label` step's `0.14em` renders), `box-shadow`, gradients and remote images all work.

What had to be dropped or rebuilt:

1. **Variable fonts** → six pinned static TTFs. The largest single change.
2. **CSS custom properties** → tokens inlined as literals. `var(--canvas)` does not resolve; every
   value the card uses must be a hex string or a number written in the card's source. **The card's
   palette can therefore drift from `app/globals.css` with nothing to catch it** — worth a shared
   token module or a lint rule in the implementation effort, and worth ticket 10 recording.
3. **`mix-blend-mode`** → no substitute. Any design reaching for it gets nothing.
4. **`::before` / `::after`** → build with a sibling element.
5. **`-webkit-line-clamp`** → `maxHeight` + `overflow: hidden`, clipping mid-line.
6. **AVIF Posters** → must be transcoded, or the card is blank.

## Not established

Stated as unknown rather than guessed:

- **The per-request cost of transcoding an AVIF Poster.** `sharp` is present and the conversion is
  provably correct, but no timing was measured. This matters because it lands inside a
  request-time render on a free-tier function, and ticket 07 has to budget for it. **Left to ticket
  07.**
- **The `Re` LRU cache's size.** `Re = rs(100)` (`index.node.js:533903`) and image loads are cached
  by URL for the process lifetime (`Ct`). A per-request render therefore re-fetches its Poster on a
  cold isolate and not on a warm one, which means per-request transcoding cost is
  **cold-start-shaped**. Not measured; named here so ticket 07 budgets for the cold path.
- **Whether a resvg-level AVIF path exists.** resvg itself is a renderer and this question was
  answered for the Satori decode path, which is the one that runs. Not pursued further.
- **Whether Vercel's edge runtime behaves differently from Node here.** All probes ran on Node
  against the `index.node.js` bundle. `app/opengraph-image.tsx:3` sets `runtime = "edge"`, which
  would take `index.edge.js` instead. The decode allowlist and the opentype `fvar` bug are almost
  certainly shared, since they are the same Satori, but **this was not verified on the edge bundle**
  and is worth one check before implementing.

## Re-running the probe

```bash
bash .scratch/social-cards/probe/fetch-fonts.sh          # fetches the six static TTFs + the two variable TTFs
pnpm tsx .scratch/social-cards/probe/probe.tsx           # the token card + the device matrix
pnpm tsx .scratch/social-cards/probe/probe-images.tsx    # AVIF, remote fetch, variable fonts
pnpm tsx .scratch/social-cards/probe/probe-consequences.tsx  # what the failures look like
```

PNGs land in `.scratch/social-cards/probe/out/`. `probe.tsx` writes the Design-token card as
`00-tokens.png` — that is the ticket's requested probe, and it renders the real palette, the real
mono label step and three real `borderRadius` steps.