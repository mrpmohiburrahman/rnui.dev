# Turnstile and rate limiting on a Next.js route handler on Vercel Hobby

## Question

`public-submissions` map decision 7 puts Cloudflare Turnstile **plus per-IP rate limiting** on the
submit endpoint. This establishes how each attaches to a Next.js 16 route handler on Vercel Hobby,
and what each actually stops — for an endpoint that already sits behind a **4.5 MB** platform wall
(`map.md`, "Settled at charting" decision 3, and `vercel.com/docs/errors/FUNCTION_PAYLOAD_TOO_LARGE`,
which states the payload "does not exceed the limit of 4.5MB").

The load-bearing correction: **decision 7's "per-IP rate limiting" premise is stale.** Vercel WAF
rate limiting shipped to Hobby on 23 May 2025, one free rule per project, included in the free tier.
It is not Pro-only, and it needs no code. Sources in §4.

---

### 1. Turnstile: free tier and limits

Turnstile's Free plan is genuinely $0 and does not require any other Cloudflare product:
"Turnstile can be used independently without requiring other Cloudflare services."
— https://developers.cloudflare.com/turnstile/plans/

"It's a simple snippet of free code that eliminates CAPTCHAs."
— https://www.cloudflare.com/products/turnstile/

| Feature | Free | Enterprise |
| --- | --- | --- |
| Price | Free | Contact sales |
| Number of widgets | Up to 20 | Unlimited |
| All widget types | Yes | Yes |
| **Unlimited challenges (traffic or verification requests)** | **Yes** | **Yes** |
| Hostname management | 10 hostnames per widget | Max 200 hostnames per widget |
| Any hostname widget (no preconfigured hostnames) | No | Yes |
| Analytics lookback | 7 days max | 30 days max |
| Pre-clearance support | Yes | Yes |
| Ephemeral IDs | No | Yes |
| Offlabel (remove Cloudflare branding) | No | Yes |
| WCAG 2.2 AAA compliance | Yes | Yes |
| Community support | Yes | Yes |

— verbatim from https://developers.cloudflare.com/turnstile/plans/ (last updated Aug 14, 2026)

