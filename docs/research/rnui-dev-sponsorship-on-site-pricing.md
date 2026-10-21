# Pricing an on-site sponsorship on rnui.dev


Research date: 2026-10-02. Traffic and subscriber figures are **first-hand measurement**
against this site — PostHog project 117415 and the Resend API — not quoted from a vendor or
an analytics blog. Published rate cards are cited individually and attributed to the seller.

**Companion to** [`react-native-dev-sponsorship-pricing.md`](./react-native-dev-sponsorship-pricing.md).

That report priced the **newsletter** channel and found no published rate for on-site
placement. This one prices **on-site placement only** — the actual asset — against
rnui.dev's measured traffic.

**The newsletter channel is closed and is not used anywhere below.** The Resend audience
that carries the subscribe list (`General`, created 2025-07-18) holds **1 contact** as of
2026-10-02. Confirmed two ways: the Resend contacts API (`has_more: false`, 1 contact) and
`lib/subscription-consent-firestore.ts:32`, which hardcodes `AUDIENCE_NAME = "General"` and
writes every confirmed subscriber into it. Every newsletter rung in the companion report is
therefore unsellable and its prices must not be quoted to a sponsor.

---

## Question

What can a React Native product company be asked to pay for a **placement in the live
rnui.dev site**, per month / per quarter — and what does the inventory actually justify?

## The inventory, measured

PostHog project 117415, filtered to `$host = 'www.rnui.dev'` (the current Design; the
project also receives `old.rnui.dev`, which would otherwise double-count), bots excluded
via the project's own `$virt_is_bot` test-account filter. Pulled 2026-10-02, window
2026-09-03 → 2026-10-02 UTC.

| Metric | 30 days | 7 days | 1 day |
|---|---|---|---|
| Unique visitors | **365** | 92 | 23 |
| Pageviews | 2,652 | 807 | 113 |
| Sessions | 606 | 150 | 30 |
| Avg session | 5m 58s | 7m 02s | 5m 01s |
| Bounce rate | 48.5% | 52.7% | 43.3% |

**Trajectory is down, and that must be disclosed.** Month-over-month: visitors
**−44%** (648 → 365), sessions −28%. Views rose +6%, session duration +11%, bounce improved
59.1% → 48.5%. Fewer people arriving, but each stays longer and looks at more. The 7-day
run-rate (92 ≈ 395/mo) is back near the 30-day average, so the drop is not still
accelerating.

#### The engagement numbers are what justify a sponsorship

