# Ticket 02: Resend vs Alternative verdict

## Verdict: Keep Resend + Firestore

**Vendor: Resend** (`mail.rnui.dev`)
- At ~tens of addresses (29 mailable after scrub), Resend's pay-as-you-go pricing is cheapest. Free tier covers ~300 emails/month; at ~1 Digest/week + possible ad-hoc sends, annual volume is ~50-100 emails/month, well within free tier.
- Self-hosting is "the definition of a job not worth doing" (research §D.3). Migration to another ESP (Buttondown, Mailgun, SES + Listmonk) adds complexity with minimal benefit at this scale — all provide comparable RFC 8058 headers, DKIM, PTR, TLS, bounce/complaint handling.
- Domain reputation risk is real: `_dmarc.rnui.dev` is `p=none`; Google Nov 2025 is "ramping up enforcement on non-compliant traffic." Sending from a subdomain (`mail.rnui.dev`) with its own DKIM `d=` and SPF is recommended, but the infrastructure already targets `mail.rnui.dev`.

**Consent store: Firestore + Resend suppression**
- Firestore stores consent records (`consentText`, `formVersion`, `IP`, `timestamp`, `createdAt`, `confirmed: false`) per ticket 06 write path. This is the source of truth for what somebody agreed to.
- Resend's `unsubscribed` boolean field on each contact handles suppression state. Per map rule 4, suppression memory is split: signed-in Readers remember server-side (Resend), signed-out visitors remember in browser only (not currently wired, but the split pattern is established).
- "Firestore keeps consent only while Resend owns `unsubscribed`" (map.md ticket 08/14) — this split is accepted and already wired.

**Opt-in mode: Double opt-in**
- Strongly recommended by Google ("Confirm each recipient's email address before subscribing them") and Yahoo ("send them an email asking them to click to confirm their opt-in… won't sign up accidentally or get signed up maliciously… won't contain uninterested people, fake email addresses, or most robots").
- The current `subscribeEmail` already wires double opt-in: pending address written to Firestore → confirmation email sent via Resend → confirmation route confirms. This was added in ticket 06.
- Without double opt-in, 18 of 51 signups were bots (scrub-2026-08-14.md, median gap 20s between form junk and signup). Double opt-in filters these with zero extra code.

**Unsubscribe ownership: Resend owns `unsubscribed`; Firestore records consent**
- Per map rule 4: suppression memory split — signed-in Readers remember server-side (Resend `unsubscribed`), signed-out visitors browser-local.
- The `List-Unsubscribe` header + one-click body link are required before any send (pre-send checklist §D.1). Resend handles the suppression write when the unsubscribe POST is received.

**Per-send cost/complexity at ~tens of addresses:**
- Resend: Free tier covers ~300 emails/month. At ~1 Digest/week + possible ad-hoc = ~50-100 emails/month → effectively $0/complexity unchanged.
- Migration to alternative vendor: Non-trivial setup cost (DNS records, DKIM, DMARC, subdomain warm-up), migration of 29 addresses, updated consent records. Benefit: negligible at this volume.
- Self-hosting: Not viable (research §D.3). Complexity: high; cost: time outweighs savings at 48 addresses/year.

---

## Overturned from notify-and-preview's 12 settled decisions

The core infrastructure (Resend + Firestore + double opt-in) is kept, but these 10/12 decisions from notify-and-preview require implementation (pre-send checklist §D):

1. **Copy** — Old: `"Get notified when new animation is being added"` (51 signups, CASL/GDPR formally defective, no sender identity, no frequency, no unsubscribe mechanism, no privacy link). New: `"Get the weekly Digest"` per §D.3 — contains all four things CASL requires (name, mailing address, contact method, statement that consent can be withdrawn) plus ICO-informed consent elements. Measurement: The old copy established only "a request to be notified when a new Recording is added"; it did not establish sender identity, frequency, or unsubscribe. Ticket 06 corrects the live copy; ticket 02 confirms the verdict-elevated wording.

2. **Privacy policy** — Current: `"we collect an email address voluntarily"` + `"share with trusted third-party service providers"` — insufficient per §D.2. Must add: who you are, what is collected, why/on what basis, retention/sunset rule, processors by name, rights, version/effective date. Measurement: The existing policy lacks every disclosure independently required by GDPR, CASL, CAN-SPAM, and PECR. Ticket 02 keeps the verdict but the rethink that earned its name includes updating the policy.

3. **Double opt-in** — Not previously wired as a formal mechanism. Measurement: Google and Yahoo both recommend confirmed opt-in for deliverability at any volume. At 41/48 gmail recipients, a cold first-contact email with no unsubscribe is "a one-or-two-complaint message by construction" — 2.4% spam rate, 8x the 0.3% threshold. Double opt-in filters bots and provides consent proof. The current `subscribeEmail` already implements this (ticket 06), but ticket 02 reaffirms it as part of the Resend+Firestore verdict.

