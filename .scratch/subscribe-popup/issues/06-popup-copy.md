# What exact words does the popup say?

Status: resolved
Type: grilling
Blocked by: 01

## Question

Lock the popup's words once the opt-in verdict (ticket 01) lands. Constraints are fixed: Recording (never animation), Subscriber (never user), Digest (never newsletter); honest frequency (only when new Recordings land — no fixed-weekly promise); confirm-once + unsubscribe-anytime; reuse the `SignupDisclosure` disclosure rather than writing a second consent story.

Decide: headline, one-line promise, button label, success copy, and whether the privacy-policy link or version needs a bump for the popup surface. Keep it to words — visual treatment belongs to ticket 04.

Note (from 01, now resolved): the current `SIGNUP_DISCLOSURE_BODY` commits to "once a week" — reword to a non-committal frequency and bump `CONSENT_FORM_VERSION`, since the stored string is the consent evidence.

## Note from 04, and most of this ticket is already decided

Ticket 04 was a prototype ticket and the maintainer reacted to it in conversation, so these shipped in `lib/sender-identity.ts` rather than waiting here. **Do not re-decide them; read the current constants and settle only what is left.**

Already done, all verified live:

- **Headline** — `SIGNUP_HEADING` is `"Get the Digest"`. The "weekly" came out; it was a second promise of a cadence the schedule does not keep.
- **Promise** — `SIGNUP_PROMISE` is `"New Recordings, only when there is something new. Confirm once."`, its own constant shown above the field on every surface. It had to leave `SIGNUP_DISCLOSURE_BODY`: the footer's only description of what you sign up for was inside that string.
- **Disclosure** — `"Sent by MD. MOHIBUR RAHMAN from rnui.dev. Unsubscribe any time."` Option C. Postal address and `hello@rnui.dev` removed from the site at the maintainer's instruction; CASL ECPR s.4(d) knowingly unsatisfied there, CAN-SPAM unaffected because the address stays in every Digest footer via `IDENTITY_BLOCK_HTML`.
- **Version** — `CONSENT_FORM_VERSION` is `2026-10-09.1`, bumped from `2026-09-25.1`.
- **Cadence** — "once a week" left five places, not one: the disclosure, the heading, `/subscribe` body prose, the `/subscribe` meta description, and the Privacy Policy's description of the Digest.

**Left to settle here:**

1. **Does `hello@rnui.dev` go back into the disclosure?** CASL s.4(d) wants a mailing address AND one of phone, email or web address. Option C dropped both, so only the first limb is knowingly missed; "rnui.dev" plus the policy link is an argument for the second, not a certainty. About eighteen characters.
2. **Button label and success copy.** "Subscribe" and "Check your inbox — the Digest starts once you confirm." are what shipped and were prototyped, but neither has been ratified on the record.

## Answer

**`hello@rnui.dev` stays off. Button and success copy ratified as shipped. The consent request satisfies CASL s.4(d) by reference, not by omission.**

### The address was never off the site — ticket 04's premise was wrong

The carried-over note said option C "dropped both" the mailing address and the contact method, leaving only the first limb knowingly missed and the second an argument. That is not what the code does. `SIGNUP_DISCLOSURE` is `SIGNUP_DISCLOSURE_BODY` **plus** `SIGNUP_DISCLOSURE_POLICY_SENTENCE` (`lib/sender-identity.ts:130`), and `components/signup-disclosure.tsx` renders that second half as a live link to `PRIVACY_PATH` = `/privacypolicy`. That page publishes:

- `POSTAL_ADDRESS` — "Halima Nagar, Cumilla 3502, Bangladesh" — at `app/privacypolicy/page.tsx:143`, rendered as its own paragraph specifically so ticket 04's requirement holds, and
- `CONTACT_EMAIL` — "hello@rnui.dev" — as a `mailto:` at `app/privacypolicy/page.tsx:103-109`, in the paragraph immediately below the address.

So every element s.4(d) asks for is inside the consent request's own string, one click from where consent is given, and the consent record stored by `subscribeEmail` carries the link. What ticket 04 removed was the address *from the form*; the address was never off the site's reachable surface. `CONTACT_EMAIL` is also `REPLY_TO`, so it is the reply address on every Digest that has ever been sent — it is a standing published channel, not a secret being withheld.

**Adding 18 characters back buys nothing that is not already there**, and re-adds precisely the density ticket 04 removed from a line that renders at 11.5px inside a 400px modal. The honest statement of the posture is stronger than the one this ticket was carrying: not "CASL s.4(d) is knowingly unsatisfied" but "s.4(d) is satisfied by reference through a link that is itself part of the stored consent string." That is a defensible reading, not a certainty, and it is recorded as such.

### Ratified as shipped

- **Button — "Subscribe".** One word, the plainest verb available, and it names the thing the reader becomes (a **Subscriber**), which is exactly what the domain calls it. "Send me the Digest" is the better label *only* on the signed-in Reader's prefilled one-tap path, where the address is already known and no typing happens; that is a surface state, not the default, and it does not displace this one.
- **Success — "Check your inbox — the Digest starts once you confirm."** Accurate against ticket 01's double opt-in with a link that dies on use: "starts once you confirm" is literally true, and it tells the reader the one action the confirmation link requires, which is the step people otherwise miss.

No further copy changes. The cadence purge is confirmed complete across all five sites (disclosure, heading, `/subscribe` body, `/subscribe` meta description, Privacy Policy's description of the Digest), and the privacy-policy version does **not** need a bump for this ticket: no new data is collected, no new third party is involved, and the disclosure string itself did not change in this ticket.

### Two stale comments that will reverse a settled decision

Both of these still assert the pre-option-C string and must be corrected in the same pass as any build, or a later session will read them and "fix" the disclosure back:

- `components/signup-disclosure.tsx:6` — "Name, mailing address, contact method and the right to withdraw are all in the string". The mailing address and the contact method are **not** in the string any more.
- `lib/sender-identity.ts:8-11` — "name, mailing address, contact method, and that consent can be withdrawn, all four present". Same defect.

Left as a build-time action rather than done here: wayfinder produces decisions, not edits. This is the same hazard ticket 04 recorded for the 400px width — a comment that reads as an instruction and is now the opposite of one.

### Recorded on the record

The maintainer deferred both items to the agent's judgement rather than choosing between the options, having said they could not judge the compliance question. The decision above is therefore the agent's recommendation *accepted*, not a preference the maintainer was consulted on — flagged so a later session can revisit it without re-litigating the reasoning, and without reading acceptance as informed sign-off on the legal reading.
