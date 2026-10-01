# Stand up the sending channel, verified

Status: resolved
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

## Comments

**2026-09-26 — verified against the live service, end to end. All six acceptance bullets met. Status
`resolved`.**

The sending hold was lifted by the maintainer on 2026-09-25, so the two outbound sends below were
permitted rather than taken under it. Everything here is a measurement: the raw headers come from a
message this session sent and then read back **out of the receiving mailbox**, not off the dashboard.

```
Return-Path: <010001a0e0047118-cbb14bbb-a83c-448d-8e2b-aaea8e74104f-000000@send.mail.rnui.dev>
DKIM-Signature: v=1; a=rsa-sha256; q=dns/txt; c=relaxed/simple; s=resend; d=mail.rnui.dev; t=1790464782;
        h=From:Reply-To:To:Subject:MIME-Version:Content-Type:List-Unsubscribe:List-Unsubscribe-Post:Message-ID:Date;
DKIM-Signature: v=1; a=rsa-sha256; q=dns/txt; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono;
        d=amazonses.com; …
From: "rnui.dev" <digest@mail.rnui.dev>
Reply-To: hello@rnui.dev
Precedence: bulk
List-Unsubscribe: <https://unsubscribe.resend.com/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
Message-ID: <010001a0e0047118-cbb14bbb-a83c-448d-8e2b-aaea8e74104f-000000@email.amazonses.com>
X-Entity-Ref-ID: 480d784c-2125-4be6-9bae-ebc83fdbbe50
X-SES-Outgoing: 2026.09.26-54.240.48.63
```

**Bullet 2 — `From:` aligns with DKIM strictly and with SPF only relaxed.** `From:` is
`digest@mail.rnui.dev`, so the From domain is `mail.rnui.dev`. The signature declares
`d=mail.rnui.dev` — the identical string, so **strict DKIM alignment** holds, and DMARC passes on DKIM
alone. The envelope sender is `send.mail.rnui.dev` (`Return-Path` above; its SPF is
`v=spf1 include:amazonses.com ~all` and the delivering hop is `54.240.48.63`, an SES address). That is
a *different* hostname from the From domain, so **SPF aligns only relaxed** — `send.mail.rnui.dev` and
`mail.rnui.dev` share the organizational domain `rnui.dev`. DMARC's relaxed SPF check therefore passes
too, but strict SPF does not; DKIM is what carries the strict alignment.

**For the root domain, which the acceptance asks about.** The From domain's organizational domain is
`rnui.dev`, and it is `_dmarc.rnui.dev` at the apex — `p=none; rua=mailto:hello@rnui.dev` — that
evaluates a `digest@mail.rnui.dev` message, because `_dmarc.mail.rnui.dev` is deliberately empty and
inherits it. So the apex record computes both alignments and sees the same result: strict DKIM, relaxed
SPF. Nothing about the alignment depends on which of the two hostnames DMARC is read from.

**A third thing the `h=` list buys, checked because it is load-bearing.** `List-Unsubscribe` and
`List-Unsubscribe-Post` are both inside the DKIM `h=` list, so Resend signs the one-click headers
rather than emitting them unsigned. Gmail and Yahoo require those headers to be covered by the
signature for the mailbox one-click button to be honoured, so this is the difference between the button
working and the header merely existing. (The `s=resend` key at `mail.rnui.dev` is the 1024-bit one
ticket 05 is still deciding about; the second signature, `d=amazonses.com`, is SES's own and is not
ours.)

**Bullet 4 — the broadcast is created through the API, not the dashboard.**
`pnpm broadcast:test` → `scripts/resend-broadcast.ts` → `createBroadcast()`, which is
`POST /broadcasts` with `audience_id`, `from`, `reply_to`, `subject`, `html`; then `sendBroadcast()`,
`POST /broadcasts/{id}/send`. Both calls are the exports ticket 11's weekly job will use. Broadcast
`532f874a-606f-4801-a2f9-d378b39b1db9` is `sent`.

