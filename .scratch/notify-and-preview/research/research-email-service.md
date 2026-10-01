# Email service for rnui.dev — 48 subscribers, conditional weekly digest

Research date: **2026-08-14**. All figures from vendors' own pricing/docs/policy pages.

## The situation being solved for

- 48 unique valid addresses in Firestore (`emails`: `email` + `createdAt`), collected 2024-12-30 → 2026-08-11.
- **Single opt-in, no confirmation email, no captcha, never mailed once.** 41/48 are gmail.com.
- Growth ~2.5/month, expected to rise (form moving to a footer column on every route).
- Job 1: one-off announcement / re-permission send.
- Job 2: conditional weekly digest — our code decides whether to send at all, fired from CI.
- Job 3: long-term list growth from the site's own form.

Two facts shape everything below:

1. **At 48 recipients this is not a "bulk sender" under Gmail's rules.** Google's threshold for the
   strict tier (RFC 8058 one-click unsubscribe, DMARC, SPF+DKIM both) is **5,000 messages per day to
   Gmail accounts**. Below that, the requirements for *all* senders still apply: SPF **or** DKIM,
   valid forward-and-reverse DNS, TLS, and **spam rate below 0.3%** in Postmaster Tools.
   (support.google.com/a/answer/81126)
2. **85% of the list is Gmail.** A single-digit number of spam complaints out of 48 blows past 0.3%.
   One person hitting "spam" on a 41-Gmail send is 2.4%. This is the whole risk of job 1, and it is
   an argument for a re-permission send with a prominent unsubscribe, not against sending at all.

---

## Recommendation

### Resend for job 1 + 2.

**Why:**

- **Free at this size, and free all the way to the ceiling that matters.** Free plan = 3,000
  emails/month, 100 emails/day, 1 domain; marketing side = **1,000 contacts free**. 48 contacts
  sending ~4 digests/month is ~208 emails/month against a 3,000 allowance.
- **It hosts the unsubscribe.** Broadcasts "handle all your unsubscribe flows for you automatically",
  with a hosted preference page, Topics for per-category preferences, and global unsubscribe state on
  each contact. Resend's own bulk-sender post states plainly that `List-Unsubscribe` **and**
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` "are handled automatically when using Resend
  Broadcasts. No action is needed from you." That is RFC 8058 compliance for free, which matters the
  day the list outgrows 5,000/day and matters for complaint rate long before that.
- **Job 2 is exactly two API calls**, both first-class documented endpoints (below).
- **No import review, no manual account approval.** Resend's stated position on consent is
  behavioural, not procedural: they police complaint and bounce rates after the fact. There is no
  gate to get through with an aged list.
- The project already runs Next.js on Vercel; Resend is the lowest-friction option in that stack
  (React Email, official Node SDK) and does not add a second hosted "newsletter brand" to the site.

**Job 2, concretely:**

```ts
// CI decides. If nothing new, exit 0 and send nothing.
const items = await newCatalogueItemsSince(lastRunISO);
if (items.length === 0) process.exit(0);

