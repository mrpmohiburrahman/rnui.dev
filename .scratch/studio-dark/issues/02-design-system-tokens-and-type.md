# 02 — The design system: tokens, type, spacing, radius, elevation, fonts

Status: ready-for-human
Blocked by: 01

The foundation tickets 04 to 12 build on. Nothing here draws a surface; it puts every number the
mock specifies somewhere a component can ask for it by name, once, so that eight later tickets
are not each transcribing hex codes out of HTML.

## Problem

### The design's values exist in six HTML files and nowhere in the repo

`assets/new-ui/Specimen.dc.html:101-167` is the specification — palette, type scale, radius,
elevation, spacing and motion, with real numbers. Nothing in `app/globals.css` or
`tailwind.config.ts` holds any of them. `app/globals.css:6-66` declares the thirteen shadcn HSL
tokens (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`,
`--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, plus `--radius`) in both
`:root` and `.dark`, and every one of them is a neutral grey: `--background: 0 0% 98%` light,
`0 0% 3.9%` dark. The Studio Dark canvas is `#0A0B0D` dark and `#F4F4F1` light. No overlap.

The consequence is already visible. `app/globals.css:75` sets the page background with
`@apply bg-[#FAFAFA] dark:bg-background text-foreground` — a literal hex for light mode, a token
for dark. Across `app/` and `components/`, `grep -rn "bg-\[#\|text-\[#\|border-\[#"` returns 21
hits. Every one of those is a colour decision that no single file owns, and every surface ticket
in this effort would add more of them unless this ticket lands first.

### The five mocks disagree with each other about three tokens

Each `.dc.html` carries its own inline `const PAL = { dark: {...}, light: {...} }`, and they have
drifted:

| token | Specimen | Catalogue | CatalogueMobile | Detail | Tile |
|---|---|---|---|---|---|
| dark `line2` | `rgba(255,255,255,0.22)` | `0.24` | `0.24` | `0.24` | `0.22` |
| light `line2` | `rgba(16,18,22,0.24)` | `0.28` | `0.26` | `0.28` | `0.30` |
| light `line` | `rgba(16,18,22,0.13)` | `0.13` | `0.13` | `0.13` | `0.14` |
| dark `accSoft` | `rgba(111,227,204,0.13)` | `0.13` | `0.13` | `0.13` | `0.14` |
| light `accSoft` | `rgba(14,112,98,0.09)` | `0.09` | `0.09` | `0.09` | `0.10` |
| dark `newBg` | — | — | — | `rgba(235,208,138,0.2)` | `0.22` |

(Specimen `:102-103`, Catalogue `:175-176`, CatalogueMobile `:85-86`, Detail `:107-108`,
Tile `:65-66`, and for `newBg` Detail `:107` against Tile `:106`.) Six values, five files, no
arbiter. If each surface ticket copies from its own mock the site ends up with six colours that
differ for no reason anybody can name later.

`newBg` is the one divergence the rule below cannot settle, because the Specimen does not draw it.
**The Tile's `0.22` wins**: the Tile is the surface that renders 48 of these tags to the Detail's
one, and the light value is byte-identical in both mocks, so the Specimen's measured
*8.6:1 on tag fill* (`:126`) holds either way.

### Radius, duration and easing have no room in the current config

`tailwind.config.ts:96-100` derives `rounded-lg`/`md`/`sm` from `--radius: 0.5rem`
(`app/globals.css:35`), giving 8px, 6px and 4px. The design's scale is 16, 12, 9 and 6
(`Specimen.dc.html:146-149`). Not one value matches, and those three keys currently dress every
Radix primitive under `components/ui/`, so they cannot simply be repointed.

Tailwind 3.4.17's default `transitionDuration` steps are 75, 100, 150, 200, 300, 500, 700 and
1000ms. The design uses 120, 160, 220, 240 and 260ms (`Specimen.dc.html:160-167`). None of the
five exists, and its one custom curve, `cubic-bezier(.2,.8,.2,1)`, has no key either.

### The site ships zero webfonts and the design needs two

`tailwind.config.ts:22-25` records, in a comment left by `ui-ux-overhaul` ticket 05, that there is
deliberately **no** `fontFamily` override: Haskoy was deleted rather than fixed because the
`@font-face` rule emitted the family name `fontSans` while Tailwind asked for `Haskoy`, so 172KB
downloaded on every route and rendered nothing (`.scratch/ui-ux-overhaul/spec.md:49`). The site has
rendered in `ui-sans-serif`/`system-ui` ever since.

Studio Dark is drawn in Space Grotesk and JetBrains Mono — `Specimen.dc.html:14` prints
`SPACE GROTESK 400/500/700 · JETBRAINS MONO 400/500` as part of the specimen, and
`Catalogue.dc.html:10` requests exactly those weights from `fonts.googleapis.com`. Adding two
webfonts to a site whose field LCP p75 is **4,212ms desktop / 4,515ms mobile**, both inside
Google's poor band (`.scratch/ui-ux-overhaul/spec.md:139-140`), is the single most likely way to
undo the performance work — which is why `spec.md`'s constraints name webfonts and the per-tile
glow as the two things to measure rather than assume.

