# Subscribe popup — first-visit inbox capture

Wayfinder map. Label: `wayfinder:map`. Charted 2026-10-07 with the maintainer, in one `/wayfinder` session.

## Destination

A build-ready spec for a first-visit scroll-triggered subscribe popup that captures email addresses for later sends (Digest cadence undecided — weekly or ad-hoc), **plus** a judged verdict on whether the email setup itself should change. Reached when the opt-in mode, the vendor/storage choice, the popup's trigger, look, memory, and consent wiring are all decided and nothing is left to decide before build.

## Notes

**Domain.** `CONTEXT.md` is binding: a catalogue record is a **Recording** (never animation), a confirmed address is a **Subscriber** (never user/lead), the email is the **Digest** (never newsletter/blast), a signed-in person is a **Reader** (never user/account). Copy from the old form saying "new animation" is already ruled wrong — ticket 04 fixes the words.

**Skills every session should consult.** `/grilling` + `/domain-modeling` for every decision ticket; `/research` for the two AFK tickets; `/prototype` for the modal ticket.

**Standing preferences settled at charting (bind every ticket):**

1. The popup matches the Save gate's centered modal (`components/sign-in-control.tsx` GateModal: `rounded-card border-line2 bg-header shadow-2xl`, scrim + focus ring, reduced-motion aware) — no new visual language.
2. Consent and measurement are reused, not reinvented: `SignupDisclosure` text, `app/actions/subscribe-email.ts`, `newsletterSubmitted(path)` with no address in the event.
3. Copy promise is honest: new Recordings, Digest sent only when there is something new, confirm once, unsubscribe anytime. No fixed-weekly promise, no per-Recording instant-alert promise.
4. Suppression memory is split: signed-in Readers remember server-side and cross-device (subscribe or dismiss recorded once, never shown again on any device); signed-out visitors remember in the browser only (clearing cache or a new device shows it again).
5. Trigger is once-per-browser, scroll-depth **plus** a short time delay (the maintainer chose both). Exact pixels/seconds are decided in the placement ticket, not here.

**Carry-over facts (do not re-prove):** double opt-in with HMAC token over the Firestore document id, `subscribe-email.ts` + `app/api/confirm-subscription`, consent record (`consentText`, form version, IP, timestamp), Resend on `mail.rnui.dev`, Firestore keeps consent only while Resend owns `unsubscribed` (tickets 08/14). A "rethink" verdict must say what it overturns and why — it does not silently discard these.

## Decisions so far

<!-- one line per closed ticket: gist, then the link -->

- [Is a confirmation email the right call, and what cadence may the list carry?](issues/01-opt-in-and-cadence.md) — double opt-in stays (consent proof + bot filter); link dies on use with no time expiry; disclosure must drop "once a week" to cover ad-hoc sends
- [Keep Resend + Firestore or rebuild the email setup?](issues/02-vendor-and-storage-verdict.md) — keep everything (raw-HTTPS Resend, Firestore consent, Resend-owned unsubscribe); zero settled decisions overturned; the "overturn" table was already-landed history
- [Where may the popup fire, and what wins a crowded screen?](issues/03-placement-and-stacking.md) — `/` and `/products` only at 350px + 5s both-required, once per browser; the GateModal shell verbatim at every width; fade-only under reduced motion; on crowding the popup loses both ways — it dies for the visit rather than queueing, so the Save gate always wins and nothing re-arms it
- [What does the popup look like, matching the Save gate?](issues/04-popup-prototype.md) — a 400px centered modal, overriding ticket 03 on width alone because 320px left the email field narrower than the footer's own; field and button stacked, disclosure at 11.5px. Its copy decisions shipped: the paragraph is "Sent by MD. MOHIBUR RAHMAN from rnui.dev. Unsubscribe any time." with no address on the site, `CONSENT_FORM_VERSION` bumped to `2026-10-09.1`, and the pitch line split out into `SIGNUP_PROMISE` so the footer no longer promises nothing
- [How is "never show again" remembered for Readers vs visitors?](issues/05-suppression-memory.md) — D1 `reader_prefs`, one row per verified `sub`, permanent one-way suppression (`dismissed` upgrades to `subscribed`); the read piggybacks the `GET /api/saved-demos` that `SiteHeader` already fires on every page, writes get `POST /api/reader-prefs`; unknown state fails toward showing. Visitors reuse `newsletterSubscribed` untouched and add one dismissal-only key — no cookie, no Firestore rules change, no reset UI
- [What exact words does the popup say?](issues/06-popup-copy.md) — `hello@rnui.dev` stays off: the disclosure's own "See our Privacy Policy" link lands on a page publishing both the postal address and the contact email, so s.4(d) is satisfied by reference rather than by omission, which corrects ticket 04's premise. "Subscribe" and "Check your inbox — the Digest starts once you confirm." ratified; two stale comments recorded as a build-time fix
- [Does the popup fight the PostHog prompts that are already live?](issues/07-prompt-interleave.md) — no awareness of any of it: the Try-the-Preview popover was stopped and `preview-survey.tsx` deleted before this ticket answered, and the exit survey's popover (z-index 2147483645, above the scrim) is an accepted rare overlap, not a defect. The popup never touches `$last_seen_survey_date`; its whole footprint is one `newsletter_submitted` event

## Not yet specified

<!-- `Suppression-store shape` graduated to ticket 05; `Prompt interplay` to ticket 07. -->

- **Sunset and hygiene for popup-acquired addresses.** Whether zero-engagement rules or tracking changes apply; the published policy currently says no open/click tracking, so turning any on bumps the policy version.
- **Instant alerts vs Digest.** Whether "any time I want" ever becomes per-Recording mail or stays manual Digests; the map promises only the Digest rule until decided.
- **Inbox placement under new volume — dependency now discharged, due to be re-examined.** `_dmarc.rnui.dev` is `p=none`; whether popup-driven growth changes deliverability posture was parked on the vendor verdict, and that verdict landed (keep Resend + Firestore). The question is now unblocked but still unsharpened: it is a function of the list size the popup actually wins, and nothing has measured that yet. Ticket it before any deliverability work.

## Out of scope

- **Changing sign-in itself.** The Save gate's auth flow, providers, and account panel are untouched; this map only reads signed-in state, never modifies it.
- **Standalone survey mail and commercial mail.** The survey travels inside a Digest if at all; sponsor pitches and third-party promotion are not this effort (notify-and-preview decisions 1–2 stand).
- **Auto-publishing and upload paths.** Public-submissions non-goals carry over: nothing here publishes Recordings or touches R2/transcoding.
