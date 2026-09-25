# Build the publication notice

Status: ready-for-agent
Type: task
Blocked by: 09, 10

## Question

Write the code for the second message. It is a **different animal** from the receipt, and the
difference is the whole reason this is not a clause in ticket 07:

- It is triggered by a **local act** (publication) rather than by an HTTP request, so its home is
  beside the publish flow, not in `app/api/submit/route.ts`. Ticket 09 says which shape that takes.
- It has **no consent record to write** and nothing to roll back. Publishing has already happened, so
  a failed notice cannot undo anything and must not try.
- It links to a live page, so it has **2 URLs to get right** rather than none.

Deliver:

- **A pure builder**, exporting something shaped like `publicationNotice(recording) -> { subject,
  html }`. Pure, so ticket 10's sentences are pinned by tests, and importable without Firestore.
- **One `sendEmail` call** at the trigger ticket 09 named: a standalone `pnpm submissions:notify`
  invoked by a new final step in `add-recording`, taking the address and the submission key as
  arguments because nothing is looked up. The guard against a second send is ticket 09's sent-log at
  `.scratch/submission-receipt/notices/<submission-key>.json`, which carries no address because the
  key is a ULID, and refuses a repeat unless `--again` is passed. Its second layer is that the script
  prints the address and the Recording before sending.
- **The plain-text decision applied here too**, consistent with what ticket 07 chose for the receipt,
  so the two messages do not disagree about whether they have a text part.
- **HTML escaping and a single-line subject**, exactly as the receipt does and for the same reasons.
- **Comments** recording why this is not in the route handler, and what the double-send guard is for,
  so neither is tidied away later.
- **Tests**: one per sentence of ticket 10's wording, one for the escaping, one for the subject
  shape, and one proving the guard refuses a second send.

**It must not touch the Resend audience**, same as the receipt. A published Contributor is still not
a Subscriber.

## Acceptance

- The builder is pure and importable without a network, a secret or Firestore.
- Exactly one notice per Recording, with a test for the guard.
- A failed notice changes nothing about the published page and does not retry blindly.
- Nothing in the send path touches the Resend audience.
- Every interpolated value is escaped, with a test that would fail if it were not.
- Links are absolute, because a relative href in an inbox resolves against the mail client.
- `pnpm check-types`, `pnpm lint` and `pnpm test` all exit 0.
- No em dashes anywhere in the added code, strings or comments.

## Not in this ticket

Sending it. The **SENDING HOLD** covers this effort, so the build stops at a dry run.
