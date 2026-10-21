# Opt-in & Cadence Research Notes

Ticket: `issues/01-opt-in-and-cadence.md`. Researched 2026-10-07 by a `/research` subagent, verified against the code before recording.

## 1. Single vs double opt-in

**Verdict: double opt-in stays.** The flow already exists end to end — `subscribeEmail()` writes a pending record (`confirmed: false` + consent text, form version, IP, timestamp), mails an HMAC-signed token link (`lib/subscribe-token.ts`), and `app/api/confirm-subscription/route.ts` spends the token and only then admits the address to the Resend audience. It is simultaneously the proof-of-consent record and the bot filter (18 of the original 51 signups were bots filing junk within 43 seconds — `notify-and-preview/research/scrub-2026-08-14.md`), which is why no captcha was added (`research-consent-and-deliverability.md` §D.3: "Do the double opt-in; do not add a captcha"). The pre-ticket-06 form was single opt-in with no confirmation, no consent sentence, no privacy link; ticket 06 is what added the confirmation.

## 2. Confirmation email shape & expiry

Subject "Confirm your rnui.dev Digest subscription"; body asks to confirm, links "Yes, confirm my address" at `/api/confirm-subscription?token=…`, carries the full `SIGNUP_DISCLOSURE` plus identity block, and tells a non-requester to ignore it. No time-based expiry by design — the token is `id.HMAC(id)`, not a JWT, with no `exp` (`subscribe-token.ts`: "no expiry to encode"); the link dies on use (spent token confirms identically to a forged one, by intent). Rotating `SUBSCRIBE_TOKEN_SECRET` invalidates all outstanding links. No expiry change recommended.

## 3. One disclosure for weekly + ad-hoc

One disclosure can cover both **only without a fixed-frequency promise**. The current `SIGNUP_DISCLOSURE_BODY` commits to "once a week" (`lib/sender-identity.ts:67-71`), which ad-hoc sends would break — and some weeks have nothing new. Resolution for the copy ticket: reword to a non-committal frequency ("when new Recordings land" / "periodically") and bump `CONSENT_FORM_VERSION` when it changes, since the string is the stored consent evidence.
