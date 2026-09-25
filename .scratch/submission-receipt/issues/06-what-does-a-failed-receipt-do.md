# What does a failed receipt do to the Submission?

Status: ready-for-agent
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
