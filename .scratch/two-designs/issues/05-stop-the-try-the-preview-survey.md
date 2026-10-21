# 05 — Stop survey `01a00821`

Status: resolved
Blocked by: 04

## Problem

Survey `01a00821-b97e-0000-22ae-8da5e1689800`, "Try the Preview", is **live** in project
117415, targets `icontains rnui.dev` — which matches both `www.rnui.dev` and
`old.rnui.dev` — and reads:

> There's a redesign of rnui.dev to look at. Same catalogue, redrawn, at preview.rnui.dev.
> Two questions there if you have an opinion about it.

After ticket 04 that copy is false on both hosts: on `www` it advertises a redesign the
visitor is already looking at, and on the Archive it advertises a redesign that sits next
to it. It also links to `preview.rnui.dev`, which ticket 04 turns into a redirect.

`notify-and-preview` ticket 13 records that launching it needed **two** switches — a
`start_date` and its internal targeting flag `823688` set `active: true` — and that from the
survey API alone the stopped state is indistinguishable from a working one. So verifying
this one stopped means reading `/decide/`, not the survey record.

## Work

1. `survey-stop` on `01a00821`. Do not delete it; `notify-and-preview` 13 is a closed record
   that describes it.
2. Verify through `POST /decide/?v=3` against the 117415 token that the survey id is absent
   from the response — the same verification ticket 07 did for launch.
3. Update its `description` to record the stop and why, so the PostHog UI does not read as
   a live survey pointing at a host that redirects.

## Acceptance

- The survey id is absent from `/decide/`.
- Its `description` names the date it was stopped and that the previous design is now at
  `old.rnui.dev`.
- `notify-and-preview` ticket 13's Comments carry a dated note pointing at this ticket.

## Comments

**2026-10-21 — taken against the already-stopped survey, and finished.** The file said
`ready-for-agent`, but PostHog already held the stop: `end_date` is `2026-10-02T01:51:38Z`, so
`survey-stop` was a no-op and no second stop was needed. Two things were still missing and are now
done.

- **`/decide/` re-verified.** `POST /decide/?v=3` against project 117415's public token returned one
  survey, `019fbc46`, and not `01a00821`. Its internal targeting flag
  `survey-targeting-1eb4100998-custom` is also absent from `featureFlags`, which is the half that
  `notify-and-preview` 13 records as the second switch.
- **Description updated.** The previous text named the date but said nothing about the Archive; it
  now records that the previous design lives there, at the literal hostname `old.rnui.dev` that
  the Acceptance bullet asks the description to name, and that re-verification happened on
  2026-10-21. `survey-launch` on the id would still restore it, so the description says that would
  be wrong.
- **The cross-note exists.** `notify-and-preview` ticket 13's Comments carry the dated pointer to
  this ticket, and name the result of the `/decide/` check.

The survey is left in the project, unarchived. `notify-and-preview` 13 is the closed record that
describes it.
