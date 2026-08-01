# 03 — Instrument the catalogue's real events

Status: ready-for-human
Blocked by: 01

## Problem

The site has **zero custom events** in 90 days. Everything known about visitor behaviour comes
from autocapture, which records that a `div` was clicked but not that a demo was watched.

The one custom event in the codebase, `demo_load_failed`
(`components/interactive-video.tsx:75`), has never fired. Resolving why is part of this ticket:
either no demo has failed since it was added, or the capture is unreachable.

The product's purpose is: visitor watches a recording, then opens the contributor's repo.
Neither end of that is measured.

## Work

Capture these events. Names are lowercase snake_case, properties flat, no PII.

| Event | Fires when | Properties |
|---|---|---|
| `demo_played` | a recording starts playing | `entry_id`, `caption`, `category`, `author`, `surface` (`grid`/`detail`), `trigger` (`autoplay`/`click`) |
| `demo_watched` | a recording has played ≈2s | same, plus `seconds` |
| `demo_load_failed` | existing event — keep, verify it fires | existing, plus `reason` from `FAILURE_REASONS` |
| `entry_opened` | the detail view opens | `entry_id`, `caption`, `category`, `author`, `source` (`card`/`url`) |
| `repo_clicked` | the outbound source link is followed | `entry_id`, `caption`, `author`, `surface` |
| `filter_applied` | a category or contributor filter is set | `facet` (`category`/`author`), `value`, `active_filter_count` |
| `filter_cleared` | a filter is removed | `facet`, `value` |
| `search_performed` | debounced search settles | `query_length`, `result_count` — **not the query text** |
| `sort_changed` | sort control used | `sort` (`recent`/`top-viewed`/`top-voted`) |
| `bookmark_added` / `bookmark_removed` | save toggled | `entry_id`, `caption` |
| `vote_cast` | vote button used | `entry_id`, `caption` |
| `load_more_clicked` | pagination advanced | `page`, `entries_shown` |

`search_performed` records length and result count only. The raw query is visitor-supplied
free text and does not belong in analytics.

Wire-up points: `components/interactive-video.tsx` (playback, failure),
`components/entry-card.tsx` (open, repo, bookmark, vote), `components/catalogue-search.tsx`
(search), `hooks/use-sorted-data.ts` (sort), `components/nav/catalogue-nav.tsx` (filters).

Add a single `lib/analytics.ts` exporting one typed function per event, so no component calls
`posthog.capture` with a string literal. Every property name is then defined once.

## Acceptance

- Each event above appears in the PostHog activity feed when triggered in a preview
  deployment, with all listed properties populated.
- `demo_load_failed` either fires on a deliberately broken asset path, or the reason it
  cannot is documented under `## Comments` and fixed.
- No event carries a raw search string, an email, or any visitor-entered text.
- A funnel `demo_played → entry_opened → repo_clicked` returns non-zero at every step.

## Do these in the same pass

- **Ticket 09, steps 2 and 3** — the "Redesign — before / after" dashboard is built entirely
  out of the events above, and its funnel tile *is* this ticket's fourth acceptance criterion.
  Building it here means the events and the dashboard verify each other; building it in a later
  session means discovering a missing property twice.
- **The "Failed demos" playlist** that ticket 05 asks for — filtered to `demo_load_failed`, and
  only possible once this ticket has proved that event fires.

## Depends on

Ticket 01 — otherwise the first week of funnel data is 41% crawlers.

Ticket 04 is not a dependency, but should land first anyway: it flips on dead-click capture and
the replay triggers, and those collect nothing until they are on. See the note at the top of
ticket 04.

## Comments

### 2026-08-01 — All thirteen events wired. `ready-for-human`: two acceptance bullets need a deploy.

**`lib/analytics.ts`** is the new module: one exported function per event, so no component
spells an event name or a property name. It takes the `posthog-js` singleton from module scope
rather than through `usePostHog()`, which is what lets `hooks/use-sorted-data.ts` and
`components/playback-owner.tsx` report — neither is a component body, so neither can call a hook.

Wired, per surface:

