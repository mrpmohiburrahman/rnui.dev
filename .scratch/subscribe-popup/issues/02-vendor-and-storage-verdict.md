# Keep Resend + Firestore or rebuild the email setup?

Status: resolved
Type: research

## Question

The maintainer chose a full rebuild comparison over keeping the current plumbing. Judge it: Resend on `mail.rnui.dev` + Firestore consent records + double opt-in vs the realistic alternatives (other vendors, audience-only storage, single opt-in), against the actual load — ~tens of addresses, Digest only when ≥1 new Recording, plus possible ad-hoc sends.

The verdict must name: vendor, consent store, opt-in mode, unsubscribe ownership, and per-send cost/complexity at this scale. Anything it overturns from notify-and-preview's 12 settled decisions (notably 10/12 plus tickets 05/06/08/14) must be listed explicitly with the measurement that justifies the overturn — silent drift is not a verdict. If the answer is "keep it," say what "rethink" changed (copy, cadence, popup wiring) so the effort still earned its name.

## Answer

**Keep Resend (raw HTTPS, no SDK) + Firestore consent + double opt-in + Resend-owned unsubscribe — zero settled decisions overturned.** At ~29 addresses the free tier covers all volume and a migration buys nothing. The "rethink" earned its name through copy, cadence, and popup wiring, not plumbing. Note: the raw report's "overturned" table is history already landed via tickets 03–08, not new change — recorded as such in [research/vendor-and-storage.md](../research/vendor-and-storage.md). This unblocks the suppression-memory ticket: a subscribed Reader is already a Resend contact, so the remaining store question is dismissed-without-subscribing Readers.
