# Studio Dark

Rebuild the site's appearance to the Studio Dark direction, in both modes, and rename the
domain to the vocabulary that direction speaks.

Decided with the maintainer 2026-08-01, in a `/grill-with-docs` session. The design being
built already exists as a specified system: `assets/new-ui/*.dc.html`.

## The reversal this effort rests on

`.scratch/ui-ux-overhaul/spec.md:7-14` records that a full visual redesign was **rejected** on
2026-07-30 — five directions briefed, one (Studio Dark) generated and audited, the maintainer
preferring the existing design, the material kept "for reference, not for building".

**That rejection is overturned.** The maintainer reversed it on 2026-08-01. Studio Dark is
being built. `ui-ux-overhaul` keeps its `resolved` tickets and its finished behaviour work;
only its decision 1 ("the look is frozen as it renders today") and decision 14's static clause
are superseded, and a dated correction says so in that file rather than a rewrite — it is a
finished effort and is not reopened.

`posthog-expansion/spec.md`'s non-goal "Anything that changes what the site looks like" is
likewise superseded, and carries its own dated correction.

## What the mock already is

Not a picture. `assets/new-ui/` is a specified system, and reading it is cheaper than
re-deciding anything in it.

| File | What it holds |
|---|---|
| `Catalogue.dc.html` | Desktop catalogue, 1440px, in eight variants: `home` `loading` `filtered` `saved` `zero` `end` `reduced` `failed` |
| `CatalogueMobile.dc.html` | The same at phone width, with the bottom sheet |
| `Detail.dc.html` | The Recording detail, as overlay and as a shared-link arrival |
| `Tile.dc.html` | One tile, with `DECODE FAILED`, `NEW`, saved and focused states |
| `Specimen.dc.html` | Palette with contrast ratios, type scale, radius, elevation, spacing, **motion** |
| `rnui Studio Dark.dc.html` | Composite |

Both palettes are fully specified — 20 tokens each, plus `raise`, `amber`, `plinth`, `ctrlBg`
on the tile. The Specimen names the modes `DARK — THE DEFAULT` and
`LIGHT — THE SAME ROOM, LIGHTS ON`.

### Contrast, verified 2026-08-01

Every pair clears 4.5:1 as drawn. Measured, not assumed:

| Pair | Ratio |
|---|---|
| light `acc #0E7062` on `canvas #F4F4F1` | 5.43 |
| light `t3 #666B74` on `canvas #F4F4F1` | 4.86 |
| light `t1 #14161A` on `canvas #F4F4F1` | 16.44 |
| dark `acc #6FE3CC` on `canvas #0A0B0D` | 12.69 |
| dark `t3 #8E949F` on `panel #101216` | 6.15 |

This retires `ui-ux-overhaul` decision 17, which recorded that no single Source-link colour
could clear 4.5:1 against both `#fafafa` and `#262626`. A per-mode accent solves it by
construction, so the split that decision reluctantly accepted is now the design.

### Motion, as the Specimen already specifies it

| Moment | Spec |
|---|---|
| Tile enters view → video swaps in | 160ms opacity, linear |
| Playing tile brightness + glow | 220ms `cubic-bezier(.2,.8,.2,1)` |
| Filter chip add / remove | 120ms ease-out |
| Overlay open (scrim + 8px rise) | 240ms `cubic-bezier(.2,.8,.2,1)` |
| Overlay close on Escape | 160ms ease-in |
| Bottom sheet (mobile) | 260ms spring, no overshoot |

Under `prefers-reduced-motion` the Specimen states: *"video elements are never mounted —
posters only, tiles at full brightness, all durations 0ms."* That is what `ui-ux-overhaul`
ticket 09 already ships, so reduced motion needs no new rule, only preservation.

The mock's 160ms tile swap supersedes decision 15's 150ms. One number, the mock wins.

### Elevation

`E0` hairline — chrome and paused tiles. `E1` *"emission — a playing tile, tinted by its own
recording"*. `E2` overlay. E1 is why every tile in the design glows in its own colour, and why
this effort measures a hue per Recording.

## Sequence

The order is load-bearing and was decided deliberately. Nothing here is a preference.

```
1  RENAME      Entry -> Recording, author -> Contributor
               free today, a migration tomorrow
2  DEPLOY A    behaviour (ui-ux-overhaul) + 13 PostHog events + the rename
               -> annotate in PostHog, let it collect
3  BUILD       Studio Dark, all ten routes
4  DEPLOY B    -> annotate
```

