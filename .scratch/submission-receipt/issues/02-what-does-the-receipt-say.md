# What does the receipt say?

Status: ready-for-agent
Type: grilling
Blocked by: 01

## Question

The exact words of the one message, in the two pieces a mail needs: a subject line and
a body.

Constraints already fixed, by
[What survives of "no receipt"?](01-what-survives-of-no-receipt.md) and the disclosure in
`lib/submission-consent.ts`:

- **It may not promise publication.** "Publication is not guaranteed" is in the
  disclosure the Contributor already agreed to, and a receipt that contradicts it would
  be worse than the silence it replaces.
- **It may not promise a reply or a timescale**, unless ticket 01 says otherwise.
- **It has a real choice about the "either way" promise, and that choice is the interesting one.**
  Ticket 01 established that both outcomes now produce a message, so "we will let you know either way"
  is a promise this pipeline can keep. The only thing that can break it is a human forgetting to type
  the error message, which is a real risk rather than a theoretical one. So the sentence is allowed,
  and it should be decided deliberately rather than added by omission or dropped by default. Saying
  nothing is also allowed and is the safer half of the trade.
- **It must say what happens next honestly.** Every Submission is looked at by hand, and
  if it is not published the file is deleted within 30 days.
- **No em dashes.** The maintainer's stated preference, now applied across the feature.
- **No new constant for the sender and no new address.** `FROM`, `REPLY_TO` and
  `IDENTITY_BLOCK_HTML` are reused exactly as `lib/submission-notification.ts` reuses
  them, which is what those constants exist for.

Produce the subject and the body ready to paste into a builder, and state beside each
sentence which constraint it satisfies, the way `lib/submission-consent.ts` documents
its disclosure. Keep the rejected wordings with their reasons: the temptation on a later
edit is to add "we will be in touch", which is the promise in a nicer coat.

## Acceptance

- A subject line and a body, final, with no placeholder brackets left in them.
- Every sentence mapped to the constraint it satisfies.
- At least one promising wording considered and rejected, with the reason.
- No em dash in either, and no em dash in the reasoning either.
- The body survives being read as plain text, because some clients strip the HTML.
- The body does not invite a reply unless ticket 05 decided it should.
