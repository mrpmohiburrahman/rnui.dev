// lib/saved-demos.ts
//
// Every byte of SQL this site sends to Cloudflare D1 lives in this file.
//
// That sentence is the ticket. sign-in-to-save map.md carries as a constraint
// that "a saved-demo read is one document read per visitor, never one per
// Recording", and calls it the decision that keeps D1 affordable and the one
// that would be expensive to retrofit. A constraint nobody can violate beats a
// rule everybody must remember, so the read discipline here is *structural*:
//
//   - `d1()` is module-private. Nothing outside this file can construct a query,
//     so no route can invent one against another Reader's saved Demos.
//   - Every exported function takes `uid` as its first argument and there is no
//     "read them all". Forgetting to scope a read is a type error, not someone
//     else's saved list.
//   - `readSavedDemos` is the only read, and it is one primary-key point lookup.
//     There is no function that reads per Recording, and adding one is the moment
//     the constraint is broken — which is the point of it being conspicuous.
//
// The uid is never taken from a request body, query parameter or client header.
// It comes from the verified `sub` claim of a Firebase ID token and nothing else;
// see lib/firebase-token.ts for that check and why a failed verification leaves
// the request unauthenticated rather than anonymous.
//
// HOW D1 IS REACHED, AND WHY NOT THROUGH THE WORKERS BINDING
//
// wrangler.toml records the D1 binding, and it is what owns the schema and the
// migrations. The app itself does not use it: the site is Next.js on Vercel, so
// there is no `env` to read the binding from. It goes to the account's REST
// /query endpoint with a token scoped Account -> D1 -> Edit, which is the same
// route `pnpm saved:d1:migrate` uses. One endpoint for the app and the tooling
// means the schema that runs is the schema that was migrated.
//
// Env vars are read per call rather than at import, like CLOUDFLARE_R2_TOKEN in
// lib/submission-storage.ts, so this module imports in a test without them and a
// missing value fails at the request that needed it rather than at module load.

/**
 * A Recording id, as the catalogue actually spells them.
 *
 * Measured over every id in `data/catalogue.ts` on 2026-10-06: 298 of 298 are
 * exactly 26 characters, uppercase, drawn from 33 distinct characters —
 * `0123456789ABCDEFGHJKLMNPQRSTVWXYZ`. That is Crockford base32 *plus `L`*, so
 * these are ULID-shaped rather than strict ULIDs: whoever minted them allowed the
 * one letter Crockford drops to avoid confusion with a digit. This pattern is
 * therefore the data, not the specification, and `tests/saved-demos.test.ts` pins
 * it against the catalogue so it cannot be quietly tightened back into rejecting
 * real ids — which an earlier draft of this file did, on a `L`.
 *
 * What it buys: the string that reaches SQL is 26 characters of `[0-9A-Z]` and
 * nothing else — not a quote, not a comma, not a second element of the JSON array
 * passed as a parameter. Belt-and-braces, since ids are always bound as
 * parameters and never interpolated, but the column is JSON and being strict
 * about what may go into it is cheap.
 */
const RECORDING_ID = /^[0-9A-Z]{26}$/

function checkRecordingId(recordingId: string): string {
  if (!RECORDING_ID.test(recordingId)) {
    throw new Error(`Not a Recording id: ${JSON.stringify(recordingId)}`)
  }
  return recordingId
}

/** The verified Firebase `sub`. Never empty; see lib/firebase-token.ts. */
function checkUid(uid: string): string {
  if (uid === "") {
    throw new Error(
      "Saved Demos are keyed by a Reader uid, and this one is empty"
    )
  }
  return uid
}

type D1Target = { url: string; token: string }

/**
 * Credentials, resolved per call.
 *
 * A separate token from CLOUDFLARE_R2_TOKEN on purpose: that one is scoped to
 * Workers R2 Storage and cannot read D1 at all — measured against the live
 * account on 2026-10-06, `GET /d1/database` with the R2 token returns
 * `10000 Authentication error` while the same call with this token lists the
 * database. Least privilege is cheaper than discovering the overlap later.
 */
