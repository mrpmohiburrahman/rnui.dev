# The notification email

Status: ready-for-human
Type: task
Blocked by: 04, 07

## Question

The email that tells the maintainer a Submission arrived — the whole reason the feature exists.
One message per Submission, sent through `lib/resend.ts`'s `sendEmail`, carrying the object key and
a copy-pasteable command rather than an attachment (decision 12 **as amended by ticket 04** — a
presigned link dies at 7 days against a 30-day object).

**The `From:` is already correct — use it unchanged.** `lib/sender-identity.ts` exports
`FROM = "rnui.dev <digest@mail.rnui.dev>"`, and `mail.rnui.dev` was confirmed `verified` with
`capabilities.sending: "enabled"` against the live Resend API on 2026-09-25. This **replaces an
earlier draft of map decision 6** that sent from the apex because `CLAUDE.md` and
`notify-and-preview` ticket 05 both said this subdomain read `pending` — it does not any more.
The apex does not appear in the account's domain list at all, so reuse `FROM`.

Do not touch the `mail.rnui.dev` DNS. `CLAUDE.md` states every edit there makes things worse, and
it is now moot: the records are right and the domain is verified.

`SENDER_NAME`, `POSTAL_ADDRESS`, `CONTACT_EMAIL` and `IDENTITY_BLOCK_HTML` already exist and are
reused, not copied. Do not change `FROM` — a Digest's sender identity is permanent, and changing
it resets reputation that took months to build. **The notification wants no new constant and no
change to `lib/resend.ts`:** `sendEmail({ to, subject, html })` already sends from `FROM` with
`reply_to: REPLY_TO`, which is exactly what this needs.

## Acceptance

- Submitting successfully sends exactly one email to `CONTACT_EMAIL`, through the existing
  `sendEmail` and its existing `FROM` and `reply_to` — **no new constants and no change to
  `lib/resend.ts`.** `hello@rnui.dev` already forwards to the maintainer's inbox through
  Cloudflare Email Routing, so there is no new address to provision.
- The body carries everything an `add-recording` session needs, so the maintainer never opens the
  site to publish: Contributor name, every handle supplied, caption, Category, source URL, the
  compressed file's size, **the Submission's object key, and the copy-pasteable
  `pnpm submissions:open <key>` command from ticket 04.** If a presigned URL is included at all it
  must be labelled with its expiry — the key and the command are the durable part, and the link is
  the convenience that stops working in a week.
- The consent record from ticket 10 is summarised: the disclosure version and the timestamp.
- A send failure does **not** silently discard the Submission. State in a comment what happens
  to the stored object when Resend fails, and confirm it is recoverable — losing somebody's work
  because a vendor 500'd is the worst outcome this feature can produce.
- The notification is not marked as a broadcast and does not touch an audience: it is
  transactional, one recipient, and it must never create a Subscriber.
- **The SENDING HOLD is recorded, not worked around.** `CLAUDE.md` sets it: no mail leaves this
  project until the maintainer lifts it. Prepare and dry-run freely; when the send is ready for
  a real transmission, set `Status: ready-for-human` and name the hold rather than declaring this
  resolved.

## Comments

**Status: `ready-for-human`, and deliberately NOT `resolved` — the SENDING HOLD is why.** `CLAUDE.md`
says: *"no mail leaves this project until they lift it and every open issue in the effort is fixed …
Prepare, stage, draft and dry-run freely; transmit nothing."* That lands on this ticket more directly
than on any other: the deliverable *is* an outbound message. So it is built, unit-tested and
dry-run, and the only thing left is a real transmission, which is the maintainer's to authorise. A
green build does not lift the hold.

### What was built

- `lib/submission-notification.ts` — `submissionNotification(notice) → { subject, html }`. A pure
  builder, so the message's contents are pinned by tests rather than by reading a template.
- `app/api/submit/route.ts` — sends it, last, through the existing `sendEmail`.
- `tests/submission-notification.test.ts` (13 cases) and five more in `tests/submit-route.test.ts`.

