# 05 — Watch the rage-click replays

Status: ready-for-human

Narrowed 2026-08-01. This ticket used to mix "watch recordings and form a judgement" with
"set four project settings", so it could never be handed to an agent or finished by a person in
one sitting. The configuration — masking, minimum duration, the `$rageclick` trigger, the
"Rage-clicks" playlist — moved to ticket 04. What is left is the part that needs eyes.

Do this in one sitting with tickets 07 and 10, and step 4 of ticket 09. All four are the
maintainer's judgement, and together they are about an hour.

## Problem

Session replay has been on since 2025-06-05, sampling 100% of sessions and retaining 90 days.
Its onboarding was never completed. Nothing is watching the recordings, and the 55KB recorder
loads on every page.

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

Both candidates have since been worked on in the `ui-ux-overhaul` effort, so part of what the
replays show may already be fixed. Say which, in the notes — it is the difference between
"proved the fix" and "still broken".

## Work

1. Watch the replays behind the 32 home-page rage-clicks. Write down what the visitor was
   trying to click, one line each, under `## Comments`.
2. Confirm email inputs are masked, by watching one recording of the newsletter form being
   filled. Ticket 04 sets the masking config; this is the check that it took.

## Acceptance

- The cause of the 32 home-page rage-clicks is written down and traced to a specific element.
- Each cause is marked as already fixed by the UI/UX work, or still live.
- Email masking is confirmed on a real recording.

## Notes

The maintainer has confirmed session replay stays on. Its 55KB cost is accepted; this ticket is
about earning it back.

The second playlist this ticket used to ask for, "Failed demos" filtered to `demo_load_failed`,
belongs to whoever lands ticket 03 — the event does not exist until then.
