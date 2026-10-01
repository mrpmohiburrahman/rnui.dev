# Who owns "unsubscribed" — Resend or Firestore?

Status: resolved
Type: grilling
Blocked by: 14

## Question

Decision 12 keeps **Firestore as the source of truth** — that is where `createdAt`, the only
consent evidence, lives. But Resend's one-click unsubscribe is handled inside Resend: someone
clicks, and Resend removes them from *its* audience. Firestore never hears about it.

So if ticket 11's weekly job reads Firestore and syncs contacts into Resend, **it re-adds the
people who just unsubscribed.** Mailing someone who unsubscribed is the single most reliable way
to earn a spam complaint, and at 41 Gmail recipients one complaint is 2.4% — eight times Google's
threshold.

The question is where the unsubscribed flag lives and how a removal in one system reaches the
other. Roughly:

1. **Firestore owns it.** Unsubscribe links point at an rnui.dev route that writes Firestore, then
   calls Resend. Full control; loses Resend's automatic RFC 8058 handling, which was a real reason
   to pick Resend.
2. **Resend owns it, Firestore reconciles.** Keep the automatic handling; the weekly job reads
   Resend's audience before sending and writes any removals back. One extra API call.
3. **Both, with the sync one-directional** — Firestore only ever *adds* confirmed addresses, never
   resurrects a removed one, guarded by a permanent suppression record that is never deleted.

Whatever is chosen, the suppression record must be **permanent and checked at send time**. An
unsubscribe that can be undone by a later sync is not an unsubscribe.

## Acceptance

- One model chosen, with the failure it prevents written down.
- The exact point in ticket 11's job where suppression is checked, named.
- Verified by hand against a real address: unsubscribe, then run the sync, then confirm the address
  is still gone. This is the one thing in the map that must be tested rather than reasoned about.

## Comments

**2026-09-26 — decided, built, and verified by hand. Status `resolved`.**

### The decision: Resend owns "unsubscribed". Firestore keeps no second ledger.

The flag lives on the Resend contact — that is where the one-click POST lands (ticket 14 measured it
setting `unsubscribed: true` and leaving the row in place) and it is what Resend honours when a
broadcast fans out. Firestore keeps the **consent record** and nothing else. Map decision 12 is
untouched: this ticket is about the flag, not the consent, and the two never needed to be the same
store.

### The failure it prevents — and it was live, not hypothetical

**`POST /audiences/{id}/contacts` is an upsert, not a create.** Measured against the live API:

```
POST {email: <existing, unsubscribed:true>, unsubscribed:false}  -> 201
       read back                                                 -> unsubscribed = FALSE
POST {email: <existing, unsubscribed:true>}                       -> 201
       read back                                                 -> unsubscribed = FALSE   (field defaults to false)
POST {email: <existing, unsubscribed:true>, unsubscribed:true}    -> 201
       read back                                                 -> unsubscribed = true
```

So there is **no 409**, and the field defaults to `false` when omitted. The old `addContact` posted
`{email, unsubscribed: false}` unconditionally and caught a 409 that never arrives — its entire
defence was dead code. Any later import — the 29 survivors, a re-run of a staging step, ticket 11's
audience sync — would have silently re-subscribed somebody who had opted out, and the next broadcast
would have mailed them. **A `pnpm broadcast:test` to the maintainer would have done it too.** At 41
Gmail recipients one complaint is 2.4% against Google's 0.3% threshold, and Postmaster Tools is
silent at this volume, so the damage would have been invisible until it was reputation.

This is also what made the privacy policy's retention sentence true by accident rather than by
design. Ticket 07 had to withdraw a stronger promise ("kept on a suppression list indefinitely")
because nothing implemented it; what the page says now — *"a record that it unsubscribed is kept,
because the alternative is a later import silently re-adding you"* — described a guarantee the code
did not actually provide. It does now.

### The mechanism: one write path, split in two

The only function that writes a contact became two, and the split **is** the decision:

| function | may clear `unsubscribed`? | callers |
| --- | --- | --- |
| `ensureContact` | **never** — reads first, returns if the contact exists | imports, ticket 11's audience step, `pnpm broadcast:test` |
| `subscribeContact` | yes | the confirmation route, and nothing else |

`ensureContact` issues `GET /audiences/{id}/contacts/{email}` and returns without writing when the
address is already there, so "never resurrect" is structural rather than a rule everybody has to
remember. `subscribeContact` is the old `addContact`, kept for the one caller where clearing the flag
is correct: the address owner followed a link this server signed and mailed to them, which is fresh
express consent and legitimately overrides an earlier withdrawal.

Nothing deletes a contact, so the flag is permanent by construction as well as by rule.

### The exact point ticket 11 checks suppression — `ensureContact`