**Bullet 5, first half — a test broadcast actually delivered to the maintainer.** Resend records it as
email `01a0e000-4ce2-7564-a021-945ad5c5baef`, recipient `mrpmohiburrahman@gmail.com`, subject
`rnui.dev — test send, ticket 05`, `last_event: delivered`, message id
`<010001a0e000c26d-7a8e4720-6319-4876-a75d-8ac40a75ae74-000000@email.amazonses.com>`. It was read
after `last_event` moved `queued` → `delivered` rather than at the first poll. `delivered` is Resend's
250-OK-from-the-recipient-MTA, which is the bar the acceptance set.

**Bullet 5, second half — the one-click `List-Unsubscribe-Post` really does remove the address.** This
is the bullet the effort depends on, and it is the one that needed an address nominated for the
purpose, so it was **not** run against the maintainer's address or against any of the 29. A throwaway
address at a public disposable-inbox service (`rnui-probe-…@uberip.com`) was put in a scratch audience
of its own and sent the same `{{{RESEND_UNSUBSCRIBE_URL}}}` broadcast. Then:

```
POST https://unsubscribe.resend.com/?token=…   Content-Type: application/x-www-form-urlencoded
     body: List-Unsubscribe=One-Click                → 204

before: GET /audiences/{aid}/contacts/{addr}  unsubscribed = false  id = d0b8ff87-8f17-4e6b-94fc-4f7483eb6f38
after:  GET /audiences/{aid}/contacts/{addr}  unsubscribed = true   id = d0b8ff87-8f17-4e6b-94fc-4f7483eb6f38
```

**Exactly what it removes it from, because ticket 08 is built on this.** The POST flips the contact
row's `unsubscribed` flag to `true` **inside that one Resend audience**. The row is **not deleted** —
the same `id` is still there, now `unsubscribed = true`. The unsubscribe JWT claims name the scope:
`{contactId, audienceId, broadcastId, teamId, exp}`. With **no Topics configured** on the account,
Resend documents that flag as "unsubscribed from all emails from your account", so it is
account-global once set. **Firestore is never contacted and never hears about it** — nothing in this
POST touches rnui.dev. That is precisely the gap ticket 08 has to close: a later sync that reads
Firestore and writes contacts into Resend would re-add this address as `unsubscribed: false` unless
suppression is checked at send time.

**The audience is accounted for, before and after.** `General` held exactly one contact before the
send and exactly one after — `mrpmohiburrahman@gmail.com`, id `ba165218-0c0a-4856-8f4e-fcc057c302c7`,
`created_at` `2026-08-15 01:00:40`, `unsubscribed: false`. Same id, same `created_at`, same count. **A
send added nobody**, which is the property the acceptance asked for; `addContact` is idempotent here
and 409s on the duplicate rather than inserting a second row.

**Free-tier counters, since ticket 10's staged send has to fit inside them.** `GET /emails` (the last
30 days) holds five messages, all `delivered`: **2 today** — this session's two broadcast fan-outs —
and 3 on 2026-09-25 from `submission-receipt`. That is **2 of 100/day** and **5 of 3,000/month**, so a
Digest to the 29 survivors is comfortably inside both.

**Cleanup, and one piece of it could not be done.** The scratch audience was deleted
(`DELETE /audiences/{id}` → 200), which takes its contact row with it. The scratch **broadcast could
not** be deleted: `DELETE /broadcasts/{id}` returns `403 validation_error "Only draft or scheduled
broadcasts can be deleted"`. So `480d784c-2125-4be6-9bae-ebc83fdbbe50` remains in the account as a
`sent` broadcast with a subject that says it is a probe. It addresses nobody (its audience is gone)
and is recorded here so a later session does not read it as debris it should have removed.

**What is left is two bullets, and both are the maintainer's, on ticket 05** — bullet 1's DKIM
key-length decision and bullet 6's Google Postmaster TXT. Bullets 2, 3, 4 and 5 are now met, so
[Stand up Resend on mail.rnui.dev](05-stand-up-resend.md) is down to those two.
