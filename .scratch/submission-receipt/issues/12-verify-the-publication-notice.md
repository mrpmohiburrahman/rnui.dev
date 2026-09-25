# Verify the publication notice end to end

Status: ready-for-agent
Type: task
Blocked by: 11

## Question

Prove the second message arrives, and that it arrives **when it should and not before**. The receipt
is verified by [Verify it end to end](08-verify-it-end-to-end.md); this is the other half, and it has
a failure mode the receipt does not.

1. **Publish something, for real, and watch the notice.** The receipt could be tested by submitting
   through the deployed form. This one fires from the maintainer's machine, so verification means
   doing an actual publish, or the closest thing to one that does not put a fake Recording in the
   catalogue. Say which was done and why.

2. **Prove it did not fire earlier.** The notice existing at the right moment is only half of it. What
   matters just as much is that nothing was sent at receipt time, and that nothing is sent twice.
   Check the send history rather than the code: `GET /emails` is the record.

3. **Read the notice back from Resend**, as ticket 08 does for the receipt: recipient, subject, body,
   `last_event`. Pull the links out of the body and fetch them, because a notice whose link 404s is
   worse than no notice.

4. **Try the case ticket 09 worried about.** Publish a Submission whose consent record is more than 30
   days old, or simulate it, so the missing-address path is exercised rather than assumed. Whatever
   ticket 09 decided, this is where it is checked.

**The SENDING HOLD gates this ticket** exactly as it gates ticket 08. Set `Status: ready-for-human`
and name the hold if it still stands.

## Acceptance

- The real trigger exercised, or the closest safe equivalent, with the choice justified.
- `GET /emails` showing the notice, and **not** showing a second one for the same Recording.
- Recipient, subject, body and `last_event` recorded from Resend's side.
- Every link in the body fetched, with its status.
- The missing-address path exercised, with what happened.
- The audience checked directly and unchanged.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and `pnpm rules:verify` all exit 0, and a build.
- `Status: ready-for-human` with the hold named, if the hold still stands when this runs.
