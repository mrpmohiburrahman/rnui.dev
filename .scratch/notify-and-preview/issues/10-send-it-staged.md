# Send the first Digest, staged

Status: ready-for-agent
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