Ticket 11's audience step calls **`ensureContact`** per intended address, immediately before
`createBroadcast`, and **must never call `subscribeContact`**. There is deliberately no separate
suppression read: the read is inside the write, which is the only place a resurrection can happen.
The send itself needs no check of its own, because Resend skips an unsubscribed contact when a
broadcast fans out — measured below.

### Verified by hand against a real address

A scratch audience, two addresses seeded, one of them put into the unsubscribed state, then the sync
run over **both** — exactly what an import does:

```
BEFORE the sync:   ticket08-control@…     unsubscribed=false
                   ticket08-suppressed@…  unsubscribed=true

sync: ensureContact over 2 intended address(es)
                   ticket08-suppressed@…  exists=true  unsubscribed=true     <- still gone
                   ticket08-control@…     exists=true  unsubscribed=false

AFTER the sync:    ticket08-control@…     unsubscribed=false
                   ticket08-suppressed@…  unsubscribed=true     <- still gone
```

Nothing was added, nothing was cleared, and the audience size did not move. For contrast, in the same
audience, the **old** write was then run against the suppressed address:

```
old write (POST {unsubscribed:false}) -> 201   •   read back -> unsubscribed = FALSE
```

That is the resurrection, shown side by side with the guard that stops it.

The unsubscribed state was produced with `PATCH {unsubscribed: true}` rather than by sending a second
broadcast and pressing the one-click URL. That is the same write ticket 14 measured the one-click POST
to perform, verified there against a real POST with a real read-back, so the composition is measured
end to end and no further probe broadcast was left in the account. The scratch audience was deleted.

**Resend's own send-time behaviour, measured separately.** A broadcast to an audience holding two
subscribed and two unsubscribed contacts produced **exactly two** email records — the subscribed pair.
The suppressed pair got no record of any kind, so ticket 11 cannot mail an unsubscriber even by
accident, and the flag is enforced by the vendor rather than by our loop.

### Why not the other two options

- **Firestore owns it (option 1).** Resend broadcasts emit the RFC 8058 headers automatically, to
  `unsubscribe.resend.com`; nothing can redirect them to a route of ours, so option 1 means giving up
  the automatic handling that was part of why Resend was chosen. It also cannot work: Firestore denies
  `list` on the signup collection forever and denies `get` on a *confirmed* record, so the recipients
  could never be read back out of it. The audience is the only list that can exist.
- **Both, with a permanent suppression table (option 3).** The permanent record already exists — it is
  the contact's flag — and a second copy in Firestore would need a new collection, a rules change and
  a deploy to store a fact nothing could act on that the flag does not already answer. That is the
  framework this effort was told not to grow. The one case it would cover is a contact being *deleted*
  and then re-imported; nothing deletes contacts, and the policy's "ask and that record will be erased"
  is the only sanctioned deletion.

### Code changed

- `lib/resend.ts` — `addContact` became `subscribeContact`; `ensureContact` and `getContact` added;
  `ContactPage`'s entries gained `unsubscribed`; the 409 catch deleted, because the status it waited
  for does not occur and swallowing a real 409 would now hide a failed re-subscription.
- `lib/subscription-consent-firestore.ts` — the confirm path calls `subscribeContact`, and the
  audience-name comment no longer says ticket 08 is undecided.
- `scripts/resend-broadcast.ts` — `main()` calls `ensureContact`, and `refuseSendReason` now refuses
  when the test recipient itself has unsubscribed, because Resend would deliver nothing while the
  script still printed `sent broadcast …`. That silent success was a real trap for the next person to
  run `pnpm broadcast:test`.
- `tests/resend-broadcast.test.ts` — the two 409 tests are gone and four write-path tests replace
  them: `ensureContact` does not write over an existing contact, does create an absent one, and
  `subscribeContact` posts `unsubscribed: false`; plus a guard case for the suppressed test recipient.
  `pnpm check-types` clean, **474/474 vitest passing**.

### One bounce, and the counters, recorded rather than hidden

The send-time experiment fanned out to two addresses; one was a disposable inbox that **bounced**
(`rnui-t08b-…@uberip.com`), the other delivered. A bounce charged against `mail.rnui.dev` is worth
knowing about even though it came from a throwaway domain, and ticket 10 is where bounce counts are
kept. Free-tier usage after this ticket: **4 sends on 2026-09-27** (two broadcasts, two experiments)
and 9 in the 30-day window, against 100/day and 3,000/month. Four probe broadcasts now sit in the
account and cannot be removed — `DELETE /broadcasts/{id}` refuses anything that is not a draft
(`480d784c…` from ticket 14, `532f874a…` is ticket 05's real test send, `a0368a09…` and `d161c420…`
from this ticket); all four address nobody, and they are named here so a later session does not read
them as debris it should have cleared.
