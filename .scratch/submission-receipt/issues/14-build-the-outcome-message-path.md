# Build the outcome message path

Status: resolved
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

## Comments

Ticket 13 chose the command, so this wrote it.

### What was built

- **`lib/outcome-message.ts`**, a pure builder taking `{contributor, caption, reason}`. The
  scaffold is `lib/sender-identity.ts` and `lib/email-html.ts` as they already are: no second
  escaper and no second identity block, which is this ticket's own instruction.
- **`scripts/send-outcome.ts`**, registered as `pnpm submissions:outcome`. It prompts for the
  address, the caption and the reason, prints the whole message, and sends after a question.
- **`tests/outcome-message.test.ts`**, 14 cases.
- **`.claude/skills/add-recording/SKILL.md`**, a section for the case this message exists for, so
  the maintainer meets it where they decide not to publish.

### The reason is entered at a prompt, and the escaping is pinned twice

The reason is read line by line until a line containing only a full stop, rather than taken as
`--reason "..."`, because prose full of apostrophes is exactly what shell quoting breaks. A
`--reason-file` alternative exists for scripting.

Escaping has two tests that would each fail on their own: a forged `<a href>` in the reason, and
a line the maintainer typed containing `<br>`, which asserts the tag we insert is ours while the
one they typed stays text.

### Three things the build added to ticket 13's decision

**`--help` exists.** Ticket 14 asks for discoverable usage, and this command has no wrong-argument
route to discovery because every failure is reached by answering prompts. So usage is printed on
request rather than only on a mistake.

**A bad `--reason-file` says so in one line.** The first version let `readFile` throw, which put a
stack trace in front of somebody who mistyped a path. Found by running it with a deliberately
wrong path.

**The Contributor's name is optional and the greeting falls back to `Hello,`.** Under pressure the
maintainer may hold only the address, and a wrong name is worse than no name.

### Paths run, not assumed

```
--help                        usage, exit 0
--dry-run with every flag     the full message, nothing sent
--reason-file missing         "could not read --reason-file ... ENOENT", exit 1
```

### Gates

`pnpm check-types` 0, `pnpm lint` 0 errors, `pnpm test` **452 passing across 26 files**,
`pnpm rules:verify` **42/42**. No em dashes.

### What this leaves

Nothing in this effort needs a new tool. A real send of this message is not verified here, because
it is a message only the maintainer can write, and no test can type a reason on their behalf.
