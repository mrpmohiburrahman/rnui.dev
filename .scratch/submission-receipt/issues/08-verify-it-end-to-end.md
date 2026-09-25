# Verify it end to end

Status: ready-for-agent
Type: task
Blocked by: 07

## Question

Prove the receipt arrives, and prove it to the standard the other effort's ticket 09 was
held to rather than to a green test suite. That means a real Submission through the
deployed form and Resend's own record of what was sent.

1. **One real Submission, through the deployed route.** Not a stubbed challenge and not a
   unit test: the same path a stranger takes, because every failure this map worries about
  , a filtered message, a wrong address, a receipt that never fires, is invisible
   otherwise.

2. **Read it back from Resend rather than from the inbox alone.** `GET /emails` lists what
   was sent and `GET /emails/{id}` returns the body, which is how the notification was
   verified. Do the same here: the recipient, the subject, the body, and `last_event`.
   `delivered` is the only acceptable value, and a `bounced` or `complained` is a finding
   for ticket 03, not a flake to retry.

3. **Check the deliverability question for real.** Ticket 03 could not settle whether a
   first-contact message lands. This is where that is answered, so record where the
   message actually ended up, not just that Resend accepted it. A receipt in a spam folder
   is a failed receipt, and the whole point of the effort is that the Contributor is not
   left wondering.

4. **Confirm the addressing did not leak.** Exactly one message to the Contributor, one to
   the maintainer, and nothing added to the audience. Check the audience directly rather
   than trusting the code path.

**The SENDING HOLD gates this ticket.** `CLAUDE.md` says no mail leaves the project until
the maintainer lifts it, and only they lift it. So this ticket cannot resolve on an
agent's schedule: set `Status: ready-for-human` and name the hold, exactly as the
notification ticket did, rather than declaring it done.

## Acceptance

- A real Submission through the deployed form, with its object key and timestamp.
- Resend's record of the sent receipt: recipient, subject, body, and `last_event`.
- Where the message landed, from the recipient's side, not from Resend's.
- The audience checked directly and unchanged.
- `pnpm check-types`, `pnpm lint`, `pnpm test` and `pnpm rules:verify` all exit 0, and a
  build.
- `Status: ready-for-human` with the hold named, if the hold still stands when this runs.
