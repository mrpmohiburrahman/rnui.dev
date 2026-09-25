# Where does a reply go, and does the receipt invite one?

Status: resolved
Type: grilling
Blocked by: 02

## Question

Every message this repo sends sets `reply_to: REPLY_TO`, which is `CONTACT_EMAIL`,
`hello@rnui.dev`. For the notification that is obviously right. For a receipt to a
Contributor it is a decision, and it cuts both ways.

1. **If the reply goes to `hello@rnui.dev`**, a Contributor who answers the receipt
   reaches the maintainer, which is what somebody replying to "we received your Demo"
   almost always wants. It also means the receipt has to be readable as something a
   person may answer, and that the maintainer has accepted a new inbound channel.

2. **If `reply_to` is left off or pointed elsewhere**, nobody is invited to answer, and
   a message that reads as answerable becomes a message somebody answers into a void.
   That is worse than no receipt, and it is the failure mode this question exists to
   avoid.

3. **Whether the body should invite a reply at all** is the same decision from the other
   end, and belongs with this one: a receipt that says "reply if anything is wrong" is a
   promise to read replies. Decide, do not leave both half-decided.

Settle it for the receipt specifically, not for `sendEmail` generally: whatever the
answer, the notification's own `reply_to` does not change.

## Acceptance

- A decision, with the reason.
- If the answer is "the maintainer", the ticket says what that commits the maintainer to,
  and the wording ticket is told the body may be answerable.
- If the answer is "nobody", the ticket says how a Contributor who does need to reply is
  meant to find the address, given the identity block carries `hello@rnui.dev` anyway.
- It is stated that this does not change `lib/resend.ts`.

## Answer

Resolved 2026-09-25. The maintainer's answer was **"nowhere"**: the receipt stays one-way and must not
look answerable.

**What that means in practice, and what it cannot mean.** The actionable half is the body, and the
wording ticket already satisfies it: the close is "Nothing is needed from you", nothing asks a
question, and nothing invites a response. But literal "nowhere" is not implementable here, and there
are three separate reasons rather than one:

1. **`sendEmail` hardcodes `reply_to: REPLY_TO`.** Honouring "nowhere" literally means editing
   `lib/resend.ts`, which the acceptance above forbids, and which would also change the notification
   and every future message rather than only this one.
2. **`IDENTITY_BLOCK_HTML` prints `hello@rnui.dev` in the footer.** Reusing that block is required by
   ticket 09 of the other effort, and it satisfies CAN-SPAM's requirement that a commercial message
   carry a reachable contact. So the address is in the body whether or not `reply_to` points at it.
   A Contributor who needs to reply will find it, which is what the acceptance bullet asks for.
3. **A reply that bounces is worse than one that arrives.** If replies were genuinely routed to a void,
   somebody answering a message about their own work would get nothing back and would conclude the
   site is dead. The maintainer can answer; a mail server cannot.

**So the resolution is: one-way in tone, answerable in fact, which is the safe side of both.** The
message solicits nothing and reads as complete on its own, and if somebody replies anyway it lands at
`hello@rnui.dev`, which forwards to the maintainer through Cloudflare Email Routing. No change to
`lib/resend.ts`, no change to the identity block, no change to the wording.

**What it commits the maintainer to:** very little, which is why it is the right answer. A reply is
possible but unexpected, so there is no promise to answer within any particular time, and no monitor
to watch beyond the inbox they already read.

**Recorded because the next reader will ask:** if a future decision genuinely wants replies refused,
it needs both a `lib/resend.ts` change and a decision to drop the identity block, and that is a
different ticket in a different effort rather than a tweak to this one.

### What this does not settle

The error message is a **separate** question and it points the other way: ticket
[How does a hand-typed outcome message get sent?](13-how-does-a-hand-typed-outcome-message-get-sent.md)
is likely to answer that it is written as a reply to the notification, which is the maintainer
replying, not the Contributor. Nothing here forbids that, and nothing here applies to it.
