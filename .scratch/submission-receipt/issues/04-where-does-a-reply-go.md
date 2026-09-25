# Where does a reply go, and does the receipt invite one?

Status: ready-for-agent
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
