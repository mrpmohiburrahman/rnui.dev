# 15 — The search box finds what its own placeholder suggests

**What to build:** Typing a Category name or an Author name into the search box
returns that Category's or that Author's Entries, instead of nothing.

The box on the home page rotates the eighteen Category display names as its
placeholder suggestions. Fourteen of the eighteen return zero results when typed.
`Buttons` returns nothing against twenty Entries; `Sliders` nothing against
nineteen; `Misc` nothing against a hundred and forty-eight. One Author of
twenty-four is findable. The box is advertising queries it cannot answer.

The cause is one line in the Entry fetch: the filter tests the caption and only the
caption, matching the raw phrase with a substring test. A caption averages 2.31
words and never contains its own Category name. Make the rule test caption, author
and Category, and require every word the visitor typed to appear in one of the
three rather than the whole phrase in one. `tab bar` then goes from three hits to
nineteen, and every Category and every Author becomes findable by typing it.

The rule moves out of the server action and becomes a pure function of an Entry and
a term. It has to, in order to be checkable: the action is a server action reaching
Firestore, so nothing in the data suite can reach the matching rule where it lives
now. As a pure function it runs against the catalogue with no credentials, which is
how the criteria below are verified.

While in the sitemap configuration, two lines that are lying. The site address it
generates points at a host whose DNS resolves to a parking page and which serves
nothing. And `/search` is listed as crawlable, which aims search engines at an
orphan page that returns 503 in production.

**No search engine is added and no index is built.** Two independent measurements
against this catalogue — a benchmark of forty-four queries, and a real
384-dimension model run locally — found embedding search scoring *below* untuned
keyword search on this corpus: 80% and 91% recall against 89% and 95%. Captions
average 2.31 words, sixty-nine percent are one or two words, and the whole
searchable corpus is under thirteen thousand characters. There is nothing in a
two-word noun phrase for a meaning-model to recover, and an index for it would be
larger than the text it indexes. Cost was never the deciding factor: at this
traffic the paid version is fractions of a cent per year. It is simply the worse
product here.

**Blocked by:** None — can start immediately. It touches neither catalogue merge,
and none of the modules ticket 06 deletes.

**Status:** resolved

- [x] The matching rule is a pure function of an Entry and a search term, in a module the data suite can import without credentials
- [x] Every Category display name returns a non-empty result, asserted by iterating the Category table rather than a hand-picked sample
- [x] Every Author name returns a non-empty result, asserted by iterating the Authors present in the catalogue
- [x] A multi-word term matches when each of its words appears in the caption, the author or the Category
- [x] Matching stays case-insensitive, and an empty or whitespace-only term still returns every Entry
- [x] The Entry fetch calls the function rather than restating the rule, and no second copy of the matching logic exists
- [x] The sitemap configuration names the host the site is actually served from, and excludes the orphan search page
- [x] No dependency is added
- [x] Type check, test suite, build and end-to-end tests all pass

The assertions iterate the Category table and the Author list rather than naming
cases, so a Category added later is covered the day it lands and forgetting to
extend the test is not possible.

**Accepted costs, named now rather than discovered later.** Results come back
unranked, in catalogue order, and `Misc` returns a hundred and forty-eight of them
— the grid is unpaginated and people already scroll it, but it is real. Typos still
miss: `buton` and `carosel` return nothing, and no amount of tuning token matching
fixes that. So do paraphrases the captions never use, like `swipeable card` or
`skeleton loader`. Both gaps are closed by a fuzzy-matching library for about six
kilobytes, and neither should be bought before the analytics already installed say
how many zero-result queries are actually of that shape.

**Deliberately not done.** The three dead search modules stay in the tree.
Nothing links to `/search`, so they cost no visitor anything, and removing them is a
decision about a submitted grant claim rather than about code. That deletion belongs
to ticket 06 once the claim is settled.

## Comments

**Implemented 2026-07-30.**

**Measured, before and after, over all 277 Entries:**

