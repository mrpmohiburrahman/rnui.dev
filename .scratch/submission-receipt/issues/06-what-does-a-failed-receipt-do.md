# What does a failed receipt do to the Submission?

Status: resolved
Type: grilling
Blocked by: 01

## Question

Public Submissions ticket 09 answered this for the *notification*: nothing is rolled
back, the object and the consent record stand, the visitor is not asked to resend, and
`pnpm submissions:open --list` is the recovery. That answer holds because the maintainer
noticing a lost Submission is the worst consequence.

A receipt is the other direction, and the consequence is different: if the receipt fails,
**the Contributor thinks their work vanished**. Somebody who has just spent ten minutes
picking a file and solving a challenge, and who then hears nothing, has no way to tell
"it arrived and the mail bounced" from "the form ate it". They may resubmit, or give up,
or tell somebody the site is broken.

So decide, at least:

1. **Does the handler still return success?** The Submission *is* stored. Returning a
   failure would invite a duplicate object and a second consent record for the same Demo,
   which is the thing ticket 09 refused to do.

2. **Does the visitor's on-screen message change?** The form currently says the
   Submission reached the maintainer. If the receipt failed, that is now a claim the
   Contributor has no evidence for. Say whether the success copy needs to be softer, or
   whether it stays, and what the difference is between the two failures.

3. **Is the failure recoverable at all?** The notification failure is recoverable by the
   maintainer with `--list` and the stored address. A receipt failure is not recoverable
   by the Contributor, because they cannot see the bucket. Say what the maintainer does
   when they notice, and whether that is worth a ticket or just a comment.

4. **Do two failures compound?** If the notification *and* the receipt both fail, the
   object sits in a bucket nobody has been told about and the person is waiting. That is
   the worst case in this map, and it deserves an explicit answer rather than an
   inference from the two separate ones.

## Acceptance

- The answer for the submission's own outcome, stated as a decision with its reason.
- Whether the on-screen copy changes, and if not, why the existing sentence is still
  honest.
- The compounding case answered explicitly.
- Whatever is chosen is written as a comment at the call site in
  `app/api/submit/route.ts`, the way ticket 09's answer is, so it is not re-litigated.

## Answer

### 1. The handler still returns success, and now says one more thing

`ok: true` whenever the object and the consent record exist, which is true in both failure
cases. The reason is Public Submissions ticket 09's and it has not weakened: a failed
request invites a second send, and a second send stores a duplicate object and writes a
second consent record for the same Demo, which is worse than a missing email.

What is new is that `SubmitResult` carries **`notified: boolean`**, one extra fact the form
needs and one the route already had in hand. It is `true` unless the notification's send
threw.

### 2. The promise is decided by whether the *maintainer* was told

The question as posed assumed the branch keyed on whether the receipt sent. The wording
ticket 02 settled says otherwise, and this is the part worth reading twice.

The form's one promise is that the Contributor hears the outcome either way, and **the
outcome message is what keeps it**. The arrival receipt does not; it is not an outcome, it
is a courtesy. The outcome message is typed by the maintainer, so what decides whether the
promise is keepable is whether the maintainer knows the Submission exists.

So the flag is `notified`, and the on-screen copy becomes:

| `notified` | The copy | Why it is honest |
|---|---|---|
| `true` | "Thank you, your Demo was received. We will email you either way." | Both halves are true. The object is stored, and the person who owes the outcome message has been told. |
| `false` | "Thank you, your Demo was received." | The Demo was received. The maintainer was not told, so nothing is promised. |

**The receipt's own failure changes nothing on screen, deliberately.** With `notified` true,
a failed receipt still leaves the Contributor receiving the outcome message, so the promise
is kept and the sentence stands. Promising less because a courtesy they have not yet looked
for went astray would be the form apologising for something the reader cannot see.

### 3. The sentence on screen was already false, independently of this decision

`app/submit/page.tsx` read "You will hear back through one of the handles you gave". That
stopped being true the moment the form began asking for an email address, and it was wrong
whatever this ticket decided.

It now reads **"Thank you, your Demo was received."** That is a claim about the file, and it
is true whether or not the notification reached the maintainer, so it needs no branch. The
either-way arm is written into the comment at the call site and lands with
[Build the receipt](07-build-the-receipt.md), because it cannot be said before a receipt
exists to keep it.

### 4. The compounding case: the receipt does not go when the notification did not

This is the answer the map most needed, and it turned out to be a rule rather than a
tie-break.

The two failures have different victims. A lost notification costs the maintainer: the
object sits in a bucket nobody has been told about. A lost receipt costs the Contributor:
somebody who spent ten minutes on a file hears nothing and cannot tell "it arrived and the
mail bounced" from "the form ate it".

**Two silent failures are survivable and coherent.** The object is in the bucket, the
record stands, nobody was told, and nobody was promised anything, so nobody is waiting. The
recovery is `pnpm submissions:open --list` inside 30 days, and the 30-day lifecycle rule is
the floor under it.

**The order that is not survivable is a receipt with no notification.** The receipt's own
wording carries the either-way promise (ticket 02 wrote it), so sending it in that state
puts a promise in a stranger's inbox on behalf of a maintainer who has no way to know they
exist. So the receipt is **skipped** on that path, not sent and not retried.

The alternative was considered and rejected on the record: send the receipt anyway, on the
argument that the Contributor knowing is strictly better and `--list` is a standing habit.
It loses because "mostly keepable" is the same failure this ticket's sibling options were
rejected for, and because telling somebody everything is fine is precisely what takes away
the maintainer's reason to look.

### 5. Recovery for a failed receipt is not a ticket

A receipt failure is unrecoverable by the Contributor, who cannot see the bucket, and that
is why it is answered by suppressing the promise rather than by adding a retry. For the
maintainer it is recoverable the ordinary way, because the address reaches them twice: it
is in the notification's `Reply to` row, and it is in the consent record filed under the
same key. One more ticket would buy a tool where a habit already works.

### 6. What was built here, and what ticket 07 inherits

Built: `notified` on the response, the branch point documented at the send in
`app/api/submit/route.ts`, the stale sentence replaced, and two tests pinning the flag in
both directions (`tests/submit-route.test.ts`).

Inherited by ticket 07: the either-way arm of the copy, and the `if (notified)` guard
around the receipt send. Both are written into the comment rather than left to be
rediscovered. Nothing sends on the skipped path today, because nothing sends a receipt yet.

Gates: `pnpm check-types` 0, `pnpm lint` 0 errors, `pnpm test` 393 passing across 23 files.
No em dashes added.
