# Can ImageResponse render this Design

Status: resolved
Type: research
Blocked by:

## Question

**The card has to be the Design, and `ImageResponse` renders a much narrower CSS subset than a
browser. Which of the Design's tokens and type survive, and what has to be rebuilt by hand?**

Satori — what `next/og`'s `ImageResponse` wraps — supports a specific flexbox subset. Establish, from
its documentation and by writing a probe, which of these the site actually uses:

- **Type.** `app/layout.tsx:40-52` loads Space Grotesk and JetBrains Mono through `next/font/google`,
  which emits `@font-face` and CSS custom properties. `ImageResponse` reads neither. Does it accept
  `next/font` at all, or must the font files be fetched as `ArrayBuffer` and passed in `fonts`? What
  does that cost per render, and is it cached?
- **`linear-gradient`.** `app/opengraph-image.tsx:14` uses one and it renders flat. Confirm, so the
  Design's candidates are not drawn against a feature that silently does nothing.
- **`box-shadow`.** The Design leans on `--e0`/`--e1`/`--e2` and `--media-glow` for depth
  (`app/globals.css:246-268`). Not in the Satori subset. What is the substitute — stacked borders,
  offset solid rectangles?
- **`background-image`, `filter`, `::before`/`::after`, `mix-blend-mode`** — all absent, all
  plausible things a designer will reach for.
- **`border-radius`.** The Design has four steps (`tile`/`panel`/`chip`/`badge`). Confirm these render,
  since the Poster frames are rounded in the Design and a square Poster frame will not look like this
  site.
- **Remote images.** A Recording card composites an AVIF Poster fetched from R2
  (`lib/cdn.ts` `getCdnUrl`). Does `ImageResponse` accept AVIF, and does it fetch cross-origin? What
  happens when the fetch fails — a blank card, or a thrown 500 on a shared link?

Then produce **one throwaway probe card** that renders the Design's real tokens — `--canvas`,
`--acc`, `--t1/t2/t3`, Space Grotesk, `--acc` mono label at the `label` step — at 1200×630, and say
plainly which of the Design's devices had to be dropped to make it.

## Notes

Read `app/globals.css:203-268` for the palette and `tailwind.config.ts` `fontSize` for the seven
steps. Both families are documented as variable fonts covering Space Grotesk wght 300–700 and
JetBrains Mono wght 100–800, which is convenient here: one file per family covers every weight a
card needs.

The probe is an asset, not a decision. Leave it somewhere out of `app/` and link it. What this ticket
must hand the next sessions is **the constraint list** — every Design device with a verdict of
"renders", "flat" or "unavailable" — because ticket 04 designs inside it.

## Answer

Full findings: [`../research/can-imageresponse-render-this-design.md`](../research/can-imageresponse-render-this-design.md).
Probe: [`../probe/`](../probe/) — `pnpm tsx .scratch/social-cards/probe/probe.tsx`.

Satori is `0.15.2`, compiled into Next 16.1.1 as `@vercel/og` 0.7.2; `satori` is **not** separately
installable, so ticket 07 cannot pin or upgrade it. Verdicts were **measured** — two cards differing
only in the device under test, diffed on decoded RGBA — because Satori drops unsupported properties
silently and a byte-length comparison would have called a dropped `mix-blend-mode` "different".

**The constraint list:**

- **renders:** `linear-gradient`, `radial-gradient`, `background-image: url()`, `filter`,
  `border-radius` (all four steps), `box-shadow` **including `--e0`/`--e1`/`--media-glow` with their
  negative blur term**, `position: absolute`, `gap`, `margin: auto`, `object-fit`, `letterSpacing`,
  `overflow: hidden` + `maxHeight`, PNG/JPEG/GIF/APNG/SVG images, remote cross-origin image fetch.
- **unavailable:** `mix-blend-mode` (no substitute), `::before`/`::after` (no selector surface),
  `-webkit-line-clamp`, **CSS custom properties** (every token must be an inline literal),
  **AVIF and WebP images**.
- **unavailable but required:** **variable fonts hard-throw.** Next's bundled
  `@shuding/opentype.js@1.4.0-beta.0` parses `fvar` but never populates `font.names`, so
  `parseFvarAxis` dereferences `undefined` (`index.node.js:11891`). Each weight must be a **pinned
  static TTF**; `woff2` is refused separately. Six files, 490 KB.

**Three findings that change the map's beliefs:**

1. **The map's suspicion that `linear-gradient` renders flat is wrong.** It renders — 74.9% of pixels
   change and the wash is visible. No designer is building against a dead feature.
2. **The Design's depth survives.** `--e0`/`--e1`/`--media-glow` all render as SVG `<feDropShadow>`.
   The ticket's suggested substitutes — stacked borders, offset rectangles — are **not needed**.
3. **The map's "one variable file per family covers every weight" is true of the web and false of the
   card.** See above; this inverts the assumption the Notes were written on.

**The finding that decides the mechanism, and the opposite of what the ticket guessed:**

**`lib/asset-path.ts:34` makes `.avif` the only Poster extension** and `tests/data-integrity.test.ts:23`
enforces it. Satori's allowlist is `[png, apng, jpeg, gif, svg+xml]` (`index.node.js:534012`) — AVIF
and WebP are detected by the magic-byte sniffer and then **explicitly declined**. The ticket asked
whether a failed fetch gives "a blank card, or a thrown 500". **It is a blank card, and the failure is
invisible.** The fetch's `.catch` returns `[]` (`index.node.js:16093`), so the card still renders with
nothing where the Poster should be. Measured by distinct-colour count on the output: an AVIF Poster
yields **1 colour** (the canvas); PNG and JPEG yield 2 and 373.

Consequence: **any card that composites a Poster must transcode it, or it ships silently broken.**
`sharp` is already a dependency and the conversion is provably correct. **Whether to transcode per
request, pre-convert a sibling asset, or drop the Poster is not decided here** — it belongs to
tickets 06 and 07.

**Also answered:** `next/font/google` **cannot** feed a card. It returns
`{ className, style: { fontFamily }, variable }` (`@next/font/dist/types.d.ts`) — no bytes, no path —
while `fonts` needs `{ data: ArrayBuffer, name, weight }` (`@vercel/og/types.d.ts`). The bytes must be
fetched from somewhere else, and the three real options are in the research note. Font-engine cost is
a `WeakMap` cache keyed on the **`fonts` array identity**, so the array must be hoisted to module
scope: 17 ms reused vs 21–26 ms fresh.

**Not established, deliberately:** the per-request cost of transcoding an AVIF Poster (left to
ticket 07, which must budget for it); the 100-entry image-URL LRU means transcoding cost is
cold-start-shaped; and every probe ran on the **Node** bundle while `app/opengraph-image.tsx:3` sets
`runtime = "edge"`. The allowlist and the `fvar` bug are the same Satori and almost certainly shared,
but the edge bundle was **not** verified — one check before implementing.

### Surfaced by this answer

- **Ticket 02 has graduated new work.** The AVIF decision is sharp enough to be its own ticket, and
  three sessions all need the same answer. Added as **14 — Can a card show a Poster at all**.
- **`CSS custom properties do not resolve`, so the card's palette can drift from
  `app/globals.css` with nothing to catch it.** Added to the fog: whether a shared token module or a
  lint rule should hold the cards to the Design. Implementation effort, but visible now.
- **The edge-runtime gap is now sharp** — it is one check, not a fog. Folded into ticket 07's
  acceptance rather than ticketed separately.