| Category | before | after | | Category | before | after |
| --- | --- | --- | --- | --- | --- | --- |
| Accordions | 0 | 2 | | List | 12 | 18 |
| Arc Sliders | 0 | 2 | | Loaders | 0 | 4 |
| Bottom Sheets | 0 | 6 | | Misc | 0 | 148 |
| Buttons | 0 | 20 | | Onboarding | 6 | 6 |
| Carousels | 1 | 10 | | Parallaxes | 0 | 4 |
| Charts | 2 | 9 | | Pickers | 0 | 1 |
| Circular Progress Bars | 0 | 3 | | Sliders | 0 | 19 |
| Drop Down | 0 | 2 | | Tab bars | 0 | 19 |
| Full Apps | 0 | 5 | | Headers | 0 | 3 |

Fourteen of the eighteen returned zero, exactly as the survey said. Authors: 24 in
the catalogue, **1** findable before, **24** after. `tab bar`: 3 → 19.

**The rule** is `matchesSearchTerm(entry, term)` in `lib/entry-search.ts`. It lowers
the term, splits on whitespace, and requires every word to appear in the caption, the
author or the Category — each word may come from a different one of the three. It
imports `Entry` as a type only, so the data suite reaches it with no Firebase and no
credentials, which is the point: while the rule was a line inside a server action
that reaches Firestore, nothing could check it.

**One thing the obvious implementation gets wrong.** The three fields are joined
before the substring test, and joining them with a *space* lets a single word match
across a field boundary — an Entry captioned "…goes split" by an author "button
Person" would answer to `splitbutton`. They are joined with a newline instead, which
is safe because terms are split on whitespace and so no word can ever contain any.
There is a test for it.

**`tests/entry-search.test.ts`, 67 assertions**, all generated by iteration rather
than named: one per Category from `CATEGORY_NAMES`, one per Author present in
`allEntries`. A Category added later is covered the day its row lands.

Two details worth knowing about those loops. The per-Category assertion is that
*every* Entry in that Category is found by typing the Category's display name, which
is stronger than a non-empty count and stays correct for a Category whose row exists
before its first Entry — the non-empty assertion is made only for Categories that
have Entries, which is what `data/entry.ts` already warns about. And the Author loop
has a guard assertion that there is more than one Author, so it cannot pass vacuously
if the catalogue import ever comes back empty.

The improvement itself is asserted as a comparison — `tab bar` finds more than the
caption-only rule did — rather than as `19`, because the exact number moves every
time an Entry lands.

**The sitemap, and a third lying line the ticket did not name.**
`next-sitemap.config.js` said `https://rnui.pixellog.io/`, which does not resolve at
all: `curl` returns nothing, not even a parking page. `data/meta-data.ts` carried the
same dead host in the JSON-LD the site emits — the identical defect, one file over.
Both now say `https://www.rnui.dev`.

`www`, not the apex, checked against the live site: `https://rnui.dev` answers 307 to
`https://www.rnui.dev/`, which answers 200 with the real page. `data/default-url.ts`
moved to `www` as well, since it feeds `metadataBase` — a sitemap and a canonical
naming different hosts would have been a defect introduced by fixing only one of
them.

`/search` is excluded. The ticket said it returns 503 in production; it returns
**200**. The 503 is one level down: the page is a client form, and
`POST /api/search` — the endpoint it posts to — answers 503, so the page loads and
every search on it fails. It is still an orphan, with nothing in the tree linking to
it, so the exclusion stands; the reason is just narrower than the ticket recorded.
The generated sitemap now holds nine URLs, all on `www.rnui.dev`, and no `/search`.

**No dependency added**, and no index built. The generated `public/robots.txt` picks
up the corrected host on its own.

Verified: `pnpm check-types`, `pnpm lint` (0 errors), `pnpm test` (160 passed, up from
93), `pnpm build`, `pnpm exec playwright test` (7 passed).

**2026-07-30 — the three dead search modules this ticket left alone are deleted.**
So is the `/search` page they served, so the sitemap `exclude` that pointed at it
has gone too: there is no such route to exclude. `matchesSearchTerm` is untouched
and is now the only search in the repo. See
[ADR-0006](../../../docs/adr/0006-search-does-not-ship-and-the-codex-layer-goes-with-it.md).
