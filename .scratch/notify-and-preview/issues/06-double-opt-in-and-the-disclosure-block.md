# Give the signup form double opt-in and a disclosure block

Status: ready-for-agent
Type: task
Blocked by: 04

## Question

Every address collected from today must carry provable consent, so this problem never recurs. Two
changes to one form.

**Double opt-in, and no captcha.** Confirmed opt-in is simultaneously the proof-of-consent record
that does not currently exist *and* the bot filter that does not currently exist. One mechanism,
both problems — which is why the captcha is deliberately not added. Google and Yahoo both
recommend it.

**The disclosure block.** Satisfying CASL's ECPR s.4 at the point of capture — name, mailing
address, contact method, purpose, and a statement that consent can be withdrawn — satisfies GDPR's
informed limb automatically. Ticket 04 supplies the verbatim text.

The build is small because the repo already has every pattern: `app/actions/subscribe-email.ts` is
the write, `app/api/counters-collection/route.ts` is the route-handler shape,
`lib/counters-firestore.ts` is the Firestore access. Roughly 60 lines across two files. Resist
making it more — see `/ponytail`.

Note the current copy says "new animation", which `CONTEXT.md` lists under _Avoid_. This is the
moment to fix it. Also note `studio-dark` decision 9 moves this form into a fourth footer column,
`NOTIFY`, on every route — coordinate rather than collide.

## Acceptance

- Submitting writes `confirmed: false` with an opaque token; the address is **not** a Subscriber
  and never enters the Resend audience until confirmed.
- A confirmation email sends on submit.
- A confirm route flips the flag and adds the contact to the Resend audience.
- Stored per record: the consent string shown, the form version, IP, and timestamp.
- Form copy carries ticket 04's disclosure block and links the privacy policy.
- "animation" replaced with the domain's own vocabulary.
- No captcha added.
- One runnable check covering the token path: an unconfirmed address never reaches the audience,
  and a token cannot be replayed.
