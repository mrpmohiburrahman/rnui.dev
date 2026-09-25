# Build the outcome message path

Status: ready-for-agent
Type: task
Blocked by: 13

## Question

Implement whatever
[How does a hand-typed outcome message get sent?](13-how-does-a-hand-typed-outcome-message-get-sent.md)
decided. There are three possible shapes and the ticket above names which one won.

- **A `pnpm` command** taking an address and a reason, sending through `sendEmail`. It then needs the
  fixed scaffolding around the typed text, escaped and safe for a subject line like every other
  message here.
- **A command that prompts**, which additionally needs the prompt to be readable and the cancel path
  to be obvious.
- **Nothing at all,** if replying to the notification won. Then this ticket has no code to write and
  must say so plainly rather than inventing a tool nobody asked for. That is a legitimate resolution
  and should be recorded as one, not as a skipped ticket.

Whatever the shape, the fixed parts are shared with the other two messages: `FROM`, `REPLY_TO`,
`IDENTITY_BLOCK_HTML`, the escaping, and the plain-text decision ticket
[Build the receipt](07-build-the-receipt.md) makes. Do not write a second escaper or a second identity
block.

## Acceptance

- Whatever ticket 13 decided, implemented, or explicitly not implemented with its reason.
- Typed text is escaped before it reaches the HTML, with a test that would fail if it were not.
- If there is a command: its usage is discoverable, its failure is loud, and a dry run exists if ticket
  13 asked for one.
- If there is no code: a line here saying so, and what the maintainer does instead.
- `pnpm check-types`, `pnpm lint` and `pnpm test` all exit 0 if anything was written.
- No em dashes anywhere in added code, strings or comments.
