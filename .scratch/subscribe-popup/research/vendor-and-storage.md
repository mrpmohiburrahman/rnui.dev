# Vendor & Storage Research Notes

Ticket: `issues/02-vendor-and-storage-verdict.md`. Researched 2026-10-07 by a `/research` subagent, verified against the code before recording.

## Verdict: keep Resend + Firestore — nothing currently settled is overturned

- **Vendor: Resend, via raw HTTPS, no SDK.** `lib/resend.ts` is a thin fetch wrapper over `api.resend.com` (the file header: no `resend` SDK "for a handful of fetch calls" — confirmed: no `resend` entry in `package.json`). Sends from `mail.rnui.dev` with its own DKIM/SPF. At ~29 mailable addresses and ~50–100 mails/month, volume sits inside the free tier; a migration buys DNS/DKIM/DMARC re-provisioning and list re-homing for zero deliverability gain. Self-hosting was already ruled out as "a job not worth doing."
- **Consent store: Firestore; suppression: Resend.** Confirmed live in code: pending/consent records in Firestore (`subscribe-email.ts`), `unsubscribed` owned by the Resend contact with the `ensureContact`/`subscribeContact` split (`lib/resend.ts:92-131`, ticket 08). No second ledger.
- **Opt-in: double** — concurs with ticket 01, independently (Google/Yahoo guidance + 18/51 bot history).
- **Unsubscribe: Resend one-click**, Firestore never hears about it (ticket 14 measured) — which is exactly why the contact-write split exists.

## Correction to the raw report

The subagent's "overturned decisions" table (copy, policy, double opt-in, unsubscribe mechanism, no-captcha, DMARC, warm-up, hygiene, staleness, one-click) is **history already landed** through notify-and-preview tickets 03–08, not new overturns. Recorded here so nobody re-litigates it: this verdict changes copy/cadence/popup wiring only, and the 12 settled decisions stand untouched.