**No new constant, no new address, no change to `lib/resend.ts`** — as the ticket required.
`sendEmail` already sends from `FROM` with `reply_to: REPLY_TO`. The recipient is the existing
`CONTACT_EMAIL`, `hello@rnui.dev`, which already forwards to the maintainer through Cloudflare Email
Routing. It is not a broadcast: no audience is touched and no Subscriber can be created, because
`ensureAudience` and `addContact` are never called on this path.

### The acceptance, bullet by bullet

| Bullet | Where it is met |
| --- | --- |
| One email to `CONTACT_EMAIL`, existing `sendEmail` / `FROM` / `reply_to`, no new constants | asserted in the route test against the real `CONTACT_EMAIL` |
| Carries name, every handle supplied, caption, Category, source, size, **key**, **command** | asserted one value at a time in the notification test |
| The consent record is summarised: version and timestamp | asserted — `2026-09-25.1, 2026-09-25T03:00:00.000Z` |
| A send failure does not discard the Submission, and it is recoverable | below |
| Not a broadcast and never creates a Subscriber | `sendEmail` only; the audience calls are unreachable |
| The hold is recorded rather than worked around | this section, and the `Status:` line |

### A send failure keeps the work, and the code says where it went

By the time the send is attempted the object is in the bucket and the consent is recorded, so
**nothing is rolled back**, and the visitor is not asked to send their work again — retrying would
store a duplicate object and write a second consent record for the same Demo, which is worse than a
missing email.

The recovery path is `pnpm submissions:open --list`: it reads the bucket directly from R2 and lists
by key, size and timestamp, so an unnotified Submission appears there as an object the maintainer has
no memory of, which is exactly the signal. It has 30 days before the lifecycle rule takes it.

The honest cost, recorded at the call site rather than glossed: the handler still returns `ok: true`,
so in that one failure the form tells the visitor their Submission reached the maintainer when it
reached the bucket. Refusing the request instead would be the bigger lie and would risk losing the
work — the outcome this ticket names as the worst the feature can produce.

### Dry run

`submissionNotification` rendered with a realistic notice and written to
`/tmp/notification-dry-run.html`, with **`sendEmail` never called**:

```
To:      hello@rnui.dev
Subject: New Submission: Radial FAB — Hewad Mubariz

Contributor   Hewad Mubariz
GitHub        hewad-mubariz
X             hewadM1
Caption       Radial FAB
Category      Buttons
Source        https://github.com/example/radial-fab
Demo size     80.1 KB
Consent       2026-09-25.1, 2026-09-25T03:00:00.000Z

Open it with:
pnpm submissions:open 01JD7Q9XKT3M8ZPW4R2YV6B1C0.mp4
```

LinkedIn was left empty on purpose and comes through **absent rather than blank**, which is what the
test pins: a blank row reads as "has a LinkedIn we could not read" and sends the maintainer looking
for something that does not exist.

**The escaping is not cosmetic.** Every interpolated value is a stranger's text rendered as HTML in
somebody's mail client. A caption of `<a href="https://evil.example">Open the Dashboard</a>` would
otherwise arrive wearing rnui.dev's sender reputation — mail clients block script, but they do not
block a forged link. Five cases cover it, including that `&` is escaped first so an entity is not
double-escaped.

### What is left, and who does it

**The maintainer, and only the maintainer: authorise the first real transmission.** That means lifting
the hold and letting one Submission through end to end — which also needs the deployed route, so it
follows a push and the Vercel environment variables ticket 07 named. Until then this ticket cannot be
`resolved`: its deliverable is a message that has not been sent, and the hold says that is not an
agent's call.

**Still true of the pipeline around it:** a real Turnstile token has never traversed the route (ticket
07), and `/submit` is not live on `rnui.dev` — production is `main` while this work sits on
`feat/studio-dark`.

**Gates:** `check-types` clean, `lint` clean, `test` 23 files / 386 passing, `rules:verify` 41/41,
`pnpm build` OK with `ƒ /api/submit`.
