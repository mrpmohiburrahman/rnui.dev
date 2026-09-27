# A Contributor's identity is their name string

Grouping Recordings by person needs a key, and this catalogue has no database to hold one: the key is the exact string in `Recording.contributor`, and the 23 names in `data/*.ts` are the 23 Contributors. We keep it that way — no id, no slug, no registry — and add the two things that make it safe to keep: a spelling rule that says when two names are the same person, and a data test that refuses a second spelling into `main`.

This became a decision rather than an accident when the submission form began suggesting existing names. Anything that helps a stranger pick the right Contributor has to answer "the same as what?", and the answer is now written down somewhere other than a code comment.

## Considered options

- **A slug** — `jake-wharton` as the key. Rejected in `app/contributors/page.tsx`: `Pushkar Tandon` and `Pushkar Tandon ` collapse to the same slug under every slugifier, and `Daehyeon Mun (문대현)` loses `문대현` entirely under NFKD-then-strip. *"A scheme that works for 22 of 23 names and silently merges the 23rd is not a scheme."*
- **A stable id per Contributor** — a `contributors.ts` registry plus a `contributorId` on every Recording. The real alternative, and the one this ADR declines. It buys renameability, and it is the only thing that could tell two people with the same name apart. Neither has been needed across 280 Recordings and 23 names, and the price is a hand-maintained registry (nothing can generate it), a migration across every data line, and every live `?contributor=` address.
- **Fold aggressively on read** — strip accents, punctuation and case so near-spellings merge themselves. Rejected: it merges names that are genuinely different people, and it hides a duplicate rather than preventing one. Folding is for recognising a name as it is typed; it never reaches storage.

## Consequences

- **Two people who share a name are one Contributor**, so far as the catalogue can tell. Accepted deliberately: the maintainer reads every Submission before it becomes a Recording, and can ask before publishing.
- **Renaming a Contributor is a data edit across every Recording of theirs.** There is no rename operation, and this ADR is the reason there is not one.
- **The identity is not stable under whitespace**, so the data is guarded rather than trimmed. `tests/data-integrity.test.ts` already fails if a stored name carries surrounding whitespace — the guard that caught `"Pushkar Tandon "` — and a second guard fails if two stored names fold to the same person.
- **Anything that matches on a name must fold, and anything that stores one must not.** The two rules are deliberately different, and a reader who finds only one of them will "fix" the other.
