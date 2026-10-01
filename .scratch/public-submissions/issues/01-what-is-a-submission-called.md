# What is a Submission called?

Status: resolved
Type: grilling

## Question

`CONTEXT.md` has no term for what arrives at `/submit`. Create one before any code names it,
because the wrong word is how a future ticket writes an unvetted thing into the catalogue.
Run `/domain-modeling`; use `/grilling` if the answer is contested.

Answer all four:

1. **What is the noun?** `Recording` is a *catalogue* record: published, vetted, present in
   `data/<category>.ts`, with an Asset path immutable once published (ADR-0003). What arrives
   at `/submit` is none of those — unvetted, unreviewed, may never be published, and its file
   is deleted after 30 days. Candidates: *Submission*, *Proposal*, *Contribution*, or a
   qualified `Recording` such as *Pending Recording*. Whatever wins goes into `CONTEXT.md`
   with an `_Avoid_` list, in the style of the existing entries.

2. **What do we call the person before publication?** `CONTEXT.md` defines **Contributor** as
   "the person whose work a Recording shows", and lists *submitter* and *user* under its
   `_Avoid_`. If the person who submits is not yet a Contributor, this effort either needs a
   second term or must justify calling them a Contributor on arrival. Do not leave it
   implicit — the form's labels depend on it.

3. **Is a Submission consent-bearing?** Map decision 9 says it carries a consent record. Does
   that make *Submission* a domain term, or is the record an implementation detail of the
   form? The distinction decides whether tickets 05 and 10 write vocabulary or code.

4. **Where does the word appear?** Form labels, the privacy policy, the notification email
   (ticket 09), and every comment in the code. Fix the spellings once so four surfaces do not
   drift.

## Notes

`CONTEXT.md`'s `### The catalogue` section is where this belongs if it is a catalogue concept;
`### The site` if it is a form concept. Read both before choosing.

Nothing blocks this ticket. Three block on it: **05, 07, 10**. Prefer the plain answer over a
clever one — the shortest word that is not already taken.

## Answer

Resolved 2026-09-25 with the maintainer.

- **The noun is `Submission`.** Added to `CONTEXT.md` under `### The catalogue`, ahead of
  `Recording`, with its `_Avoid_` list: *entry, item, proposal, contribution, pending recording,
  upload*. The entry states the things that actually separate it from a Recording — not in
  `data/<category>.ts`, not on the site, file deleted after 30 days — and states that promotion is
  one-way and only the maintainer does it.
- **The person is a `Contributor` from the moment they submit.** `CONTEXT.md`'s Contributor entry
  was extended to say so, because its existing definition ("the person whose work a Recording
  shows") would have implied a second word was needed. *Submitter* stays avoided: it would name a
  state that does not exist.
- **A Submission is not consent-bearing in the vocabulary.** Decision 9's consent record is an
  implementation detail of the form, so ticket 10 writes code rather than language, and `CONTEXT.md`
  gains no consent term.
- **Spellings, fixed here so four surfaces do not drift:** `Submission` and `Contributor`, both
  capitalised when they name the concept, lowercase `submission` only in a URL or a code identifier.
  Used by the form labels (ticket 05), the privacy policy (ticket 10), the notification (ticket 09)
  and every code comment.

**This unblocked 07 and 10.**
