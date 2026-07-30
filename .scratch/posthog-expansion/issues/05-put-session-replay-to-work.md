# 05 — Put session replay to work

Status: ready-for-human

## Problem

Session replay is on, sampling 100% of sessions, retaining 90 days, capturing console logs and
network performance. It has been running since 2025-06-05 and its onboarding was never
completed. Nothing is watching the recordings, and the 55KB recorder loads on every page.

Meanwhile there are 74 rage-click events pointing at exactly where to look:

| URL | Element text | Rage-clicks | People |
|---|---|---|---|
| `/` | *(none)* | 32 | 24 |
| `/?search=star` | *(none)* | 3 | 2 |
| `/?search=text` | *(none)* | 2 | 2 |
| `/products?category=Buttons` | Buttons | 2 | 2 |
| `/products?category=Loaders` | Loaders | 2 | 2 |
| `/?search=grid` | *(none)* | 2 | 1 |

The 32 home-page rage-clicks with no element text are the strongest single piece of usability
evidence available. A rage-click on nothing labelled means a visitor clicked something that
looked interactive and got no response. Two candidates, both real: the card is a `motion.div`
with no role or handler feedback, and the demo requires a second click on the play button to
start. The search-result cluster is consistent with the undebounced search re-rendering 277
cards on every keystroke.

This ticket is `ready-for-human` because the first step is watching recordings, which needs a
person's judgement, not an agent's.

## Work

1. Watch the replays behind the 32 home-page rage-clicks. Write down what the visitor was
   trying to click, in one line each, under `## Comments`.
2. Create a saved playlist "Rage-clicks" filtered to sessions containing `$rageclick`, and one
   "Failed demos" filtered to `demo_load_failed` once ticket 03 lands.
3. Configure replay rather than leaving it at defaults:
   - Set a masking config. Nothing on the site is sensitive, but the newsletter and contact
     forms take email addresses — mask inputs by default.
   - Consider `session_recording_minimum_duration_milliseconds` so one-second crawler visits
     are not stored.
   - Keep the 100% sample rate. Volume is low enough that sampling would only lose signal.
4. Add `$rageclick` to `session_recording_event_trigger_config` so those sessions are certain
   to be captured.

## Acceptance

- The cause of the 32 home-page rage-clicks is written down and traced to a specific element.
- Two saved playlists exist.
- Email inputs are masked in replays — verified by watching one recording of the newsletter
  form being filled.

## Notes

The maintainer has confirmed session replay stays on. Its 55KB cost is accepted; this ticket
is about earning it back.
