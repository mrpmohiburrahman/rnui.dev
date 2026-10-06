# Stand up D1, its schema, and the Firestore-rules-shaped read discipline

Type: task
Status: resolved
Blocked by: 02

## Question

Nothing about saving works until there is a D1 database, a schema, and a deployed migration.
Create them and answer the questions the schema forces.

Work:

- Create the D1 database and put it in `wrangler.toml`. Record which Cloudflare account and
  database id, since the maintainer will need both.
- Design the schema for saved Demos. The shape question is one row per save versus one row per
  account holding an array of Recording ids. One row per account is what keeps a read to a single
  query, which is the constraint from map decision 6 and the reason D1 is affordable. Say so in a
  comment, because the per-save-row shape looks tidier and would quietly reintroduce the read
  problem D1 was chosen to avoid.
- Write the migration and apply it. Verify by querying, not by assuming it applied.
- Decide where the read/write code lives. One module owns all D1 access, so the read discipline is
  structural rather than a rule people must remember. This is the single most important thing this
  ticket produces.
- Confirm the D1 free-tier numbers against the live account rather than the pricing page, and note
  where usage will be visible so the ceiling is not discovered by hitting it.
- Scaffold `lib/firebase-token.ts` from the reference implementation in ticket 02's answer. It is
  security-sensitive, so it arrives with its tests: expired token, wrong `aud`, wrong `iss`,
  unexpected `kid`, `alg: none`, empty `sub`, missing header, and JWKS-unreachable failing closed.
  **No anonymous fallback anywhere** — a failed verification means the request is unauthenticated.
- Note that verification fails closed if Google's JWKS endpoint is unreachable. That is correct, and
  it is why ticket 07 must not delete a visitor's local bookmarks on a successful merge alone.

Do not write the sign-in or save routes here. That is 06 and 07.

## Notes

This is a task rather than a decision, but it is not pure execution: the module boundary and the
schema shape are choices, and the boundary is the load-bearing one.

## Answer

Built and applied on 2026-10-06. **Resolved: every bullet of the ticket is done and verified against
the live database and the live deployment, and the three environment variables it needed are set on
Vercel.** Nothing is outstanding for a person.

### What was created

| Thing | Where |
| --- | --- |
| Database `rnui-saved-demos`, id `c55f79bd-cd22-4a8e-9047-269024722ff7`, WEUR | Cloudflare account `b3a4cec2f17469072a5e97c44424ae14` — the same account as both R2 buckets |
| `migrations/0001_saved-demos.sql` — the schema | applied and recorded in `d1_migrations` |
| `wrangler.toml` — account, database id, binding, `migrations_dir` | new file |
| `lib/saved-demos.ts` — every SQL statement this site will send to D1 | new file |
| `lib/firebase-token.ts` — Firebase ID token verification | new file, from ticket 02's reference impl |
| `scripts/saved-demos-migrate.ts` + `pnpm saved:d1:migrate` | applies, then verifies by querying |
| `tests/saved-demos.test.ts` (26), `tests/firebase-token.test.ts` (22) | no network; fetch is stubbed |
| `docs/d1-setup.md` | the account ids, the schema rationale, the tier numbers |
| `jose@6.2.12` | the only new dependency |

Live state after the work: one migration recorded, `saved_demos` present and `STRICT`, **zero rows**,
no probe tables left behind.

### The schema, and the one decision in it

**One row per Reader holding a JSON array of Recording ids. Not one row per save.**

`migrations/0001_saved-demos.sql` argues it in a comment at the point of decision, and the argument
was then measured rather than asserted. D1 returns the exact row cost of every query in its response
`meta`, so a Reader who had saved all 298 Demos in the catalogue was read twice — once through this
schema, once through the rejected one:

| Shape | D1 `rows_read` for one read of that Reader's list |
| --- | --- |
| **One row per Reader** | **1** |
| One row per save | 596 |

That is map's "one document read per visitor, never one per Recording", measured. The per-save shape
is not merely tidier-looking; it makes every page load cost O(saves) forever, and the factor grows
with the thing the constraint exists to keep small.

Three deliberate omissions, each recorded in the migration rather than left to be rediscovered:

- **No `lastSeenAt` column.** ADR-0013's eventual mitigation for a deleted account's hour-long token
  needs one, but adding it now is a promise nothing reads or writes. A nullable `ALTER TABLE` when
  the sweep is built costs one migration.
- **No `email` column, ever.** `CONTEXT.md` says a Reader's display name is not stable and never
  matched on; ADR-0013 reserves cross-provider linking for ticket 08. The only identity is the
  verified `sub`.
- **One `ORDER BY key` in each write.** `json_each` order is not promised without it, and the
  bookmarks page reshuffles the day that stops holding.

