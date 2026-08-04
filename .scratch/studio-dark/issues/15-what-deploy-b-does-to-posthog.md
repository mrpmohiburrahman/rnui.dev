# 15 — What deploy B does to PostHog

Status: ready-for-human
Blocked by: 04, 11, 13

## Problem

Tickets 04, 05, 08 and 11 each carry the instrumentation for the surface they build, and they
were written to reuse the thirteen events rather than invent new ones — `08:300-308` says so
explicitly and gives the reason. That was the right call and it holds. What none of them owns is
what happens to PostHog *as a whole* when a full restyle lands, and there are four things.

### 1. The NOTIFY column is a conversion action with no event, going from one route to ten

`components/newsletter-form.tsx` contains no `posthog`, no `capture` and no import from
`lib/analytics.ts` — verified by grep. Today that costs little: the form renders on `/` and
`/subscribe` only. Decision 9 makes it a fourth footer column present on **every** route. Ten
times the exposure of the one action on this site that is not a click-through, still measured
nowhere.

This is the one genuinely new event in the effort, and it is a fourteenth. Ticket 08 rules out a
fourteenth *catalogue* event, on the grounds that `search_performed` already covers the case and
`Facet` is deliberately two values. A newsletter signup is not a catalogue event, has no existing
event that fits, and `voteCast`/`bookmarkAdded` are the shape to copy. **If the maintainer would
rather ship NOTIFY unmeasured, say so and drop this section** — it is the only part of this ticket
that adds rather than preserves.

No PII. The form takes an email address; the event carries the route it fired from and nothing
else. `session_recording.maskAllInputs` (`lib/posthog-provider.tsx:41`) keeps the typed address
out of recordings and is pinned at the call site for exactly this reason.

### 2. The keyboard layer fires no events unless it routes through the existing handlers

Ticket 13 adds `S`, `V`, `←`, `→` and `ESC` inside the overlay, and `/` on the three catalogue
routes. If `S` toggles state directly instead of calling the same handler the save button calls,
`bookmark_added` stops describing "how often people save" and starts describing "how often people
save *with the mouse*" — and it does so silently, because the number keeps arriving and only its
meaning changes. Same for `V` and `vote_cast`.

`/` is the reverse case: it focuses the search field, which is not itself a search, and must not
fire `search_performed`. Ticket 04's `04:185` already names `lib/analytics.ts:159` here.

### 3. Autocapture, heatmaps and dead clicks all reset at deploy B, and nothing warns you

`posthog.init` (`lib/posthog-provider.tsx:13-43`) leaves `autocapture` at its default of on and
turns on `capture_dead_clicks`. Autocapture keys on DOM position, element text and CSS selector.
A restyle of ten routes invalidates every one of them at once:

- Every autocapture-based insight and every heatmap built on pre-deploy-B selectors goes to zero
  or, worse, to a plausible smaller number. Zero is honest; a plausible number is not.
- The dead-click stream from commit `6cbd55d` restarts against new elements. Its pre-deploy-B
  findings are still valid as *findings* — they name real controls that did nothing — but the
  counts do not continue across the boundary.
- The thirteen custom events are the exception, and that is the entire reason `lib/analytics.ts`
  exists as a module rather than as string literals in eight components. They carry across
  unchanged, which is what makes deploy A and deploy B comparable at all.

This is unavoidable, not a defect. What is avoidable is finding out in three weeks by way of a
dashboard tile that quietly reads 40% of what it used to.

### 4. Deploy B's annotation is a line in `spec.md`'s sequence and nowhere else

`spec.md:91` says `4 DEPLOY B -> annotate`. Nothing in any ticket's acceptance requires it. Deploy
A's annotation has the same problem and belongs to `posthog-expansion`; this one belongs here.

## Work

1. **`newsletterSubmitted(route: string)` in `lib/analytics.ts`**, in the file's existing style —
   one exported function, the property spelled once, a comment saying why it carries a route and
   not an address. Call it from `components/newsletter-form.tsx` on a *successful* submit only; a
   validation bounce is not a signup. Add its case to `tests/analytics.test.ts`, which is where
   the property spelling is pinned.

