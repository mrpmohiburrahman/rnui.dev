# Saved Demos in Cloudflare D1

How `rnui-saved-demos` is configured, why the schema looks the way it does, and
where the ceiling is.

Background: [ADR-0013](../docs/adr/0013-saving-requires-a-social-sign-in-verified-into-d1.md),
and `.scratch/sign-in-to-save/` for the effort. Mirrors [r2-setup.md](r2-setup.md).

## What exists

| Thing | Value |
| --- | --- |
| Cloudflare account | `b3a4cec2f17469072a5e97c44424ae14` — the same account as both R2 buckets |
| Database | `rnui-saved-demos`, id `c55f79bd-cd22-4a8e-9047-269024722ff7` |
| Created | 2026-10-06, WEUR, Standard, no jurisdiction, read replication disabled |
| Tables | `saved_demos`, and `d1_migrations` (the bookkeeping table both `wrangler` and `pnpm saved:d1:migrate` write) |
| Size when created | 32 KB, empty |
| Row shape | **one row per Reader**, `reader_uid` PRIMARY KEY, `recording_ids` a JSON array, `updated_at` ISO-8601 |

## How the app reaches it

**Not through a Workers binding.** The site is Next.js on Vercel, so there is no
`env` to read `DB` from. `lib/saved-demos.ts` posts to the account's REST
`/query` endpoint with a token scoped `Account → D1 → Edit`.

`wrangler.toml` still declares the binding, because it is what pins the
database *identity* in the repo: `wrangler d1 migrations apply rnui-saved-demos`
and the app cannot drift onto two different schemas.

## Migrations

```bash
pnpm saved:d1:migrate           # apply whatever is pending, then verify
pnpm saved:d1:migrate --status  # report applied and pending, change nothing
```

It uses `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID` and
`CLOUDFLARE_D1_API_TOKEN` — the same three the app uses, so one credential covers
both. It writes the same `d1_migrations` table `wrangler` writes, so the two
tools agree about what has been applied and either can be used.

It is not a `wrangler` wrapper on purpose. Cloudflare's CLI keeps credentials in
per-developer state outside the repo, and on this machine that state was stale —
a `wrangler` OAuth token that expired 2026-08-28, shadowed by a
`CLOUDFLARE_API_TOKEN` environment variable that had expired too — so
`wrangler d1 migrations list` could not reach the account at all while `cf` could.
A migration command that fails for reasons invisible in the repo is a bad thing
for a schema to depend on.

**It verifies, and that is not decoration.** After applying, it queries
`sqlite_master` and `pragma_table_info` and fails if `saved_demos` is absent, is
missing a column, or is not `STRICT`. "The migration ran" is a claim; a missing
column is a measurement. A DDL statement and its bookkeeping insert go in one
request, and D1 executes a batch transactionally — measured 2026-10-06, a batch
whose second statement names a table that does not exist returns 400 and leaves
the first statement's row absent — so a migration cannot be recorded as applied
without having been applied.

## The schema, and the one reason it is this shape

**One row per Reader holding a JSON array, not one row per save.** The tidier
looking shape is a row per (reader, recording) pair. It is worse here, and the
reason is a budget rather than a taste.

The constraint, from `map.md`: *a saved-Demos read is one document read per
visitor, never one per Recording.* D1 bills rows read, so a row per save makes
every page load cost O(saves) forever, and the per-row count grows with the thing
you most want to keep small.

Measured against the live database on 2026-10-06, with a Reader who had saved all
298 Demos in the catalogue:

| Shape | D1 `rows_read` for one read of that Reader's list |
| --- | --- |
| **One row per Reader** (this one) | **1** |
| One row per save | 596 |

A `STRICT` table and a `CHECK (json_valid(...) AND json_type(...) = 'array')` on
`recording_ids` are both doing work: `STRICT` keeps the column text, and the
`CHECK` means a bad write cannot leave a Reader whose row will not parse — which
would read as an empty list and look like losing a save. Both were verified by
querying, including the rejections.

## Free tier, and what happens at the ceiling

The account has **one subscription: `r2_paid`** (R2 pay-as-you-go, $0). There is
no Workers Paid subscription, so **D1 is on the Workers Free plan**. Checked
2026-10-06 via the account's subscriptions API rather than the pricing page.

| Metric | Workers Free | Measured here |
| --- | --- | --- |
| Rows read | 5,000,000 / day | 1 per saved-Demos read |
| Rows written | 100,000 / day | 2 for a Reader's first save, 1 for each later one |
| Storage | 5 GB total | 32 KB, empty |
| Max database size | 500 MB | — |

**The failure mode is the same class as the one D1 was chosen to avoid, and this
is worth being plain about.** Cloudflare's own wording: when the account hits the
daily read or write limit, *"you will not be able to run queries against D1"* and
the API returns errors. That is a hard refusal until 00:00 UTC, which is exactly
the Firestore-on-Spark behaviour `map.md` decision 3 rejected.

So the case for D1 over Firestore is a **headroom** argument, not a behaviour one:
5,000,000 rows read/day against Firestore Spark's 50,000, which is the "roughly
100×" in the decision. The schema is what widens it further — one row per Reader
turns a Reader with a 298-Demo saved list into the same cost as a Reader with
one.

Reading the ceiling out of the measurements: a save costs 1–2 rows written, so
**100,000 rows written/day is about 50,000 first-time saves**, or 100,000 repeat
saves. Reads are not the binding constraint: 5,000,000 rows read/day is 5,000,000
page loads of a signed-in Reader's bookmarks page. **Writes are roughly 100×
tighter than reads**, which is the opposite of what people assume when they pick a
storage product, and it means the write path is where the ceiling lives.