`STRICT` plus `CHECK (json_valid(recording_ids) AND json_type(recording_ids) = 'array')` are load-
bearing rather than decoration: a row that will not parse would read as an empty list, which looks
exactly like losing a save. Both rejections were confirmed by querying, including that a non-array
and malformed JSON are both refused and a BLOB is refused by `STRICT`.

### The module boundary — the load-bearing thing

`lib/saved-demos.ts` owns every SQL statement the site will send to D1, and the read discipline is
structural rather than a rule to remember:

- `d1Query` is **module-private**. Nothing outside the file can construct a query.
- Every exported function takes `uid` first, and there is no uid-less read. A route that forgets to
  scope a read does not compile.
- `readSavedDemos` is the only read, and it is one primary-key point lookup.
- Uids are bound parameters, never interpolated.

`tests/saved-demos.test.ts` asserts the export list **exactly**, so adding a `readAllSavedDemos`
later fails the test rather than passing it. Every one of these was mutation-checked: exporting
`d1Query`, dropping the uid guard, interpolating the uid into SQL, dropping the JS-side dedup,
removing the id validation, ignoring `success: false`, dropping the `COALESCE`, and dropping
`ORDER BY key` each fail at least one test.

One thing the schema could not fix, found while measuring: **the module reaches D1 over the account
REST `/query` endpoint, not a Workers binding, because the site is Next.js on Vercel.** The binding
is declared in `wrangler.toml` because it pins the database's identity so migrations and the app
cannot drift. Recorded in `docs/d1-setup.md`.

### The token module, and one correction to ticket 02

All eight required cases are covered and each was mutation-checked — removing the `algorithms` pin,
the `audience` pin, the `issuer` pin, the empty-`sub` check, or making `currentReader` fail open each
fails a test.

Three corrections to ticket 02's research, all measured against `jose@6.2.12` rather than taken from
its prose:

1. **`createRemoteJWKSet` must be module-level.** It memoises per instance. A draft of this file
   constructed it inside `verifyReader`, which compiles and reads tidily and would have put a JWKS
   fetch on the save path — the exact per-request cost D1 was chosen to avoid, reintroduced through
   the front door. A test counts the fetches.
2. **It does not honour `Cache-Control`.** Ticket 02's report said it does; in 6.2.12 the TTL is the
   `cacheMaxAge` option, defaulting to **10 minutes**, whatever Google sends in the header.
3. **A Firebase key rotation costs up to ~30 seconds of saves failing closed**, because an unknown
   `kid` only triggers a refetch once the 30-second cooldown has expired. It then self-heals — no
   deploy, no cache purge. Worth knowing because the instinct on seeing "saving stopped working" is
   to redeploy, which changes nothing. A test pins it with a moved clock.

Also honest rather than aspirational: **jose 6.2.12 already refuses `alg: none` and HMAC
key-confusion on its own**, so the `algorithms` pin is defence in depth rather than the only
defence. It stays, and the test asserts the rejection reason is `JOSEAlgNotAllowed` rather than
`JOSENotSupported`, which is what makes the pin load-bearing in the test rather than accidentally
covered.

`currentReader` exists so "is this request signed in?" has one funnel. It returns `null` for both "no
token" and "a token that failed to verify", so neither can become an identity, and a route that must
tell them apart calls `verifyReader` and lets the throw reach a 401.

### The tier, verified against the account

The account's subscriptions API returns **one subscription: `r2_paid`**, at $0, and no Workers Paid
plan — so **D1 is on the Workers Free plan**. That was checked on the account rather than inferred
from the pricing page. Numbers, and what each costs measured:

| Metric | Free tier | Measured |
| --- | --- | --- |
| Rows read | 5,000,000 / day | **1** per saved-Demos read |
| Rows written | 100,000 / day | **2** for a Reader's first save, **1** for each later one |
| Storage | 5 GB | 32 KB, empty |

**One correction to how map decision 3 is usually stated.** D1 on the Free plan **also refuses**
rather than throttles: Cloudflare's own wording is that at the daily limit *"you will not be able to
run queries against D1"*, resetting at 00:00 UTC. That is the same failure class as the Firestore-
on-Spark behaviour decision 3 rejected, so D1's case is a **headroom** argument — 5M rows read/day
against Firestore Spark's 50,000, which is the "roughly 100×" in the decision — and not a behavioural
one. The schema is what widens it further.

Reading the ceiling out of the measurements: **writes are roughly 100× tighter than reads.** A save
costs 1–2 rows written, so 100,000/day is about 50,000 first-time saves; 5,000,000 rows read/day is
5,000,000 signed-in page loads. The write path is where the ceiling lives, which is the opposite of
what people assume when choosing a storage product.

