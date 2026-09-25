# Build the receipt

Status: ready-for-agent
Type: task
Blocked by: 02, 03, 04, 05, 06

## Question

Write the code. The shape is settled by everything above and by
`lib/submission-notification.ts`, which is the closest precedent and is worth reading
before writing a line: a pure builder a test can import, and one `sendEmail` call in the
route handler.

Deliver:

- **A pure builder**, `lib/submission-receipt.ts` or similar, exporting something shaped
  like `submissionReceipt(notice) -> { subject, html }`. Pure, so the wording ticket's
  sentences are pinned by tests rather than by reading a template.
- **One `sendEmail` call** in `app/api/submit/route.ts`, after the notification.
- **HTML escaping**, exactly as the notification does it. Every interpolated value is a
  stranger's text, and a caption is not less dangerous in a receipt than in a
  notification.
- **A single-line subject**, with whitespace collapsed, for the same reason.
- **No new constant and no change to `lib/resend.ts`**, unless ticket 04 decided
  otherwise and said so.
- **A comment at the call site** recording what a failed receipt does, from ticket 06, so
  it is not re-litigated by the next reader.
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
- Every interpolated value is escaped, with a test that would fail if it were not.
- `pnpm check-types`, `pnpm lint` and `pnpm test` all exit 0.
- No em dashes anywhere in the added code, strings or comments.

## Not in this ticket

Sending it. The **SENDING HOLD** covers this, so the build stops at a dry run, and
[Verify it end to end](08-verify-it-end-to-end.md) is where a real transmission lives.
