# 06 — Turn on dead-click capture

Status: ready-for-agent

## Problem

`capture_dead_clicks` is false on project 117415. A dead click is a click on something that
looks interactive and does nothing — which is precisely the failure mode the 32 unlabelled
home-page rage-clicks suggest.

The site has a concrete reason to expect them. The catalogue card is a `motion.div` with an
`onClick` and no `role`, `tabIndex` or keyboard handler
(`components/entry-card.tsx:131-137`), and the bookmark control is
`pointer-events-none` until hover (`:149-154`), so on a touch device it is visible but inert.
A finger tapping the bookmark icon on a phone produces exactly a dead click, and nothing
currently records it.

Free, one setting, no code change.

## Work

1. Enable `capture_dead_clicks` in project settings.
2. After two weeks, break `$dead_click` down by `$el_text`, `$current_url` and
   `$device_type`, and record the top ten under `## Comments`.
3. Feed that list into the UI/UX effort as evidence, not as a separate fix here.

## Acceptance

- `$dead_click` events are arriving.
- The two-week breakdown is written into this file.
- The bookmark-on-touch hypothesis is either confirmed by the data or explicitly ruled out.

## Notes

Re-check this after the UI/UX work ships. Dead clicks going to near-zero is a clean,
objective way to prove the keyboard and touch fixes worked.
