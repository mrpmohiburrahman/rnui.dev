# How does a hand-typed outcome message get sent?

Status: ready-for-agent
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