function d1(): D1Target {
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

type D1Row = Record<string, unknown>
type D1Result = { success: boolean; results?: D1Row[]; errors?: unknown }

/** One statement, bound parameters only. The only place a SQL string leaves here. */
async function d1Query(sql: string, params: unknown[]): Promise<D1Row[]> {
  const { url, token } = d1()
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`D1 query: HTTP ${res.status} ${text.slice(0, 200)}`)
  }
  // D1 answers 200 with `success: false` for a constraint violation, so `res.ok`
  // is not enough on its own.
  const body = (await res.json()) as { result?: D1Result[]; errors?: unknown }
  const result = body.result?.[0]
  if (!result?.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(body.errors ?? result)}`)
  }
  return result.results ?? []
}

/**
 * A Reader's saved Demos, newest last — the order they saved them.
 *
 * Empty for a Reader who has saved nothing. Never undefined, never null: an
 * absent row and a Reader whose list is empty mean the same thing, and a caller
 * that had to tell them apart would eventually get it wrong in the direction that
 * loses a save.
 */
export async function readSavedDemos(uid: string): Promise<string[]> {
  const rows = await d1Query(
    `SELECT recording_ids FROM saved_demos WHERE reader_uid = ?`,
    [checkUid(uid)]
  )
  const raw = rows[0]?.recording_ids
  if (typeof raw !== "string") {
    return []
  }
  const parsed: unknown = JSON.parse(raw)
  // The CHECK constraint in the migration guarantees an array of JSON. This is
  // here for the day someone edits that constraint by hand without reading the
  // migration: a wrong-shaped column must not become a crash on the bookmarks
  // page, and must not become somebody else's ids either.
  if (!Array.isArray(parsed)) {
    return []
  }
  return parsed.filter((id): id is string => typeof id === "string")
}

/**
 * Add Recording ids to a Reader's saved Demos, creating the row if it is the first.
 *
 * One statement, so it is atomic and idempotent:
 *
 *   - Nothing is ever in the array twice, whatever the client sends and however
 *     many devices send it at once. Two devices saving the same Demo converge on
 *     one entry, because the second write's `EXISTS` sees the first's.
 *   - A Reader's existing saves keep their positions and new ones are appended,
 *     so the bookmarks page does not reshuffle itself every time something is
 *     saved on a second device.
 *   - It is one row written however many ids arrive, which is what keeps the
 *     first-sign-in merge — the one call that can carry forty ids — from costing
 *     forty round trips.
 *
 * The dedup is split across the two halves on purpose. Everything already stored
 * is kept unconditionally and only *incoming* ids are tested against it, so the
 * statement is the union of the two lists rather than something subtler. The
 * stored half needs no test of its own because it was deduplicated by whichever
 * statement wrote it, and an earlier draft that tested both halves against each
 * other deleted any id present in both — which is precisely the id a second
 * device re-saves. Incoming is deduplicated here in JS for the same reason, and
 * so is the very first write, which is this array verbatim.
 *
 * Throws rather than returning a boolean, for the reason lib/resend.ts throws: a
 * save that did not happen must not be treated as one that did.
 */
export async function saveDemos(
  uid: string,
  recordingIds: readonly string[]
): Promise<void> {
  const ids = Array.from(new Set(recordingIds.map(checkRecordingId)))
  if (ids.length === 0) {
    return
  }
  const incoming = JSON.stringify(ids)
  await d1Query(
    `INSERT INTO saved_demos (reader_uid, recording_ids, updated_at)
     VALUES (?, json(?), ?)
     ON CONFLICT(reader_uid) DO UPDATE SET
       recording_ids = (
         SELECT json_group_array(value) FROM (
           SELECT stored.value AS value, stored.key AS position
             FROM json_each(saved_demos.recording_ids) AS stored
           UNION ALL
           SELECT incoming.value AS value, 2147483647 + incoming.key AS position
             FROM json_each(?) AS incoming
            WHERE NOT EXISTS (
              SELECT 1 FROM json_each(saved_demos.recording_ids) AS stored
               WHERE stored.value = incoming.value)
           ORDER BY position
         )
       ),
       updated_at = excluded.updated_at`,
    [checkUid(uid), incoming, new Date().toISOString(), incoming]
  )
}

/** Save one Demo. The single-id case of saveDemos, not a second code path. */
export async function saveDemo(
  uid: string,
  recordingId: string
): Promise<void> {
  await saveDemos(uid, [recordingId])
}

/**
 * Remove one Demo from a Reader's saved Demos.
 *
 * Atomic, and a no-op on a Reader who never saved it — which matters because the
 * caller is usually reacting to a click, and a double-click must not error.
 * `ORDER BY key` is what keeps the remaining ids in the order they were saved; a
 * bare aggregate over json_each relies on an order SQLite does not promise, and
 * the bookmarks page would quietly reshuffle the day that stopped holding.
 */
export async function unsaveDemo(
  uid: string,
  recordingId: string
): Promise<void> {
  await d1Query(
    `UPDATE saved_demos SET
       recording_ids = COALESCE(
         (SELECT json_group_array(value) FROM (
            SELECT value FROM json_each(saved_demos.recording_ids)
             WHERE value <> ?
             ORDER BY key)),
         '[]'
       ),
       updated_at = ?
     WHERE reader_uid = ?`,
    [checkRecordingId(recordingId), new Date().toISOString(), checkUid(uid)]
  )
}