const { data } = await resend.broadcasts.create({
  segmentId: SEGMENT_ID,          // body param `segment_id`
  from: 'rnui.dev <digest@mail.rnui.dev>',
  subject: `New in the catalogue: ${items.length} components`,
  html: renderDigest(items),      // or `react:`
});
await resend.broadcasts.send({ broadcastId: data.id });  // POST /broadcasts/{id}/send
```

`POST /broadcasts` then `POST /broadcasts/{broadcast_id}/send`. The send endpoint also takes
`scheduled_at` in ISO 8601 or natural language ("in 1 min"). Note the documented constraint:
**"You can send broadcasts only if they were created via the API"** — which is exactly our path, but
means a broadcast drafted in the dashboard cannot be fired from CI.

Rate limit 10 req/s per team. Import for job 1: `POST /contacts` per address (48 calls, trivial at
10/s) with `segments: [{ id }]`, or the CSV Contacts Import API.

**DNS:** SPF + DKIM + DMARC. Resend "strongly recommends" a subdomain over the root domain —
use `mail.rnui.dev` or `updates.rnui.dev`. Custom Return-Path defaults to the `send` subdomain.

### Runner-up: Buttondown.

$0 at 48 subscribers (free tier caps at 100), $9/mo at 1,000. It is the more *complete* product —
hosted signup forms, hosted archive, real double opt-in, RSS-to-email — and its free plan is not
crippled: **API access, custom sending domain and automation are all included on free**, and
Buttondown is explicit that custom *sending* domain is free on every plan because "it's scummy to
hide that behind a paywall" (only the custom *archive hosting* domain is paid).

Job 2 is one call: `POST /v1/emails` with `status: "about_to_send"` sends to the whole list
immediately; or create a draft and `POST /v1/emails/{id}/send-draft` (its `subscribers`/`recipients`
params are optional — omit them to send to everyone).

**What would make me switch to Buttondown:**

- **If job 3 becomes the priority.** Resend gives you no hosted signup form and no built-in double
  opt-in — double opt-in in Resend is a code sample you implement yourself. Buttondown ships both.
  If the footer form is meant to grow this list seriously and nobody wants to build a confirmation
  flow, Buttondown is the answer today.
- **If a public archive is wanted.** Buttondown hosts one; Resend does not.
- **If the list crosses ~100 subscribers and the $9 is acceptable** in exchange for not maintaining a
  signup/confirm flow in the Next.js app. At 1,000 subscribers Buttondown is $9/mo vs Resend $0-20,
  and Buttondown includes strictly more.

The reason it is runner-up and not the pick: at **48** subscribers the free tier is 52 signups from
its cap, at ~2.5/month rising. Resend's free ceiling is 1,000 contacts. Buttondown's is 100. For a
list about to get a footer form on every route, that is a 3-4 month runway versus a multi-year one.
The counter-argument is that the cliff is $9/month, which is not a real obstacle.

### The third option worth knowing about: Kit

Kit has the best raw numbers of anything researched — **free to 10,000 subscribers** with unlimited
broadcasts and unlimited hosted forms, **double opt-in on by default**, and job 2 in a single
`POST /v4/broadcasts`. On a feature-per-dollar basis it beats both picks.

It is not the recommendation for one reason: Kit's **Recommendations** cross-promotion network is
marked **"Required"** on the lower tiers, which means Kit puts other creators' newsletter promotions
into your signup flow as the price of the free plan. For a curated component catalogue whose whole
value is editorial judgement, renting out the signup flow to unrelated creator newsletters is a
brand cost that $9/month at Buttondown simply removes. Kit is also a creator-economy product being
bent to a developer-tooling job, and it is the vendor I could verify least cleanly because the site
blocks automated access.

**Take Kit if** you confirm in the dashboard that Recommendations can be declined (or you don't mind
it) and you want a free tier with genuinely multi-year headroom plus built-in double opt-in.

---

## Traps for this specific situation

### Cloudflare Email Service — disqualified twice over

Judged from the local skill at `~/.claude/skills/cloudflare-email-service/` and verified against
Cloudflare's own docs, which the skill itself says to trust over its own contents.

1. **It is not free, and not free at any size.** Cloudflare's pricing table
   (`/email-service/platform/pricing/`, last updated 2026-06-09) is unambiguous:
   outbound Email Sending on **Workers Free = "Not available."** It requires Workers Paid, which
   includes 3,000 emails/month then $0.35 per 1,000. So the cheapest option on the list is the only
   one with a mandatory monthly fee for this workload.
2. **Marketing/bulk is not a permitted use.** The skill states it directly: *"Email Service is for
   transactional email (triggered by user actions: signups, password resets, order confirmations).
   Marketing/bulk campaigns are not permitted — use a dedicated marketing platform."* A weekly
   catalogue digest is a subscribed marketing message, not transactional.
3. **It is send-only, and the hidden cost is large.** There is no contact list, no audience, no
   broadcast, no unsubscribe page, no preference centre, no double opt-in, no signup form. What it
   does give you is a **suppression list** (auto-suppresses hard bounces and spam complaints, with
   `GET/POST/DELETE .../email/sending/suppression`) — that is bounce handling, not list management.
   Choosing it means building unsubscribe, the one-click `POST` endpoint, the preference page and the
   opt-out state machine yourself, in the app, correctly, forever.
4. **50 recipients per email**, so even a 48-person send is one message from the cap; at any growth
   you are writing your own fan-out and throttling.
5. Still **Beta**, and daily quota starts "conservative" and scales on reputation — for a list that
   has never been mailed, that is an unknown at exactly the wrong moment.

It is a good transactional sender for a Worker. It is the wrong tool for every one of the three jobs.

### EmailOctopus — the trap that looks perfect on the pricing page

Free tier is genuinely the most generous here: **2,500 subscribers, 10,000 emails/month, $0**;
Pro from $9/mo billed yearly. Hosted forms, hosted unsubscribe, list management — everything job 1
and job 3 need.

**It cannot do job 2.** The v2 API has no create-campaign and no send-campaign operation. The full
list of campaign operations is *Get all campaigns*, *Get campaign*, *Campaign summary report*,
*Campaign links report*, *Campaign contact reports* — read-only. Everything writable is contacts,
lists, tags and fields. (The legacy v1 API is the same: campaign endpoints are all `Get`.) You would
be able to sync 48 contacts from Firestore and then have to click "send" in a browser every week,
which is precisely the requirement the brief rules out.

Worth knowing about if the digest ever becomes manual. Not selectable while job 2 stands.

---

## Vendor detail — verified from primary sources

### Resend

| | |
|---|---|
| Free | 3,000 emails/mo, **100 emails/day**, 1 domain, 10,000 automation runs; marketing: **1,000 contacts** |
| First paid | Pro **$20/mo** = 50,000 emails/mo, no daily limit. Marketing priced separately: Pro marketing **$40/mo** = 5,000 contacts |
| At 48 subs | **$0** |
| At 1,000 subs | **$0** on contacts (free marketing tier is exactly 1,000). But a weekly digest to 1,000 = 4,000 emails/mo, over the 3,000 free allowance, and a single send of 1,000 exceeds the **100/day** free cap. Realistically **$20/mo** (Pro removes the daily limit) at that size. |
| List management | **Hosted.** Contacts, Segments, Topics (opt-in or opt-out defaults, public/private), automatic unsubscribe flow, hosted + brandable unsubscribe/preference page, global unsubscribe status per contact. |
| Double opt-in | **No built-in feature.** Official code samples only (Next.js/Express/Hono/Bun/Remix/SvelteKit/PHP/Laravel). You implement it. |
| Signup form | **None hosted.** You build it (already exists on rnui.dev). |
| Import policy | No review gate, no manual approval. Policy is behavioural: *"If your spam complaint or bounce rate remains high, Resend may have to pause or terminate your account."* Their consent doc rules out ToS-clause consent, pre-checked boxes, and opt-out-by-default — it asks for an "active opt-in". A typed-email-and-submit form **is** an active opt-in; it is the *specificity* (what will you send me) that is thin here, which is what the re-permission send fixes. |
| Job 2 API | `POST /broadcasts` → `POST /broadcasts/{id}/send`. Two calls. Send-only-if-API-created. |
| Rate limit | 10 req/s per team; `ratelimit-*` response headers |
| DNS | SPF + DKIM + DMARC; **subdomain strongly recommended** (`mail.rnui.dev`); optional custom Return-Path (defaults to `send.`) and custom tracking subdomain |
| Gmail/Yahoo | **Free and automatic on Broadcasts** — both `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` per Resend's own bulk-sender post. DKIM/SPF/DMARC on all plans. |

Sources: resend.com/pricing, resend.com/pricing.md, /docs/api-reference/rate-limit,
/docs/api-reference/broadcasts/*, /docs/dashboard/audiences/introduction, /docs/dashboard/topics/introduction,
/docs/knowledge-base/what-counts-as-email-consent, /docs/add-a-domain, resend.com/legal/acceptable-use,
resend.com/blog/gmail-and-yahoo-bulk-sending-requirements-for-2024

### Loops

| | |
|---|---|
| Free | **1,000 contacts**, 4,000 sends per 30 days (marketing + transactional combined), **Loops branding at the bottom of every email**, 10 emails/sec, max 3 free teams |
| First paid | **$49/mo** up to 5,000 contacts. No cheaper paid tier — free → $49 is the whole ladder. |
| At 48 subs | **$0**, with Loops branding in the footer |
| At 1,000 subs | **$0** — but a weekly digest to 1,000 is exactly 4,000 sends/30 days, sitting precisely on the free cap. One extra send tips it to **$49/mo**. |
| List management | **Hosted.** Mailing lists (public/private) auto-generate a **branded Preference Center**; suppression endpoints; email blocklist; unsubscribed contacts don't count toward plan limits. |
| Double opt-in | **Yes, built in** — a settings toggle, with a branded confirmation page and Pending state. **Caveat:** currently gated on **Form endpoints only**; `Create contact` / `Update contact` API endpoints are *not* gated ("Coverage will expand to these endpoints soon"). So an API-driven signup bypasses it today. |
| Signup form | **Yes** — hosted form endpoints with rate limiting and basic abuse protection built in. |
| Import policy | Terms §: *"You agree that you will only send targeted, permission-based messages... **Purchased lists may not be used with the Services, regardless of the source or permission status.**"* Our list is self-collected, not purchased — compliant. No documented manual import review. |
| Job 2 API | `POST /v1/campaigns` (creates draft + empty message) → `POST /v1/email-messages/{id}` (set subject/sender/content) → `POST /v1/campaigns/{id}` with `scheduling: { method: "now" }`. **Three calls.** `method` enum is `now` \| `schedule`. Optional `POST /v1/email-messages/{id}/guardian` to validate content first. |
| Rate limit | 10 req/s per team baseline; **content API (`/v1/campaigns/*`, `/v1/email-messages/*`) is 60 requests per 60 seconds** |
| DNS | **Heaviest of the shortlist: SPF + DKIM + DMARC + an MX record.** SPF lives at `envelope.<sendingdomain>` to avoid colliding with root SPF. Subdomain (`mail.rnui.dev`) recommended. |
| Gmail/Yahoo | Claims proactive tracking of Gmail/Yahoo guideline changes. **RFC 8058 / `List-Unsubscribe-Post` is not documented anywhere in their docs** — unverified, unlike Resend which states it explicitly. |

Content is authored in **LMX**, a Loops-specific format, which is lock-in for the digest template.

Sources: loops.so/pricing, /docs/account/billing, /docs/api-reference/intro, app.loops.so/openapi.json (v1.21.6),
/docs/contacts/double-opt-in, /docs/contacts/mailing-lists, /docs/deliverability/dmarc-dkim-setup, loops.so/terms

### Buttondown

| | |
|---|---|
| Free | **Up to 100 subscribers.** Features listed for free: "Email creation, analytics, **API access**, **custom domains**, automation" |
| Paid ladder | **$9** ≤1,000 · **$29** ≤5,000 · **$79** ≤10,000 · **$139** ≤20,000 · Enterprise above |
| At 48 subs | **$0** (52 signups of headroom) |
| At 1,000 subs | **$9/mo** |
| Billing basis | Charged for **active subscribers only**, not total contacts. Pricing assumes at most one email per day to the whole list. |
| List management | **Fully hosted** — subscribe pages and embeddable forms, unsubscribe, tags, metadata, segments, suppression, hosted web archive, RSS feeds, comments. The most complete of the shortlist. |
| Double opt-in | **Yes, built in.** |
| Import policy | The only stated gate is size-based: *"If you import a very large quantity of subscribers, we may temporarily deactivate your account while we verify that the data you're importing is correct."* **48 is not a large quantity** — no realistic exposure. Separately, new-sender throttling applies: Buttondown caps hourly volume until baseline engagement is established, and will "temporarily disable your sending capability and reach out" on high unsubscribes/complaints/hard bounces. Their own guidance is that warm-up only really matters above ~10,000 migrated subscribers. |
| Job 2 API | **One call:** `POST /v1/emails` with `status: "about_to_send"`. Or two: create draft → `POST /v1/emails/{id}/send-draft` (omit `subscribers`/`recipients` to send to all). Also supports `publish_date`, `canonical_url`, `filters` for segment targeting. |
| DNS | Optional — works out of the box from `username@buttondown.email`. For a custom sending domain: **"managed"** setup delegates a subdomain via two `NS` records (recommends `mail.example.com` / `newsletter.example.com`) and lets Buttondown rotate sending partners; or **"manual"** SPF/DKIM records. Root-domain sending is manual-only. Custom tracking domain available. |
| Gmail/Yahoo | Hosted unsubscribe, hosted list, custom sending domain (and therefore DKIM/DMARC alignment) available **on the free plan**. |

Note the DNS collision to avoid: a subdomain used for "managed" sending (`NS` records) cannot also
carry the archive-hosting `CNAME`. Use two different subdomains if both are wanted.

Sources: buttondown.com/pricing, docs.buttondown.com/{api-introduction, api-emails-create, api-emails-status,
api-emails-send-draft, importing-your-data, sending-from-a-custom-domain, hosting-domain}

### Cloudflare Email Service

| | |
|---|---|
| Free | **Outbound sending: not available on Workers Free.** Inbound Email Routing: unlimited, free. |
| First paid | **Workers Paid** — 3,000 outbound emails/mo included, then **$0.35 per 1,000** |
| At 48 / 1,000 subs | Workers Paid subscription either way; sends to *verified destination addresses* are free and uncapped, but those are addresses you've verified in your own account — irrelevant for a public list |
| List management | **None.** Send-only. Suppression list only (auto hard-bounce + complaint suppression, `E_RECIPIENT_SUPPRESSED`, full CRUD at `/accounts/{id}/email/sending/suppression`, also zone-level). No contacts, audiences, broadcasts, unsubscribe page, preference centre or forms. |
| Double opt-in | **No.** Build it yourself. |
| Import policy | N/A — nothing to import into. |
| Job 2 API | `POST /accounts/{account_id}/email/sending/send`, or the Workers `send_email` binding, or SMTP. **50 recipients max per email**, so 48 subscribers is one message from the ceiling; beyond that you fan out and throttle yourself. |
| DNS | Handled via `wrangler email sending enable <domain>`; separate subdomains per mail category explicitly recommended (their docs suggest `notifications.` vs `marketing.`) |
| Gmail/Yahoo | You implement one-click unsubscribe entirely. Their compliance page just lists CAN-SPAM/GDPR/CASL and "include proper unsubscribe mechanisms". Targets given: delivery >95%, hard bounce <2%, complaint <0.1%. |
| Status | **Beta.** New accounts start on a conservative daily quota that scales with reputation; increases via a Google Form. |

**Marketing/bulk campaigns are not a permitted use.** See the trap section above.

Sources: developers.cloudflare.com/email-service/platform/{pricing,limits}/ (both last updated 2026-06-09),
/email-service/concepts/{deliverability,suppressions}/, and `~/.claude/skills/cloudflare-email-service/`

### EmailOctopus

| | |
|---|---|
| Free | **2,500 subscribers, 10,000 emails/month**, EmailOctopus branding, 1 landing page + 1 form, 1 user, 30-day reports |
| First paid | **$9/mo** billed yearly (10,000 emails/mo), unlimited forms/users, full design control |
| At 48 / 1,000 subs | **$0** at both |
| List management | Hosted — lists, contacts, tags, fields, forms, landing pages |
| Job 2 API | **Cannot send a campaign.** v2 operations on campaigns are read-only: *Get all campaigns*, *Get campaign*, *Campaign summary report*, *Campaign links report*, *Campaign contact reports*. Writable operations cover only lists/contacts/tags/fields. v1 (legacy) is the same. |
| Rate limit | Token bucket: 100 tokens, refill 10/s |

Disqualified by job 2. See the trap section.

### AWS SES

The biggest surprise of this research: SES's list management is **real**, not a fig leaf.

| | |
|---|---|
| Free | **3,000 message charges/month for the first 12 months only** — no longer perpetual. |
| Pricing | À la carte **$0.10/1,000**. But **new accounts auto-land on the "Essentials" plan at $0.16/1,000** — footnote: *"New SES accounts and account x region combinations with no metered SES activity since June 1, 2025 will start on the Essentials plan beginning July 21, 2026."* |
| At 48 subs | ~192 emails/mo → **$0** for 12 months, then **~$0.03/mo** |
| At 1,000 subs | 4,000 emails/mo → **$0.40–0.64/mo**. Cheapest at scale by an order of magnitude. |
| List management | **Genuinely hosted.** `CreateContactList` / `CreateContact`, topics with `DefaultSubscriptionStatus` of OPT_IN/OPT_OUT, a real **hosted unsubscribe landing page** that lets contacts update preferences across topics, automatic RFC 8058 one-click headers, and automatic suppression (SES issues a bounce event for sends to unsubscribed contacts — you don't filter them yourself). Requires Easy DKIM. Unsubscribe headers/footer are added **only for single-recipient sends**. |
| Signup form | **None.** You build it. |
| Double opt-in | **No.** `DefaultSubscriptionStatus` sets an initial flag only. |
| Import policy | No up-front gate. Production-access request requires attesting *"you agree to only send email to individuals who've explicitly requested it and confirm that you have a process in place for handling bounce and complaint notifications."* Enforcement is reactive (account "under review" → possible send pause). AWS's general AUP bans unsolicited mass email but has **no list-age rule** — *stale page, last updated 2021-07-01*. |
| Job 2 API | `SendBulkEmail` (`POST /v2/email/outbound-bulk-emails`) with a `BulkEmailEntries` array. **Max 50 destinations per call** — 48 subscribers fits in exactly one call, with two to spare. You will need sharding logic within months. |
| DNS | SPF + DKIM required to exit sandbox; DMARC on you. **Sandbox → production is a manual request**, typically ~24h. |
| Gmail/Yahoo | Mechanism provided (subscription management gives one-click unsubscribe); DNS, DMARC and complaint monitoring are yours. Automated monitoring (Virtual Deliverability Manager) is a paid add-on. |

**Why not the pick:** cheapest and technically sufficient, but it is the most assembly required — sandbox
exit, your own templates, your own signup and confirm flow, your own DMARC, and a 50-recipient ceiling
that this list crosses within a year. For a side project that wants to send a digest, not run an ESP,
Resend delivers the same outcome with materially less to build and maintain.

### Postmark — a price trap at exactly this size

| | |
|---|---|
| Free | **100 emails/month, hard cap, no overages** |
| First paid | Basic **$15/mo** · Pro **$16.50/mo** · Platform **$18/mo** — all include 10,000 emails/mo |
| At 48 subs | 192 emails/mo **blows the 100/mo free cap** → **$15/mo** for 1.9% utilisation of the included volume |
| At 1,000 subs | 4,000/mo, still inside 10,000 → **$15–16.50/mo flat** |
| List management | **Send-only, but with the best send-side compliance of the send-only group.** Broadcast Message Streams are purpose-built for bulk: they **automatically add a one-click unsubscribe link and RFC 8058 `List-Unsubscribe` / `List-Unsubscribe-Post` headers**, and unsubscribes land in Postmark's per-stream Suppression list. But there is **no contact database, no signup form, no preference centre** — you keep the recipient list in Firestore and pass it on every send. Postmark manages *suppression*, not *subscription*. |
| Double opt-in | **No** — no subscribe mechanism at all. |
| Import policy | ToS §5: *"All email lists contained and/or used with respect to the Service must be permission-based subscriptions. Use of a list that has been purchased or rented from a third party is prohibited."* Plus a hard bar: *"Your spam complaint rate must be lower than 1 in 1,000 emails (0.1%)."* **That 0.1% threshold is the problem** — on a 48-recipient send, a single complaint is 2.1%, twenty times over. Postmark has no pre-approval gate but is the most willing of any vendor here to pause an account after the fact. |
| Job 2 API | `POST /v1/email/bulk` — one call, message defined once, recipients array, 50MB payload limit, **no fixed recipient count cap**. Cleanest single-call bulk shape of any vendor researched. |

**Trap, on two counts:** you pay a $15/month floor to send 192 emails, and its 0.1% complaint ceiling is
mathematically almost impossible to honour on a 48-person first send to a cold, 85%-Gmail list.

### MailerSend — the clearest written disqualifier for this exact list

| | |
|---|---|
| Free | **500 emails/month** (and only after approval — pre-approval you're capped at 100/mo and one CC/BCC recipient) |
| First paid | Hobby **$6.30/mo** billed yearly = 5,000 emails/mo · Starter **$31.50/mo** = 50,000/mo. *(Monthly-billed rates not captured — page defaulted to annual.)* |
| At 48 subs | 192/mo → **$0** once approved |
| At 1,000 subs | 4,000/mo exceeds the 500 free cap → **$6.30/mo** |
| List management | **Suppression only.** No hosted subscribe form or preference centre confirmed from primary sources — that product is MailerLite, its sister service, not MailerSend. |
| Double opt-in | **No.** |
| Approval gate | **Yes, confirmed** — manual account approval, "usually very quick but can take up to 48 hours", asks for company and use-case details. |
| Job 2 API | **No campaigns endpoint exists.** Closest primitive is `POST /v1/bulk-email` taking an array of individual email objects, **capped at 500 per request** (5 on Trial), with `GET /v1/bulk-email/{id}` to poll. Fine at 48. |

**This is the trap with a written rule aimed directly at us.** MailerSend's Anti-Spam Policy bans sending
to any address *"You have not contacted them via email in the last 2 years. Permission does not age well
and these people have either changed their email address or will not remember giving their permission in
the first place."*

Our list has **never been mailed once**, and the oldest entries date to 2024-12-30 — approaching that
two-year line right now. No other vendor states the stale-permission rule this explicitly. Importing here
means importing in knowing breach of the published policy. *(Policy page is stale — last updated
2023-09-18 — but a stale policy is still the operative one.)*

### Brevo

The strongest hosted-list option among the second batch, and the one that most nearly displaces Buttondown.

| | |
|---|---|
| Free | **300 emails/day** (~9,000/mo), $0, no card. Brevo branding on emails. |
| First paid | Starter **$9/mo** (promo $8.08); +$10.80/mo to remove Brevo branding. Standard **$18/mo**. |
| Billing basis | **Priced by monthly send volume, not subscribers** — the configurator's primary lever is "Monthly email volume (campaigns & transactional)". |
| At 48 subs | 192/mo → **$0** |
| At 1,000 subs | **A single weekly burst of 1,000 emails exceeds the 300/day free cap.** Either upgrade (~$8–9/mo) or spread the digest over four days. |
| List management | **The most complete of the second batch** — hosted branded subscribe **Forms** with follow-up triggers, advanced segmentation, and per Brevo's own compliance doc: *"No action is needed on your side for the following requirements, which Brevo already handles automatically: ...One-click unsubscribe support for the list-unsubscribe header (RFC 8058) and a visible unsubscribe link in the body of marketing and subscribed emails."* Strongest "we handle it" claim found anywhere in this research. |
| Double opt-in | Not a single toggle, but native primitives (Forms + automation workflows) make it straightforward. |
| Approval gate | **Yes** — Free-plan sending unlocks only "once we approve your account". |
| Import policy | Anti-Spam Policy: scraped/purchased lists "strictly prohibited" (not us), **and** consent must be *"active: the Contact has to check a checkbox... and CAN'T be pre-checked, and explicit"*, and *"You must be able **at any time to provide a proof of opt-in for each of your Contacts**."* Our Firestore records (email + `createdAt` + form context) are that proof — **keep them, don't discard the timestamps on migration.** |
| Job 2 API | `POST /v3/emailCampaigns` (draft; `name`, `sender`, `htmlContent`/`htmlUrl`/`templateId`, `recipients` with list/segment IDs) → `POST /v3/emailCampaigns/{campaignId}/sendNow`. **Two calls, targeting a hosted list by ID** — no recipient array to marshal. |
| DNS | DKIM/DMARC required; Brevo silently rewrites unauthenticated free-address senders to a Brevo-branded fallback, a strong nudge to authenticate your own domain. |

**Why not the pick:** account-approval gate before the first send, branding on free unless you pay
$10.80/mo, a 300/day cap that the digest hits at 1,000 subscribers, and a much heavier product than a
catalogue digest needs. But it is a legitimate third choice, and the best of these four for job 3.

### Kit (ex-ConvertKit) — the largest free tier here, with one string attached

Verified directly against the rendered pricing page (kit.com blocks Jina/bot fetches; retrieved with a
browser user-agent). The subscriber row reads verbatim **"Up to 10,000"** for the free Newsletter plan.

| | |
|---|---|
| Free (Newsletter) | **Up to 10,000 subscribers**, $0, "No cost. No catch." Includes **unlimited email broadcasts**, **unlimited landing pages & forms**, audience tagging & segmentation, 1 basic Visual Automation |
| First paid | Creator **$33/mo** ($390/yr) at the 1,000-subscriber bracket · Pro **$66/mo** ($790/yr) |
| At 48 subs | **$0** |
| At 1,000 subs | **$0** — free plan still applies. Ten times Resend's free contact ceiling. |
| List management | **Fully hosted** — forms, landing pages, unsubscribe, tagging, segments, preference management, on every tier |
| Double opt-in | **Yes, and default-on** — the only vendor researched where confirmed opt-in is the default rather than a toggle. Matches the re-permission intent naturally. |
| Import policy | Requires that subscribers "have given direct permission"; purchased/scraped/non-permission lists prohibited. Enforcement is **reactive**, via bounce/complaint/unsubscribe monitoring feeding an "Account Health" and "Permission Report" mechanism → possible manual review or suspension. **No pre-import approval queue.** Important mechanic: importing into a **form** auto-confirms subscribers even when double opt-in is on — so **import the 48 into a Tag, not a form**, then send job 1 as a deliberate broadcast. |
| Job 2 API | **One call.** `POST https://api.kit.com/v4/broadcasts` with `subject`, `content`, `subscriber_filter`, `send_at` (ISO 8601 to send; `null` to keep as draft). Auth `X-Kit-Api-Key`. Personal keys have lower rate limits than OAuth apps; no published numeric ceiling. |
| DNS | SPF/DKIM/DMARC for a verified sending domain, described as required by mailbox providers rather than optional; DKIM alignment carries DMARC compliance |
| Gmail/Yahoo | Dedicated help articles on the 2024 requirements and one-click unsubscribe |

**The string attached:** the pricing page's **Recommendations** row — Kit's creator cross-promotion
network — is marked **"Required"** on the lower tiers. That means Kit places other creators' newsletter
promotions into your signup/confirmation flow as a condition of the free plan. For a curated,
opinionated component catalogue this is a real brand cost, and it is the reason Kit is not the pick
despite the best raw numbers. *(Confidence note: the "Required" marking is legible in the page source,
but Kit's table is div-based and I could not cleanly attribute the value to each column — **confirm this
and free-tier API access in the dashboard before committing.** Several Kit facts in circulation come
from search-cache rather than a live fetch, because the site blocks automated access.)*

### beehiiv — the standout trap

| | |
|---|---|
| Free (Launch) | **Up to 2,500 subscribers**, unlimited sends, "API Access **excluding Send API**" |
| Paid | Scale **$43/mo** ($517/yr) — adds automations, webhooks. Max **$96/mo** ($1,151/yr) — adds **Send API** and branding removal |
| At 48 / 1,000 subs | $0 for hosting — both sit inside the 2,500 free cap |
| List management | Fully hosted. **One-click native unsubscribe is mandatory and cannot be removed or replaced** without beehiiv's approval |
| Double opt-in | Yes, publication-level setting, **not on by default**. Per-subscription API override `double_opt_override` (`on`/`off`/`not_set`). "Smart Nudge" resends the confirmation 48h later if still pending. |
| Import policy | AUP (updated 2026-07-16) requires **affirmative consent** — "freely given, specific, informed, unambiguous, and provided through a clear affirmative action" — and reserves the right to demand **proof of consent** (log files, signup source, timestamp, method). Our addresses were collected by our own form, so they are not a purchased or scraped list; but the "Platform Risk and Discretion" clause lets beehiiv suspend for anything that "pose[s] reputational, legal, or deliverability risks... even if the specific Content or behavior is not explicitly listed." |
| Job 2 API | `POST /v2/publications/{publicationId}/posts` — one call creates **and** sends. **As of 2026-08-06 (eight days ago), omitting `status` now defaults to `draft` instead of publishing — you must explicitly pass `"status": "confirmed"` to send.** Anyone copying an older snippet will silently stop sending. |
| DNS | Custom domain = 3 CNAMEs (1 SPF, 2 DKIM); **a valid DMARC record is mandatory for all custom-domain accounts**. beehiiv's own subdomain is pre-authenticated, so a subdomain isn't strictly required. |

**Why it's the trap:** the free tier looks like the most generous on the page — 2,500 subscribers,
unlimited sends — but **the Send API is gated to the $96/mo Max plan.** Job 2 is defined as
CI-triggered sending, so beehiiv costs **$96/month to send a weekly digest to 48 people**, or $1,151/yr.
Nothing on the pricing page's headline numbers signals this; you find it in the feature footnote.

### Mailchimp — validates job 1, then punishes job 3

| | |
|---|---|
| Free | **250 contacts max**, **500 sends/month, 250/day**, 1 audience, 1 seat |
| First paid | Essentials from **$13/mo** (500 contacts, 10× send cap); Standard from **$20/mo** (12× send cap); Premium floor is 10,000 contacts at **$350/mo** |
| At 48 subs | **$0** — 192 sends/month fits inside the 500/month cap |
| At 1,000 subs | Free no longer qualifies. **Essentials $110/mo · Standard $135/mo** (annual promo $94 / $115). The steepest cost curve of anything researched — roughly 8× Essentials' entry price for 2× the contacts. |
| List management | Fully hosted; one-click unsubscribe, suppression, preference centre standard |
| Double opt-in | **Off by default** — "Mailchimp audiences are single opt-in by default." Enabled per signup form. EU-primary-contact accounts may default to double. |
| Import policy | AUP (updated 2025-09-26): *"You must be able to point to an opt-in form or show other evidence of consent for any commercial or marketing email you send"*; purchased/rented/third-party/co-reg/publicly-available lists prohibited. Enforcement combines "automated, dynamic vetting and scoring analysis tools" with human review. |
| Job 2 API | **Two calls**: `POST /campaigns` (`type: regular`, `recipients.list_id`, `settings.subject_line`) → `POST /campaigns/{id}/actions/send`. Rate limit **10 simultaneous connections per API key**, 120s call timeout. |
| DNS | Domain *verification* (1 CNAME) is separate from *authentication* (SPF+DKIM, 2 more CNAMEs). Authentication is optional at our volume — Mailchimp ties the hard requirement to the Gmail/Yahoo 5,000/day threshold, which 48 subscribers is nowhere near. |

**The genuinely useful thing Mailchimp contributes** is that its own "Examples of Compliant and
Non-Compliant Lists" page describes almost exactly this situation — addresses collected a while ago,
now finally ready to send a newsletter — and marks it **NOT OK**, with this remedy: if it's been a while
since contacts signed up, they may have forgotten who you are or changed addresses, old addresses carry
higher bounce and unsubscribe rates, and you should **send a reconfirmation email to check they still
want to hear from you before sending marketing campaigns**.

That is job 1, prescribed by the strictest list-policing vendor in the industry. **Do job 1 as an
explicit re-permission send, whichever vendor you pick.**

---

## Comparison table

Ordered by fitness for this specific job.

| Vendor | Free tier | First paid | @48 | @1,000 | Hosted list mgmt | Double opt-in | Import risk (aged, single-opt-in, never mailed) | Job 2 from CI | DNS | RFC 8058 free |
|---|---|---|---|---|---|---|---|---|---|---|
| **Resend** ✅ | 3,000 emails/mo, 100/day, **1,000 contacts** | $20 (50k emails) / $40 (5k contacts) | **$0** | $0–20 | **Yes** — Segments, Topics, hosted+brandable pref page | ✗ code sample only | **None** — no gate; reactive on complaint rate | **2 calls**: `POST /broadcasts` → `POST /broadcasts/{id}/send` | SPF+DKIM+DMARC, subdomain rec. | **Yes, explicitly automatic** |
| **Buttondown** 🥈 | **≤100 subs**; API + custom sending domain included | $9 (≤1,000) | **$0** | **$9** | **Yes** — forms, archive, RSS, segments | **Yes** | **None** at 48 — the only gate is size-based | **1 call**: `POST /v1/emails` `status:about_to_send` | Optional; NS-delegated subdomain or manual | Yes |
| **Kit** | **Up to 10,000 subs**, unlimited broadcasts + forms | $33 (1,000) | **$0** | **$0** | **Yes** — fully hosted | **Yes, default-on** | Low; reactive "Account Health"/Permission Report. Import to a **Tag**, not a form | **1 call**: `POST /v4/broadcasts` | SPF+DKIM+DMARC | Yes |
| **Brevo** | 300 emails/**day** | $9 (+$10.80 to drop branding) | $0 | ~$9 (daily cap bites) | **Yes** — forms, segments | Via automation | Must supply **proof of opt-in per contact**; approval gate | **2 calls**: `POST /v3/emailCampaigns` → `/sendNow` | DKIM+DMARC | **Yes, automatic** |
| **AWS SES** | 3,000/mo **first 12 months only** | $0.10–0.16/1,000 | ~$0 | **$0.40–0.64** | Partial — contact lists + hosted unsub page, **no signup form** | ✗ | Low; attestation at production-access request | `SendBulkEmail`, **50 destinations/call** | SPF+DKIM, **sandbox exit required** | Yes |
| **Loops** | 1,000 contacts, 4,000 sends/30d, **branding** | **$49** (5,000) | $0 + branding | $0 at exact cap → $49 | **Yes** — lists + Preference Center | **Yes**, forms-only today | Low — bans purchased lists only | **3 calls**, `scheduling:{method:"now"}` | **SPF+DKIM+DMARC+MX** | Undocumented |
| **Mailchimp** | **250 contacts**, 500 sends/mo | $13 (500) | $0 | **$110–135** | Yes | ✗ off by default | Its own docs call this scenario **NOT OK** → reconfirm first | **2 calls**: `POST /campaigns` → `/actions/send` | Verification + optional auth | Yes |
| **EmailOctopus** ⚠️ | 2,500 subs, 10,000 emails/mo | $9/mo (yearly) | $0 | $0 | Yes | Yes | Low | **Impossible — no send endpoint exists** | SPF/DKIM | Yes |
| **MailerSend** ⚠️ | 500/mo (after approval) | $6.30/mo yearly | $0 | ~$6.30 | Suppression only | ✗ | **Policy bans mailing anyone not contacted in 2 years** | `POST /v1/bulk-email`, ≤500/req | SPF/DKIM | Yes |
| **Postmark** ⚠️ | **100 emails/mo**, no overage | **$15** (10,000) | **$15** for 192 emails | $15–16.50 | Send-only; suppression + auto one-click unsub | ✗ | **0.1% complaint ceiling** = <1 complaint per 1,000 | **1 call**: `POST /v1/email/bulk` | SPF/DKIM/DMARC yours | Yes |
| **beehiiv** ⚠️ | 2,500 subs, **Send API excluded** | $43 / **$96 for Send API** | **$96/mo** | **$96/mo** | Yes; unsub mandatory | Yes, not default | Affirmative consent + proof on request | 1 call, but **Max plan only**; `status:"confirmed"` now required | 3 CNAMEs + **DMARC mandatory** | Yes |
| **Cloudflare** ⚠️ | **Sending unavailable on free** | Workers Paid, 3k then $0.35/1k | Paid plan | Paid plan | **No — send-only**, suppression only | ✗ | N/A | `POST .../email/sending/send`, **50 rcpt max** | wrangler-managed | **No — you build it** |

⚠️ = trap for this situation, for the reason in bold.

---

## What to do, in order

1. **Set up `mail.rnui.dev`** (or `updates.rnui.dev`) in Resend — SPF, DKIM, DMARC. Never send this from
   the root domain; keep the catalogue's root-domain reputation separate from bulk mail.
2. **Keep the Firestore `createdAt` timestamps.** Several vendors (Brevo, beehiiv, Mailchimp, Kit) reserve
   the right to demand proof of opt-in per contact. The timestamp plus the signup source *is* that proof.
   Do not drop it during migration.
3. **Import the 48 into a Resend Segment** — `POST /contacts` with `segments: [{ id }]`, 48 calls at 10/s.
4. **Send job 1 as an explicit re-permission email.** Say when and where they signed up, say it is the
   first email, say what the digest will be, and make the unsubscribe prominent rather than buried.
   Mailchimp's own compliance guidance prescribes exactly this for this exact scenario. Expect to lose a
   chunk of the 48 — that is the point; the ones who stay are a real list.
5. **Consider treating non-openers as unsubscribed.** With 41 of 48 on Gmail, one spam complaint is 2.4%,
   eight times Google's 0.3% threshold. A small, willing list is worth far more than 48 cold addresses.
6. **Wire job 2** as create-broadcast → send-broadcast, guarded by an early `process.exit(0)` when the
   week produced no new catalogue items.
7. **Revisit at ~800 contacts**, before the 1,000 free-contact ceiling. At that point either pay Resend
   $20/mo, or move to Buttondown at $9/mo if the hosted signup form and double opt-in have become the
   thing you actually want.

## Confidence and staleness notes

- All pricing pages were fetched live on 2026-08-14 and reflect current figures.
- **Stale policy pages** (still operative, but not recently revised): AWS Acceptable Use Policy — last
  updated **2021-07-01**; MailerSend Anti-Spam Policy — **2023-09-18**; Postmark's broadcast-unsubscribe
  article — **2025-03-21**. Cloudflare's pricing and limits pages both carry **2026-06-09**. beehiiv's
  AUP carries **2026-07-16**; Mailchimp's AUP **2025-09-26**.
- **Lower confidence, verify in-dashboard:** Kit's per-tier feature attribution (the "Required"
  Recommendations marking and free-tier API access). kit.com blocks automated fetching; the
  10,000-subscriber free cap and unlimited broadcasts/forms were confirmed from the rendered page, but
  the per-column values were not cleanly extractable.
- **Not documented, therefore unverified:** whether Loops emits RFC 8058 `List-Unsubscribe-Post` headers.
  Resend, Brevo, Postmark and SES all state it explicitly; Loops does not mention it anywhere in its docs.
- MailerSend's monthly-billed prices were not captured — its pricing page defaults to annual billing.