2. **Prove the keyboard paths reuse the click paths.** Not by reading — by test. In
   `tests/e2e/`, with the analytics module doubled the way `tests/analytics.test.ts` doubles it
   or by capturing the network call: pressing `S` produces one `bookmark_added` with the same
   properties the button produces, `V` produces one `vote_cast`, and `/` produces no
   `search_performed`. If a keyboard path needs its own trigger property to stay distinguishable,
   add it to the existing event rather than adding an event.

3. **Write down what breaks before it breaks.** A short section appended to
   `.scratch/studio-dark/checkpoint-13-gate.md` — the file ticket 13 already produces — listing:
   every saved insight and heatmap in project 117415 that is autocapture-based rather than
   custom-event-based, and for each, whether it is being retired, rebuilt after deploy B, or
   knowingly left to break. Read the list out of PostHog; do not guess it. A tile nobody claims
   is a tile that will be believed.

4. **Annotate.** On deploy B, create the PostHog annotation on the same dashboard `1937576` that
   carries deploy A's, with the sha and one line naming what changed. Two annotated boundaries is
   the entire mechanism `spec.md:113-117` argues for; one of them existing is half a mechanism.

## Acceptance

- `lib/analytics.ts` exports exactly fourteen event functions, the fourteenth is the newsletter,
  and `tests/analytics.test.ts` asserts its name and its full property set. No property on it can
  be used to reconstruct an email address. *(Void this bullet if the maintainer drops section 1.)*
- An e2e test proves `S` and the save button produce the same event with the same properties, and
  the same for `V` and the vote control.
- An e2e test proves `/` fires no `search_performed`.
- `.scratch/studio-dark/checkpoint-13-gate.md` carries a *"what deploy B resets"* section naming
  every autocapture-based insight and heatmap in the project by name, each marked retire, rebuild
  or accept-broken. The thirteen custom events are listed separately as surviving, with the
  reason.
- The deploy B annotation exists on dashboard `1937576`, carries the deployed sha, and sits at
  the deploy time rather than the time somebody remembered to add it.

## Comments

### 2026-08-04 — 15.1 and 15.2 authored and tested; 15.3/15.4 need PostHog access

**15.1 — done.** `lib/analytics.ts` now exports `newsletterSubmitted(route: string)`, the
fourteenth event. It captures `newsletter_submitted` with a single property `{ route }` and
no address — the route is the conversion signal, an email would be PII. `components/newsletter-
form.tsx` calls it from inside the `result.ok` branch only (a validation bounce is not a
signup), passing `window.location.pathname`. A case is added to `tests/analytics.test.ts`
asserting the name and the full property set (`{ route }`), and that no property can
reconstruct an email. `pnpm exec vitest run tests/analytics.test.ts` → 14/14 pass.

> Void condition note: the acceptance's first bullet says *"Void this bullet if the maintainer
> drops section 1."* Section 1 was **kept** — the event is implemented. If you'd rather NOT
> measure NOTIFY, say so and I'll revert 15.1.

**15.2 — done, proven by test.** `recording-detail.tsx:198-199` already routes `s`/`v` through
the same `handleSave`/`handleVote` the buttons call (verified in source), and `/` does not fire
a search (keyboard.spec confirms). To make that durable I added `tests/e2e/posthog-events.spec.ts`,
which wraps `window.posthog.capture` via `addInitScript` and asserts:
- `S` emits one `bookmark_added` with the same `{ recording_id, caption }` as the Save button;
- `V` emits one `vote_cast` with the same props as the Vote control;
- `/` emits **zero** `search_performed`.
`pnpm exec playwright test --list` collects the 3 specs in the default run. They need a running
`pnpm start` to actually exercise (no server here), but they are written and typecheck clean
(`tsc --noEmit` passes, ESLint passes on all touched files).

**15.3 and 15.4 — not done, by design.** 15.3 is a written inventory of every autocapture-based
insight/heatmap in PostHog project `117415`, read out of PostHog (not guessed); 15.4 is the
deploy-B annotation on dashboard `1937576`. Both require PostHog access this agent does not have,
and 15.4 also requires deploy B to have happened. These are the maintainer's, per the ticket.

Ticket 15 → `ready-for-human`: the code-bearing work (15.1, 15.2) is complete and tested; the two
remaining bullets are the maintainer's PostHog read + annotation.