**Why the rename goes first.** Two names are on ADR-0004's migration boundary *right now and only
right now* — `/recording/[id]` (277 addresses, prerendered by `ui-ux-overhaul` ticket 08 but not
deployed, so not one has ever been served) and `recording_id` (the property on all thirteen events
in `lib/analytics.ts`, not yet ingested). `git ls-tree -r --name-only main` lists neither
`app/entry/` nor `lib/analytics.ts`, so both really are free today and cost 277 redirects plus a
PostHog property migration the day after deploy A. `/products`, `?category=`, `view_count` and
`vote_count` are already public and keep their spelling, exactly as ADR-0004 decided.

*Correction, 2026-08-01, found while writing ticket 01.* This spec originally listed `?author=`
as a third free name, on the grounds that it was new in `ui-ux-overhaul` ticket 11. That is wrong:
the *composition* of filters is new, the *parameter* is not. `main`'s
`components/nav/catalogue-nav.tsx:77` already writes ``/products?author=${…}`` and
`main`'s `app/products/page.tsx:19` already reads it. `?author=` is live on the deployed site. It
is less exposed than `?category=` — the sidebar is behind a `<Suspense>` fallback and reads
`useSearchParams()` at module top, so a non-rendering crawler never saw those links — but a
rendering crawler did, and a visitor can have bookmarked one. `?contributor=` still ships as the
canonical spelling; `?author=` is kept alive by a redirect, on exactly ADR-0004's reasoning for
`/products` and `?category=`.

**Why two deploys.** `posthog-expansion` ticket 09's dashboard `1937576` exists to attribute a
change to a cause. One deploy carrying pagination, playback, URLs, type, colour and layout at
once would move every metric and explain none of it. Two annotated boundaries keep the
attribution. The gap costs nothing — deploy A's code is already written, and it collects while
Studio Dark is built.

## Decisions

| # | Decision | Consequence |
|---|---|---|
| 1 | All ten routes are in scope | The five with no mock (`/aboutus`, `/contactus`, `/subscribe`, `/privacypolicy`, `/termsofservice`) get layouts derived from the mock's vocabulary. The agent designs; the maintainer reviews |
| 2 | The mock ships as drawn, and gains whatever features make it work | The keyboard legend is drawn UI, so the keys work. `See all 148 →` is drawn, so it has a destination. Nothing on screen lies |
| 3 | Entry → **Recording**, author → **Contributor**, in code as well as copy | One vocabulary. Supersedes nothing in ADR-0004 except its examples; a new ADR records the rename and its boundaries |
| 4 | Space Grotesk + JetBrains Mono, self-hosted via `next/font/google` | Variable axes, latin subset, no `fonts.gstatic.com` hop, `adjustFontFallback` so the swap costs no CLS. LCP measured before and after |
| 5 | `defaultTheme="system"` stays | The mock's `DARK — THE DEFAULT` is read as intent, not as an override of `ui-ux-overhaul` decision 9. Both modes are first-class; the toggle persists |
| 6 | The hero copy is unchanged in light mode | The Specimen's own `LIGHT — THE SAME ROOM, LIGHTS ON` says the room metaphor survives the lights |
| 7 | `assets:measure` writes `durationMs`, `aspect` and `hue` onto each Recording | Run once, committed to `data/*.ts`, never per build. ADR-0003 makes a measurement keyed on an Asset path permanently valid |
| 8 | The tile hue is extracted from the Poster | E1's "tinted by its own recording" becomes true rather than decorative |
| 9 | The newsletter becomes a fourth footer column, `NOTIFY` | Present on every route instead of only `/`, and it stops competing with a hero the mock kept deliberately sparse. `/subscribe` stays as the standalone page |
| 10 | `showHero` splits the two catalogue routes | `/` renders the hero and the stats row, `/products` does not. One component, one flag — the mock already models it |

## Goals

1. The site renders as `assets/new-ui/` draws it, in both modes, on every route.
2. One vocabulary in code, copy and URLs.
3. The behaviour `ui-ux-overhaul` shipped survives intact — autoplay, five slots, the view
   signal, pagination, the overlay, the filters.
4. Deploy B is measurable against deploy A.

## Non-goals

- Changing what a view is. ADR-0007 stands.
- Moving view or vote counts off Firebase. `lib/counters-firestore.ts` still owns them.
- Accounts, sign-in or sync. The mock's own footer says so out loud.
- Paid PostHog features.
- Re-opening `ui-ux-overhaul`'s fourteen resolved tickets.