**Is it "unlimited" or is there an unpublished ceiling?** The *only* published statement is
"Unlimited challenges (traffic or verification requests): Yes" on the Free plan
(https://developers.cloudflare.com/turnstile/plans/). There is **no published per-month
request cap and no published Siteverify rate limit**. The word "unlimited" is a plan-table claim,
not a rate-limit guarantee, and Cloudflare's plan pages carry no fair-use clause for Turnstile that
I could find. **Treat "no ceiling" as unconfirmed** — the honest reading is "no published cap".
Note also that Cloudflare does not state a Siteverify request rate; the docs' only related guidance
is a *best practice addressed to you*, not a limit on them: "Rate limit to protect against
validation flooding."
— https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

**Siteverify.** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`, accepting
`application/x-www-form-urlencoded` or `application/json`, always returning JSON. Required:
`secret`, `response`. Optional: `remoteip`, `idempotency_key` (a UUID "to safely retry validation
requests"). Token characteristics: max length 2048 chars, validity **300 seconds** from generation,
single use.
— https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

**Is it in the account rnui.dev already uses, at no cost?** Yes on pricing terms: Turnstile is Free
and independent of proxying ("can be embedded into any website without sending traffic through
Cloudflare"). — https://developers.cloudflare.com/turnstile/ ; decision 5 already records rnui.dev
running Cloudflare (R2 on `cdn.rnui.dev`), and Turnstile is $0 on any Cloudflare account.
**Unconfirmed:** that the specific zone/account already has a Turnstile widget created — that is a
dashboard fact, not a documented one, and it is the one thing this ticket cannot read from a source.

---

### 2. The integration shape for a Next.js route handler

**The route handler.** The docs are for Next.js **16.3.6** ("Latest Version 16.3.6"). A route
handler is a `route.ts` under `app/`, exporting an HTTP method as a function taking a Web `Request`
and returning a Web `Response`; `await request.formData()` reads a multipart body, and no
`bodyParser` configuration is needed.
— https://nextjs.org/docs/app/api-reference/file-conventions/route

So the endpoint is `app/api/submit/route.ts`, and it is the same shape as the existing
`app/api/confirm-subscription/route.ts` and `app/api/counters-collection/route.ts`:

```ts
// app/api/submit/route.ts
export async function POST(request: Request) { /* ... */ }
```

**Two client flows.**

| | Implicit (managed) rendering | Explicit `turnstile.render()` |
| --- | --- | --- |
| Script | `api.js` | `api.js?render=explicit` |
| Trigger | auto-scans for `.cf-turnstile` on page load | you call `turnstile.render()` |
| Token delivery | "via callbacks or hidden form fields" | the `callback` function receives it |
| Control over timing | none — "Renders automatically on page load" | "Full control over rendering timing" |
| Documented use case | "static pages where forms exist at page load" | "dynamic content and single-page applications (SPAs) where forms are created after the initial page load" |

— https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<div class="cf-turnstile" data-sitekey="<YOUR-SITE-KEY>"></div>
```

"The `api.js` file must be fetched from the exact URL shown above. Proxying or caching this file will
cause Turnstile to fail when future updates are released."
— https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

**Which suits a form that compresses client-side before submitting: explicit.**
`/submit` is a React client component that (decision 4) checks the picked file, compresses it in the
browser, and only then uploads. A token is valid for **300 seconds** from generation, and implicit
rendering mints it at page load — a visitor browsing, picking a file and watching compression can
easily cross five minutes before the POST. Explicit rendering plus execution mode removes the race:

```js
const widgetId = turnstile.render("#turnstile-slot", {
  sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  execution: "execute",        // render the widget, do not run the challenge yet
  action: "submit",
  callback: (token) => setToken(token),
});
// ... file picked, compressed, formData assembled ...
turnstile.execute(widgetId);   // run the challenge when the submission is actually ready
```

"Execution mode — Control when challenges run... Render widget but don't run challenge yet... Later,
run the challenge when needed."
— https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

Belt and braces: `refresh-expired` defaults to `auto` — "Automatically refreshes the token when it
expires."
— https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/
The managed type is the documented default ("Managed (recommended)").
— https://developers.cloudflare.com/turnstile/


**Where the keys go.**

- **Site key → public, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.** The sitekey is "Required string" in the
  widget configuration and is rendered into the page HTML, so it cannot be secret.
  — https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/
  `NEXT_PUBLIC_` is Next.js's documented convention for a build-time-inlined, client-visible
  variable — https://nextjs.org/docs/app/guides/environment-variables (prefix convention from that
  page; not quoted verbatim in this session).
- **Secret → server only, `TURNSTILE_SECRET_KEY`**, never under a `NEXT_PUBLIC_` name. "Only call
  the Siteverify API in your backend environment. If you expose the secret key in the front-end
  client code to call Siteverify, attackers can bypass the security check."
  — https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

**The server-side `siteverify` call as it would exist in `app/api/submit/route.ts`.** It follows
`app/actions/subscribe-email.ts` in this repo, which already reads the client IP as
`h.get("x-forwarded-for")?.split(",")[0]?.trim()` — the same value feeds `remoteip`:

```ts
// app/api/submit/route.ts
import { headers } from "next/headers"

const VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type Siteverify = {
  success: boolean
  action?: string
  hostname?: string
  "error-codes"?: string[]
}

export async function POST(request: Request) {
  const form = await request.formData()
  const token = String(form.get("cf-turnstile-response") ?? "")

  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim()

  if (!token) return Response.json({ error: "verification failed" }, { status: 400 })

  const res = await fetch(VERIFY, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    }),
    // Docs: "Set reasonable timeouts. Do not wait indefinitely for Siteverify responses."
    signal: AbortSignal.timeout(5000),
  })

  const verdict = (await res.json()) as Siteverify

  // Docs: "Tokens are single-use." A replay is rejected with `timeout-or-duplicate`.
  // Docs: "Check additional fields. Validate the action and hostname when specified."
  if (
    !verdict.success ||
    verdict.action !== "submit" ||
    verdict.hostname !== new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN!).host
  ) {
    return Response.json({ error: "verification failed" }, { status: 403 })
  }

  // Only now read the 4.5 MB-bounded file and do the R2 PUT + Resend send.
}
```

