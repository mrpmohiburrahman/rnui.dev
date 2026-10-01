# Where does the publication notice's address come from?

Status: resolved
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

## Answer

### 1. The address comes from the notification email, pasted into the script

The maintainer's inbox. The notification (public-submissions ticket 09) already prints the
address in its `Reply to` row, next to the object key that ties it to this Submission.

**The leak it avoids:** no new read path on the consent collection exists at all. That
collection denies every read for a reason the public-submissions effort wrote down, so that
it can never publish who submitted what, and `scripts/verify-firestore-rules.ts` carries 42
cases asserting exactly that. Taking the address from an inbox leaves both untouched.

**The failure it invites:** if the notification is deleted, the address survives only in the
Firebase console. That is a fallback rather than a hole, and section 5 is what keeps it from
being silent.

**Rejected, and this is the tempting one:** relaxing `firestore.rules` so the script can read
the record. Even the narrow form, `allow get` by id with `list` still denied, would make the
address reachable by anybody holding a key, and it spends a deliberate guarantee on one
convenience. It would also rewrite a ruleset whose whole value is that it has been verified
case by case.

### 2. The trigger is a standalone script, called by `add-recording`'s last step

`pnpm submissions:notify`, a script beside `open-submission.ts`, invoked by a new documented
step at the end of `.claude/skills/add-recording/SKILL.md` after the Recording is published.

**Why standalone rather than logic inside the skill:** the skill is prose a session follows,
and prose cannot be tested. The script can be, in both directions, and it is reachable from a
plain local shell where `RESEND_API_KEY` already lives.

It takes the address and the submission key as arguments. Nothing is looked up, nothing is
guessed, and the same command is what the skill's step tells the maintainer to run.

### 3. The guard against a second send

**A sent-log keyed by the submission key.** `pnpm submissions:notify` writes
`.scratch/submission-receipt/notices/<submission-key>.json` and refuses to send for a key
that already has one, unless `--again` is passed explicitly.

The key is a ULID, so **the log file carries no address**, which is what makes it legal to
commit in a public repo under the convention `.gitignore` already states ("name anything
carrying a real address with the `.local.` infix"). The log records the key, the Recording it
was about, and when it went.

Its weakness, stated rather than hidden: it is local, so it does not follow the maintainer to
a second machine. The second layer covers that gap, and it is the one that actually prevents
the accident: **the script prints the address and the Recording it is about, and sends after
that**, so a repeat is visible on screen before anything leaves.

### 4. Two links, both derived from the row that was just written

The maintainer asked for both, and reading `app/contributors/page.tsx` shows the second is
safe rather than risky once the name is not retyped:

```
https://rnui.dev/recording/<id>
https://rnui.dev/products?contributor=<URL-encoded recording.contributor>
```

**Both come from the row `add-recording` has just written** in `data/<category>.ts`, so
`recording.id` and `recording.contributor` are the exact strings the catalogue itself holds.

That matters because of what that page's header records: `Pushkar Tandon` and
`Pushkar Tandon ` collapse to the same slug, which is why there is no `/contributors/[slug]`
and never will be, and why `/products?contributor=<exact name>` is the only address for one
Contributor's work. A hand-typed name one space out would land on an empty catalogue. Read
from the row, the filter matches by construction.

Encoding follows the site's own convention: `URLSearchParams`, the same construction
`app/products/page.tsx` uses in its permanent redirect, so a name with a space or a non-Latin
character survives the trip.

The two links answer two different things, which is why both are worth including. The first
is "here is your work, live". The second is "here is everything of yours on this site",
which for a first-time Contributor is a short page today and grows.

### 5. A missing address skips the notice, loudly, and never blocks the publish

The script prints the submission key and says the notice was not sent, and exits without
sending. Publishing the Recording is the valuable act; refusing to publish because a courtesy
could not be sent is backwards. But a silent skip is not acceptable either, so the line is
printed for every run where nothing went out, and it names the key so the address can still
be found in the console.

### 6. No change to `firestore.rules`, and none to the consent record's shape

Stated because the acceptance asks for it either way, and it is the answer the tickets behind
this one need.

The record stays written by the route and read by nobody, with the five fields it has. The
address's second use travels through the maintainer's inbox, not through a query, so there is
nothing to add and nothing to permit.

### 7. What this settles for the tickets behind it

[Build the receipt](07-build-the-receipt.md): unaffected by any of the above, because the
receipt's address arrives in the request rather than from a lookup. Its own blockers are all
resolved now.

[What does the publication notice say?](10-what-does-the-publication-notice-say.md): the
wording owes two links, and their shape is above.

[Build the publication notice](11-build-the-publication-notice.md): the script, its argument
list, its sent-log and its skip path.

[How does a hand-typed outcome message get sent?](13-how-does-a-hand-typed-outcome-message-get-sent.md):
the address is in the inbox for this case too, so its recommended answer, a reply to the
notification, needs no lookup and no tool.

No em dashes were introduced.
