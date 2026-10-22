# Send the first Digest, staged

Status: claimed
Type: task
Blocked by: 09

## HOLD — no mail leaves this project, 2026-08-15

**The maintainer has placed a standing hold on sending anything at all**, until they lift it *and*
every open issue in this effort is fixed. This is broader than the "maintainer authorises the send"
line below and it outranks it.

It covers every outbound message, not just the Digest:

- the staged Digest sends in this ticket, **including the first one to the maintainer**
- `pnpm broadcast:test` in ticket 05 — it sends a real test Digest
- ticket 06's live form submit — it triggers a real confirmation email

An agent may prepare, stage, draft and dry-run any of these. **Nothing is transmitted.** Do not
read a green DKIM check or a resolved blocker as the hold lifting; only the maintainer saying so
lifts it.

## Question

The irreversible one. Once this is sent it cannot be recalled, and the reputation consequences of
getting it wrong land on `mail.rnui.dev` permanently.

Send it in stages, not in one batch. Google warns against volume spikes from a domain with no
sending history, and `mail.rnui.dev` will have exactly none. Staging also means a mistake reaches
five people instead of everyone.

The arithmetic worth keeping in view while doing it: at ~41 Gmail recipients, **one spam complaint
is 2.4%** against Google's 0.3% threshold. You will not see it happen — Postmaster Tools suppresses
data at this volume — so the absence of a bad signal is not a good signal.

**Maintainer authorises the send.** An agent may prepare and stage it; a person presses go.

## Acceptance

- Sent to the maintainer first, and the one-click unsubscribe exercised on that copy before anyone
  else receives it.
- Then 5, then 10, then the remainder, spread over several days.
- Resend's 100/day free-tier cap respected throughout.
- Hard bounces removed immediately, permanently, before the next stage.
- Complaint and bounce counts recorded in Comments after each stage — this is the only baseline
  future sends will have.
- Any stage showing a complaint stops the sequence and hands back to the maintainer.

## Comments

**2026-10-22. Maintainer stage sent. Status is ready-for-human.**

The maintainer received the first Digest. The one-click unsubscribe ran on that copy. No other person received the Digest.

- Broadcast: `0ba0dd5c-b85d-44f4-8f54-07e102aee1af`
- Segment: `0607bba2-efb2-4229-a08f-422510b16a80` (`digest-stage-maintainer`)
- Email: `01a16151-4074-78eb-ba5d-4b932d410e65`
- Sent at: `2026-10-22T01:54:32.937Z`
- Subject: `The first rnui.dev Digest: 348 Recordings`
- From: `rnui.dev <digest@mail.rnui.dev>`
- Reply-to: `hello@rnui.dev`
- Last event: `delivered` (live read, same day)
- Hard bounces: 0
- Complaints: 0

Resend set contact `ba165218-0c0a-4856-8f4e-fcc057c302c7` to unsubscribed. Do not subscribe that contact again.

The opening is `You are receiving this because you run rnui.dev.` The copy has no `You signed up`. The sent email has no raw unsubscribe token. The copy has no `preview.rnui.dev`.

The agent did not send the 5, the 10, the remainder, or the yahoo group. A person starts the next stage on a later UTC day. Check bounces and complaints before that stage. Join the local address file before that stage. Create the `signup_date` property before that stage.

The suppression list holds one row. `GET /suppressions` reports its `origin` as `bounce` and its `created_at` as `2026-09-27`. That date is 25 days before the first Digest. So that row is a bounce from the ticket 14 probe period. It is not a complaint, and it does not belong to the Digest.

**2026-10-22, later. The maintainer pressed go. The agent prepared every later stage. The agent sent nothing else.**

The maintainer authorised the staged sends in conversation. The agent then did all the work that does not send mail. So each later stage needs only a bounce check and one command.

**The address join exists.** The committed tree holds docIds only. The agent read the 29 addresses from the Firebase console for `rnui-pixellog-d1008`, collection `emails`, and wrote them to `research/survivor-addresses.local.json`. `.gitignore:84` covers that name, so the addresses stay out of the public repo. Every one of the 29 matches the domain that `research/email-groups-2026-08-16.md` already records for that docId. Zero mismatches. The agent did not create a contact for the dropped undeliverable docId, and a read of that address returns 404.

**Every mailable survivor now carries `signup_date`.** 28 contacts exist, and 28 of 28 carry the date that `formatDigestDate` derives from their consent instant in UTC. None of the 28 is unsubscribed. The account holds 37 contacts, which is the 9 it held before plus these 28.

**The maintainer was not resurrected.** Contact `ba165218-0c0a-4856-8f4e-fcc057c302c7` still reports `unsubscribed: true` and still reports `created_at` `2026-08-15 01:00:40`. That is the same row ticket 14 recorded, so nothing re-created it.

Three measurements now shape the code, and each one contradicts an assumption the earlier draft made:

- **The free plan caps segments at three.** A fourth `POST /segments` answers 400: `Your plan includes 3 segments. Upgrade to add more.` `General` and `digest-stage-maintainer` already hold two slots. So every later stage shares one `digest-stage` segment, and the script empties and rebuilds it. The pre-send check therefore compares membership as a **set** against that stage's own addresses. A count check would pass while a member of the previous stage rode along.
- **The list endpoints omit `properties`.** `GET /segments/{id}/contacts` and `GET /contacts` both leave it out. Only `GET /contacts/{email}` returns it, as `{value, type}`. So the check reads one contact at a time.
- **`PATCH` preserves the suppression flag and `POST` clears it.** Measured on a contact with `unsubscribed: true`: a PATCH carrying only `properties` left the flag `true`. Ticket 08 already found that the POST resets it. `setContactProperties` therefore sends no `unsubscribed` key at all, and it is the only write the Digest makes to a contact that already exists.

**The complaint arithmetic in the Question above is stale.** It reasons from ~41 Gmail recipients and calls one complaint 2.4%. That counted the list before the scrub. The scrub left 23 Gmail addresses of the 28, so one complaint is now **4.3%** against Google's 0.3% threshold. The staged plan matters more than the Question states, not less.

**Four sends remain, on four later UTC days.** The commands are `pnpm digest:stage -- --stage <name> --prepare` and `--stage <name> --send`. Prepare sends nothing, and the agent already ran it for all four. Before each send, re-read the bounce and complaint counts for the stage before it. `refuseNextStage` refuses a send on the same UTC day, under 24 hours, with an unremoved hard bounce, or after any complaint.

| Stage | Recipients | Earliest send |
| ----- | ---------- | ------------- |
| five | 5 | 2026-10-23T01:55Z |
| ten | 10 | the next UTC day after five |
| remainder | 11 | the next UTC day after ten |
| yahoo | 2 | the next UTC day after remainder |

Yahoo goes last because `email-groups-2026-08-16.md` records both addresses as `risky` `low_deliverability`. The `digest-stage` segment currently holds exactly the five stage-five members, so `--stage five --send` is the next command and it needs no preparation.