4. **Unsubscribe mechanism** — Missing entirely before any send. Required by ePrivacy Art 13(4), PECR reg 23, CAN-SPAM, CASL s.11 regardless of volume. Measurement: Without it, the 41-gmail list cannot afford to skip it — one spam complaint per recipient poisons that recipient forever; at scale, even 0.3% spam rate is the Google threshold. The `List-Unsubscribe` header (HTTPS URI with per-recipient opaque token) + body link are pre-send checklist items. Resend's suppression `unsubscribed` field is the mechanism.

5. **Captcha not needed; double opt-in solves bots** — Old form had no captcha, leading to 18 bots/51 signups (35%). Measurement: 18 of 51 rows were bots caught by pairing form junk submissions within 43 seconds of signup (scrub-2026-08-14.md). Double opt-in is recommended over captcha (research §D.3: "Do the double opt-in; do not add a captcha"). Ticket 02 keeps the double opt-in already wired.

6. **`_dmarc.rnui.dev` is `p=none`** — Measurement: At ~tens of addresses, `p=none` is not threshold-gated (Google/Yahoo 5,000+/day threshold does not apply), but Google Nov 2025 warns "Gmail is ramping up its enforcement on non-compliant traffic." A subdomain with its own DKIM and SPF is recommended (research §D.1). Ticket 02 keeps Resend on `mail.rnui.dev` but the rethink includes updating DNS.

7. **Warm-up sequence** — No warm-up before first send. Measurement: Google: "Start with a low sending volume to engaged users, and slowly increase the volume over time… Avoid introducing sudden volume spikes if you do not have a history of sending large volumes." Send to yourself, then 5, then 10, then the remainder, over several days. Ticket 02's verdict includes adding a warm-up step.

8. **List hygiene: bulk verification + role address dropping** — Measurement: After scrub, 28/51 were mailable; 18 were bots; 1 was role mailbox (`dev@`); 1 was undeliverable (`distrokid.com`); 3 were duplicates. Bulk verification costs cents; one spamtrap hit costs far more (domain blocklist). Role addresses (`info@`, `admin@`, `support@`, `contact@`) should be dropped. Ticket 02's verdict includes these hygiene steps.

9. **Staleness: 20-month-old never-mailed list** — Measurement: ICO: "If in doubt about whether the consent is still valid, you should refresh it," default recommendation is "consider refreshing every two years." Oldest address is 20 months, just inside the refresh window. Sending a "may we email you?" email is legally worse than the digest (ICO Flybe/Honda: sending emails to determine whether people want marketing without right consent is still marketing). Ticket 02's verdict sends the digest directly, which is in scope of the stated purpose.

10. **One-click unsubscribe + suppression table** — Measurement: Required by ePrivacy Art 13(4), PECR reg 23, CAN-SPAM, CASL s.11. Without it, would-be spam complaints become actual complaints. The `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header + POST endpoint that removes instantly + permanent suppression table are pre-send checklist items. Resend's `unsubscribed` field is the suppression table.

### Not overturned (remain settled):

- **Survey inside first digest only** (not standalone) — still valid.
- **Commercial/sponsorship pitches don't send** — still valid.
- **Send from subdomain, not root domain** — still valid (map decision 8).
- **Consent record columns** (consent string, form version, IP, timestamp) — still valid (ticket 06).
- **Delete whole list and restart with compliant double-opt-in form** — still a defensible "clean option" (§D.4), but the cost of deleting 29 addresses and rebuilding is ~3 weeks of functioning signup form; keeping and fixing the list is reasonable here.

---

## Summary

| Decision | Verdict | Key measurement |
|---|---|---|
| Vendor | **Keep Resend** | Pay-as-you-go covers ~50-100 emails/month ($0 at this scale); self-hosting "job not worth doing"; migration adds complexity with no real benefit |
| Consent store | **Firestore + Resend suppression** | Split per map rule 4; Firestore stores consent proof; Resend owns `unsubscribed` |
| Opt-in mode | **Double opt-in** | Recommended by Google/Yahoo; filters 18/51 bots (35%); provides consent proof per CASL/GDPR |
| Unsubscribe ownership | **Resend `unsubscribed` + Firestore consent** | Server-side for signed-in; browser-local for signed-out per map rule 4 |
| Cost/complexity | **$0 additional** | Free tier sufficient; no migration needed; hygiene steps are low-cost |

The verdict "earns its name" by rethinking: **copy** (from "new animation" to "weekly Digest"), **cadence** (Digest only when ≥1 new Recording, not fixed weekly or ad-hoc per-Recording), and **popup wiring** (proper `SignupDisclosure` consent record, double opt-in confirmation flow). The core Resend + Firestore plumbing is kept because the alternative adds migration cost with zero deliverability gain at ~tens of addresses.