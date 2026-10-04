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

## Sources

Measured from PostHog project **117415**, `$host = 'www.rnui.dev'`, bots excluded, pulled
2026-10-02 — visitors, sessions, pages, countries, referrers, and the engagement-event and
surface breakdowns above.

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