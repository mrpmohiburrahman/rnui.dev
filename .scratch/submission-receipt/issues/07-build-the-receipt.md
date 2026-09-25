# Build the receipt

Status: resolved
Type: task
Blocked by: 02, 03, 04, 05, 06, 09

## Question

Write the code. The shape is settled by everything above and by
`lib/submission-notification.ts`, which is the closest precedent and is worth reading
before writing a line: a pure builder a test can import, and one `sendEmail` call in the
route handler.

Deliver:

- **A pure builder**, `lib/submission-receipt.ts` or similar, exporting something shaped
  like `submissionReceipt(notice) -> { subject, html }`. Pure, so the wording ticket's
  sentences are pinned by tests rather than by reading a template.
- **One `sendEmail` call** in `app/api/submit/route.ts`, after the notification and **behind
  `if (notified)`**. Ticket 06 decided the skip and the reason is at the call site: a receipt
  sent without a notification promises an outcome nobody knows to send. What that leaves to
  test is that the skipped path sends nothing, which `tests/submit-route.test.ts` can pin by
  failing the notification and counting the calls.
- **HTML escaping**, exactly as the notification does it. Every interpolated value is a
  stranger's text, and a caption is not less dangerous in a receipt than in a
  notification.
- **A single-line subject**, with whitespace collapsed, for the same reason.
- **No new constant and no change to `lib/resend.ts`**, unless ticket 04 decided
  otherwise and said so.
- **A comment at the call site** recording what a failed receipt does, from ticket 06, so
  it is not re-litigated by the next reader. Ticket 06 has already written the first half of
  this at the send; extend it rather than replacing it.
- **The either-way arm of the form's success copy**, in `app/submit/page.tsx`, behind the
  `notified` flag the response already carries. Ticket 06 left the flag wired and the copy
  deliberately unbranched, because the promise cannot be made before a receipt exists to keep
  it: "Thank you, your Demo was received. We will email you either way." when `notified`, and
  the present sentence when it is not.
- **A decision about the plain-text part, graduated out of the fog by ticket 03.** Resend
  auto-generated one for the HTML-only notification and the research measured it as lossy,
  labels running into their values, while Resend's own Deliverability Insights flags
  "missing plain text versions". So: auto-flatten, hand-write the string, or opt out of a
  check the vendor flags. Pick one, say why in a comment, and note the alternative rather
  than leaving the next reader to rediscover that there was a choice.
- **Tests**: one per sentence of the wording, one for the escaping, one for the subject
  shape, and one in `tests/submit-route.test.ts` proving exactly one receipt is sent and
  that it carries the right address.

**The receipt is transactional and must stay that way.** No audience, no
`ensureAudience`, no `addContact`, no unsubscribe link. If nothing else here is obeyed,
this one is: adding a Contributor to the Resend audience would turn a receipt into a
subscription nobody consented to.

## Acceptance

- The builder is pure and importable without a network, a secret or Firestore.
- Exactly one receipt per Submission, sent only on success, after the object and the
  consent record exist.
- Nothing in the send path touches the Resend audience.
- A receipt failure does not roll back the object, the record or the notification, per
  ticket 06's answer.
- The receipt is not sent at all when the notification failed, per ticket 06's
  compounding-case answer, and is sent when it did.
- The form's success copy offers the either-way promise when `notified` and does not when it
  is false.
- Every interpolated value is escaped, with a test that would fail if it were not.
- `pnpm check-types`, `pnpm lint` and `pnpm test` all exit 0.
- No em dashes anywhere in the added code, strings or comments.

## Not in this ticket

Sending it. The **SENDING HOLD** covers this, so the build stops at a dry run, and
[Verify it end to end](08-verify-it-end-to-end.md) is where a real transmission lives.

## Comments

**Resolved**, because this ticket's own acceptance never needed a transmission. Its last
section puts sending in ticket 08, and every bullet above is met without one. What is
unresolved is whether the message *arrives*, which is ticket 08's question rather than a build
property.

### What was built

- **`lib/submission-receipt.ts`**, a pure builder, importing only `lib/email-html.ts` and
  `lib/sender-identity.ts`, neither of which imports anything. So no network, no secret, no
  Firestore, which is the acceptance's first bullet.
