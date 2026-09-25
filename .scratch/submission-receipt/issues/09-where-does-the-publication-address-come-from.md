# Where does the publication notice's address come from?

Status: ready-for-agent
Type: grilling
Blocked by: 01

## Question

The second message fires when the maintainer publishes, which is a **local act**: `add-recording`
runs on their machine, edits `data/<category>.ts`, and uploads Assets. There is no server in that
path and no request. So two things have no obvious answer yet.

1. **Where does the address come from?** The consent record holds it, and `firestore.rules` denies
   every read, deliberately, so that the collection can never publish who submitted what. The
   maintainer can see it in the Firebase console and in the notification email in their inbox. So the
   options are roughly: read it from the console by hand, copy it out of the notification, relax the
   rules for a server-only path, or have the publish flow ask for it. Name the one least likely to
   leak an address and least likely to be skipped when the maintainer is in a hurry.

2. **What sends it?** A step inside `add-recording`, a standalone `pnpm` script that flow calls, or
   something else. It has to be reachable from a local shell with `RESEND_API_KEY`, and it must be
   hard to fire twice for the same Recording by accident, because the second message cannot be
   unsent.

3. **How does it know what to link to?** The Recording's URL and the Contributor's URL are both
   derivable at publish time, since the step just wrote the row. Say which the notice links to, or
   both, and say where in the data that comes from rather than leaving it to be rediscovered.

4. **What if the address is missing, or the record is gone?** The consent record is written by the
   route and read by nobody, and the object is deleted after 30 days by the lifecycle rule.
   Publishing routinely happens more than 30 days later. So the address may be reachable only from
   the maintainer's inbox, which is exactly the case the durable record was meant to cover. Say what
   the publish flow does then: skip the notice, or treat it as a finding.

**This is the structural question of the effort.** [Build the receipt](07-build-the-receipt.md) is
blocked on it, because an answer that changes the consent record's shape or its rules changes the
receipt's write as well.

## Acceptance

- A named source for the address, with the leak it avoids and the failure it invites.
- A named trigger, reachable locally, with the guard against sending twice.
- The link target decided, and where in the data it comes from.
- The missing-address case answered explicitly.
- Whether `firestore.rules` or the consent record's shape changes, stated either way, including
  "no change" with the reason.
