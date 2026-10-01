# Verify it end to end

Status: ready-for-human
Type: task
Blocked by: 07

## Question

Prove the receipt arrives, and prove it to the standard the other effort's ticket 09 was
held to rather than to a green test suite. That means a real Submission through the
deployed form and Resend's own record of what was sent.

1. **One real Submission, through the deployed route.** Not a stubbed challenge and not a
   unit test: the same path a stranger takes, because every failure this map worries about
  , a filtered message, a wrong address, a receipt that never fires, is invisible
   otherwise.

2. **Read it back from Resend rather than from the inbox alone.** `GET /emails` lists what
   was sent and `GET /emails/{id}` returns the body, which is how the notification was
   verified. Do the same here: the recipient, the subject, the body, and `last_event`.
   `delivered` is the only acceptable value, and a `bounced` or `complained` is a finding
   for ticket 03, not a flake to retry.

3. **Check the deliverability question for real.** Ticket 03 could not settle whether a
   first-contact message lands. This is where that is answered, so record where the
   message actually ended up, not just that Resend accepted it. A receipt in a spam folder
   is a failed receipt, and the whole point of the effort is that the Contributor is not
   left wondering.

4. **Confirm the addressing did not leak.** Exactly one message to the Contributor, one to
   the maintainer, and nothing added to the audience. Check the audience directly rather
   than trusting the code path.

**The SENDING HOLD gates this ticket.** `CLAUDE.md` says no mail leaves the project until
the maintainer lifts it, and only they lift it. So this ticket cannot resolve on an
agent's schedule: set `Status: ready-for-human` and name the hold, exactly as the
notification ticket did, rather than declaring it done.

## Acceptance

- A real Submission through the deployed form, with its object key and timestamp.
- Resend's record of the sent receipt: recipient, subject, body, and `last_event`.
- Where the message landed, from the recipient's side, not from Resend's.
- The audience checked directly and unchanged.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and `pnpm rules:verify` all exit 0, and a
  build.
- `Status: ready-for-human` with the hold named, if the hold still stands when this runs.

## Comments

**`ready-for-human`, and the hold is not what stops it.** The hold was lifted on 2026-09-25. What
stops this is that **Turnstile will not issue a token to an automated browser**, so the deployed
form cannot be driven by a script. That is the control working, and it is worth recording as a
property of the system rather than as a gap in this ticket.

### What was attempted, and what came back

Bundled Chromium, and then the real Google Chrome with a persistent profile, both headed, both
filling the form, attaching a clip and ticking consent. Three runs, and each one ended the same way:

```
frames on the page:
  https://preview.rnui.dev/submit
  https://vercel.live/_next-live/feedback/feedback.html?dpl=...
  https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/f/av0/rch/.../0x4AAAA...
```

The challenge frame's own title is **`Checking your Browser…`**, and it contains **no clickable
elements at all**: `input[type="checkbox"]` 0, `label` 0, `button` 0. So there was nothing to click
and no token was ever issued. The widget's first state does draw a "Verify you are human" checkbox,
which is what the first screenshot shows, and the challenge escalates past it.

**The bucket stayed at one object across every attempt**, so the refusals cost nothing and nothing
half-written was left behind.

**A stealth flag was available and was not used.** `--disable-blink-features=AutomationControlled`
would remove `navigator.webdriver` and give a better chance of passing. It was declined on purpose:
defeating the anti-bot control, even on the maintainer's own site, would prove that a bot can pass
the check, which is the opposite of what this control is for, and it would not tell us anything
about whether a real person can submit. That is a judgement worth having on the record rather than
silently making.

### What this means for the ticket, and for the map

**One acceptance bullet cannot be met by an agent at all**: a real Submission through the deployed
form. It needs a person with a browser. The earlier Submission in the bucket does not count, because
it predates the email field and therefore has **no address**, which is why its own notification has
no `Reply to` row.

So the ticket stays `ready-for-human` with one action in it, and the rest is done below.

### What was verified, for real

**The receipt, sent and read back from Resend.** The route's post-challenge code, using the same two
imports the route uses, with the real Submission's own values read out of the notification:

```
id            01a0d8e4-9f6a-76d7-afb7-0697c531f227
from          rnui.dev <digest@mail.rnui.dev>
to            ['hello@rnui.dev']
subject       We have your Demo
last_event    delivered
created_at    2026-09-25 14:07:37.011+00
```

Body, from `GET /emails/{id}`:

```
Hello hello,

Your Demo arrived. Thank you for sending it to rnui.dev.

he (Arc Sliders)

Every Submission is looked at by hand, and you will hear from us either way: if it is published, and if it is not.

If it is published, you are credited as "hello" with the profile links you gave. If it is not, the file is deleted within 30 days of arriving.

Nothing is needed from you.

rnui.dev, MD. MOHIBUR RAHMAN

Halima Nagar, Cumilla 3502, Bangladesh

hello@rnui.dev
```

That is ticket 02's wording, escaped, with the identity block, and `delivered` rather than merely
accepted. The caption and the Contributor are junk values from the maintainer's own quick test,
which is what makes them the right thing to test with.

**Sent to `hello@rnui.dev` rather than to a stranger**, because the only real address in this
pipeline is the maintainer's own, and the Submission that has an address is the one that has to be
made by hand.

### Where the message landed, from the recipient's side

**Not verifiable here, and this is the honest limit.** Resend reports `delivered`, which is a 250
from the receiving server and not an inbox. Confirming otherwise needs somebody to open the mailbox,
which is the same person the action above needs.

### The audience, checked directly

```
contacts: 2
  ticket06-probe@rnui.example
  mrpmohiburrahman@gmail.com
```

Both predate this effort. Neither the receipt, the notice, nor anything else sent in this session
appears in the audience, so the transactional promise holds: **one message to the Contributor, one
to the maintainer, nothing subscribed.**

### Gates

`pnpm check-types` 0, `pnpm lint` 0 errors, `pnpm test` 452 passing across 26 files,
`pnpm rules:verify` 42/42, `pnpm build` clean. Three of the four messages exist in Resend's record
and all three are `delivered`.

### What is left, precisely

1. Open `https://rnui.dev/submit` or `https://preview.rnui.dev/submit` in a browser.
2. Submit anything with an address you can read.
3. Say whether the receipt arrived, and where it landed.

That is the whole of it.
