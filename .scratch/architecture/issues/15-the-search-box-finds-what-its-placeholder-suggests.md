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

**Status:** ready-for-agent

- [ ] The matching rule is a pure function of an Entry and a search term, in a module the data suite can import without credentials
- [ ] Every Category display name returns a non-empty result, asserted by iterating the Category table rather than a hand-picked sample
- [ ] Every Author name returns a non-empty result, asserted by iterating the Authors present in the catalogue
- [ ] A multi-word term matches when each of its words appears in the caption, the author or the Category
- [ ] Matching stays case-insensitive, and an empty or whitespace-only term still returns every Entry
- [ ] The Entry fetch calls the function rather than restating the rule, and no second copy of the matching logic exists
- [ ] The sitemap configuration names the host the site is actually served from, and excludes the orphan search page
- [ ] No dependency is added
- [ ] Type check, test suite, build and end-to-end tests all pass

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
