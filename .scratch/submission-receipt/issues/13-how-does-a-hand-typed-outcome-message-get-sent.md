# How does a hand-typed outcome message get sent?

Status: resolved
Type: grilling
Blocked by: 01, 09

## Question

The third message is the one the maintainer writes each time: something went wrong with a Submission,
and here is what it was. So the question is not what it says, because they supply that. The question
is what surrounds it and what carries it.

1. **What carries it?** The published message can be a template in a script, because it fires from a
   known event with known data. An error message cannot, because its text does not exist until the
   maintainer writes it. So: a `pnpm` command that takes an address and a reason, a command that
   prompts, or the maintainer writing in their own mail client with an address copied from somewhere.
   Name the one that survives a bad day, because a tool that takes four minutes is a tool that gets
   skipped exactly when it matters.

2. **What is fixed and what is typed?** `FROM`, the identity block, and a greeting that makes clear
   which Submission is being discussed are all template. The reason is typed. Decide where that line
   sits, and whether the typed part arrives as an argument, a file, an editor or stdin.

3. **How does it know the address and the subject?** The same problem ticket
   [Where does the publication notice's address come from?](09-where-does-the-publication-address-come-from.md)
   has, and it should get the same answer rather than a second one. That is why this ticket is blocked
   on it rather than beside it.

4. **What stops a mistake?** This is the only message a human composes while delivering bad news, and
   it goes from an authenticated sender to a stranger. A dry run, a confirmation prompt and a copy of
   what will be sent are all cheap. Say which, and whether the friction is worth it.

5. **Is it a reply or a new message?** The notification email the maintainer already has carries the
   address in its `Reply to` row and the object key in its body, so deciding that the error message is
   written as **a reply to that notification** removes the need for any tool at all. The cost is that
   it then comes from the maintainer's own mail client rather than from `digest@mail.rnui.dev`. That
   trade is the decision this ticket exists for, and it is the one most likely to be right.

## Acceptance

- The carrier named, with its worst-case number of steps under pressure.
- The fixed and typed split stated, and where the typed part is entered.
- The address and subject question answered, consistent with ticket 09 rather than alongside it.
- Any guard named, with whether it was kept and why.
- The "reply instead of a tool" option considered and either chosen or rejected with a reason.

## Answer

### 1. The carrier: a prompting script, `pnpm submissions:outcome`

One command that asks for the address, the caption and the reason, prints the whole message, and
sends after a confirmation. **Worst case under pressure: one command, three answers, one `y`.**
Two minutes, and the message is correct every time rather than correct when the maintainer
remembers to format it.

### 2. The reply option, rejected, and the ticket's own premise turned out to be wrong

The ticket suggested that writing the message as a reply to the notification "removes the need for
any tool at all". **It does not reach the Contributor.** The notification is sent with
`to: CONTACT_EMAIL` and `reply_to: REPLY_TO`, and both are `hello@rnui.dev`, so a reply is
addressed straight back to the maintainer. Copying the address out of the `Reply to` row makes it
a new message, which is this ticket's third option wearing the word "reply".

The second cost is the one that actually decides it, and it is easy to miss: **the quoted
notification contains the object key and `pnpm submissions:open <key>` in a `<pre>` block**, plus
the paragraph about the private bucket. Reply-with-quote puts internal tooling in a stranger's
inbox, and trimming the quote before sending is exactly the step somebody under pressure forgets.

So it is rejected on both counts. The trade the ticket named, losing `digest@mail.rnui.dev` as the
sender, is real but secondary to those.

### 3. What is fixed, what is typed, and where the typing happens

**Fixed:** `FROM`, `REPLY_TO`, `IDENTITY_BLOCK_HTML`, the escaping, the shape of the subject, and
the greeting. Nothing here is re-implemented; the escaper and the identity block are ticket 07's.

**Typed:** the address, the Contributor's name (optional), the caption, and the reason.

**Entered at prompts rather than as arguments**, which is the part that matters under pressure: a
reason passed as `--reason "..."` has to survive shell quoting, and a paragraph of prose full of
apostrophes is where that goes wrong.

### 4. The address and the subject, consistent with ticket 09 rather than beside it

The address is pasted from the notification's `Reply to` row, and nothing reads Firestore. The
caption is copy-pasteable from the notification's own subject, which is how this message names
which Submission it is about weeks later.

### 5. The guard: a preview and a question, and deliberately no log

**Kept:** the entire message printed before anything is sent, and the send happening after a
`send it? [y/N]`. Also kept: `--dry-run`.

**Not kept: the sent-log** that the publication notice uses, and the reason is specific rather
than an omission. The notice is templated and fires from a known event, so a repeat is an
accident a log can catch. This message is hand-written, so sending it twice is already a
deliberate act, and a log would store hand-written prose about somebody's rejected work in a
tracked directory of a public repository. That is a worse risk than the one it would close.

### 6. Nothing is asked of the Contributor

The typed reason is the maintainer's own text, and the fixed scaffolding adds the identity block
and a greeting. There is no request, no link to withdraw, and no reply invited, so nobody is asked
to do anything they have not already agreed to do.