**Where usage is visible, so the ceiling is not discovered by hitting it:**

- **Dashboard** — Cloudflare dashboard → *Workers & Pages* → *D1* → `rnui-saved-demos`.
  Per-database rows read, rows written and storage.
- **`meta` on every response.** D1 returns the exact cost of every query, which
  is how the table above was measured and what `pnpm saved:d1:migrate` and any
  future script should read rather than estimating:

  ```json
  "meta": { "duration": 0.12, "size_after": 32768, "rows_read": 1, "rows_written": 0 }
  ```

- **GraphQL Analytics API** — the `d1AdaptiveGroups` dataset, attributing read and
  write volume per database and per hour. The `cf` CLI's OAuth token on this
  account returned `10000 Authentication error` against `/analytics/graphql` on
  2026-10-06, so this path is documented rather than verified here; the dashboard
  and the per-response `meta` both work.

## Credentials

| Variable | Who needs it |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Everything D1. Same account as R2. Public, not a secret. |
| `CLOUDFLARE_D1_DATABASE_ID` | Everything D1. The UUID `c55f79bd-…`, never the name — the D1 API requires the id. |
| `CLOUDFLARE_D1_API_TOKEN` | The app **and** `pnpm saved:d1:migrate`. Needs `Account → D1 → Edit`. |

**On Vercel: all three are set** on `prj_oJwJTNITIGO5i4MqVVGqjLaPIOfc`, on
2026-10-06. `CLOUDFLARE_D1_DATABASE_ID` and `FIREBASE_PROJECT_ID` are on
production, preview and development; `CLOUDFLARE_D1_API_TOKEN` is on production
and preview, as **`sensitive`** so it is write-only and never readable back.

The token itself was minted for this database with a policy of exactly three
permission groups — D1 Metadata Read, D1 Read, D1 Write — on this account alone,
named `rnui-dev saved-demos D1`. Least privilege was checked rather than assumed:
it reads and writes D1, and `GET /r2/buckets` returns **refused**, where
`CLOUDFLARE_R2_TOKEN` succeeds. (`GET /workers/scripts` answers 200 with `[]`;
the account has no Worker scripts and the policy grants nothing under Workers, so
that is the endpoint answering rather than access.)

If any of the three is ever missing, the save routes refuse every request rather
than degrading — the same shape as the missing Turnstile secrets noted in
`.env.example`.

**A separate token from `CLOUDFLARE_R2_TOKEN`, and not a distinction in the
abstract.** That token is scoped to Workers R2 Storage and cannot read D1 at all:
`GET /d1/database` with it returns `10000 Authentication error`, measured against
the live account 2026-10-06, while the D1 token lists the database.

## Reproducing it from nothing

```bash
# 1. the database
cf d1 create --name rnui-saved-demos --primary-location-hint weur

# 2. put the uuid in wrangler.toml and CLOUDFLARE_D1_DATABASE_ID, then
pnpm saved:d1:migrate

# 3. an API token, Account > D1 > Edit, into CLOUDFLARE_D1_API_TOKEN
```

WEUR matches both R2 buckets, so a Reader's saved Demos and their Assets sit in
the same region.

## Things that will bite you

- **Cloudflare's CLI credentials are outside the repo and expire.** Both the
  `wrangler` OAuth token and the `CLOUDFLARE_API_TOKEN` in this shell had expired.
  `cf auth whoami` with those environment variables set reports
  `tokenValid: false` and no accounts; unsetting them falls back to `cf`'s own
  stored OAuth token and works. If D1 calls start failing with `10000
  Authentication error`, that is the first thing to check, not the token in
  `.env`.
- **The account id in `CLOUDFLARE_API_TOKEN`-shaped variables does not help a
  token that is expired.** All four Cloudflare variables in this shell were
  checked; only two are currently valid API tokens, and neither can reach D1.
- **`wrangler d1 migrations list` defaults to `--local`.** Pass `--remote` or you
  will be told an already-applied migration is pending, against an empty local
  database.
- **D1 answers HTTP 200 with `success: false`** for a constraint violation.
  `res.ok` alone is not enough, and a write that did not happen can otherwise look
  like one that did. `lib/saved-demos.ts` checks the envelope, and
  `tests/saved-demos.test.ts` pins it.
- **Numbered SQL parameters (`?1`) are not accepted** by the D1 `/raw` endpoint —
  it counts occurrences, not distinct indices. `lib/saved-demos.ts` uses plain
  positional `?` and repeats the binding, which works.
- **`json_each` order is not promised** without an `ORDER BY key`. Both write
  statements carry one; a bare aggregate over `json_each` reshuffles the
  bookmarks page the day that stops holding.
- **Saving is not free of a per-request network hop** — there is the D1 call, and
  there is the Firebase JWKS, which is cached (see below). The JWKS cache lives at
  module scope in `lib/firebase-token.ts` and a Firebase key rotation costs at most
  ~30 seconds of saves failing closed before jose refetches; it needs no deploy
  and no cache purge. Moving `createRemoteJWKSet` inside the verify function turns
  that into a JWKS fetch per request, which
  `tests/firebase-token.test.ts` counts.

## Not yet built

- **A sweep for accounts deleted from Firebase.** ADR-0013 records that a deleted
  account's token stays valid for up to an hour, so its row outlives it by that
  much. The mitigation is a stored `lastSeenAt` plus a scheduled delete. The
  column is deliberately absent rather than added empty — see the migration's
  comment — and a nullable `ALTER TABLE` when the sweep is built costs one
  migration.
- **Cleanup of saved ids for Recordings that have left the catalogue.** On
  `.scratch/sign-in-to-save/map.md`'s fog, unasked. Note the shape helps here too:
  a stale id is one array member, not an orphaned row.