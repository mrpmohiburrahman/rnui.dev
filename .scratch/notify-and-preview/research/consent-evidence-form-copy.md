# Consent evidence: the signup copy the 48 actually saw

Snapshotted 2026-08-14 for ticket 03. **This file is the consent record.** Alongside each
address's `createdAt` in Firestore it is the whole of the proof that anyone on the list asked
to be emailed, and it is the only proof there will ever be. Ticket 06 rewrites the live copy;
nothing in ticket 06 may edit this file.

## What was live, and where

Two surfaces, both carrying the same promise:

| Surface         | File                             | Rendered by                       |
| --------------- | -------------------------------- | --------------------------------- |
| Homepage panel  | `components/newsletter-form.tsx` | `app/page.tsx`, right-hand column |
| Standalone page | `app/subscribe/page.tsx`         | `/subscribe`                      |

Note the footer form is **not** part of this record. The footer NOTIFY column is a
`feat/studio-dark` addition and has never been in production.

## The commit range it was live at

|               | SHA                                                      | Date       |
| ------------- | -------------------------------------------------------- | ---------- |
| Introduced    | `6812cdb17812f98a5af033040e8aa4d28de98ad1`               | 2025-01-08 |
| Still live at | `3ff21a128175d16fad927b37e6fbf24fb164b62d` (`main` HEAD) | 2026-07-30 |

**The copy did not change once across the whole collection window.** The only commit to touch
either file in between is `1139632cb22d83191528189fdc4892105882c8bf` (2026-07-30, "refactor: stop
printing debug output on ordinary paths"), which removed one `console.log` from each. Zero words
changed. So a single snapshot covers every one of the 51 signups — there is no per-address
question of _which_ copy that person agreed to.

One wrinkle worth recording: the three earliest signups (2024-12-30, 2025-01-04, 2025-01-07)
**predate `6812cdb` by up to ten days**. The Next.js site was developed outside git history and
committed in one drop after it was already serving, so those three saw this same copy in
production before it was ever committed. There is no earlier form — the pre-Next.js site had no
signup surface anywhere in its tree.

## The copy, verbatim

Homepage panel, `components/newsletter-form.tsx` at `3ff21a1`:

- Heading: **"Get notified when new animation is being added"**
- Field placeholder: `youremail@email.com`
- Submit button: **"Sign up →"** (**"Submitting..."** while pending)
- On success: **"Thank you for signing up!"**
- On a return visit: **"You have been added to the email list."**

`/subscribe`, `app/subscribe/page.tsx` at `3ff21a1`:

- Heading: **"Awesome React Native UI"**
- Body: **"Get notified when new animation is being added"**
- Field label: **"Email Address"**, placeholder `youremail@email.com`
- Submit button: **"Sign up →"** (**"Submitting..."** while pending)
- On success: **"Thank you for signing up!"**

That is the entire text. There was no other wording on either surface — no checkbox, no
consent sentence, no link to a privacy policy.

## What the copy does and does not establish

**Establishes.** A request to be notified when a new Recording is added. That is an unambiguous
opt-in to the Digest and to nothing else, and it is why the map's first sending verdict is
_send_: the Digest is literally the thing this text promised.

**Does not establish.** Everything ticket 04 exists to fix, all of it absent from both surfaces:

- no identification of the sender — no name, no trading identity, no postal address
- no contact method other than the site itself
- no statement of frequency
- no mention of unsubscribing, and no unsubscribe mechanism existed
- no link to a privacy policy, and no statement of what the address would be used for
- no separate affirmative act — submitting the form was the whole of the consent
- no double opt-in, so no proof the person controls the address they typed

Two further gaps in the record itself, both permanent:

- **No IP address, user agent or timestamp of the page view was ever stored.** The write is
  `{ email, createdAt }` and nothing else, so the evidence is the signup instant and this file.
- **The write path was public and uncaptcha'd**, which is why 18 of the 51 rows turned out to be
  a bot. See `scrub-2026-08-14.md`.

## The word "animation"

Both surfaces say "new animation". `CONTEXT.md` lists _animation_ under _Avoid_ — the domain term
is **Recording**. The copy is quoted here as it stood because this is an evidence file and the
evidence is what it is. Ticket 06 is where the live copy is corrected.
