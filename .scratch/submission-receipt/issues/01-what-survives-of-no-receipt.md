# What survives of "no receipt"?

Status: resolved
Type: grilling

## Question

Decision 8 of Public Submissions says **no receipt**: the Contributor is told nothing,
and silence is the design. This effort reverses it. Establish what survives the reversal
and what does not, in the maintainer's words, because a reversal nobody scoped is a
policy that drifts one message at a time.

Settle at least these:

1. **What was decision 8 protecting against?** Its recorded reason was that a receipt is
   a promise: "we have your work" reads as "we are considering it", and considering is
   where somebody's expectations start costing somebody else's attention. Is that
   argument dead, or does it survive in a weaker form, no promise of *publication*, no
   promise of *a reply*, no promise of *a timescale*?

2. **Does "no receipt" become "exactly one receipt"?** A single acknowledgement at the
   moment of arrival, and nothing after it, is the shape the maintainer asked for.
   Confirm that is the whole of it, and that a second message (an outcome, a rejection,
   a request for changes) is *not* implied by this effort.

3. **What does the maintainer want to be true after it is sent?** One sentence, for
   example "they should not be left wondering whether the upload worked". The wording
   ticket is judged against it, and a receipt that satisfies nothing is worse than the
   silence it replaces.

4. **How is the amendment recorded?** Decision 8 lives in a *resolved* map, so it cannot
   simply be edited. Name the mechanism the way Public Submissions did when ticket 03
   amended decision 7 and ticket 04 amended decision 12, and say where the amendment is
   written down so the next session finds it.

Answer in the maintainer's own words rather than a paraphrase, and record the exchange.

## Acceptance

- The surviving constraints are listed as constraints, each with the reason it survives,
  each traceable to something the maintainer actually said.
- Whether a second message is or is not implied is stated explicitly, not left to be
  inferred from the absence of one.
- The amendment to decision 8 is named, including the file it is recorded in.
- The one-sentence success condition exists, and the wording ticket can be judged
  against it.

## Answer

Resolved 2026-09-25, in conversation with the maintainer. The exchange, in their words:

> So there should be two emails. One is when I got the email, I will send the email that yeah, we
> have got the demo. Then after the publishing that demo on the site, there will be another email
> saying that we publish it with the link of his page on the site.

So **decision 8 becomes two messages, not one**, and this map's destination is redrawn from "a
receipt" to both of them:

1. **On arrival**, one message: we have your Demo.
2. **On publication**, one message: it is live, with the link.

**What dies, and what survives:**

- **Dies:** the absolute. Silence is no longer the design at either end of the pipeline.
- **Survives, and it binds the wording ticket:** no promise of publication. The disclosure the
  Contributor already agreed to says "publication is not guaranteed", so the arrival message cannot
  contradict it. It may not say "we will publish it" and may not promise a date. Whether it may
  promise **a second message when it is published** is the one point where the two answers touch,
  and the distinction is conditional versus unconditional: "if it is published you will hear" is
  allowed, "we will publish it" is not. Ticket
  [What does the receipt say?](02-what-does-the-receipt-say.md) decides the sentence; this ticket
  records which of the two it is allowed to be.
- **Reversed again on 2026-09-25, in the maintainer's next message.** There *is* a message for the bad
  outcome. Their words:

  > The email, second email would be like this. If the animation is published, then I will send the
  > contributor the message that the email is published. And if there is an error, then I will also
  > send him the error message. And the error message won't be automatic because I have to type in
  > what the error was.

  So there are **three messages**, and the third is a different kind of thing from the first two: the
  published message is a fixed template, and the error message is the maintainer typing the actual
  reason every time. That is a tooling question rather than a wording one, and it is
  [How does a hand-typed outcome message get sent?](13-how-does-a-hand-typed-outcome-message-get-sent.md).

  **It also sharpens the arrival message, in a way that cuts both ways.** Both outcomes now produce a
  message, so "we will let you know either way" is a promise this pipeline can keep, which is what
  makes it sayable at all. What can break it is a human forgetting to type the error message. Ticket
  [What does the receipt say?](02-what-does-the-receipt-say.md) decides whether to make the promise,
  knowing what it rests on, and that decision is now a real one rather than a formality.
- **Still standing, as a constraint on volume:** three messages per Submission at most, and two of the
  three exist because a person did something. Nothing here is a stream, a status tracker or a queue,
  and decision 2 (no self-serve publish) is untouched.

**The success condition, in the maintainer's terms.** After the second message, the Contributor knows
two things they could not know before: that their Demo arrived, and that it is live with a link to
it. Nothing about it is a promise, and nothing about it asks them to do anything.

**The structural consequence, which is a new ticket.** The second message fires from a *different
event*: publication, which happens on the maintainer's machine through `add-recording`, not in the
submit route. So it does not share the receipt's trigger, cannot share its builder, and it has a
question the receipt never had, namely where the address comes from given that the consent record
denies every read by design. That is
[Where does the publication notice's address come from?](09-where-does-the-publication-address-come-from.md).

**The amendment.** Decision 8 lives in a resolved map and is not edited there. The reversal is
recorded here, pointed at from this map's Decisions-so-far, noted against decision 8 itself in
`../public-submissions/map.md`, and named in `CLAUDE.md`, which is where a future session looks for
what is in flight.