- **One `sendEmail` call** in `app/api/submit/route.ts`, behind `if (notified)`, after the
  notification, and now the last thing the handler does.
- **`lib/email-html.ts`**, new, holding `escapeHtml` and `oneLine`.
- **The either-way arm** of the form's success copy in `app/submit/page.tsx`, behind the
  `notified` flag ticket 06 left wired.
- **Tests**: `tests/submission-receipt.test.ts` with 19 cases, and five additions to
  `tests/submit-route.test.ts`.

### The refactor this took, disclosed

Escaping and the one-line flatten lived inside `lib/submission-notification.ts` as private `esc`
and `oneLine`. This ticket said "exactly as the notification does it", and the honest reading of
that is one implementation rather than two: **escaping that exists twice is escaping that can be
fixed once, and the copy that was not fixed is the one that ships.** So both moved to
`lib/email-html.ts` with their reasoning, and the notification imports them. Its four `esc()`
call sites were renamed, its behaviour is unchanged, and its existing tests confirm that rather
than assume it.

### The plain-text decision, made rather than defaulted

**Auto-flatten, so no hand-written text part.** Ticket 03 measured Resend's generated flatten as
lossy for the notification, and the dry run below shows exactly why: its table runs labels into
values (`ContributorHewad Mubariz`, `Reply tohewad@example.com`). This body is paragraphs of
whole sentences, so its flatten reads as prose and needs nothing.

The alternative is recorded in the module rather than left to be rediscovered: one `text` field
on `sendEmail` plus the string written out by hand. This ticket's deliverables closed that door on
purpose ("no change to `lib/resend.ts`"), so taking it would mean reopening a decision rather than
extending one. Resend's Deliverability Insights does flag a missing text part, so it is the first
thing to revisit if ticket 08 finds placement trouble.

### The dry run, and what it cannot prove

Run against the real builders with a representative Submission, then deleted rather than
committed as a second command a later ticket might design differently:

```
=== RECEIPT, to the Contributor ===
from:       rnui.dev <digest@mail.rnui.dev>
reply_to:   hello@rnui.dev
to:         hewad@example.com
subject:    We have your Demo
--- body ---
Hello Hewad Mubariz,

Your Demo arrived. Thank you for sending it to rnui.dev.

Radial FAB (Buttons)

Every Submission is looked at by hand, and you will hear from us either way: if it is published, and if it is not.

If it is published, you are credited as "Hewad Mubariz" with the profile links you gave. If it is not, the file is deleted within 30 days of arriving.

Nothing is needed from you.

rnui.dev, MD. MOHIBUR RAHMAN

Halima Nagar, Cumilla 3502, Bangladesh

hello@rnui.dev
```

`FROM` and `REPLY_TO` are the existing constants, unchanged. **Nothing was transmitted**, and the
script imported `sendEmail` nowhere, so it could not have.

What this proves is the wording, the addressing and the escaping. What it cannot prove is
placement, which ticket 03 already recorded as indeterminable without a real send.

### Two existing tests had to change, and that is a finding rather than tidying

The notification's suite asserted `sendMail` was called once. A second message made that false,
and changing the number to `2` would have been the worse repair: either message could then vanish
while the total stayed right. So **each message is now selected by its recipient**, through
`toMaintainer()` and `toContributor()`, and the order is asserted separately as
`[CONTACT_EMAIL, hewad@example.com]`. A receipt going out before the notification would mean the
ordering had been rewritten, and that is now a test rather than a comment.

### Gates

`pnpm check-types` 0, `pnpm lint` 0 errors (6 pre-existing warnings elsewhere), `pnpm test`
**417 passing across 24 files**, `pnpm build` clean, with both messages present in the built route
chunk. No em dashes in anything added.

### What ticket 08 inherits

A real transmission, which cannot happen until the SENDING HOLD is lifted, plus ticket 03's list
of what to watch on the first one: the `delivered` event against a stranger's mailbox rather than
rnui.dev talking to rnui.dev, whether the missing text part draws a spam score, and whether
`_dmarc.rnui.dev` at `p=none` is worth moving now that this pipeline sends to people who never
asked to hear from it.