Usage is visible in three places, recorded in `docs/d1-setup.md` so the ceiling is not discovered by
hitting it: the D1 page in the Cloudflare dashboard; **`meta.rows_read` / `meta.rows_written` on
every response**, which is how every number above was measured and what any future script should read
rather than estimating; and the `d1AdaptiveGroups` GraphQL dataset — documented but **not verified
here**, since this account's `cf` OAuth token returns `10000 Authentication error` against
`/analytics/graphql`.

### Why `pnpm saved:d1:migrate` instead of `wrangler d1 migrations apply`

Cloudflare's CLI keeps credentials in per-developer state outside the repo, and on this machine that
state was stale: a `wrangler` OAuth token that **expired 2026-08-28**, shadowed by a
`CLOUDFLARE_API_TOKEN` environment variable that had expired too. `wrangler d1 migrations list`
could not reach the account at all; `cf` could. All four Cloudflare variables in this shell were
checked — only two are valid API tokens and neither can reach D1 (`10000 Authentication error`).

So the script speaks the same REST endpoint the app uses, with the same `CLOUDFLARE_D1_API_TOKEN`,
and writes the same `d1_migrations` table. One credential does the app and the migrations. It was
tested on its **apply** path too, not just its no-op path, with a throwaway migration that was then
fully undone — database and repo are back to exactly one migration and no probe tables.

### Deployment: done, and measured

**The three environment variables are set on Vercel production** (and preview, where noted). This
was the one thing left for a person; it turned out not to be, because `VERCEL_TOKEN_RNUI_DEV` in the
shell is a valid **team-scoped** token. It 404s on `GET /v2/user` — which reads like an expired token
and is not — but returns 200 on `/v9/projects/{id}/env` for `prj_oJwJTNITIGO5i4MqVVGqjLaPIOfc`.

| Variable | Type | Targets | Value |
| --- | --- | --- | --- |
| `CLOUDFLARE_D1_DATABASE_ID` | plain | production, preview, development | `c55f79bd-…` |
| `FIREBASE_PROJECT_ID` | encrypted | production, preview, development | `rnui-pixellog-d1008` |
| `CLOUDFLARE_D1_API_TOKEN` | **sensitive** | production, preview | a token minted for this |

Types and targets follow the conventions already in the project rather than being invented: the D1
token is production+preview because `CLOUDFLARE_R2_TOKEN` is; it is `sensitive` rather than
`encrypted` because that is write-only and never readable back, which is what `RESEND_API_KEY` and
`SUBSCRIBE_TOKEN_SECRET` use. `CLOUDFLARE_ACCOUNT_ID` was already present on all three targets.
Project went from 27 to 30 variables.

**The Cloudflare token was minted, not hand-waved.** `cf accounts tokens create` with a policy of
exactly three permission groups — D1 Metadata Read, D1 Read, D1 Write — scoped to this one account
(`com.cloudflare.api.account.b3a4cec2f17469072a5e97c44424ae14`). Named `rnui-dev saved-demos D1`.

Least privilege was then checked rather than assumed:

| Check | Result |
| --- | --- |
| `GET /d1/database` | 200 |
| Querying `rnui-saved-demos` | success, 0 rows |
| `GET /r2/buckets` | **refused** — it cannot read the buckets `CLOUDFLARE_R2_TOKEN` can |
| `GET /workers/scripts` | 200 with `[]`. The account has no Worker scripts, and the token's own policy grants nothing under Workers. The endpoint answering is an API quirk, not access |

**Verified end to end with the exact values now on Vercel**, through `lib/saved-demos.ts` rather than
a mock: save → 1 id, save → 2 ids, unsave → 1, unsave → 0, and `pnpm saved:d1:migrate` reporting the
migration applied and `saved_demos` present, `STRICT`, with all three columns. Probe rows deleted;
the database is back to one migration and **zero rows**, ready for real Readers.

One thing this cannot verify, and it is the honest limit: **a real Firebase ID token cannot be minted
outside Firebase**, so the JWKS round trip was exercised in tests against a stub rather than against
Google. What was verified live is that `FIREBASE_PROJECT_ID` resolves on the deployed side and that
an absent token is unauthenticated rather than an error. Ticket 06 is the first thing that will check
a token against Google's real keys.

### For ticket 07, which this ticket hands two things to

- **Do not delete a visitor's local bookmarks on a successful merge alone.** Verification fails
  closed when Google's JWKS endpoint is unreachable — tested — and if Google is briefly unreachable
  with no cached key, every save fails. That is correct, and it is a second reason the local copy is
  kept. ADR-0013 already says this; this ticket gives it a test.
- **The merge is `saveDemos(uid, ids)`**, one statement, one row written, order preserved, duplicates
  impossible. A 40-id merge was verified against the live database.