## Work

Two files carry almost all of this: `app/globals.css` and `tailwind.config.ts`. The tokens are CSS
custom properties so that `.dark` on `<html>` switches them (`tailwind.config.ts:5`,
`darkMode: ["class"]`, and `attribute="class"` at `app/layout.tsx:52`), and they are surfaced
through `theme.extend` so components write `bg-canvas` rather than `bg-[var(--canvas)]` — a class
Tailwind cannot see with an arbitrary value and cannot warn about when the variable is misspelt.

**The arbitration rule, applied throughout: the Specimen wins.** `spec.md`'s own table names
`Specimen.dc.html` as the file that holds the palette, and it is the only mock that publishes
contrast ratios against its own values. Where a surface mock's inline copy differs, it is copying
drift, not intent. The first five divergences above are all hairline alpha on 1px borders and
translucent fills; none of them is text, and none is the focus ring (the focus ring is `3px solid`
accent, `Tile.dc.html:101`), so nothing measured in `spec.md`'s contrast table moves.

### 1 — The palette, into `app/globals.css`

Add a **new** `@layer base { :root { … } .dark { … } }` block immediately after the existing one
that ends at `:67`. Do not edit lines 6-66. The thirteen shadcn tokens keep dressing everything
under `components/ui/`, and repointing them would restyle every Radix primitive at once with no
mock to check the result against.

Custom-property names are the mock's own keys, kebab-cased, so that a reader can diff
`Specimen.dc.html:102-103` against `globals.css` by eye. None of them collides with the thirteen
names already declared.

| var | dark | light | drawn at |
|---|---|---|---|
| `--canvas` | `#0A0B0D` | `#F4F4F1` | Specimen `:102-103` |
| `--panel` | `#101216` | `#FFFFFF` | Specimen `:102-103` |
| `--rail` | `#0C0D11` | `#EFEFEB` | Specimen `:108`/`:119` swatch "Rail / footer"; Catalogue `:175-176` `railBg` |
| `--header` | `rgba(10,11,13,0.92)` | `rgba(244,244,241,0.94)` | Catalogue `:175-176` |
| `--line` | `rgba(255,255,255,0.11)` | `rgba(16,18,22,0.13)` | Specimen `:102-103` |
| `--line2` | `rgba(255,255,255,0.22)` | `rgba(16,18,22,0.24)` | Specimen `:102-103` |
| `--t1` | `#F1F2F4` | `#14161A` | Specimen `:102-103` |
| `--t2` | `#B2B8C2` | `#4F545C` | Specimen `:102-103` |
| `--t3` | `#8E949F` | `#666B74` | Specimen `:102-103` |
| `--acc` | `#6FE3CC` | `#0E7062` | Specimen `:102-103` |
| `--acc-soft` | `rgba(111,227,204,0.13)` | `rgba(14,112,98,0.09)` | Specimen `:102-103` |
| `--on-acc` | `#06120F` | `#FFFFFF` | Catalogue `:175-176` |
| `--field` | `rgba(255,255,255,0.045)` | `#FFFFFF` | Catalogue `:175-176` |
| `--filter-bar` | `rgba(255,255,255,0.03)` | `#FFFFFF` | Catalogue `:175-176` |
| `--empty` | `rgba(255,255,255,0.02)` | `#FBFBF9` | Catalogue `:175-176` |
| `--x-bg` | `rgba(255,255,255,0.13)` | `rgba(16,18,22,0.10)` | Catalogue `:175-176` |
| `--scrim` | `rgba(4,5,8,0.74)` | `rgba(24,26,30,0.52)` | Catalogue `:175-176` |
| `--skel` | `rgba(255,255,255,0.07)` | `rgba(16,18,22,0.07)` | Catalogue `:175-176`; Tile `:65-66` |
| `--new-fg` | `#F3DEA6` | `#5C4204` | Specimen `:115`/`:126` swatch "New tag text"; Detail `:107-108` `newFg` |

That is the twenty palette keys the mocks name, in nineteen variables: `footerBg` is byte-identical
to `railBg` in both modes (`#0C0D11` / `#EFEFEB`, Catalogue `:175-176`) and the Specimen's own
swatch is labelled "Rail / footer" (`:108`), so one variable serves both and there is one place to
change it.

Carry the measured contrast ratio as a comment beside each text token, so that anyone editing one
sees the budget they are spending. Use `spec.md`'s figures, verified 2026-08-01 — light `acc` on
`canvas` 5.43, light `t3` on `canvas` 4.86, light `t1` on `canvas` 16.44, dark `acc` on `canvas`
12.69, dark `t3` on `panel` 6.15 — and note in the same comment that the Specimen prints slightly
different numbers for the same pairs (`:111-115`, `:122-126`: dark `t1` 16.8:1, `t2` 9.5:1, `t3`
5.7:1, `acc` 11.9:1; light `t1` 15.4:1, `t2` 7.5:1, `t3` 5.1:1, `acc` 4.9:1). Both sets clear
4.5:1; the spec's are the ones somebody actually measured, and recording the discrepancy stops it
being rediscovered once per ticket.