## Constraints

- **`api_host` stays `https://us.i.posthog.com`.** Hardcoded at `lib/posthog-provider.tsx:18`;
  a first-party `/ingest` proxy got rnui.dev categorised as Malware. Unchanged by this effort.
- **`/products`, `?category=`, `view_count`, `vote_count` keep their spelling.** ADR-0004's
  boundary. `middleware.ts` exists to keep 18 legacy Category URLs alive.
- **Assets live only on the CDN.** ADR-0001. `assets:measure` reads the Published Assets the
  way `check:videos:production` already does; there is no local staging copy.
- **The performance work is not spent.** `ui-ux-overhaul` took the mobile lab build from 4.34MB
  / LCP 7.2s to 0.51MB / LCP 3.4s, and field LCP p75 is still 4,212ms desktop / 4,515ms mobile,
  both in Google's poor band. Two webfonts and a per-tile glow are the two things in this effort
  most able to undo that. Both are measured, not assumed.
- **No PII.** Unchanged.

## Checkpoints

Stop and hand back at each of these.

1. **Before the rename is committed.** It touches 57 files and 356 `author` occurrences, 279 of
   them in `data/`. The review is a snapshot, not a read: `pnpm assets:paths` captured before
   must be byte-identical after, exactly as ADR-0004 required of its own rename.
2. **Before deploy A.** `posthog-expansion` ticket 09 step 4 — the success criteria, agreed in
   writing — is due *before* the numbers arrive, not after. That is `posthog-expansion` spec
   checkpoint 5 and it blocks this sequence at step 2.
3. **Before the five undrawn routes are built.** Their designs are invented rather than ported.
   Present them; do not ship them unreviewed.
4. **Before deleting or restyling anything `ui-ux-overhaul` shipped for a recorded reason.** Its
   spec carries corrections for a dozen assumptions that turned out wrong. Read the correction
   before overriding the decision.
5. **Before deploy B.** Contrast, keyboard and reduced-motion verification, and the LCP/CLS/INP
   measurement, are acceptance — not a follow-up.

## Tickets

Dependencies below are the `Blocked by:` lines as the tickets actually carry them, verified
2026-08-01 after a consistency pass. The graph is acyclic — every edge points to a strictly lower
number — so ascending order is a valid execution order.

| # | Ticket | Blocked by |
|---|---|---|
| 01 | Rename the domain to Recording and Contributor | — · blocks everything, and blocks deploy A |
| 02 | The design system in Tailwind: tokens, type, spacing, radius, elevation, fonts | 01 |
| 03 | `assets:measure` — duration, aspect and hue per Recording | 01 |
| 04 | The shell: header and footer | 01, 02 |
| 05 | The rail: Categories and Contributors with counts | 01, 02 |
| 06 | The hero, the stats row and the headings | 01, 02, 04 |
| 07 | The tile | 01, 02, 03 |
| 08 | The grid, the filter chips, Load more and the empty states | 06, 07 |
| 09 | The detail: overlay and shared-link arrival | 07 |
| 10 | Contributor routes | 01, 02, 05 |
| 11 | Mobile: the bottom sheet and the phone header | 04, 05, 08 |
| 12 | The five routes the mock does not draw | 02, 04 · checkpoint 3 |
| 13 | Motion, reduced motion, accessibility and the performance measurement | 07, 08, 09, 10, 11, 12 · the merge gate |

Three dependencies are not obvious from the titles and were found only by writing the tickets:

- **06 needs 04**, because the hero currently holds the only search box on the site
  (`app/page.tsx`), and 04 is what gives the search somewhere else to live. Landing 06 first
  leaves no search box on any route.
- **08 needs 06**, because 06 owns `catalogueResultLine`, which 08 renders in five of its states.
- **13 needs 10 and 12**, not merely the four surfaces. It sweeps all ten routes; run before
  `/contributors` and the five undrawn pages exist, it would certify nine routes and call it ten.
  A gate that runs before the last surface is built is not a gate.

One count changed while the tickets were written and is recorded here so it is not rediscovered:
**there are 23 Contributors, not 24.** `data/fullapps.ts:23` carries `"Pushkar Tandon "` with a
trailing space, which a naive unique-count reads as a twenty-fourth person. Ticket 10 step 1 trims
it; tickets 04, 05, 06 and 11 all print the total and all derive it from `contributors.length`, so
only their assertions move.
