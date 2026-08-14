# Who owns "unsubscribed" — Resend or Firestore?

Status: ready-for-agent
Type: grilling
Blocked by: 05

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
