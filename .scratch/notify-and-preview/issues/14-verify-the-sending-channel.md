# Stand up the sending channel, verified

Status: ready-for-agent
Type: task

## Question

This is the agent half of [Stand up Resend on mail.rnui.dev](05-stand-up-resend.md), split out so the
work can proceed. Ticket 05's own text predicted it: *"Unattended, then an agent — when Resend flips
to `verified`, `pnpm broadcast:test` sends the test Digest, and the last three bullets can all be
closed in one sitting."*

**That condition is met.** Measured 2026-09-25: `GET /domains` returns `mail.rnui.dev` as `verified`
with `capabilities.sending: "enabled"`, and `send.mail.rnui.dev` carries its SPF and its SES feedback
MX. Ticket 05 keeps the two bullets only the maintainer can move: bullet 1's DKIM key-length decision
and bullet 6's Google Postmaster TXT.

Everything here is a verification against the real service. Nothing is reasoned about, and nothing is
assumed from the dashboard.

## Acceptance

- **Bullet 2 of ticket 05: `From:` aligned to SPF or DKIM.** State which of the two it aligns with and
  why, using the fact that `From:` is `mail.rnui.dev`, the DKIM `d=`, and that
  `send.mail.rnui.dev`'s SPF covers `amazonses.com`. Record the alignment for the **root** domain too,
  since DMARC at the apex is what evaluates it.
- **Bullet 4: a broadcast created through the API, not the dashboard.** Resend cannot send a
  dashboard-drafted broadcast programmatically, and ticket 11 fires one from CI, so a broadcast that
  only exists in the dashboard is not evidence. Name the script and the call it makes.
- **Bullet 5, first half: a test broadcast actually delivered to the maintainer.** Record the message
  id, the recipient, and Resend's own `last_event` for it. `delivered` is the bar, and it means a
  250 OK rather than an inbox.
- **Bullet 5, second half, and this is the one the effort depends on: the one-click
  `List-Unsubscribe-Post` verified to actually remove the address.** Send the POST, then read the
  audience back and confirm the contact is gone — then say **exactly what it was removed from**,
  because ticket 08 is built on knowing that, down to whether Firestore ever hears about it.
- **The audience is accounted for before and after**: its size, and the fact that no contact was
  created that did not already exist. A send must not add anybody.
- **What a send does to the free-tier counters is recorded** — sends used today against the 100/day
  cap, and the month's total against 3,000 — since ticket 10's staged send will need to fit inside it.

## Notes

- **It carries no `Blocked by:` line, and that is the convention rather than an oversight.** The one
  condition this ticket had was the domain reaching `verified`, and that is met. It is deliberately
  *not* blocked by ticket 05, because 05 stays open on two maintainer bullets and blocking here would
  reproduce the six-week stall this split exists to end.
- The maintainer's address is `hello@rnui.dev`, which Cloudflare Email Routing forwards. The
  unsubscribe test must target an address nominated for the purpose rather than a real subscriber, and
  the acceptance says so above.
- `pnpm broadcast:test` exists (`scripts/resend-broadcast.ts`). Read it before running it: it was
  written for ticket 05's step and has never run against a verified domain.
- Anything that reads the audience is measured against Resend, not Firestore. Decision 12 keeps
  Firestore as the source of truth, and this ticket is where the gap between them becomes visible.
