# What does the receipt say?

Status: resolved
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
- The body does not invite a reply unless [Where does a reply go?](04-where-does-a-reply-go.md)
  decided it should. The close below is deliberately neutral, so that ticket can add or drop an
  invitation without rewriting anything above it.

## Answer

Resolved 2026-09-25 with the maintainer, who answered the one question this ticket existed for:
**yes, the arrival message makes the "either way" promise.** The exchange was a single word, which is
the whole of the decision, and it is worth recording that it was made deliberately rather than
inherited: both outcomes now produce a message, so the promise is keepable, and the only thing that
can break it is a human forgetting to type the error message. That risk is accepted.

### Subject

```
We have your Demo
```

One line, no caption, no name, no punctuation. Keeping the caption out is deliberate: it is visitor
text with no length limit, so it can be 200 characters and it can contain a newline, and a subject
line is the one place a long or hostile string is expensive. The caption is in the body, where it
belongs and where it is escaped.

### Body

```
Hello {contributor},

Your Demo arrived. Thank you for sending it to rnui.dev.

{caption} ({category})

Every Submission is looked at by hand, and you will hear from us either way: if it is published, and
if it is not.

If it is published, you are credited as "{contributor}" with the profile links you gave. If it is not,
the file is deleted within 30 days of arriving.

Nothing is needed from you.

{IDENTITY_BLOCK_HTML}
```

### Every sentence, and the constraint it satisfies

| Sentence | Constraint |
| --- | --- |
| "Your Demo arrived. Thank you for sending it to rnui.dev." | The success condition from ticket 01, in its plainest form. `CONTEXT.md` vocabulary: Demo, not upload, video or entry. |
| "{caption} ({category})" | Names which Submission this is, from columns that already exist in `data/recording.ts`, so the Contributor can tell what the message is about weeks later. |
| "...you will hear from us either way: if it is published, and if it is not." | The maintainer's answer. Explicitly conditional in both directions, so it does not promise publication, only a second message. |
| "If it is published, you are credited as {contributor} with the profile links you gave." | Restates what they agreed to in the disclosure. No promise about *whether*, only about *how*. |
| "If it is not, the file is deleted within 30 days of arriving." | The same promise the disclosure already makes, so the two cannot be read as disagreeing. |
| "Nothing is needed from you." | The message asks for nothing, so it cannot be mistaken for a request. It also pre-empts the reader who wonders whether they must reply. |

### The wording considered and rejected

**"We will publish it if it fits the catalogue."** Rejected on ticket 01's constraint, and it is the
tempting one: it is warm, it sounds like courtesy, and it promises an outcome. The disclosure the
Contributor already agreed to says publication is not guaranteed, so this sentence would contradict
the words they actually consented to. The same reason kills "we will be in touch soon", which adds a
timescale nobody can keep.

### Constraints that turned out to be non-issues

- **Plain text.** The body is written as sentences and one bracketed line, with no layout doing any
  work, so the auto-flattened text part Resend generates for an HTML-only message reads correctly.
  Ticket 03 measured that flattening as lossy for the *notification*, whose table runs labels into
  values; this body has no table, which is why it does not inherit that problem. The plain-text
  decision ticket [Build the receipt](07-build-the-receipt.md) makes should still be made with this in
  mind rather than assumed.
- **No new constant, no new address.** `FROM`, `REPLY_TO` and `IDENTITY_BLOCK_HTML` are used as they
  are, exactly as the notification uses them.
- **No em dashes**, and none were introduced.

### What this does not settle

The close is neutral, so [Where does a reply go?](04-where-does-a-reply-go.md) can decide the reply
question without reopening this wording. And [Does the disclosure or the privacy policy have to
change?](05-does-the-policy-change.md) inherits a message that repeats the disclosure's own promises
back to the Contributor, which is the strongest argument available that no document needs editing.
