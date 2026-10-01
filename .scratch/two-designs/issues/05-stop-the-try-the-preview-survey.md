# 05 — Stop survey `01a00821`

Status: ready-for-agent
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