| Signal | Events | Unique users | % of visitors |
|---|---|---|---|
| Demo played (live component video) | 16,318 | **280** | 77% |
| Filter applied (browsing by category) | 756 | 85 | 23% |
| Recording opened (a library's page) | 399 | 83 | 23% |
| **Repo clicked (outbound to the library's GitHub)** | **90** | **40** | 11% |
| Search performed | 89 | 17 | 5% |
| Sort changed | 55 | 30 | 8% |
| Load more clicked | 85 | 26 | 7% |
| Bookmark added / vote cast | 12 / 3 | 3 / 3 | 1% |

#### Where the value sits — the decisive table

| Surface | demo plays (users) | recording_opened | **repo clicks (users)** |
|---|---|---|---|
| `/recording/*` — one library's page | 341 (66) | — | **68 (36)** |
| `/products` — the catalogue | 7,135 (125) | 240 (48) | 15 (5) |
| `/` and other | 8,842 (216) | 159 (49) | 7 (3) |

**A visitor on a library's detail page clicks through to that library's GitHub roughly half
the time** — 36 of 66 users. Those 68 clicks are 76% of all outbound repo clicks the site
produces. The homepage carries the most attention (216 users playing demos) and almost no
intent (7 clicks). The catalogue is where people browse; the detail page is where the
decision is made.

This is the whole pitch, and it is not a traffic argument: **rnui.dev sits inside the
library-selection moment, and it hands 40 qualified developers a month directly to a
product's GitHub.**

#### What the same inventory earns on an ad network

Carbon Ads, the only dev-focused network publishing a full card, pays publishers
**$1.20–$2.30 CPM** and charges advertisers **$6 CPM** ([media kit](https://www.carbonads.net/media-kit),
last reviewed 2026-09-02). At 2,652 pageviews that is **$3–6/month**. Even a generous $10
AdSense RPM on developer content yields ~$26/month.

**Programmatic and direct-sold are not the same market, and the gap is roughly 50×.** The
per-impression price is irrelevant; the relevant unit is the *hand-off*, and it is worth
what the receiving product earns from it.

---

## Price ladder

Anchored to what the inventory does, not to its size. Values are what to **ask**, and what
to **accept** — the first sale is a proof of concept and should close cheaply.

| # | Package | Ask | Accept | What the sponsor is buying |
|---|---|---|---|---|
| 1 | **Dofollow logo credit**, footer | $50/mo | free | Brand association. Use it to seed the first deal, never as revenue. |
| 2 | **Sponsored listing in `/products`** — "Featured" ribbon, always in first position, permanent | **$200/mo** | $100/mo | Discovery. Appears wherever anyone browses any category. |
| 3 | **Sponsored ribbon on the library's own `/recording/*` page** + dofollow link | **$300/mo** | $150/mo | **The decision surface.** Where 50% of visitors already click to GitHub. |
| 4 | **Sponsored technical post** — owner-written, sponsor-approved | **$400** one-off | $200 | A credible technical endorsement in the owner's voice. High effort; sell sparingly. |
| 5 | **"Founding Sponsor"** — #2 + #3 + one post + logo, 12 months, category exclusivity | — | — | Lock the category before a competitor buys it. |
| 6 | **Annual**, prepaid | 15% off quarterly | — | Cash up front; standard across published dev rate cards. |

**Quarterly figures:** #2 alone **$500–750**; #2 + #3 **$1,000–1,500**; Founding Sponsor
**$2,500–4,000/year**.

#### The ceiling, and why

Value the inventory from the receiving side. A GitHub visit from an RN developer sits near
the top of a dev-tool funnel. Assuming 1–5% of GitHub visitors reach a paid tier at
$50–200/yr, one acquired customer is worth roughly **$25–200** in first-year revenue. At
**40 repo clicks/month**, the *entire* click stream is worth about **$100–800/month** to one
sponsor.

So:

- **$200–300/mo is genuinely fair** and needs no heroics to justify.
- **$500/mo** needs the click stream plus the permanent catalogue association, and is a
  stretch a small dev company will decline.
- **Above ~$500/mo** cannot be defended on traffic. It requires the email list (below).

**Do not quote impressions.** 2,652 pageviews at a $10 CPM reads as a bad deal and invites
the comparison to Carbon Ads. Quote *40 qualified outbound clicks, 280 demo plays, 83
library-page opens, 100% of it React Native*.

---

## How to sell it

1. **Lead with the detail-page number, not the traffic number.** "Half the developers who
   land on a library's page click through to its repo" is the pitch. "365 monthly visitors"
   is not — it is small, and a sponsor will check it.
2. **Disclose the −44% before they find it.** They will check, and the trend is not the
   strong part. The defence is the engagement shift: bounce 59% → 48.5%, session time +11%.
3. **Sell exclusivity for a category, not just a slot.** One sponsored animation library is
   a feature; two is an ad programme nobody wants. This is what justifies the Founding
   Sponsor tier above plain sponsorship.
4. **Offer a tracked link.** The site already fires `repo_clicked`; a sponsor-specific
   query parameter makes clicks attributable per sponsor. Reporting is what converts a
   one-off into an annual contract — and it is cheap to add.
5. **Make the first one cheap and public.** One named sponsor, one link, one number. That
   case study is worth more than the fee and is the only thing that unlocks the next price.
6. **Price #3 and #3-permanent as the renewal.** A ribbon on the detail page is a monthly
   product; it renews, and renewal is where the margin is.

### Who to knock first

Start where the spend already happens. The This Week In React
[sponsor page](https://thisweekinreact.com/sponsor) (updated June 2026) lists past sponsors
including **RevenueCat, Callstack, Software Mansion, Stream, PowerSync, Blitz, WorkOS,
Clerk, Axiom** — the exact set rnui.dev is targeting has already bought this class of
placement. Software Mansion is both a target buyer and the publisher of React Native
Weekly, so it knows the value of an RN audience first-hand.

---

## The thing that would actually raise the price

The list. `General` holds **1 contact** against ~400 monthly visitors. That is the binding
constraint on every number above, and it is a growth problem with a direct payoff: at a 5%
subscribe rate, 400 visitors/month yields ~20 subscribers/month — roughly **240 within a
year**. A list of that size is what turns $250/mo into $1,000+/mo, because it becomes a
sendable, targetable asset with a real open rate instead of a page placement.

Sell the placement to fund the list, and the list to sell the placements properly.

---

## Gaps

- **No first-party rate exists anywhere for an on-site sponsorship.** Every published dev
  rate card prices a *newsletter* or a *dedicated send*. The ladder above is derived from
  rnui.dev's own measured inventory and buyer-side economics, not from a comparable
  on-site price. This is a derived estimate, not a published price.
- **No buyer-side conversion benchmark for developer tools** was found from a primary
  source, so the 1–5% paid-tier assumption in *The ceiling* is an assumption. It is the
  single number the ceiling rests on.
- **No sponsor has ever been charged**, so there is no historical anchor and no
  demonstrated renewal rate.
- The audience is **not purely enterprise**: of 365 visitors the top countries are
  US 60, India 39, Germany 18, Brazil 13, Türkiye 13, Spain 11, Pakistan 10, Netherlands
  10, Canada 10. India + Pakistan + Bangladesh + Vietnam together are roughly **17%** of
  traffic — a large share of React Native's developer base is at agencies and
  outsourcing shops, who buy on a client's behalf and are more price-sensitive. Weight
  the target list towards US/EU vendors and avoid pitching pure self-serve SaaS pricing.
- The **350 GitHub stars** on `mrpmohiburrahman/rnui.dev` (the repo linked from the site
  footer, formerly `awesome-react-native-ui`) are a modest authority signal. Worth
  mentioning; not worth a line in the pitch.

## Update — 2026-10-08 (re-measured, price ladder revised)

Re-measured six days later. Two findings change the ladder above, one of them materially.

### The 30-day visitor count is inflated by a single day

| Window (30d, `www.rnui.dev`, bots excluded) | Visitors | Pageviews |
|---|---|---|
| Raw, includes Oct 7–8 | **715** | 4,725 |
| **Baseline, Oct 7–8 excluded** | **378** | **2,881** |
| Prior 30 days | 688 | — |

**267 of the 715 visitors arrived on 2026-10-07** (168 direct, 67 Reddit, 24 Google) and
traffic fell back to 94 the next day. This is one viral day, not a trend: the preceding
30 days were 688, and the daily baseline across Sept–Oct is 12–20 visitors with a
September high of 36. **Quote a sponsor 378, never 715.** A sponsor who checks PostHog and
sees 715 will check again, and the correction costs more credibility than the number bought.

### The detail-page click rate, measured correctly this time

The 2026-10-02 report stated "36 of 66 users click to GitHub" (~50%) by intersecting
`recording_opened` with `repo_clicked` per session. Measured properly — unique users per
surface, a user attributed to the surface where the click fired, over the full 30 days:

| Surface | Pageview users | Repo-click users | Click rate |
|---|---|---|---|
| **`/recording/*` (library detail)** | 213 | **49** | **23%** |
| `/` + other | 511 | 9 | 1.8% |
| `/products` (catalogue) | 246 | 6 | 2.4% |
| `/submit` | 150 | 0 | 0% |

**23%, not 50%** — and the qualitative conclusion survives intact: the detail page converts
at **10–13× the catalogue and the homepage**. Lead with the detail-page number; do not quote
the 50% figure, which came from a session-level join that overstates it.

Baseline engagement excluding the spike: **271 demo-play users, 37 repo-click users**,
83 recording-opened users, 80 filter-applied, 77 searches.

### Revised price ladder

The $200–300/mo "fair" range above held up, but the reasoning in *The ceiling* needs
restating at the lower, correct click volume. Baseline is 37 repo-click users/mo (was 40),
and the detail-page rate is 23% (was ~50%).

| Package | Ask | Accept |
|---|---|---|
| Dofollow logo credit, footer | $50/mo | free |
| **Sponsored listing in `/products`**, permanent, 1 per category | **$200/mo** | $100/mo |
| **Sponsored ribbon on `/recording/*`** — the decision surface | **$300/mo** | $150/mo |
| Both (listing + detail-page ribbon) | $500/mo | $300/mo |
| Founding Sponsor — both + one post + category exclusivity, 12 mo | $1,000/mo | $600/mo |

**Weekly equivalents** (÷ 4.33): **$23 · $46 · $69 · $115 · $139 per week.** Bill quarterly;
it is the convention on every published dev rate card and it gets you paid up front.

#### Break-even, and why $2,000/mo is out of reach on impressions

At $100 first-year value per acquired dev-tool customer (the assumption *The ceiling* rests
on, still unverified from a primary source):

| Price | Customers/mo needed | As % of the 37 repo-click users |
|---|---|---|
| $200/mo | 2 | 5.4% |
| $300/mo | 3 | 8.1% |
| $500/mo | 5 | 13.5% |
| **$2,000/mo** | **20** | **54%** |

Four models for the visitors needed to justify **$2,000/mo**, and the disagreement between
them is the real answer:

| Model | Visitors/mo needed | vs. today's 378 |
|---|---|---|
| Hand-off, linear from current inventory | **~3,000** | 8× |
| Qualified-dev at $0.50/dev, 70% dev share | ~5,700 | 15× |
| Display CPM floor at $30 CPM, 2 impressions/visitor | **~33,000** | 88× |
| Newsletter at $78.6 sub-CPM, 4 sends/mo, 5% conversion | ~127,000 | 336× |

**~3,000–6,000 monthly visitors is where $2,000 becomes defensible**, and only via the
hand-off story. Sold as impressions it needs ~33,000. At 2,881 pageviews a $30 CPM network
buy yields **$86/mo**; Carbon Ads would pay $3–6 for the same traffic. Do not quote
impressions — quote 37 qualified outbound clicks, 271 demo plays, 100% React Native.

### Rate cards re-verified against source 2026-10-08

Both anchors were fetched live, not carried forward:

- [**This Week In React — sponsor**](https://thisweekinreact.com/sponsor), page states
  *"Last updated: June 2026"*: **40,297 subs, 56% open, 11% click.** 1st sponsor
  €1,500 / €2,700 (2) / €5,000 (4, recommended) / €9,600 (8). 2nd sponsor €800 → €4,000.
  **4× React Native Links €600** (€150/send) against 4× React Links €1,600 — the same
  publisher charging **8× more for the React audience than the React Native audience**.
  Past sponsors include **Callstack and Software Mansion**, i.e. the exact rnui.dev targets.
- [**Native Weekly — sponsor**](https://www.nativeweekly.com/sponsor): **5,000+ subs, 58%
  open, 18% click**, USA 60% / Germany 15% / India 10%. **$440 per issue, $1,760 for 4.**
  "400–600 clicks per placement." 2nd placement mid-newsletter at 50% off.

Normalised: **$78.6 subscriber-CPM** at Native Weekly, against Carbon's $6 *advertiser* CPM —
a 13× uplift, and the reason precision beats list size here.

### Still closed: the newsletter

Resend audience `General` re-checked 2026-10-08: **1 contact**, `has_more: false`. The
`newsletter_submitted` event has **never fired once** in the project's history — not in the
taxonomy at all. The newsletter channel remains unsellable, and no rung of the ladder above
may be justified by email reach.

At a 5% subscribe rate on 378 baseline visitors that is ~19 subscribers/month. The path from
here to the $1,000/mo rung runs through the list, not through traffic: sell the $200–300
placement to fund it, then sell the list properly.

### Risk, restated for this specific placement

A paid slot inside a curated catalogue violates the community norm unless it is visually
labelled **"Sponsored"** and never ranked or interleaved with the free entries. The
`/products` surface is a discovery surface — mixing paid and unpaid results destroys the
trust that makes 23% click-through possible in the first place. Sell **one sponsor per
category** so the slot never competes with a sponsor's own competitor.

## Sources

Measured from PostHog project **117415**, `$host = 'www.rnui.dev'`, bots excluded, pulled
2026-10-02 — visitors, sessions, pages, countries, referrers, and the engagement-event and
surface breakdowns above.

### Update sources (2026-10-08)

- PostHog **117415**, `$host = 'www.rnui.dev'`, window 30 days to 2026-10-08: baseline
  (Oct 7–8 excluded) 378 visitors / 2,881 pageviews / 271 demo-play users / 37 repo-click
  users; spike day Oct 7 = 267 visitors; surface click-rate table computed from
  `$current_url` bucketed by surface, `countIf`/`uniq` over `$pageview` and `repo_clicked`.
- Resend audiences + contacts API, audience `General`
  (`958d64ec-630e-40ba-9cc7-3a9a9e64fedb`) — 1 contact, `has_more: false`, re-confirmed.
- `newsletter_submitted` — the event `components/newsletter-form.tsx:58` captures — is absent
  from the project's event taxonomy. `SELECT event, count() … WHERE event ILIKE '%subscri%'`
  returns zero rows across 90 days of data, and PostHog returns a taxonomy warning naming it
  as not found when queried directly.
- [This Week In React — sponsor](https://thisweekinreact.com/sponsor) and
  [Native Weekly — sponsor](https://www.nativeweekly.com/sponsor), both fetched 2026-10-08;
  subscriber counts, open/click rates and every price quoted above are as published on those
  pages on that date.

- Subscriber count: Resend audiences/contacts API, audience `General`
  (`958d64ec-630e-40ba-9cc7-3a9a9e64fedb`), 1 contact, `has_more: false`.
- Where the list is written: `lib/subscription-consent-firestore.ts:27-32,72`.
- [Carbon Ads media kit](https://www.carbonads.net/media-kit) (last reviewed 2026-09-02) —
  the $1.20–$2.30 publisher CPM and $6 advertiser CPM used for the ad-network comparison.
- [This Week In React — sponsor](https://thisweekinreact.com/sponsor) — past-sponsor list
  establishing that the target companies already buy this placement.
- [State of React Native 2025 — Resources](https://results.2025.stateofreactnative.com/en-US/resources/)
  (n=713) — RN devs prioritise documentation (86.6%) over newsletters (best 32.5%); the
  basis for selling a permanent catalogue listing rather than reach.