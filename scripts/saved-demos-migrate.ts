// scripts/saved-demos-migrate.ts
//
// Apply whatever is in migrations/ to the saved-Demos D1 database, and prove it
// landed.
//
// Why this exists rather than `wrangler d1 migrations apply`. The Cloudflare CLI
// keeps its credentials in per-developer state outside the repo, and on this
// machine that state was stale — a `wrangler` OAuth token that expired 2026-08-28,
// shadowed by a `CLOUDFLARE_API_TOKEN` environment variable that had expired too,
// so `wrangler d1 migrations list` could not reach the account at all while
// `cf` could. A migration command that fails for reasons invisible in the repo is
// a bad thing for the schema to depend on.
//
// So this speaks the same REST /query endpoint lib/saved-demos.ts uses, with the
// same `CLOUDFLARE_D1_API_TOKEN`, and writes the same `d1_migrations` bookkeeping
// table `wrangler` writes. One credential does the app and the migrations, the
// two agree about what has been applied, and either tool can be used.
//
//   pnpm saved:d1:migrate           apply unapplied migrations, then verify
//   pnpm saved:d1:migrate --status  report what is applied and what is pending
//
// Verifying is not optional. "The migration ran" is a claim; "the table exists
// with these columns" is a measurement, and migration 0001 has a CHECK constraint
// and a STRICT body that only matter if they are really there.

import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

/**
 * Credentials, and the endpoint. Deliberately the same three variables and the
 * same URL as lib/saved-demos.ts — a migration that ran against a different
 * database than the app reads is the failure this avoids.
 */
function endpoint(): { url: string; token: string } {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  const database = process.env.CLOUDFLARE_D1_DATABASE_ID
  const token = process.env.CLOUDFLARE_D1_API_TOKEN
  if (!account || !database || !token) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and " +
        "CLOUDFLARE_D1_API_TOKEN are not set, see .env.example"
    )
  }
  return {
    url:
      `https://api.cloudflare.com/client/v4/accounts/${account}` +
      `/d1/database/${database}/query`,
    token,
  }
}

type D1Result = {
  success: boolean
  results?: Record<string, unknown>[]
  meta?: { rows_read: number; rows_written: number }
}

/**
 * Run one or more statements.
 *
 * Several statements semicolon-joined in a single `sql` are executed by D1 as
 * one batch, and that batch is transactional: measured against the live database
 * on 2026-10-06, a batch whose second statement names a table that does not exist
 * returns 400 and leaves the first statement's row absent. That is what lets a
 * migration be one request and still be all-or-nothing.
 */
async function d1(sql: string, params: unknown[] = []): Promise<D1Result[]> {
  const { url, token } = endpoint()
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  })
  const body = (await res.json()) as {
    result?: D1Result[]
    errors?: { code: number; message: string }[]
    messages?: unknown
  }
  if (!res.ok || body.errors?.length) {
    const why =
      body.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`
    throw new Error(why)
  }
  return body.result ?? []
}

/** The bookkeeping table, byte-for-byte the shape `wrangler` and `cf` expect. */
const BOOKKEEPING = `CREATE TABLE IF NOT EXISTS d1_migrations(
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	name       TEXT UNIQUE,
	applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)`

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations")

/** Migration filenames sort numerically because `cf` names them 0001_, 0002_. */
function localMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
}

async function appliedMigrations(): Promise<string[]> {
  await d1(BOOKKEEPING)
  const [result] = await d1("SELECT name FROM d1_migrations ORDER BY id")
  return (result?.results ?? []).map((row) => String(row.name))
}

async function main(): Promise<void> {
  const statusOnly = process.argv.includes("--status")
  const local = localMigrations()
  const applied = await appliedMigrations()
  const pending = local.filter((name) => !applied.includes(name))

  const database = process.env.CLOUDFLARE_D1_DATABASE_ID
  console.log(
    `database  ${database} (account ${process.env.CLOUDFLARE_ACCOUNT_ID})`
  )
  console.log(`applied   ${applied.length ? applied.join(", ") : "(none)"}`)
  console.log(`pending   ${pending.length ? pending.join(", ") : "(none)"}`)

  if (statusOnly) {
    return
  }
  if (pending.length === 0) {
    console.log("\nNothing to apply.")
  }

  for (const name of pending) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8")
    // The migration body and its bookkeeping insert go in ONE batch, so a
    // migration cannot be recorded as applied without having been applied.
    await d1(`${sql}\nINSERT INTO d1_migrations (name) VALUES ('${name}');`)
    console.log(`applied   ${name}`)
  }

  // Verify by querying, not by assuming. The point of this ticket's "verify by
  // querying" is that `applied` means something: a tool can print "applied" and
  // be wrong, whereas a missing column throws.
  const [{ results: tables } = { results: [] }] = await d1(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'saved_demos'"
  )
  if (!tables?.length) {
    throw new Error(
      "migrations reported success but saved_demos does not exist — do not trust the log, check the database id"
    )
  }
  const [{ results: columns } = { results: [] }] = await d1(
    "SELECT name, type FROM pragma_table_info('saved_demos')"
  )
  const expected = ["reader_uid", "recording_ids", "updated_at"]
  const found = (columns ?? []).map((c) => String(c.name))
  for (const column of expected) {
    if (!found.includes(column)) {
      throw new Error(
        `saved_demos has no ${column}; found ${found.join(", ") || "(none)"}`
      )
    }
  }
  const [{ results: strict } = { results: [] }] = await d1(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'saved_demos'"
  )
  if (!/\bSTRICT\b/i.test(String(strict?.[0]?.sql ?? ""))) {
    throw new Error("saved_demos is not a STRICT table")
  }
  console.log(
    `\nverified  saved_demos exists, STRICT, columns ${found.join(", ")}`
  )
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
