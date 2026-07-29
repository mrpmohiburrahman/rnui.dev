# rnui.dev Redesign — Design Brief & Claude Prompts

## Overview

rnui.dev is a curated directory of React Native UI animations and components, currently presented in a clean but generic 5-column white grid. The site has strong content (community-made portrait video demos) but weak visual identity. Below are three opinionated redesign concepts — each engineered to give the site a distinct personality while preserving the core jobs-to-be-done: **discover, filter, preview, vote, and visit source**. Three production-ready Claude Design prompts follow, each detailed enough for a non-designer to paste-and-ship.

---

## Concept A: Dark Craft

**Vibe:** A premium, late-night developer tool — the React Native equivalent of Linear, Raycast, and Vercel's design language fused into a gallery experience.

### 1. Color Palette
| Role | Hex | Notes |
|---|---|---|
| Background (base) | `#0A0A0B` | Near-black with a 1% blue tilt |
| Surface (card) | `#111114` | Raised one step |
| Surface elevated (hover) | `#17171B` | Two steps up |
| Border (subtle) | `#1F1F23` | Hairline 1px |
| Primary text | `#F5F5F7` | Off-white, not pure |
| Secondary text | `#8A8A93` | Metadata, captions |
| Accent (electric) | `#7C5CFF` | Iris violet — votes, links, focus rings |
| Highlight (signal) | `#D4FF4F` | Lime — "New" badge, top voted indicator |
| Danger/heart | `#FF5C7A` | Bookmark active |

### 2. Typography
- **Headings:** `Geist` (or `Inter Display` fallback) — tight tracking `-0.02em`, weight 600
- **Body/UI:** `Geist` regular, weight 400-500
- **Mono accents:** `Geist Mono` for category counts, view numbers ("12.4K"), and code-like flourishes
- Hierarchy: H1 32/40, H2 20/28, card title 15/20, metadata 12/16

### 3. Layout Changes
- **Top bar:** Slim 56px sticky header with logo wordmark `rnui`, command-K search trigger (`⌘K` chip on the right), GitHub stars badge, theme toggle, "Submit" CTA pill
- **Sidebar:** 240px fixed left, two collapsible sections — **Categories** (with live count badges in mono font) and **Authors** (avatar + handle list, scrollable). Active category gets a left-edge 2px violet bar and `#17171B` background
- **Main:** 5-column desktop grid → 4 at 1280 → 3 at 1024 → 2 at 768 → 1 at mobile. Sort tabs become **segmented control** at top right ("Recent · Viewed · Voted")
- **Hero strip removed**; replaced by a one-line greeting `"812 animations · curated by the community"` above the grid

### 4. Card Redesign
Cards become **polished phone mockups**:
- 9:16 aspect, 14px rounded corners (mimics iOS device radius)
- 1px inner border `rgba(255,255,255,0.06)` + outer shadow `0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.4)`
- Video autoplays muted on hover; static thumbnail otherwise
- **Top-left overlay:** category pill (frosted, `backdrop-blur-md`, 11px mono uppercase)
- **Top-right overlay:** bookmark icon button (outline → fills `#FF5C7A` on tap)
- **Bottom gradient overlay** (40% height, black→transparent) holding: author avatar + handle (12px), component caption (15px semibold), and right-aligned metadata row `↑ 142  ·  ▶ 12.4K`
- Below card (outside frame): three tiny social icons (X, LinkedIn, GitHub) that appear only on card hover

### 5. Signature Visual Element
**The Aurora Spotlight.** A single soft radial gradient (`#7C5CFF` at 8% opacity, 800px radius) follows the cursor across the grid background — only visible on dark mode, only on desktop. Combined with a barely-perceptible SVG noise texture (`opacity: 0.03`) over the entire background. Cards "lift" out of this dim atmosphere.

