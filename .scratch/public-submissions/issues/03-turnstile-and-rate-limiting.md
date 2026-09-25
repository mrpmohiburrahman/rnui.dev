# Turnstile and rate limiting on a Vercel route handler

Status: resolved
Type: research

## Question

Map decision 7 puts Cloudflare Turnstile plus per-IP rate limiting on the submit endpoint.
Establish exactly how both attach to a Next.js 16 route handler on Vercel Hobby, and what
each does and does not stop.

Deliver `research/submit-abuse-controls.md`, every claim citing its source.

1. **Turnstile: free tier and limits.** Requests per month, siteverify rate limits, what the
   free tier excludes, and whether it is genuinely unlimited or has an unpublished ceiling.
   Confirm it is included in the Cloudflare account rnui.dev already uses, at no cost.

2. **The integration shape for a Next.js route handler.** The two flows — the implicit
   (managed) widget and the explicit `turnstile.render()` — and which suits a form that also
   does client-side compression before submitting. State where the site key goes
   (`NEXT_PUBLIC_` as it must be public) and where the secret goes, and give the server-side
   `siteverify` call as it would exist in `app/api/submit/route.ts`.

3. **What Turnstile actually stops, and what it does not.** Be blunt: a solved token is
   reusable for 300 seconds unless the action/challenge is bound to something session-specific,
   and bots that solve challenges exist. Say which of these matter for an endpoint that also
   enforces a 5 MB cap.

4. **Rate limiting on Hobby.** Does Vercel Hobby offer the WAF rate-limiting rules, or is it
   Pro-only? If Pro-only, what are the free alternatives that do not add a vendor — a
   Cloudflare rate-limiting rule is *not* available because the endpoint is on Vercel, not
   behind Cloudflare. Cover at minimum: Cloudflare-proxying the submit hostname, an
   in-memory counter (**and why it does not work** on serverless), Firestore as a counter,
   and Vercel's own firewall defaults.

5. **What is the cheapest control that actually holds?** Given the 4.5 MB platform wall is
   already a hard per-request bound, recommend the minimum that makes repeated abuse
   unattractive — and say plainly if the honest answer is "the platform wall plus Turnstile is
   enough, and rate limiting is not worth the machinery here".

## Notes

Read `notify-and-preview`'s `map.md` entry on `userFeedback` first. It records the existing
unguarded write path this decision exists to avoid repeating, and it should not be re-derived.

## Acceptance

`research/submit-abuse-controls.md` exists; question 4 gives a clear yes/no on Hobby WAF rate
limiting with a source; question 5 ends with one recommendation and names what it does not
protect against.

## Answer

Resolved 2026-09-25. Full findings, every claim sourced, in
[`../research/submit-abuse-controls.md`](../research/submit-abuse-controls.md).

**Turnstile yes. Rate limiting no — and this ticket's own premise was wrong in one place.**

- **Turnstile Free is $0 with no published request or Siteverify cap**; the docs claim unlimited
  challenges. It is included in the Cloudflare account rnui.dev already uses.
- **Vercel Hobby *does* include one WAF rate-limit rule per project**, plus 1M allowed requests a
  month — since 2025-05-23, and **not** Pro-only. This ticket assumed otherwise; corrected here.
- **It stops** blind POSTs and replay: tokens are single-use and a reused one returns
  `timeout-or-duplicate`.
- **It does not stop a solver.** A solved token is unbound to the payload and carries no per-IP
  cadence, so one solved challenge per submission is enough.
- **Use explicit rendering** — `turnstile.render()` with `execution: "execute"` — which suits a form
  that compresses before submitting, given the 300-second token lifetime. Validate server-side
  against action, hostname and remoteip.
- **In-memory counters cannot work:** Vercel instances scale to zero and are per-region. Firestore
  would work but adds hot-path writes for a threat it does not close — hence **no rate limiter**.

**Honest limits, recorded rather than glossed:** this does not protect against a human or a farm
solving one challenge per submission, **unbounded Resend sends**, distributed IPs, or storage growth.

**Consequences, applied to the map:** decision 7 was amended to drop the rate limiter, and ticket 07
was rewritten to match. The fog entry on notification volume gained this finding as direct support —
it names unbounded Resend sends as a gap, which is exactly what that entry worried about.
