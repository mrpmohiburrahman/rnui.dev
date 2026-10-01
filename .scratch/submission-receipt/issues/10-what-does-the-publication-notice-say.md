# What does the publication notice say?

Status: resolved
Type: grilling
Blocked by: 01, 09

## Question

The second message's subject and body. The same shape of question as
[What does the receipt say?](02-what-does-the-receipt-say.md), with three differences that matter.

1. **It carries good news and a link.** That is the point of it, and it is also the only message in
   this pipeline with a call to action, so decide what the Contributor is being invited to do. Look
   at it, or nothing at all?

2. **It is the one message that can be wrong after the fact.** A Recording can be unpublished,
   renamed, recategorised, or have its Demo replaced. This message goes out once and cannot be
   corrected. So say what that implies about what it may claim. **The link question is settled:**
   ticket [09](09-where-does-the-publication-address-come-from.md) decided **both links**, the
   Recording's page and the Contributor's filtered catalogue, each derived from the row that was
   just written so neither can point at an empty page. What is left here is wording that survives
   the Recording being renamed later.

3. **It arrives days or weeks after the receipt,** when the Contributor has forgotten the whole
   thing. Whether it has to say what it is about is therefore a real decision rather than a style
   one, and the answer is probably that it does.

Everything else carries over: no em dashes, `FROM`, `REPLY_TO` and `IDENTITY_BLOCK_HTML` reused, no
new constant, and the plain-text decision that ticket 07 has to settle for the first message applies
to this one too.

## Acceptance

- A subject and a body, final, with no placeholder brackets left in them.
- Every sentence mapped to the constraint it satisfies.
- The link target named, consistent with ticket 09's answer, and consistent with what ticket 07
  decides about the Recording surface.
- What the message may claim about a Recording that later changes.
- No em dash in either, and the body survives being read as plain text.
- The Contributor is not asked to do anything they have not already agreed to do.

## Answer

### Subject

```
Your Demo is live: Radial FAB
```

Built as `Your Demo is live: ${oneLine(caption)}`, which is the notification's own
construction and for the same reason: the caption is visitor text with no length limit and
it may contain a newline, and a subject line is the expensive place to put one. Question 3
of this ticket asked whether it has to say what it is about, and the answer is yes, so the
caption is the identifier. The Contributor's name is not in it, because they are the
recipient and already know who they are.

### Body

```
Hello {contributor},

Your Demo is live on rnui.dev.

{caption} ({category})

See it:
https://www.rnui.dev/recording/{id}

Everything of yours on the site:
https://www.rnui.dev/products?contributor={URL-encoded contributor}

Nothing is needed from you.

{IDENTITY_BLOCK_HTML}
```

Each URL is on a line of its own rather than inline, so the flatten that produces the text
part leaves a reader two clean links rather than a paragraph with URLs buried in it.

### Every sentence, and the constraint it satisfies

| Sentence | Constraint |
| --- | --- |
| "Your Demo is live on rnui.dev." | The event ticket 01 promised, in its plainest form. Present tense and anchored to the moment of publication, which is what makes the next section's problem go away. |
| "{caption} ({category})" | Identifies which Submission weeks later, from the same two columns the receipt uses, so the two messages name the same thing the same way. |
| "See it:" and the Recording URL | Ticket 09's first link, the precise one. |
| "Everything of yours on the site:" and the filter URL | Ticket 09's second link, the stable one. |
| "Nothing is needed from you." | The receipt's own close, kept identical. Ticket 04 decided this pipeline's messages are one way in tone, and this is the sentence that carries it. It also pre-empts the reader who wonders whether the news requires a reply. |

### What it may claim about a Recording that later changes

**The event, and never the future.** No sentence above can be falsified by a later
unpublish, rename, recategorisation or Demo replacement, because none of them says anything
about a state that persists. There is no "permanently", no "it will stay live", no "your work
is now part of rnui.dev", and no count of how many Recordings the Contributor has, because a
count changes.

That is also why both links are here, which ticket 09 asked for on the maintainer's answer
and which turns out to be a hedge rather than a courtesy. Checked rather than assumed:

- **`/recording/[id]` calls `notFound()`** when the id is not in the catalogue
  (`app/recording/[id]/page.tsx`), so a rename or an unpublish can 404 the precise link.
- **`/products?contributor=<name>` cannot 404.** It renders a zero panel instead, so the
  stable link survives anything that happens to one Recording.

So the pair is "the exact thing, and the door that still opens". A message that carried only
the first would be a link that can rot; one that carried only the second would send somebody
to a list instead of their work.

**Both hosts are `www`, and that is a correction this ticket found rather than inherited.**
Ticket 09 wrote `rnui.dev`, and the apex is a redirect, which was measured rather than
assumed:

```
https://rnui.dev/recording/x                    307 -> https://www.rnui.dev/recording/x
https://www.rnui.dev/recording/x                404
https://www.rnui.dev/products?contributor=...   200
```

The first line is why the notice names `www`, and it agrees with `data/default-url.ts`, whose
own comment says the apex made every canonical and every `og:` URL a redirect. The second and
third lines are the 404 and 200 the section above claims, measured live on 2026-09-25.

The origin is therefore **not** read from `defaultUrl`, and the reason is worth recording: that
constant resolves to `http://localhost:3000` when `VERCEL_URL` is unset, so a build-time
import from a local shell would put `localhost` links in a stranger's inbox. The builder holds
its own production origin instead, as a constant with this paragraph beside it.

**One residual, accepted rather than hidden.** If a Contributor's Demo were ever replaced
without their knowledge, "Your Demo is live" would then describe the Submission rather than
the bytes at the end of the link. Replacing somebody's published work is not something this
site does quietly, and the second link means no reader is stranded, so the sentence stays.

### Rejected

- **"Your work is now part of rnui.dev."** Warm, and a state claim that an unpublish turns
  into a lie. It is the same failure as the receipt's rejected "we will publish it", one
  message later.
- **"Your Demo has been published" in the subject with the raw caption.** Without `oneLine` a
  caption containing a newline reaches a header, which is broken formatting at best and header
  injection at worst.
- **A table, as the notification uses.** The notification's table is for a maintainer reading
  a form; it flattens into `ContributorHewad Mubariz`, which ticket 03 measured and ticket 07
  confirmed. This body has no table, so it inherits none of that.
- **Any line inviting a reply.** Ticket 04 settled the tone for the messages to Contributors,
  and a second message is not the place to reopen it.

### Constraints that turned out to be non-issues

- **Plain text.** Paragraphs and two bare URLs, so the auto-generated text part reads
  correctly and the decision ticket 07 made needs nothing new here.
- **No new constant.** `FROM`, `REPLY_TO` and `IDENTITY_BLOCK_HTML` are reused unchanged.
- **No em dashes**, and none were introduced.
- **The missing address is not this ticket's.** Ticket 09 decided it is skipped loudly, which
  is a behaviour rather than a wording, so nothing here changes if the address cannot be found.
