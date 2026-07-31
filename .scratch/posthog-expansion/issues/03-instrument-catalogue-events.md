# 03 — Instrument the catalogue's real events

Status: ready-for-agent
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

## Depends on

Ticket 01 — otherwise the first week of funnel data is 41% crawlers.