| Event | Where |
|---|---|
| `demo_played` | `demo-tile.tsx` on first `playing` (grid / autoplay) · `interactive-video.tsx` on first `play` (detail / click) |
| `demo_watched` | `playback-owner.tsx` where the two-second watcher crosses (grid) · `interactive-video.tsx` on `timeupdate` (detail) |
| `demo_load_failed` | both of the above, unchanged properties |
| `entry_opened` | `entry-card.tsx` `handleClick` (`card`) · `entry-detail.tsx` open effect (`url`) |
| `repo_clicked` | `entry-card.tsx` Source link (grid) · `entry-detail.tsx` GitHub link (detail) |
| `filter_applied` / `filter_cleared` | `nav/catalogue-nav.tsx`, off the same test `facetHref` navigates on |
| `search_performed` | `entry-card-grid.tsx` — see the deviation below |
| `sort_changed` | `hooks/use-sorted-data.ts` `setSort` |
| `bookmark_added` / `bookmark_removed` / `vote_cast` | `entry-card.tsx` |
| `load_more_clicked` | `entry-card-grid.tsx` `loadMore` |

`lib/view-signal.ts` gained one thing: the watcher now reports the seconds it accumulated, so
`demo_watched.seconds` is what actually played rather than the threshold echoed back. The
threshold and the session cap are untouched — ADR-0007's decisions stay where they were.

`tests/analytics.test.ts` pins every event name and property set, including the third acceptance
bullet directly: `search_performed` sends two numbers and no string. 184 unit tests and 118 e2e
pass; `pnpm build` is clean.

**Why `demo_load_failed` had never fired.** Neither of the ticket's two hypotheses. The capture
was added in `f4b3507` on **2026-07-29**, one day before the 2026-07-30 measurement — so
"zero in 90 days" was one day of silence, not ninety. It was also reachable only after a
click-to-play in the shipped build, since `interactive-video.tsx` mounts no `<video>` until
someone presses play. Nothing was broken and nothing needed fixing; it now also fires from the
autoplaying grid tile, which is a far larger surface for it.

**Deviation from the ticket's wire-up list.** The ticket names `components/catalogue-search.tsx`
for `search_performed`. It is in `components/entry-card-grid.tsx` instead: the box knows the
term and only the grid knows `result_count`, and the event needs both. It fires on the settled
URL, which is what the 300ms debounce produces, so it is still one event per settled search —
and the raw term never leaves the grid's closure. `CatalogueSearch` only renders on `/`
(`app/page.tsx:20`), where the grid is mounted too, so no search goes unreported.

**Two things for the maintainer, neither blocking:**

1. **`entry_opened.source` collides with the glossary.** In this repo `source` is the Entry's
   outbound Source link (`data/entry.ts:30`, and `repo_clicked` is about following it); here it
   means `card` / `url`. The ticket's property table names `source`, so it shipped as specified
   rather than renamed on an agent's initiative — but `opened_from` would not collide, and
   renaming an event property is only free before the event has shipped.
2. **`vote_cast` fires on the cast direction only.** The ticket says "vote button used" and
   names one event where bookmarks get a pair. Firing the same name for a withdrawal would make
   a count of it meaningless, so withdrawals are currently invisible. Say if they should not be.

`Surface`, `Facet` and `EntryFacts` are new load-bearing nouns with no `CONTEXT.md` entry —
noted here for `/domain-modeling` rather than added unilaterally.

**What is left, and who does it.** Acceptance bullets 1 and 4 need a preview deployment: nothing
in PostHog can show these events in the activity feed, or return non-zero at every funnel step,
until the code is deployed. That is spec checkpoint 3. Bullets 2 and 3 are met.

Maintainer:
1. Deploy a preview and exercise the catalogue — play a Demo, open an Entry, follow its Source
   link, filter, search, sort, bookmark, vote, load more.
2. Confirm each event in the PostHog activity feed with its properties populated.
3. Confirm the funnel tile on dashboard `1937576` is non-zero at all three steps.
4. Then this ticket is `resolved`.

The "Failed demos" replay playlist ticket 05 asks for is **not** built. It needs
`demo_load_failed` to have actually fired at least once, which needs the deploy above — the
event has now been reachable for two days, with no occurrences. Build it when there is one to
put in it.
