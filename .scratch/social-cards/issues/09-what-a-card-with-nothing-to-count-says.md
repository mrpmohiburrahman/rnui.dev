# What a card with nothing to count says

Status: open
Type: grilling
Blocked by: 04

## Question

**Roughly ten routes in `app/` are neither Recording, Contributor nor Category: `/`, `/aboutus`,
`/contactus`, `/subscribe`, `/submit`, `/bookmarks`, `/privacypolicy`, `/termsofservice`, `/not-found`.
They share a link and have no count to show. What does each card say?**

The map's fog has this and it is not sharp enough to have been ticketed before; the default card's
design now makes it sharp, because once a default design exists the question becomes "which of these
ten actually needs its own, and which is honestly better served by the default".

Group them by what a share *means*:

- **`/`** — the default card's own territory, but a root share and a filtered share are different
  intentions even if they get the same image.
- **`/aboutus`** — the maintainer's page. A share of it is a person sharing themselves, and it deserves
  to be recognisably a person rather than the catalogue.
- **`/contactus`, `/subscribe`** — transactional. Is a card for these the default, or something that
  says what tapping it gets you? Note `/contactus`, `/subscribe` and `/submit` each have their own
  `layout.tsx`, which is where a card for them would sit.
- **`/privacypolicy`, `/termsofservice`** — legal text, never shared deliberately. The default card is
  fine and saying so is a decision.
- **`/bookmarks`** — per-visitor and machine-local; a share of it shows a stranger someone else's
  bookmarks. Worth deciding whether it should have a card at all, and `robots.txt` is a related
  question this map should not accidentally answer.
- **`/not-found`** — a card on a 404 would be absurd, and if the mechanism makes one unavoidable, that
  is a finding about the mechanism rather than a design question.

For each: the default card, or its own? If its own, what is the one thing it says? Settled here so
that the spec can state a complete list rather than a rule.

## Notes

- `/bookmarks` and `/products` are the two client-heavy routes; `app/products/page.tsx` awaits
  `searchParams` and `/bookmarks` reads the Remembered set from the browser. Neither can be fully
  prerendered, which bears on ticket 07's runtime question and is worth restating there.
- The three stored Remembered-set keys are `"bookmarkedItems"`, `"votedItems"` and
  `"viewedEntryIds"` (`CLAUDE.md`), and the last is one this map must not emit. Unrelated to cards,
  but noted because a `/bookmarks` card touches that route.
- Invoke `/grilling`. This is a short conversation with the maintainer, not a build.