### 2 — The tile's three extra tokens, and five more the Detail and the mobile sheet draw

`Tile.dc.html:65-66` adds four keys the base palette does not have, of which three are declared
here:

| var | dark | light |
|---|---|---|
| `--raise` | `#15181D` | `#FFFFFF` |
| `--plinth` | `#05060A` | `#080A0E` |
| `--ctrl` | `rgba(255,255,255,0.04)` | `#FFFFFF` |

The fourth, `amber` (`#EBD08A` dark / `#7A5806` light), is **not** declared. `grep -n "amber"
assets/new-ui/*.html` returns exactly two hits, both that `PAL` declaration itself: the mock applies
it to nothing. The `NEW` tag's text is `newFg`, which the Tile computes for itself at `:107` as
`#F3DEA6` / `#5C4204` — byte-identical to the Detail's, and already `--new-fg` below. A token no
surface consumes is dead CSS the token test in step 11 would then have to be taught to tolerate.

`--plinth` is also the Specimen's fourth swatch, "Media plinth" (`:110`, `:121`), and the note at
`Specimen.dc.html:32` says why it is near-black in both modes: *"The media plinth stays near-black
in both modes — the recording is the light source, so it never sits on paper."*

Declare these five in the same block rather than leaving tickets 09 and 11 to invent names for
them:

| var | dark | light | drawn at |
|---|---|---|---|
| `--well` | `rgba(255,255,255,0.03)` | `#FBFBF9` | Detail `:107-108` (`cardBg`, used at `:51`) |
| `--bar-track` | `rgba(255,255,255,0.09)` | `rgba(16,18,22,0.10)` | Detail `:107-108` |
| `--bar-fill` | `rgba(255,255,255,0.34)` | `rgba(16,18,22,0.34)` | Detail `:107-108` |
| `--new-bg` | `rgba(235,208,138,0.22)` | `rgba(255,238,190,0.94)` | Tile `:106`, arbitrated above; Detail `:107-108` draws `0.2` |
| `--dock` | `rgba(12,13,17,0.94)` | `rgba(239,239,235,0.96)` | CatalogueMobile `:85-86` |

`cardBg` becomes `--well` because `CONTEXT.md` lists *card* on the avoid list for the catalogue
record, and ADR-0004 is the decision that code uses the glossary's names rather than its avoid
list. The other four keep the mock's word.

Twenty-seven variables in total, each declared in both `:root` and `.dark`.

### 3 — Surface every colour token in `tailwind.config.ts`

Under `theme.extend.colors`, add one key per variable whose value is `"var(--canvas)"` and so on —
**raw `var()`, not `hsl(var(...))`**. The thirteen shadcn tokens hold bare HSL channel triples and
are wrapped in `hsl()` at `tailwind.config.ts:27-38`; the Studio Dark tokens hold complete colours.
Mixing the two conventions is silent: `hsl(var(--canvas))` resolves to `hsl(#0A0B0D)`, which is
invalid, so the declaration is dropped and the element paints nothing.

The cost of raw `var()` is that Tailwind's opacity modifier does not work on these keys —
`bg-canvas/50` will not compile to anything useful. That is accepted rather than worked around,
because eleven of the twenty-seven tokens are already `rgba()` with baked alpha (`--line`,
`--line2`, `--acc-soft`, `--field`, `--filter-bar`, `--empty`, `--x-bg`, `--scrim`, `--skel`,
`--header`, `--ctrl`), and the channel-triple form cannot express them without splitting each into
a colour plus an alpha, which is twice the tokens to keep in step for a modifier the mock never
uses.

### 4 — Elevation

Three levels, `Specimen.dc.html:150-154`. Declare each as a variable in the same base block and
expose it as `theme.extend.boxShadow` keys `e0`, `e1`, `e2`.

`E0 · hairline only — chrome, paused tiles`

    dark   0 0 0 1px rgba(255,255,255,0.07)
    light  0 0 0 1px rgba(16,18,22,0.10)

`E2 · overlay — detail over the catalogue`

    dark   0 40px 120px -30px rgba(0,0,0,0.9)
    light  0 40px 100px -30px rgba(16,18,22,0.45)

`E1 · emission — a playing tile, tinted by its own recording` is not a constant. The Specimen draws
it at a fixed hue 290 as an illustration (`:152`), but `Tile.dc.html:83-85` computes it from the
Recording's own hue, and spec decision 8 makes that hue a real measurement taken from the Poster.
The Specimen's illustration and the Tile's formula differ slightly — `hsla(290,60%,62%,0.26)` and
`hsla(290,70%,58%,0.45)` against the Tile's `60%` and `55%` lightness at `0.24` and `0.45` alpha —
and **the Tile's numbers win here**, because the Tile is the only place E1 is drawn against a real
Recording and the Specimen's swatch has no Recording to be tinted by.

