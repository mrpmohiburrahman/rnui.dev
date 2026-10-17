# What does the popup look like, matching the Save gate?

Status: resolved
Type: prototype
Blocked by: 03

## Question

Build the cheap concrete thing the maintainer reacts to: a centered modal reusing the Save gate's shell (`rounded-card border-line2 bg-header shadow-2xl`, scrim, focus ring) carrying the subscribe form — email input, Subscribe button, `SignupDisclosure` block, success state ("Check your inbox — the Digest starts once you confirm"), error state, and close path.

Use the `/prototype` skill. Match drop shadow, spacing, and focus behaviour to `GateModal` exactly; do not invent new tokens. Show desktop and phone widths and the already-subscribed silent state. Link the prototype as the ticket's asset; the copy inside follows ticket 04's words.

## Asset

Prototype (throwaway, sub-shape B): `/prototype/subscribe-popup?variant=A|B|C|D`
— `app/prototype/subscribe-popup/page.tsx` +
`components/prototype/subscribe-popup-prototype.tsx` (states, not layouts, per
the no-new-visual-language constraint). A form, B success, C error,
D already-subscribed silent (no modal). GateModal shell copied byte-for-byte;
submit stubbed in-memory; disclosure is the real `SignupDisclosure`. Copy is
interim pending ticket 06 (popup copy). Verified: `tsc --noEmit` clean, all
four variants 200 on the running dev server.

## Answer

**Chosen by the maintainer on 2026-10-09: spacing variant 3, and option C copy — a 400px centered modal at `w-[400px]` rather than GateModal's 320px, field and button stacked, disclosure at 11.5px.** Two throwaway comparison pages were built for it, `/prototype/subscribe-disclosure` (three copy options side by side) and `/prototype/subscribe-spacing` (three spacings, copy fixed).

**Ticket 03 is overridden on width, and only on width.** It ruled "the same centered modal shell as `GateModal`, `max-w-[calc(100vw-48px)]`, no sheet variant, no new tokens". Everything except the width survives byte-for-byte: same scrim `z-[70]`, same `z-[71]` panel, same `rounded-card border-line2 bg-header shadow-2xl`, same focus ring, still a centered modal at every width, still no new tokens. The width moved because 320px minus 16px padding leaves a 288px content box, and the field row shared it with the button, leaving the input about 190px — narrower than the footer's own `max-w-[220px]`. Stacking alone (variant 1) fixed the field but left the disclosure at 10.5px, which reads as texture. Variant 3 does both. **This override is the maintainer's, made with the deviation named on the page in front of them, and it is recorded here so the next session does not "correct" 400px back to 320px.**

**Copy decisions taken here that belong to ticket 06**, all shipped in `lib/sender-identity.ts` rather than left in the prototype:

1. `SIGNUP_DISCLOSURE_BODY` is now `Sent by ${SENDER_NAME} from rnui.dev. Unsubscribe any time.` — option C. The postal address and `hello@rnui.dev` left the site, on the maintainer's instruction, and CASL ECPR s.4(d) is knowingly unsatisfied there. CAN-SPAM 16 CFR 316.4(c)(1) is unaffected because it binds the message: `IDENTITY_BLOCK_HTML` still prints the address in every Digest footer, and the Privacy Policy still prints it at `app/privacypolicy/page.tsx:143`.
2. `CONSENT_FORM_VERSION` moved `2026-09-25.1` → `2026-10-09.1`, because the stored string is the consent evidence and the old records are no longer comparable.
3. The pitch line became its own constant, `SIGNUP_PROMISE`, shown above the field on every surface. It had to leave the disclosure, not just be shortened: the footer's ONLY description of what you were signing up for was the phrase inside `SIGNUP_DISCLOSURE_BODY`, so dropping "once a week" from that string silently left the footer promising nothing. Three copies of the pitch existed across three files and were collapsed into one constant, which the popup prototypes now import rather than restating.
4. `SIGNUP_HEADING` lost "weekly" too. The cadence was promised in five places, not one.
5. The pitch line no longer says "unsubscribe anytime". It sat ten pixels above a disclosure that says "Unsubscribe any time", and the duplicate was most of what made the card feel cramped. The disclosure is the one that counts: `subscribeEmail` stores `consentText: SIGNUP_DISCLOSURE` on every record, so the pitch line is never evidence.

**One item left open and not answered here:** whether `hello@rnui.dev` returns to the disclosure. CASL s.4(d) wants a mailing address AND one of phone, email or web address; option C as drafted dropped both, and "rnui.dev" plus the policy link is only an argument for the second limb, not a certainty. Ticket 06 carries it.