Every clause is from https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
(endpoint; `secret`/`response` required, `remoteip`/`idempotency_key` optional; 300-second validity;
single use; `timeout-or-duplicate`; "Set reasonable timeouts"; "Validate the action and hostname
when specified"; "Rate limit to protect against validation flooding"). One caveat: `remoteip` is
**optional** and is not an enforcement mechanism — it tells Siteverify which address to score the
token against. It is not a per-IP quota.



---

### 3. What Turnstile actually stops, and what it does not

**Blunt version.**

- **Server-side validation is not optional, and without it Turnstile stops nothing.** "Tokens can be
  forged. An attacker can submit any string to your form endpoint without completing a challenge."
  A widget with no Siteverify call is decoration. — https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- **A solved token is a bearer credential for 300 seconds.** "Each token is valid for 300 seconds
  (5 minutes) after generation." "Tokens are single-use. Each token can only be validated once. A
  replayed token will be rejected with the `timeout-or-duplicate` error code." So *if and only if*
  Siteverify is called on every request, a token is good for exactly one admission and replay buys
  nothing. Two real consequences follow:
  1. **Nothing about the token binds it to the payload.** The challenge attests to the *session*, not
     to the file. A token obtained by hand can be attached to any body the attacker likes — a
     different filename, different bytes, a different 4.5 MB. The token proves "a browser passed a
     challenge", not "this person picked this file".
  2. **One token, one request, at 300-second expiry — that is a rate of one submission per solved
     challenge, not a rate per IP or per second.** Turnstile imposes *no* cadence on how often the
     same IP may solve. It is a per-request gate, not a limiter. That is exactly the gap decision 7
     asked a rate limit to fill.
- **`action` and `hostname` are the only cheap binding available, and they are weak.** Checking
  `verdict.action === "submit"` stops a token minted for a *different widget on the same site* being
  replayed here, and checking `hostname` stops a token minted on another domain. That is
  cross-widget/cross-site confusion, not session binding. Cloudflare's own best-practice list is
  "Check additional fields. Validate the action and hostname when specified."
  — https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- **Turnstile's challenge is adaptive, and "solved" is not a synonym for "human".** Cloudflare
  describes non-interactive proof-of-work/proof-of-space/browser-probing challenges and states
  "we can fine-tune the difficulty of the challenge to the specific request and avoid showing a
  visual or interactive puzzle". Fine-tuning *exists* because outcomes are not binary — and Turnstile
  Analytics exists to "evaluate the **challenge solve rate**", a metric that only makes sense
  because challenges are sometimes solved by traffic the operator did not want.
  — https://developers.cloudflare.com/turnstile/ and, for the metric,
  https://developers.cloudflare.com/turnstile/turnstile-analytics/
- **Bots that solve Turnstile challenges: partially confirmed, and worth stating carefully.** What
  the first-party docs support is that challenge solving is measured, not that it is impossible
  (the "challenge solve rate" metric above) and that an operator must not trust the client: "Never
  trust client-side validation alone." What the docs do **not** say — anywhere I could find — is
  anything about third-party solver farms or commercial "solve this Turnstile" services.
  **A market for solving Turnstile challenges is widely reported in security research but is
  unconfirmed by first-party sources here. Treat "a paid solver hands me a token" as an assumption
  to design against, not a documented fact.**

**What matters for an endpoint that also enforces a 5 MB cap.**

| Claim | Does it matter here? |
| --- | --- |
| Token replay within 300s | **No**, provided Siteverify runs on every request — a replayed token is rejected with `timeout-or-duplicate`. |
| Token not bound to the payload | **Yes.** A solver submits arbitrary content; the R2 object and the notification email are both attacker-chosen within 4.5 MB. |
| No per-IP cadence | **Yes, and it is the real hole.** Unbounded sequential submissions, one solved challenge each. |
| `action`/`hostname` confusion | Marginal — only useful if a second widget is ever added. |
| Volume of bytes | **No.** The 4.5 MB wall bounds every request regardless of the token, so a solved token cannot buy a bigger upload. This is the one thing the platform already guarantees. |
| Cost per accepted submission | **Yes** — each pass costs a Firestore write, an R2 PUT and a Resend send. Turnstile does not cap the count; it only raises the price of each one. |

**What Turnstile does not do at all:** validate file type or size, verify a human's intent, attribute
a submission to anyone, or produce an audit trail. Those are the submit endpoint's own job.


---

### 4. Rate limiting on Hobby

**Yes — unambiguously yes, and this is the ticket's premise being wrong.** "WAF Rate Limiting is
available on all plans." — https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
It has been since 23 May 2025: "Rate limiting now has higher included usage and broader
availability... The first 1,000,000 allowed rate limit requests per month are now included. **Hobby
teams also get 1 free rate limit rule per project**, up to the same included allotment. These
changes are now effective and have been automatically applied to your account."
— https://vercel.com/changelog/rate-limiting-now-available-on-hobby-with-higher-included-usage-on-pro

It is a **priced** feature (the docs bill it as Managed Infrastructure), but on Hobby the included
allowance covers any plausible traffic here:

| Resource | Hobby | Pro | Enterprise |
| --- | --- | --- | --- |
| Number of rules | **1 per project** | 40 per project | 1000 per project |
| Included requests | **1,000,000 allowed requests** | Usage-based | Custom |
| Counting keys | IP, JA4 Digest | IP, JA4 Digest | IP, JA4 Digest, User Agent and arbitrary Header keys |
| Counting algorithm | Fixed window | Fixed window | Fixed window, Token bucket |
| Counting window | Min **10s**, max **10mins** | Min 10s, max 10mins | Min 10s, max **1hr** |

"The Hobby limit above applies to WAF Rate Limiting rules. Hobby projects can have up to 3 total
custom firewall rules." — https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
(That sentence is ambiguous about whether the rate-limit rule consumes one of the three; the WAF
limits table gives Hobby "Custom Rules — Up to 3" and "Project level IP Blocking — Up to 3"
independently — https://vercel.com/docs/vercel-firewall/vercel-waf — so read it as 1 rate-limit
rule *plus* 3 custom rules, but treat the overlap as **unconfirmed**.)

The plan page states the Hobby row plainly: "Firewall Rate Limit Requests — 1M allowed requests /
month included", against Pro's "Starting at $0.50 per 1M allowed requests"; and Hobby gets
"Web Application Firewall — Custom Firewall Rules: Up to 3", "IP Blocking: Up to 3", while
"OWASP Core Ruleset (managed)" is Enterprise.
— https://vercel.com/pricing

Three properties that matter more than the headline:

- **Counters are per region.** "Rate limit counters are tracked on a per-region basis; traffic
  matching a given rate limit key in multiple regions can exceed the limit you configure for any
  single region." — https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- **The rule is a dashboard object, not code.** Conditions + `Then: Rate Limit`; "Update the **Time
  Window** field as needed (defaults to 60s) and the **Request Limit** field as needed (defaults to
  100 requests)"; the action defaults to **429** and can be Log, Deny or Challenge, and Log mode
  exists to "first monitor the effect before applying a rate limit or block action."
  — https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- If you ever need an application-level key (a user id, a custom header), the same single rule can be
  consumed from code with `@vercel/firewall`'s `checkRateLimit()`. — https://vercel.com/kb/guide/add-rate-limiting-vercel
- **What happens after 1,000,000 allowed requests on Hobby is unconfirmed.** Hobby cannot buy more:
  "If you have a free Hobby account, you are limited to the usage caps and cannot purchase
  additional usage." — https://vercel.com/pricing — but neither the changelog nor the pricing page
  says whether the rule stops applying, the project pauses, or traffic continues unmetered. Not
  worth probing at rnui.dev's volume.


#### The alternatives, one by one

| Option | Cost | Does it hold? | Verdict |
| --- | --- | --- | --- |
| **Vercel Hobby WAF rate limit rule** | £0, 1M allowed requests/mo included | Per-IP, per-region, fixed window, min 10s max 10min, 429 by default | **Yes** — and it is a dashboard rule, not machinery |
| **Cloudflare-proxying the submit hostname** | Cloudflare Free = $0 | Free zone gets **1** rate limiting rule, counting period **10 s** only, mitigation 10 s; Pro 2 rules; Business 5; Enterprise 100 | Works, but duplicates a control already free on Hobby and costs a DNS move |
| **In-memory counter (a `Map` in module scope)** | £0 | **No — it cannot work.** See below | Rejected |
| **Firestore as the counter** | £0 within Spark, but 1 read + 1 write per submission | Yes, but concentrated contention and extra cost on the hot path | Only as a second line, never first |
| **Vercel firewall defaults** | £0 | DDoS mitigation, IP blocking, custom rules are free on all plans; **no** bot protection on Hobby | Baseline only — not a rate limit |

**Cloudflare-proxying, precisely.** The ticket is right that a *Cloudflare* rate-limiting rule is not
available today, because the endpoint is on Vercel and not behind Cloudflare — but the option is not
closed off by Cloudflare's plan, it is closed off by DNS. On the Free plan rate limiting rules exist:
the availability table gives "Number of rules" as **1 / 2 / 5 / 100 / 100** across
Free / Pro / Business / Enterprise, with a counting period of **10 s** on Free against "all supported
values up to 1 min" on Pro — so Free is a 10-second fixed window, the coarsest configuration in the
product. — https://developers.cloudflare.com/waf/rate-limiting-rules/

Cost/benefit: to get it you would put rnui.dev's DNS in the Cloudflare zone and orange-cloud the
submit host, moving the site's edge from Vercel to Cloudflare, and you would still get a 10-second
window — finer than the 10-second *minimum* Vercel already offers free, which also reaches a
10-minute maximum. **Rejected: strictly worse than what Hobby gives you for free, plus a DNS
migration.**

**Why an in-memory counter does not work on serverless.** Not a style preference — the execution
model forbids it. Vercel: "Vercel creates a new function invocation for each incoming request. If
another request arrives soon after the previous one, Vercel **reuses the same function** instance to
optimize performance and cost efficiency. Over time, Vercel only keeps as many active functions as
needed to handle your traffic. **Vercel scales your functions down to zero when there are no incoming
requests.**" — https://vercel.com/docs/functions
Add the region behaviour Vercel documents for its own counters — "counters are tracked on a
per-region basis" — https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting — and the
failure modes are concrete:

1. **Two requests can land on different instances.** A `Map` is per-instance, so an attacker spread
   across instances gets N × the limit with no attacker effort.
2. **Instance reuse is opportunistic, not a guarantee.** "reuses the same function instance" is
   described as an optimisation *when another request arrives soon after the previous one*; nothing
   promises it.
3. **Scale to zero discards the state.** A slow attacker waits out the counter — the limit resets on
   every cold start, which is the exact adversary a rate limit exists to defeat.
4. **A fresh deploy resets it too**, so the control silently stops controlling on your cadence, not
   theirs.

An in-memory counter is worse than no counter: it produces a `429` that looks like a guarantee and is
not one.

**Firestore as a counter.** It would work — same store, same `lib/firebase.ts`, visible across
instances and regions — and the repo already has the collection-shape precedent in
`lib/counters-firestore.ts`, surfaced through the read-only `app/api/counters-collection/route.ts`
(a diagnostic echo of the build-time collection name, not a write path). Two documented costs:

- **Contention.** Firebase's own distributed-counter guidance exists because a single hot document
  retries under load: "With too few shards, some transactions may have to retry before succeeding,
  which will slow writes." — https://firebase.google.com/docs/firestore/solutions/counters
  (The specific "maximum write rate to a document" figure on the quotas page is widely reported as
  about one write per second per document; I did not read that line verbatim this session, so it is
  **unconfirmed**. — https://firebase.google.com/docs/firestore/quotas)
- **Cost on the hot path.** Every submission pays a read + a write on a path that already pays a
  Firestore write, an R2 PUT and a Resend send. On a £0 budget that is the wrong place to spend.

Verdict: a legitimate second iteration *if* junk arrives and the free WAF rule proves insufficient.
Not the first control, and not needed at this volume.

**Vercel's own firewall defaults.** "Vercel Firewall features available on all plans are free to use.
This includes DDoS mitigation, IP blocking, and custom rules." Priced features are rate limiting and
managed rulesets. — https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing
Hobby limits: Custom Rules up to 3, Project-level IP Blocking up to 3, **WAF Managed Rulesets: N/A**,
Account-level IP Blocking: N/A. — https://vercel.com/docs/vercel-firewall/vercel-waf
So on Hobby the platform gives you DDoS mitigation, IP blocks and custom rules — **and no bot
protection at all.** Managed rulesets and the OWASP Core Ruleset are Enterprise-only. That absence is
the whole reason Turnstile does the bot work here.

---

### 5. What is the cheapest control that actually holds?

**The honest answer is the one the ticket invites: the 4.5 MB platform wall plus Turnstile is
enough, and rate limiting is not worth the machinery here.** What follows is the reasoning, and then
the one free thing that is not "machinery" and therefore costs nothing to also switch on.

**Why the wall plus Turnstile is sufficient.** Everything that makes this endpoint expensive is
already bounded, and the bounds are platform-level:

| Exposure | What bounds it | Source |
| --- | --- | --- |
| Bytes per request | **4.5 MB**, unfreeable, enforced before your code runs | https://vercel.com/docs/errors/FUNCTION_PAYLOAD_TOO_LARGE |
| Blind scripted POSTs | Turnstile — no widget, no token, no pass | https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ |
| Token replay | Single use; replayed tokens rejected `timeout-or-duplicate` | same |
| Storage accumulation | R2 lifecycle rule, 30 days (map decision 11) | decision 11 |
| Notifications per submission | one send, from `mail.rnui.dev` via the existing `sendEmail` | decisions 6 and 8 |

The residual exposure is **one solved challenge per accepted submission**, and that is the only thing
a rate limit would reduce further. Against a £0 budget and an endpoint whose per-request cost is a
Firestore write, an R2 PUT and one email, bulk abuse requires an attacker to solve a challenge per
submission — which is the discouragement Turnstile was asked to provide. Adding a counter to a
Firestore write path (more writes, contention, a new failure mode that can reject real submissions)
buys a bound on a *quality* of attacker that has to spend effort to reach you at all. That is
machinery for its own sake.

**The one free addition, which is not machinery.** Vercel Hobby already includes **one** WAF
rate-limiting rule per project and **1,000,000 allowed requests per month**, at no cost, with no
code: a dashboard rule keyed on IP, fixed window, 10s–10min, default action 429.
— https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting and
https://vercel.com/changelog/rate-limiting-now-available-on-hobby-with-higher-included-usage-on-pro
If junk ever appears, this is the escalating move, in order: switch the existing rule to **Log** to
see what real traffic looks like, then **Rate Limit** with a generous window (e.g. 20 requests per
10 minutes on the `/api/submit` path), then Deny or Challenge. Because it is free, codeless and
reversible, configuring it is a five-minute dashboard task rather than a decision — but it is **not
load-bearing**, and nothing else should be built on the assumption that it is there.

**What is explicitly out of scope, and why:**

- Firestore counters — extra writes and contention on the hot path (§4).
- Cloudflare rate limiting via proxying — a DNS migration to obtain a 10-second window that Vercel
  gives away with a 10-minute one (§4).
- A new vendor (Upstash, Redis, Arcjet, hCaptcha) — decision 5: no new accounts.
- Managed bot protection — Enterprise-only on both platforms
  (https://vercel.com/docs/vercel-firewall/vercel-waf ; https://developers.cloudflare.com/turnstile/plans/).

---

## Bottom line

**Recommendation: ship Turnstile — managed widget rendered explicitly with `execution: "execute"`,
minted after compression, validated server-side on every request by Siteverify with `remoteip` plus
`action` and `hostname` checks — and let the platform's 4.5 MB request-body wall be the volumetric
bound. Do not build a rate limiter.** Optionally, and without any code, turn on Vercel Hobby's single
included WAF rate-limit rule on `/api/submit`; it costs nothing and is worth having, but treat it as
insurance, not as the control the design depends on.

**What this recommendation does NOT protect against:**

1. **A solver.** Anyone who solves one challenge per submission — human, farm, or script with a
   solved token in hand — is admitted, indefinitely and from any number of IPs. Turnstile sets a
   price per request; it does not set a rate.
2. **Unbounded notification volume.** One accepted submission is still one Resend send. Nothing in
   this design caps emails per hour; that is exactly the open question `public-submissions`'s map
   leaves to ticket 09, and this ticket does not answer it.
3. **Distributed low-rate abuse across many IPs**, and any per-IP counter's per-region splitting
   (https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).
4. **Storage growth.** The 4.5 MB wall bounds each object, not how many objects arrive before the
   30-day lifecycle rule removes them.
5. **Content.** A solved token certifies a challenge was passed, not that the submitted file is a
   genuine Screencast, or that the submitter has any right to send it.
6. **The existing `userFeedback` write path**, which this decision deliberately does not touch —
   `notify-and-preview`'s *Not yet specified* records it as "an open write path with no captcha and
   visible bot junk in it", and it remains unguarded after this change.
7. **Siteverify availability.** If Cloudflare's API is slow or down, a fail-closed endpoint rejects
   real submissions and a fail-open one accepts everything. That trade-off is a code decision, not a
   rate limit, and the docs only advise "Have fallback behavior for API failures."
   — https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