So declare `--tile-hue: 175` in `:root` only (it is not mode-dependent; 175 is the Tile's own
fallback at `Tile.dc.html:75`, and it is the accent's hue, so an unmeasured Recording glows the
site's own green rather than an arbitrary colour), and:

    dark   --e1: 0 0 0 1px hsla(var(--tile-hue),60%,60%,0.24),
                 0 22px 60px -20px hsla(var(--tile-hue),70%,55%,0.45);
    light  --e1: 0 0 0 1px rgba(16,18,22,0.10),
                 0 20px 44px -22px hsla(var(--tile-hue),55%,40%,0.55);

Ticket 07 sets `--tile-hue` per tile from the `hue` field ticket 03 writes. Note for whoever picks
up 07 and should not treat it as a drift: the Tile's paused shadow in **light** mode carries a
second layer the Specimen's E0 does not, `0 8px 20px -16px rgba(8,10,14,0.5)`
(`Tile.dc.html:87-88`). That belongs to the tile, not to E0, and 07 adds it there.

### 5 — Radius

Four steps, `Specimen.dc.html:146-149`, added to `theme.extend.borderRadius` as new keys.
`rounded-lg`/`md`/`sm` and `--radius` are left exactly as they are, for the reason in the Problem
section: they dress `components/ui/`.

| key | px | the Specimen's label |
|---|---|---|
| `tile` | 16 | `16 — media tile` |
| `panel` | 12 | `12 — panel, sheet row` |
| `chip` | 9 | `9 — chip, control` |
| `badge` | 6 | `6 — badge, tag` |

### 6 — Spacing: change nothing, and record why

`Specimen.dc.html:155-159` gives seven steps on a 4px base: 4 (icon gap), 8 (control gap), 12 (card
meta), 16 (mobile gutter), 24 (grid column gap), 28 (grid row gap), 40 (detail columns). Tailwind's
default spacing scale is already 4px-based and contains every one of them — `1`=4, `2`=8, `3`=12,
`4`=16, `6`=24, `7`=28, `10`=40. Add no `spacing` key. Put the mapping in a comment in
`tailwind.config.ts` next to the other extends, so the next reader does not add a redundant scale
and end up with two names for 28px.

### 7 — Motion tokens, and one reduced-motion rule

The Specimen's six moments (`:160-167`) are applied by tickets 07, 08, 09 and 11 and verified by
ticket 13, but the values are config and belong here or they will be typed inline five times.

Add to `theme.extend.transitionDuration`: `120`, `160`, `220`, `240`, `260`. Add to
`theme.extend.transitionTimingFunction`: `rise: "cubic-bezier(.2,.8,.2,1)"` — the curve the
Specimen gives for both the playing-tile glow (220ms) and the overlay's scrim-plus-8px-rise
(240ms). `linear`, `ease-out` and `ease-in`, which cover the other three, are CSS keywords Tailwind
already ships. The bottom sheet's *"260ms spring, no overshoot"* is a framer-motion spring, not a
CSS transition; the 260 duration key exists for the non-spring parts and ticket 11 owns the spring.

Then, in `app/globals.css`, one `@media (prefers-reduced-motion: reduce)` rule that zeroes the
durations. `app/providers.tsx` already answers reduced motion once for framer-motion with
`MotionConfig reducedMotion="user"`, but that config does not reach a CSS transition, so CSS needs
its own answer or the Specimen's *"all durations 0ms"* (`Specimen.dc.html:95`) is only half true.
This must not touch `components/demo-tile.tsx:31,151`, where `ui-ux-overhaul` ticket 09 already
ships the harder half of that rule — no `<video>` element is mounted at all under reduced motion —
and `spec.md` says reduced motion needs preservation, not a new rule.

### 8 — The fonts, in `app/layout.tsx`

Import both from `next/font/google`, at module scope:

    import { JetBrains_Mono, Space_Grotesk } from "next/font/google"

    const grotesk = Space_Grotesk({
      subsets: ["latin"],
      display: "swap",
      adjustFontFallback: true,
      variable: "--font-grotesk",
    })

    const jetbrains = JetBrains_Mono({
      subsets: ["latin"],
      display: "swap",
      adjustFontFallback: true,
      variable: "--font-jetbrains",
    })

No `weight` key. Omitting it requests the variable font, one file per family covering Space
Grotesk's `wght` 300-700 and JetBrains Mono's `wght` 100-800, rather than five static instances for
the five weights the design uses. `display: "swap"` and `adjustFontFallback: true` are both
`next/font`'s defaults; write them anyway, because `adjustFontFallback` — which synthesises a
metric-matched fallback face so the swap moves no pixel — is the entire reason spec decision 4 lets
two webfonts into a site with a 0.549 field CLS, and an invisible default is one someone deletes as
noise.

Then change `app/layout.tsx:39` from `<html lang="en" className="font-sans" …>` to carry both
variables:

    <html lang="en" className={`${grotesk.variable} ${jetbrains.variable} font-sans`} …>

Add no `preconnect`. `Catalogue.dc.html:10` and `rnui Studio Dark.dc.html:10` both open with
`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` followed by a
`fonts.googleapis.com/css2?family=Space+Grotesk…` stylesheet; that is how a standalone HTML mock has
to do it. `next/font/google` downloads the files at build time and serves them from the app's own
origin, so there is no third-party hop to warm. The only `preconnect` on the page stays the CDN one
at `:42-47`, which exists for Demos and Posters — and note for the glossary's sake that a webfont is
not an Asset: ADR-0001 puts Demos and Posters in object storage, ADR-0003 makes their paths
immutable, and neither applies to build output.

Leave `app/opengraph-image.tsx:21` (`fontFamily: "system-ui, sans-serif"`) alone. That is Satori
rendering an image on the server; it cannot read a CSS variable, and giving the OG image a real
typeface is its own piece of work with its own byte cost.

### 9 — The type scale, in `tailwind.config.ts`

Seven steps, `Specimen.dc.html:137-145`. Set `theme.extend.fontFamily` first —
`sans: ["var(--font-grotesk)", ...defaultTheme.fontFamily.sans]` and
`mono: ["var(--font-jetbrains)", ...defaultTheme.fontFamily.mono]` — which is the line the comment
at `tailwind.config.ts:22-25` says does not exist; replace that comment with one that says what the
key now does and why the variable name must match `app/layout.tsx`.

Then add each step as a `theme.extend.fontSize` tuple carrying its own weight, tracking and
leading, so `text-hero` is one class that cannot drift from the specimen:

| key | px | weight | letter-spacing | family | the Specimen's label |
|---|---|---|---|---|---|
| `detail` | 36 | 500 | `-0.025em` | Space Grotesk | `36 / 500 / -2.5% · detail title` |
| `hero` | 29 | 500 | `-0.02em` | Space Grotesk | `29 / 500 / -2% · hero` |
| `section` | 17 | 500 | `-0.01em` | Space Grotesk | `17 / 500 · section head` |
| `tile-title` | 14.5 | 500 | `-0.01em` | Space Grotesk | `14.5 / 500 · card title` |
| `body-sm` | 12 | 400 | `0` | Space Grotesk | `12 / 400 · contributor, body-sm` |
| `metric` | 10 | 400 | `0` | JetBrains Mono | `mono 10 · metrics, tabular` |
| `label` | 9 | 500 | `0.14em` | JetBrains Mono | `mono 9 / +14% · labels` |

`card title` becomes `tile-title` for the same ADR-0004 reason as `--well`. The two mono steps do
not set a family in the tuple — Tailwind's `fontSize` cannot — so they are written with `font-mono`
alongside; say so in the comment. `metric` is the one that carries view counts, and the Specimen
says *tabular*: give it `font-variant-numeric: tabular-nums` via the `tabular-nums` utility at the
call site, or the count jitters when it changes.

Line height: all seven specimen samples are drawn at `line-height:1.1` (`Specimen.dc.html:40`), so
bake `1.1` into every tuple. Multi-line prose in the same mock is drawn at `1.5` (`:32`,
`font-size:11.5px;line-height:1.5`), so a paragraph overrides with `leading-[1.5]` — that is the
surface tickets' business, not a step here.

The mocks draw twenty-one distinct font sizes, and two of them are off this scale often: 9.5px
appears 43 times and 12.5px 32 times across the six files. They are not being folded in. Spec
decision 2 says the mock ships as drawn, so a surface ticket that meets one writes the drawn value;
if a real component repeats one more than a handful of times, that ticket names it then. Snapping
12.5 to 12 to tidy the scale would be a redesign nobody reviewed.

### 10 — Repoint the page background

`app/globals.css:75` becomes `@apply bg-canvas text-t1;` — the hardcoded `bg-[#FAFAFA]` and the
`dark:bg-background` pair both go, because `--canvas` already answers both modes. Leave the
tap-highlight and font-smoothing declarations at `:77-82` untouched.

### 11 — Pin the tokens with a test, not with a Specimen route

Add `tests/design-tokens.test.ts`. Three assertions:

1. Read `app/globals.css` as text, parse the Studio Dark `:root` and `.dark` blocks, and compare
   against a table of all twenty-seven values in both modes **written out by hand in the test
   file**. This is ADR-0005's arrangement, deliberately: a test that imports its expectation from
   the thing under test can no longer catch that thing being wrong. Two statements of one rule
   read as an oversight, so carry the same pointer comment `tests/data-integrity.test.ts` carries.
2. Import `tailwind.config.ts` and assert set equality in both directions between the variables
   declared in `globals.css` and the keys under `theme.extend.colors` that reference them. A token
   declared and never surfaced is dead CSS; a Tailwind key pointing at an undeclared variable
   compiles to a rule that paints nothing and warns about nothing.
3. Assert that the two font variable names in `theme.extend.fontFamily` are the same two strings
   passed as `variable:` in `app/layout.tsx`. This is the exact break that made Haskoy invisible
   for however long it shipped — `@font-face` emitted `fontSans`, `tailwind.config.ts` asked for
   `Haskoy`, and nothing failed, it just rendered in system-ui
   (`.scratch/ui-ux-overhaul/issues/05-delete-dead-weight.md:24-40`). A test is the only thing that
   would have caught it.

A `/specimen` route was the alternative and is rejected. It is a public URL that needs its own
markup, its own `next-sitemap` exclusion and its own upkeep; it proves nothing this test does not;
and a drifted value on a page nobody opens is silent, whereas the same drift in `pnpm test` stops
CI. `tests/e2e/theme.spec.ts` already covers what a rendered check is for — the class on `<html>`
and the resolved mode — and ticket 13 can extend it if a rendered assertion is wanted.

### 12 — Measure, then run the checks

This is the only commit in the whole effort where the typeface changes and nothing else does, so it
is the only point at which a font-only LCP delta is attributable. Measure before and after on the
same machine: Lighthouse 12 against a production build of `/` and `/products`, mobile and desktop,
five runs each, recording the median **and the spread** of LCP, CLS, FCP and total transferred
bytes. Also record `ls -l .next/static/media/*.woff2` before and after — the number was 172KB for
one dead Haskoy face, and this ticket adds two live families.

Then `pnpm check-types && pnpm lint && pnpm test && pnpm build`, and the Playwright suite.

## Acceptance

- All twenty-seven custom properties are declared in both `:root` and `.dark` in
  `app/globals.css`, with the exact values in the three tables above.
- `git diff` shows no change to `app/globals.css:6-66` or to the `borderRadius` block at
  `tailwind.config.ts:96-100`. `--radius` is still `0.5rem` and `rounded-lg` is still 8px.
- `tests/design-tokens.test.ts` passes, and changing one hex character in `app/globals.css`
  makes it fail. Demonstrate that by doing it, then reverting.
- Deleting one key from `theme.extend.colors`, or renaming one `--font-*` variable in
  `app/layout.tsx` without renaming it in `tailwind.config.ts`, also makes it fail.
- A built stylesheet contains a rule for each of `bg-canvas`, `text-t1`, `text-t3`, `text-acc`,
  `border-line`, `bg-plinth`, `rounded-tile`, `shadow-e2`, `text-hero`, `text-label`,
  `duration-160` and `ease-rise`, and each resolves to the value in the tables above.
- Built `.font-sans` begins `font-family:var(--font-grotesk)` and `.font-mono` begins
  `font-family:var(--font-jetbrains)`.
- On a running production build, `getComputedStyle(document.body).fontFamily` resolves to the
  emitted Space Grotesk family, and a `<span class="font-mono">` resolves to the emitted JetBrains
  Mono family — not to `ui-sans-serif`/`ui-monospace`. Both modes, `/` and `/products`.
- A fresh build emits woff2 files for exactly two families under `.next/static/media/`, and
  `next-font-manifest.json` lists both. The byte total is written into `## Comments`.
- The emitted CSS contains a fallback `@font-face` per family carrying `size-adjust`,
  `ascent-override`, `descent-override` and `line-gap-override` — the observable artefact of
  `adjustFontFallback`. If those declarations are absent, the CLS argument for admitting two
  webfonts has not been met.
- `grep -r "fonts.gstatic.com\|fonts.googleapis.com" .next/` over the build output returns nothing,
  and `app/layout.tsx` has gained no `<link rel="preconnect">`.
- Under `prefers-reduced-motion: reduce`, every element using a `duration-*` utility from the five
  new keys computes `transition-duration: 0s`. `components/demo-tile.tsx` is unmodified.
- **Lighthouse, five runs, median and spread, before and after, on `/` and `/products`, mobile and
  desktop, all written into `## Comments`.** If the median mobile LCP delta exceeds the spread of
  the five runs, stop: set `ready-for-human` and hand the numbers to the maintainer rather than
  resolving. Field LCP p75 is already 4,515ms mobile — past the 4,000ms boundary of Google's poor
  band, not merely above the 2,500ms good one — and spec
  decision 4 admits these fonts on the condition that LCP is measured, not assumed.
- Lab CLS on the same runs does not rise.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and `pnpm build` all pass, and the Playwright suite
  passes — `tests/e2e/theme.spec.ts` in particular, since it reads the class on `<html>` that this
  ticket's tokens now hang from.
- **No colour moves.** No component consumes a colour token yet, so on a running production build
  `getComputedStyle` returns the same `color` and `background-color` before and after this commit
  for `document.body`, for `main` and for one tile — both modes, `/` and `/products`. Every glyph
  does change typeface, so wraps and block heights move by construction; that is this commit
  working, and the lab CLS bullet above is what bounds it.

## Depends on

**01, on vocabulary rather than on code.** `grep -niE "entry|entries|author"` over
`app/globals.css` and `tailwind.config.ts` returns nothing, so neither file needs renaming and this
ticket could technically land first. It is blocked anyway because `spec.md`'s sequence puts the
rename before any file this effort touches, and because ADR-0004 rejected exactly this shape of
overlap in its second considered option — "to avoid a period in which half the codebase speaks each
vocabulary". This ticket's test file, its comments and the `tile-title` and `--well` names are all
written in the post-rename vocabulary; landing them first would create that period on purpose.

Nothing else blocks it. Everything downstream depends on it: tickets 04, 05, 06, 07, 08, 09, 10,
11 and 12 each render a surface out of these tokens, and 13 verifies contrast, reduced motion and
performance against them. `spec.md`'s ticket table annotates only 07 as needing 02, which
understates it — 02 is a prerequisite of every surface ticket in the effort, and any of them
starting before it lands will hardcode hex codes that then have to be unpicked.

## Open questions

1. **`--well`, `--filter-bar` and `--empty` are pairwise equal in one mode each.** `--well` and
   `--filter-bar` are both `rgba(255,255,255,0.03)` dark; `--well` and `--empty` are both `#FBFBF9`
   light. Merging any pair changes the other mode, so all three stay. Flagged so that a later tidy
   does not merge them on the strength of one column.
2. **The dark link hover `#9BEEDD` is drawn once, and only in a mock's page chrome.**
   `rnui Studio Dark.dc.html:10` sets `a{color:#6FE3CC}a:hover{color:#9BEEDD}` in the composite's
   own inline stylesheet. No light-mode hover is drawn anywhere. Not declared here rather than
   invent the light half; ticket 04 owns links and can name it if it needs one.

## Comments

### 2026-08-02 — Built. All checks pass except the LCP bullet, which the acceptance's own stop condition fires on. `ready-for-human`.

Everything in Work steps 1-11 is done and verified. Step 12's checks all pass. The one acceptance
bullet that cannot resolve is the font LCP measurement: **the median mobile LCP delta exceeds the
spread of the five runs, so per the acceptance this is `ready-for-human`, not `resolved`.** The
numbers are below, all written from Lighthouse 12 on a production build of this repo, five runs
per cell, median and spread, same machine and Chrome throughout.

**What the commit is.** The 27 palette tokens in both modes plus `--tile-hue`/`--e0`/`--e1`/`--e2`
in `app/globals.css` (new `@layer base` block after the shadcn one; lines 6-66 untouched), the
reduced-motion zero-duration rule, all tokens surfaced as raw-`var()` `theme.extend.colors` keys,
`boxShadow` e0/e1/e2, the four radii, the seven-step type scale, the five `duration-*` keys and
`ease-rise`, the two `next/font/google` families self-hosted in `app/layout.tsx`, and the body
repoint to `bg-canvas text-t1`. The `borderRadius` lg/md/sm block and `--radius` are byte-identical.

**Tests.** `tests/design-tokens.test.ts` (8 cases) pins all 27 values in both modes by hand, both
directions between `globals.css` and `theme.extend.colors`, and the `--font-*` names against
`app/layout.tsx`. Each mutation the acceptance asks to demonstrate fails as designed and was
reverted: one hex changed (`#F4F4F1`→`#F4F4F0`), one colors key deleted, one font variable renamed
in one file only. `pnpm check-types`, `pnpm test` (192/192), `pnpm lint` (0 errors, 8 pre-existing
warnings in files this ticket does not touch), `pnpm build`, and Playwright **119/119** all pass.

**The font build.** No `.woff2` files before (0 bytes — the dead Haskoy face is gone and nothing
replaced it until now). After: **9 files, 134,336 bytes (~131KB)** under `.next/static/media/`, two
families (Space Grotesk 3 files, JetBrains Mono 6 — per-unicode-range latin subsets). Per page the
two preloaded faces are `0c89a48…woff2` (22,320 B) + `70bc3e1…woff2` (40,480 B) = 62,800 B
(~61KB), both listed in `next-font-manifest.json`. The emitted CSS has a `Space Grotesk Fallback`
and `JetBrains Mono Fallback` `@font-face` per family carrying `size-adjust`/`ascent-override`/
`descent-override`/`line-gap-override` — the observable artefact of `adjustFontFallback`. On a
running production build, `getComputedStyle(document.body).fontFamily` resolves to
`"Space Grotesk", "Space Grotesk Fallback", …` and `var(--font-jetbrains)` resolves to
`"JetBrains Mono", "JetBrains Mono Fallback"`, on `/` and `/products`, both modes. `grep
"fonts.gstatic.com\|fonts.googleapis.com" .next/` returns only the two pre-existing matches in the
`@vercel_og` edge chunk (Satori's OG-image runtime, present before this ticket, byte-identical
after); `app/layout.tsx` gained no preconnect. Under `prefers-reduced-motion: reduce` the built
CSS zeroes every transition and animation duration; `components/demo-tile.tsx` is unmodified.

**The LCP measurement — why this is ready-for-human.**

| cell | before median | after median | Δ median | before spread | after spread | CLS |
|---|---|---|---|---|---|---|
| home mobile | LCP 3,718ms | 4,076ms | **+358ms** | 3.65–5.29s | 3.94–4.11s | 0 → 0 |
| products mobile | LCP 3,320ms | 3,635ms | **+315ms** | 3.18–3.33s | 2.79–3.73s | 0 → 0 |
| home desktop | LCP 780ms | 867ms | +87ms | 0.76–0.80s | 0.73–0.90s | 0 → 0 |
| products desktop | LCP 713ms | 852ms | +139ms | 0.71–0.73s | 0.74–0.92s | 0 → 0 |

FCP barely moved (917→915, 922→935ms); total transferred bytes rose 624→688KB (home mobile) and
550→614KB (products mobile). A second five-run mobile session confirms the new medians are stable:
home 4,029ms, products 3,706ms. The per-run mobile clusters are tight and non-overlapping
(before ≈3.65–3.83s, after ≈3.94–4.11s), so the rise is a real font effect, not session noise: the
two preloaded woff2s sit on the throttled mobile connection before the poster fetches start. The
acceptance's stop condition — *"the median mobile LCP delta exceeds the spread of the five runs"* —
fires on home mobile (358ms > 170ms after-spread), so this is handed to the maintainer rather than
resolved. Field LCP p75 was already 4,515ms mobile (Google's poor band), so the question is whether
+~330ms median on the lab mobile build is a price spec decision 4 is willing to pay, and whether a
per-route `preload={false}` or dropping the mono face from first paint would buy it back. **What is
left: the maintainer reads the two numbers above and says ship or trim.** Everything else in the
acceptance is met.

**Two acceptance bullets met with a caveat, recorded here rather than silently.**

1. *"No colour moves."* The bullet as written contradicts step 10: step 10 repoints `body` to
   `bg-canvas text-t1`, so `getComputedStyle(document.body)` necessarily changes — light
   `rgb(250,250,250)`→`rgb(244,244,241)`, dark `rgb(10,10,10)`→`rgb(10,11,13)`. Its intent (no
   component consumes a token yet) holds: no component does. `main`'s background is
   `rgba(0,0,0,0)` before and after; main and a tile have no colour declaration of their own, so
   their computed color inherits body and moves with it. Body is the one deliberate exception and
   is step 10's own point. Flagged rather than "met".
2. *"A built stylesheet contains a rule for each of `bg-canvas` … `ease-rise`"* (and the
   `.font-mono` half of the next bullet). Tailwind tree-shakes classes no component uses, and none
   of these is used yet — tickets 04-12 are what consume them. Verified instead with a standalone
   Tailwind compile of exactly those classes against this `tailwind.config.ts`: every one resolves
   to the token value (`bg-canvas`→`var(--canvas)`, `text-hero`→29px/1.1/-0.02em/500,
   `duration-160`→160ms, `ease-rise`→`cubic-bezier(.2,.8,.2,1)`, `shadow-e2`→`var(--e2)`, etc.).
   The values cannot be dead-wrong and dead-CSS simultaneously; the site build only proves it once
   a surface uses them.

**One test updated in scope.** `tests/e2e/theme.spec.ts` hardcoded the old dark body
`rgb(10,10,10)`; step 10 makes it `rgb(10,11,13)`. Updated with a comment pointing at `--canvas`.
The acceptance names this file explicitly.

**Two file sets intentionally not in this commit.** `tests/e2e/theme.spec.ts` is the only test
change. The regenerated `public/sitemap-0.xml` (which had gone stale with pre-rename `/entry/`
URLs and new timestamps, produced by this ticket's own `pnpm build`) lands as a separate chore
commit so the token commit stays reviewable.

### 2026-08-05 — The font cost, now measured against everything else that moved.

This ticket was handed back with *"the maintainer reads the two numbers above and says ship or
trim"*, the numbers being +358ms home-mobile LCP and 624→688KB from the font commit alone. A full
before/after against deploy A's SHA `76651a3` has since been run (`checkpoint-13-gate.md`, *Load
metrics (step 10)*), and it puts those numbers in proportion.

On mobile `/products`, total transferred bytes go 551KB → 1,094KB across the whole effort. The
breakdown, one Lighthouse run per arm:

| Resource | before | after | delta |
|---|---|---|---|
| Media (Demo video) | 1 req / 35KB | 4 reqs / 413KB | +378KB |
| Image (Posters) | 5 reqs / 24KB | 16 reqs / 122KB | +98KB |
| Font | 0 | 2 reqs / 62KB | +62KB |
| Script | 22 reqs / 425KB | 23 reqs / 423KB | −2KB |

**The two webfonts are the smallest of the three additions**, and `Script` did not grow at all.
That does not retire this ticket's stop condition — the fonts do sit on the throttled mobile
connection ahead of the poster fetches, which is the mechanism recorded on 2026-08-02 — but it
does change what "trim" would buy: dropping the mono face from first paint recovers at most a
fraction of 62KB, where the media path is 476KB. If the decision is about mobile LCP rather than
about typography, the lever is elsewhere.

`Status` unchanged. The decision this ticket is waiting on is still the maintainer's, and it is
now better informed rather than answered.