### 6. Animation Philosophy
- Spring-based, 200-300ms, `cubic-bezier(0.32, 0.72, 0, 1)` (Raycast's curve)
- Card hover: `translateY(-2px)` + shadow deepens + border brightens to `rgba(255,255,255,0.12)`
- Video fades in over thumbnail (200ms opacity)
- Category click: layout shift uses `view-transition-name` for crossfade
- `⌘K` opens a centered command palette with blurred backdrop

### 7. Who It Appeals To
Senior React Native engineers, design-conscious indie devs, anyone who keeps Linear and Raycast open all day. The "I want my tools to feel like luxury goods" crowd.

---

## Concept B: Warm Editorial

**Vibe:** A printed design annual you can scroll — Kinfolk meets Resend docs meets Panda CSS. Confident typography, generous whitespace, slow rhythm.

### 1. Color Palette
| Role | Hex | Notes |
|---|---|---|
| Background | `#F7F3EC` | Warm bone / off-white |
| Surface (card frame) | `#FFFFFF` | Pure white pops against bone |
| Ink (primary text) | `#1A1714` | Near-black with brown undertone |
| Secondary text | `#6B655C` | Warm gray |
| Accent (sepia) | `#C2410C` | Burnt orange / terracotta |
| Highlight | `#1A1714` | Inverted — black pills on bone |
| Border | `#E8E1D5` | Soft sand |

### 2. Typography
- **Display headings:** `Fraunces` (variable, optical size 144, weight 500, slight slant) — for hero number "812", section labels
- **UI/body:** `Inter Tight` weight 400-500, generous line-height 1.6
- **Caption italics:** `Fraunces` italic for component author bylines ("by @nandorojo")
- Hierarchy: hero numeral 96px, H1 48/56 serif, card title 17/24 sans, byline 14/20 italic serif

### 3. Layout Changes
- **Masthead:** 80px tall, three-zone — left `rnui.dev` wordmark in serif, center horizontal scrolling category nav (no sidebar!), right search + theme + submit
- **No sidebar.** Categories live in a **sticky horizontal pill rail** below the masthead, scrollable on overflow. Author filter becomes a dropdown menu
- **Sort tabs** become italic serif text links separated by `·` dots: *Recent · Top Viewed · Top Voted*
- **Hero strip:** Large editorial line — `Eight hundred twelve animations.` (serif, 72px, with a small `Curated by 200+ React Native builders` underneath)
- **Grid:** Asymmetric **masonry** — 4 columns desktop, but every 6th card spans 2 columns (a "featured" treatment with bigger caption). 3 cols at 1024, 2 at 768, 1 at mobile

### 4. Card Redesign
Cards feel like **magazine plates**:
- White frame, 4px solid white border, 4px radius (subtle, almost square)
- Drop shadow only on hover: `0 12px 32px rgba(26, 23, 20, 0.08)`
- Video/thumbnail inside the frame, no overlays on the media itself (clean!)
- **Below the media** (this is the key move): a 64px text block with —
  - Component caption in 17px sans semibold ink
  - "*by* @author" in italic serif underneath
  - Bottom row: category in 11px uppercase tracked-out sans + dot + view count + dot + vote count (all in secondary warm gray)
- **Bookmark** appears as a small serif star `✦` top-right of the text block (not on the video)
- **"New" badge:** a thin terracotta underline beneath the caption — no boxy badge

### 5. Signature Visual Element
**The Drop Cap Number.** Every section header (and the hero) leads with an oversized `Fraunces` numeral — the count of items in that category — set 96-144px, hanging into the left margin like a magazine drop cap. Combined with a single hairline `1px solid #E8E1D5` rule between sections. This treatment alone makes the site feel like it was art-directed.

### 6. Animation Philosophy
- Slow, easing-out, 400-500ms — feels like turning a page
- No bounce, no spring. Pure `ease-out`
- Cards fade and rise 8px on scroll-in (IntersectionObserver, staggered 40ms)
- Category pill click: ink fills the pill background with a 250ms left-to-right wipe
- Hover state on cards: shadow blooms, no transform

### 7. Who It Appeals To
Designers-who-code, founders building consumer apps, the Awwwards-submitting crowd, people who follow @rauchg and @steventey on Twitter. The "I want my portfolio to look like this" demographic.

---

## Concept C: Tactile Arcade

**Vibe:** A playful, candy-colored gallery that treats every card like a physical object on a soft pastel grid — Neubrutalism softened by neomorphic depth, with a touch of arcade-game energy. Think Are.na meets a Figma community page meets a Game Boy palette.

I chose this over neon/cyberpunk because the *content* (mobile animations) is itself playful and motion-heavy — a tactile, toy-like wrapper amplifies that energy without becoming a stunt. It's still grid-disciplined and scannable.

### 1. Color Palette
| Role | Hex | Notes |
|---|---|---|
| Background | `#EFEAE0` | Putty / cream paper |
| Surface | `#FFFDF8` | Slightly warmer white |
| Ink | `#191919` | Hard black |
| Accent primary | `#FF5A1F` | Hot tangerine |
| Accent secondary | `#3D5AFE` | Cobalt blue |
| Highlight | `#D8FF3C` | Acid lime (for "New") |
| Border | `#191919` | Hard 1.5px black borders everywhere |
| Dark mode bg | `#1B1A17` | Warm charcoal |
| Dark mode surface | `#252320` | |

### 2. Typography
- **Display:** `Space Grotesk` weight 700 — punchy, geometric, slightly weird
- **Body/UI:** `Space Grotesk` weight 400-500
- **Mono:** `JetBrains Mono` for numbers and category counts
- Hierarchy: H1 56/64 with `-0.03em` tracking, card title 16/22 weight 600, metadata 12/16 mono

### 3. Layout Changes
- **Top bar:** Chunky 72px with a thick `1.5px solid #191919` bottom border. Logo is a bold wordmark `rnui` with the `.dev` set in tangerine. Center: a single fat search bar (full-width, pill-shaped, black border, slight cobalt shadow offset `4px 4px 0 #3D5AFE`). Right: theme toggle as a flip-switch toy, "Submit" as a tangerine button with a 4px offset black shadow
- **Sidebar:** 260px, every category is a **chip with a hard black border and a 3px offset colored shadow** — colors rotate through tangerine, cobalt, lime, and a soft pink `#FFB3C7`. Active category inverts (black fill, white text, no shadow)
- **Sort tabs:** Three big toggle buttons styled like arcade keys — when pressed, they appear "depressed" (shadow disappears, translates 3px down/right)
- **Grid:** 5-column desktop, even spacing, but every card sits on a faintly different pastel "tile" background showing through a 8px gap — making the page feel like a board game

### 4. Card Redesign
Cards are **physical playing cards**:
- White surface, 12px rounded corners, **1.5px hard black border**, no soft shadow — instead a `6px 6px 0 0` offset shadow in either tangerine, cobalt, or lime (rotates per row for visual rhythm)
- Video sits inside with a 10px inner radius, separated from the card edge by an 8px white margin (gives it the "Polaroid" feel)
- Below the video, a chunky info block:
  - Category as a small black-bordered pill with a 2px offset shadow, top-left
  - Component caption in 16px Space Grotesk 600
  - Author row: tiny circular avatar with a black border + handle
  - Bottom row split: left = `▶ 12.4K` in mono, right = a big chunky **vote button** (heart icon + count in a pressable pill)
- **Hover:** card "presses in" — shadow offset reduces from 6px to 2px, card translates `3px 3px`, mimicking a button press

### 5. Signature Visual Element
**The Offset Shadow System.** Every interactive surface — cards, buttons, chips, search bar — uses solid-color offset shadows (no blur, no transparency). The whole site feels like it's made of laminated paper tiles you could pick up. Combined with a faint dotted-grid background (`radial-gradient` dots at 24px spacing, `#19191908`) it evokes graph paper / pegboard.

### 6. Animation Philosophy
- Snappy and physical, 150-200ms, `cubic-bezier(0.2, 0, 0, 1.2)` (slight overshoot)
- Buttons and cards always animate by *removing their shadow and translating into where it was* — a unified "press" gesture
- Vote button: tap triggers a particle burst of 3 tiny hearts that fly up and fade
- Category change: cards re-enter with a quick scale-from-0.95 + 80ms stagger
- Hover on card: video starts, card lifts slightly *away* from shadow (opposite of click)

### 7. Who It Appeals To
Indie hackers, app studio founders, the Tldraw/Excalidraw/Are.na crowd, designers who post on Cosmos, anyone whose Twitter pinned tweet involves shipping vibes. Younger, more playful, mobile-first builders.

---

## Master Prompt: Concept A — Dark Craft

```
ROLE
You are a senior product designer at a tier-1 dev-tools company (Linear/Vercel/Raycast caliber). Your output is a single, production-ready HTML + Tailwind CSS artifact representing the homepage of a website.

PROJECT
The site is rnui.dev — "Awesome React Native UI" — a community-curated directory of React Native UI animation and component demos. Users come here to: (1) browse a gallery of portrait video demos, (2) filter by category or author, (3) preview animations by hovering, (4) bookmark/vote favorites, and (5) click through to the GitHub source. The vibe must feel like a premium developer tool — confident, dark, technical, but warm enough to enjoy browsing.

CONCEPT: DARK CRAFT
A premium late-night developer-tool aesthetic — Linear's restraint, Raycast's tactility, Vercel's typographic discipline. Near-black backgrounds with subtle noise, iris-violet accents, and cards that feel like polished iOS device mockups.

DESIGN TOKENS (use exactly)
Colors:
- bg-base: #0A0A0B
- bg-surface: #111114
- bg-elevated: #17171B
- border-subtle: #1F1F23
- border-strong: rgba(255,255,255,0.12)
- text-primary: #F5F5F7
- text-secondary: #8A8A93
- accent-iris: #7C5CFF
- highlight-lime: #D4FF4F
- danger-heart: #FF5C7A

Typography:
- Font family (UI + headings): "Geist", "Inter", system-ui
- Font family (mono): "Geist Mono", ui-monospace
- Heading tracking: -0.02em
- H1: 32px / 40px / weight 600
- Card title: 15px / 20px / weight 600
- Metadata: 12px / 16px / weight 500
- Mono numerals for view/vote counts

Spacing & shape:
- Base unit: 4px
- Card radius: 14px (mimics iOS device corner)
- Button radius: 8px
- Pill radius: 999px
- Card border: 1px solid border-subtle
- Card shadow: 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.4)
- Card hover shadow: 0 1px 0 rgba(255,255,255,0.08), 0 16px 40px rgba(0,0,0,0.6)
- Hover transition: 200ms cubic-bezier(0.32, 0.72, 0, 1)

LAYOUT — BUILD THESE 5 SECTIONS

1) TOP NAV (sticky, height 56px, bg-base with 1px bottom border-subtle)
   - Left: wordmark "rnui" in 18px weight 700, followed by a tiny lime dot
   - Center-left: subtle nav links "Gallery · Authors · About" in 13px text-secondary
   - Right cluster (gap 12px):
     - Search trigger: a 240px pill button bg-surface, border-subtle, with magnifying-glass icon + placeholder "Search animations" + a "⌘K" chip on the right (mono, bg-elevated)
     - GitHub stars badge: github icon + "2.1k" in mono
     - Theme toggle (sun/moon icon button, 32x32)
     - "Submit" button: solid accent-iris bg, white text, 8px radius, weight 600

2) LEFT SIDEBAR (240px fixed, bg-base, 1px right border-subtle, scrollable)
   - Section label "CATEGORIES" — 11px mono uppercase, text-secondary, tracking 0.08em
   - 18 categories listed vertically: Accordions, Arc Sliders, Bottom Sheets, Buttons, Carousels, Charts, Circular Progress, Drop Down, Full Apps, Headers, List, Loaders, Misc, Onboarding, Parallaxes, Pickers, Sliders, Tab bars
   - Each row: 36px tall, padding-x 12px, hover bg-elevated, active state has a 2px left-edge iris bar + bg-elevated
   - Right-aligned count in mono text-secondary (e.g. "42")
   - Separator (1px border-subtle, 24px vertical margin)
   - Section label "AUTHORS" with avatar+handle list (8 visible, scroll for more)

3) MAIN CONTENT HEADER (above grid)
   - Row 1: "812 animations · curated by the community" in 14px text-secondary
   - Row 2: Segmented control on the right — three options "Recent · Viewed · Voted" — bg-surface pill, active option has bg-elevated + text-primary, inactive text-secondary

4) CARD GRID (5 cols desktop, gap-5)
   Each card uses these data fields: caption, demoPath, posterPath, author, source, category, twitterId, linkedInId, githubId, view_count, vote_count, isNew

   Card structure (aspect-ratio 9/16):
   - Outer wrapper: bg-surface, 14px radius, 1px border-subtle, card shadow
   - Inside (relative, full bleed): thumbnail image; on hover, autoplay muted video fades in over 200ms
   - Top-left absolute overlay: category pill — backdrop-blur-md bg-black/40, 11px mono uppercase, padding 6px 10px, radius 999px
   - Top-right absolute overlay: bookmark icon button (24x24, outline icon, fills #FF5C7A on toggle)
   - If isNew: small lime dot (8x8) on top-right corner of category pill
   - Bottom gradient overlay (40% height, linear-gradient transparent → rgba(0,0,0,0.85))
     - Inside the gradient, padding 14px:
       - Row 1: 20x20 circular avatar + "@author" in 12px text-primary weight 500
       - Row 2: caption in 15px weight 600 text-primary, truncate
       - Row 3 (flex justify-between, 12px mono):
         - Left: "↑ {vote_count}" in iris when > 100, else text-secondary
         - Right: "▶ {view_count}" formatted ("12.4K"), text-secondary
   - On card hover ONLY, render three tiny 16x16 social icons (X, LinkedIn, GitHub) at the BOTTOM EXTERIOR of the card, fade in

5) BACKGROUND ATMOSPHERE
   - Apply a fixed full-viewport SVG noise texture at opacity 0.03
   - On the main grid area, add an aurora spotlight: a radial-gradient div (800px x 800px, #7C5CFF at 8% center → transparent) that follows cursor position (use mousemove; only on desktop, only in dark mode)

RESPONSIVE
- 1280px+: 5 cols
- 1024-1279: 4 cols, sidebar still visible
- 768-1023: 3 cols, sidebar collapses to icon rail (48px)
- <768: 2 cols, sidebar becomes a hamburger-triggered sheet sliding from left with backdrop blur

INTERACTIONS
- Card hover: translateY(-2px), shadow deepens, border brightens to border-strong, video fades in, social icons appear below
- Button hover: brightness 1.1
- Sidebar row hover: bg-elevated
- Bookmark click: scale 0.85 → 1.15 → 1 spring; fills with danger-heart
- Vote click: number bumps up, brief lime flash on the arrow
- ⌘K: opens a centered command palette modal (bg-elevated, 16px radius, backdrop-blur on overlay)

DON'T FORGET
- Dark mode is the DEFAULT. Include a light mode toggle but design dark-first.
- "New" indicator on isNew items (lime dot on category pill)
- Bookmark icon top-right of every card
- Vote count uses ↑ arrow, view count uses ▶
- Social icons (X, LinkedIn, GitHub) — only show the ones the author has
- Sort tabs: Recent / Viewed / Voted as segmented control
- 18 category filter list with live counts
- Use Lucide icons throughout
- Use real placeholder content — author handles like @nandorojo, @mrousavy, @catalinmiron, captions like "Liquid swipe carousel", "Animated bottom sheet", "Spotify-style header parallax"

OUTPUT
A single self-contained HTML file using Tailwind via CDN, Geist font via Google Fonts, Lucide icons via CDN. Render at least 15 sample cards. The result should look like a real shipped product, not a wireframe.
```

---

## Master Prompt: Concept B — Warm Editorial

```
ROLE
You are an award-winning editorial designer who recently joined a top dev-tools company. You design like Pentagram meets Vercel. Your output is a single production-ready HTML + Tailwind CSS artifact.

PROJECT
The site is rnui.dev — a curated directory of React Native UI animation and component demos contributed by the community. Users browse portrait video demos, filter by category, bookmark/vote favorites, and click through to GitHub source. This redesign must feel like a beautifully art-directed annual — a print magazine you can scroll. Calm, confident, typographically driven.

CONCEPT: WARM EDITORIAL
Warm off-white "bone" backgrounds, serif/sans pairing, asymmetric masonry grid, magazine-style drop-cap numerals, generous whitespace, slow ease-out animation. References: Resend.com, Panda CSS docs, Linear's blog, and a print design annual.

DESIGN TOKENS (use exactly)
Colors:
- bg-bone: #F7F3EC
- surface-white: #FFFFFF
- ink: #1A1714
- ink-soft: #6B655C
- accent-sepia: #C2410C
- border-sand: #E8E1D5
- (dark mode equivalents: bg #15110C, surface #1F1A12, ink #F2EBDD, accent same)

Typography:
- Display (headings, numerals, italic captions): "Fraunces", serif — variable, opsz auto
- UI/body: "Inter Tight", sans-serif
- Hero numeral: 96px / weight 500 / opsz 144 / Fraunces
- H1: 48px / 56px / weight 500 / Fraunces / tracking -0.01em
- Section label: 11px / uppercase / Inter Tight / tracking 0.12em / ink-soft
- Card title: 17px / 24px / Inter Tight / weight 600 / ink
- Byline: 14px / 20px / Fraunces / italic / ink-soft (prefix "by ")
- Metadata: 12px / 16px / Inter Tight / weight 500 / ink-soft

Spacing & shape:
- Card radius: 4px (subtle, near-square)
- Button radius: 999px (full pills) OR 4px (rect buttons)
- Card inner padding (text block): 20px
- Card frame border: none; instead use 4px solid white padding around media
- Shadow on hover only: 0 12px 32px rgba(26, 23, 20, 0.08)
- Hairline rule: 1px solid border-sand for section dividers
- Animation: 400ms ease-out (no bounce, no spring)

LAYOUT — BUILD THESE 5 SECTIONS

1) MASTHEAD (top, height 80px, bg-bone, 1px bottom border-sand)
   - Three-zone: 
     - Left: wordmark "rnui.dev" in Fraunces 24px weight 500, the ".dev" in sepia
     - Center: HIDDEN on desktop (categories live below)
     - Right: search icon button → expands to full input on click; theme toggle (sun/moon as serif glyph); "Submit" pill button (ink bg, bg-bone text, 999px radius)

2) HORIZONTAL CATEGORY RAIL (sticky below masthead, height 56px, bg-bone, 1px bottom border-sand)
   - Horizontally scrollable row of category pills with overflow indicator
   - Each pill: 36px tall, padding-x 16px, radius 999px, 1px border-sand, ink text 13px weight 500
   - Active pill: ink background, bg-bone text, no border
   - Hover: pill ink fills left-to-right via a ::before pseudo-element, 250ms ease-out
   - 18 categories: Accordions, Arc Sliders, Bottom Sheets, Buttons, Carousels, Charts, Circular Progress, Drop Down, Full Apps, Headers, List, Loaders, Misc, Onboarding, Parallaxes, Pickers, Sliders, Tab bars
   - First pill is "All" with count

3) HERO STRIP (max-width 1280px, mx-auto, padding-y 96px)
   - Big editorial line: "Eight hundred twelve animations." in Fraunces 72px weight 500
   - Underneath in Inter Tight 16px ink-soft: "Curated by 200+ React Native builders. Updated weekly."
   - Bottom-right of strip: italic serif sort links "Recent · Top Viewed · Top Voted" separated by middle-dot. Active link has a 2px ink underline-offset rule.
   - Hairline border-sand below the strip

4) MASONRY GRID (max-width 1280px, mx-auto, padding 32px)
   Use CSS columns or a flex/grid masonry. 4 columns desktop, gap 32px.
   Every 6th card spans 2 columns ("featured" treatment, larger caption).

   Card structure:
   - bg-surface-white wrapper, 4px radius, no border, no default shadow
   - 4px white interior padding around media (creates frame effect)
   - Media area: rounded 2px, aspect 9/16 (portrait) — featured cards aspect 4/5
   - On hover: shadow blooms over 400ms ease-out, no transform
   - Text block BELOW media (padding 16px, 64-80px tall depending on layout):
     - Top-right corner: small serif star "✦" toggles bookmark; if isNew, a 24px-wide 2px sepia underline appears beneath the caption
     - Caption: 17px Inter Tight weight 600 ink
     - Byline: "by @{author}" in Fraunces italic 14px ink-soft
     - Bottom row (flex justify-between, padding-top 12px, 1px border-sand top):
       - Left: category name 11px uppercase tracked Inter Tight ink-soft
       - Right: "{view_count} views · {vote_count} votes" 11px ink-soft
   - On hover, three social glyphs (X, in, gh) appear as tiny serif-styled letters in the top-right of the text block

Use data fields: id, caption, demoPath, posterPath, author, source, category, twitterId, linkedInId, githubId, view_count, vote_count, isNew

5) FOOTER (large, calm)
   - Max-width 1280px, mx-auto, padding-y 96px, hairline top border-sand
   - Left: huge "rnui.dev" in Fraunces 64px ink (with sepia .dev)
   - Right: link columns (About / Contact / Terms / Privacy / Newsletter)
   - Tiny credit line at very bottom in Fraunces italic

SIGNATURE: DROP-CAP NUMERALS
At the top of the grid (and any section header), set the category's item count as an oversized hanging numeral in Fraunces 144px, opacity 0.9, that hangs into the left margin of the content column. This is the visual identity anchor — used consistently.

RESPONSIVE
- 1280px+: 4 cols masonry, every 6th featured
- 1024-1279: 3 cols, every 5th featured
- 768-1023: 2 cols, no featured spans
- <768: 1 col, masthead collapses search to icon, category rail still horizontal scroll

INTERACTIONS
- Card hover: shadow blooms in over 400ms ease-out, NO transform
- Category pill hover: ink fills via left-to-right wipe
- Sort link hover: 2px sepia underline draws in left-to-right
- Bookmark star: scales 0.9→1.1→1 over 300ms, fills sepia when active
- Scroll-in: every card fades and rises 8px on intersection, staggered 40ms

DON'T FORGET
- Dark mode toggle (warm dark — bg #15110C)
- "New" indicator = sepia underline, NOT a boxy badge
- Bookmark = serif star ✦
- Vote / view counts as quiet metadata, not badges
- Use real React Native author handles: @nandorojo, @mrousavy, @catalinmiron, @WcandillonW, @evanbacon
- Real-sounding captions: "Liquid swipe carousel", "Skia loader collection", "Reanimated tab bar", "Spotify-style parallax header"
- Use Lucide icons sparingly; prefer typographic glyphs

OUTPUT
Single self-contained HTML using Tailwind CDN, Fraunces + Inter Tight from Google Fonts. Render ~16 cards with at least 2 featured spans. The page should feel finished, art-directed, and printable.
```

---

## Master Prompt: Concept C — Tactile Arcade

```
ROLE
You are a playful, opinionated product designer in the spirit of the teams behind Tldraw, Excalidraw, Linear's marketing site, and the Figma community page. You ship interfaces that feel like toys but work like tools. Output a single production-ready HTML + Tailwind CSS artifact.

PROJECT
The site is rnui.dev — a community-curated directory of React Native UI animation and component demos. Users browse portrait video demos in a 5-column grid, filter by category/author, vote and bookmark, and click out to GitHub. The redesign must feel tactile, candy-colored, and playful — every surface should look like a laminated paper tile you could pick up. Still scannable and professional, never gimmicky.

CONCEPT: TACTILE ARCADE
Putty/cream paper background, hard 1.5px black borders, solid-color offset shadows (no blur), three-color accent rotation (tangerine / cobalt / acid lime), chunky Space Grotesk type, snappy "press" animations. References: Tldraw landing page, Are.na profile pages, Figma Community, Neubrutalist UI kits softened with rounded corners.

DESIGN TOKENS (use exactly)
Colors:
- bg-paper: #EFEAE0
- surface-white: #FFFDF8
- ink: #191919
- ink-soft: #5A5A5A
- accent-tangerine: #FF5A1F
- accent-cobalt: #3D5AFE
- highlight-lime: #D8FF3C
- soft-pink: #FFB3C7
- (dark mode: bg #1B1A17, surface #252320, ink #F2EBDD)

Typography:
- Display/UI: "Space Grotesk", sans — weights 400, 500, 600, 700
- Mono: "JetBrains Mono", ui-monospace
- H1: 56/64 weight 700 tracking -0.03em
- Card title: 16/22 weight 600
- Button labels: 14/20 weight 600
- Metadata: 12/16 JetBrains Mono weight 500

Spacing & shape:
- Card radius: 12px
- Button radius: 10px
- Pill radius: 999px
- Hard border: 1.5px solid ink everywhere on interactive surfaces
- Offset shadow: 6px 6px 0 0 {color} (cards), 4px 4px 0 0 ink (buttons), 3px 3px 0 0 {color} (chips)
- Press state: shadow shrinks to 2px and surface translates by the lost shadow distance
- Hover transition: 150ms cubic-bezier(0.2, 0, 0, 1.2)
- Dot grid background: radial-gradient(#19191908 1px, transparent 1px) 24px 24px

LAYOUT — BUILD THESE 5 SECTIONS

1) TOP NAV (height 72px, bg-paper, 1.5px bottom solid ink)
   - Left: wordmark "rnui" in Space Grotesk 28px weight 700 ink, ".dev" in tangerine
   - Center: large pill-shaped search input — 480px wide, 48px tall, bg-surface-white, 1.5px ink border, 4px 4px 0 cobalt shadow. Placeholder "Search 812 animations…" in ink-soft. Magnifying glass icon left, "⌘K" mono chip right
   - Right: theme toggle styled like a tiny toy flip switch (white pill bg, ink border, sliding lime dot indicator) + "Submit" button (tangerine bg, ink text, 4px 4px 0 ink shadow, 10px radius)

2) LEFT SIDEBAR (260px fixed, bg-paper, 1.5px right border ink, padding 20px)
   - Heading: "CATEGORIES" in 11px weight 700 uppercase ink, tracking 0.1em
   - 18 categories listed as vertical chips with rotating shadow colors:
     - Each chip: full-width, 40px tall, padding-x 14px, bg-surface-white, 1.5px ink border, 10px radius, 3px 3px 0 0 {tangerine|cobalt|lime|pink} (cycle), text 14px weight 500 ink
     - Right-aligned count in JetBrains Mono 12px ink-soft
     - Active state: bg ink, text bg-paper, NO shadow (looks pressed in)
     - Hover: shadow shrinks to 1px 1px, chip translates 2px 2px
   - Separator: 1.5px solid ink with 20px vertical margin
   - "AUTHORS" section: same chip style, with tiny circular avatar (20px) + handle

3) MAIN HEADER (above grid)
   - Row 1 (large): "812 animations." in Space Grotesk 48px weight 700 ink. The number cycles through tangerine on hover.
   - Row 2: subtitle "Crafted by the React Native community." 16px ink-soft weight 500
   - Row 3 (below): Sort tabs as three chunky arcade-key buttons in a row:
     - "Recent", "Top Viewed", "Top Voted"
     - Each: 44px tall, padding-x 20px, bg-surface-white, 1.5px ink border, 10px radius, 4px 4px 0 ink shadow
     - Active: bg ink, bg-paper text, shadow gone, translated 4px 4px (depressed)
   - Right-aligned: a "Random" button (lime bg, 4px 4px 0 ink shadow) with dice icon

4) CARD GRID (5 cols desktop, gap 24px)
   Card structure (uses fields: caption, demoPath, posterPath, author, source, category, twitterId, linkedInId, githubId, view_count, vote_count, isNew):
   - Outer wrapper: bg-surface-white, 12px radius, 1.5px solid ink border, 6px 6px 0 0 {tangerine|cobalt|lime} (rotate by index)
   - Inside, 8px padding (creates the "Polaroid" white frame around video)
   - Media: aspect 9/16, 10px inner radius, autoplay-on-hover muted video
   - On the media (absolute):
     - Top-left: category pill — bg-paper, 1.5px ink border, 11px weight 600 ink, padding 4px 10px, 999px radius, tiny 2px ink shadow offset
     - Top-right: bookmark icon button — 32x32 bg-surface-white, 1.5px ink border, 10px radius, 2px 2px 0 ink shadow. Fills lime when active.
     - If isNew: a small acid-lime ribbon at top-right of the entire card (rotated -8deg, 1.5px ink border, "NEW" in 10px mono weight 700)
   - Below media (padding 12px 8px 8px):
     - Row 1: avatar (24px circle, 1.5px ink border) + "@author" 13px weight 500 ink
     - Row 2: caption in 16px weight 600 ink, truncate to 2 lines
     - Row 3 (flex justify-between, padding-top 10px, 1.5px dashed border-top ink/20):
       - Left: "▶ 12.4K" in JetBrains Mono 12px ink-soft
       - Right: vote button — pill 28px tall, bg-surface-white, 1.5px ink border, 999px radius, 2px 2px 0 tangerine shadow, contains heart icon + count in mono. On press: shadow gone, translates 2px 2px, triggers a 3-heart particle burst flying up.
   - Card hover: video plays, card LIFTS — shadow grows from 6px to 8px, card translates -2px -2px
   - Card press (mousedown): shadow shrinks to 2px, card translates 4px 4px
   - On hover, three tiny social icons (X / LinkedIn / GitHub) appear stacked vertically on the right outer edge of the card — each is a 28x28 white square with ink border and 2px offset shadow in the card's accent color

5) BACKGROUND & ATMOSPHERE
   - Whole-page dot grid (radial-gradient dots, 24px spacing, #19191908)
   - At top-right of viewport, a small decorative "controller" SVG (game-pad icon) tilted slightly, ink stroke 1.5px, purely decorative
   - Footer: 1.5px ink top border, big "rnui.dev" wordmark in Space Grotesk 96px weight 700 with .dev in tangerine, link columns to the right in chip style

RESPONSIVE
- 1280+: 5 cols, sidebar visible
- 1024-1279: 4 cols, sidebar 220px
- 768-1023: 3 cols, sidebar becomes a collapsible drawer triggered from header
- <768: 2 cols, header simplifies: hamburger (becomes a chunky button with offset shadow) opens a full-screen sheet with all categories as chips. Search bar collapses to icon button that expands inline.

INTERACTIONS
- Universal "press" pattern: any interactive element (card, button, chip) loses its offset shadow and translates into that space on mousedown — feels physical
- Card hover: lift (opposite of press) + video play + social icons fade in on right edge
- Vote button: tap → press animation + 3 heart particles burst up and fade
- Bookmark: tap → scales 0.85→1.2→1 + fills lime
- Category chip select: chip inverts (ink fill, paper text), shadow disappears
- Sort tab select: depressed-key state
- Sidebar scroll: tiny custom scrollbar with ink thumb on paper track

DON'T FORGET
- Dark mode (warm charcoal bg, same accent colors pop harder)
- "NEW" ribbon top-right of card (tilted -8deg, lime, ink border)
- Bookmark icon top-right of media area
- Vote = heart icon, view = play icon, both in mono
- Only show the social icons the author actually has (twitterId / linkedInId / githubId)
- Use real RN handles: @nandorojo, @mrousavy, @catalinmiron, @evanbacon, @WcandillonW
- Realistic captions: "Liquid swipe carousel", "Skia gradient loader", "Reanimated tab bar", "Spotify parallax header"
- Rotate card shadow colors by index modulo 3 (tangerine, cobalt, lime) for grid rhythm
- Use Lucide icons everywhere; ensure 1.5px stroke to match the border weight

OUTPUT
Single self-contained HTML file using Tailwind CDN, Space Grotesk + JetBrains Mono from Google Fonts, Lucide icons CDN. Render at least 15 sample cards with rotating shadow colors and one or two with the "NEW" ribbon. The page should feel like a beautifully crafted toy — playful but precise.
```
