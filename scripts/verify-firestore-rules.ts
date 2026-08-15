#!/usr/bin/env tsx
/**
 * Runs firestore.rules against Firebase's own rules engine and asserts what each
 * request should do. Run via: pnpm rules:verify
 *
 * notify-and-preview ticket 06. These rules are the only thing standing between
 * a public repo and 29 real people's email addresses, so they get a test suite
 * rather than a careful read.
 *
 * The case that matters most is the first one. Legacy signup records carry no
 * `confirmed` field, and 29 of their document ids are PUBLISHED — they sit in
 * .scratch/notify-and-preview/research/scrub-survivors.json, in a public repo,
 * under a note that reads "Rejoin docId against Firestore emails/ for the
 * address". So an unconditional `allow get` on this collection is a data breach,
 * and `get('confirmed', true)` defaulting those records to "not pending" is what
 * prevents it. If someone ever loosens that, this file fails.
 *
 * Uses `projects/{p}:test`, which evaluates a ruleset WITHOUT deploying it, so
 * this is safe to run against the live project and is worth running BEFORE
 * `firebase deploy --only firestore:rules`.
 *
 * Auth: a gcloud user token. `gcloud auth login` if this errors.
 */
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const PROJECT = "rnui-pixellog-d1008"
const T = "2026-08-15T02:00:00Z"
const D = (p: string) => `/databases/(default)/documents${p}`

/** A pre-ticket-06 record: no `confirmed` key, and its document id is public. */
const LEGACY = { email: "legacy@example.com", createdAt: T }
const PENDING = {
  email: "someone@example.com",
  createdAt: T,
  confirmed: false,
  consentText: "c",
  formVersion: "v",
  ip: "1.2.3.4",
}
const CONFIRMED = { ...PENDING, confirmed: true, confirmedAt: T }

type Method = "get" | "list" | "create" | "update" | "delete"
type Case = {
  name: string
  expectation: "ALLOW" | "DENY"
  method: Method
  path: string
  /** The incoming document, for writes. */
  incoming?: Record<string, unknown>
  /** The document already in storage, if any. */
  existing?: Record<string, unknown>
}

const CASES: Case[] = [
  // --- the breach case, and its twin on the dev collection ---
  {
    name: "legacy get by PUBLISHED docId is denied",
    expectation: "DENY",
    method: "get",
    path: D("/emails/8hHysd66IHGnJF6MpjSD"),
    existing: LEGACY,
  },
  {
    name: "legacy get on emails-dev is denied",
    expectation: "DENY",
    method: "get",
    path: D("/emails-dev/8hHysd66IHGnJF6MpjSD"),
    existing: LEGACY,
  },

  // --- the flow double opt-in actually needs ---
  {
    name: "pending get is allowed",
    expectation: "ALLOW",
    method: "get",
    path: D("/emails/tok-1"),
    existing: PENDING,
  },
  {
    name: "pending get on emails-dev is allowed",
    expectation: "ALLOW",
    method: "get",
    path: D("/emails-dev/tok-1"),
    existing: PENDING,
  },
  {
    name: "creating a pending signup is allowed",
    expectation: "ALLOW",
    method: "create",
    path: D("/emails/tok-1"),
    incoming: PENDING,
  },
  {
    name: "creating a pending signup on emails-dev is allowed",
    expectation: "ALLOW",
    method: "create",
    path: D("/emails-dev/tok-1"),
    incoming: PENDING,
  },
  {
    name: "the confirmation flip is allowed",
    expectation: "ALLOW",
    method: "update",
    path: D("/emails/tok-1"),
    existing: PENDING,
    incoming: CONFIRMED,
  },

  // --- forged consent evidence ---
  {
    name: "planting an already-confirmed record is denied",
    expectation: "DENY",
    method: "create",
    path: D("/emails/evil"),
    incoming: CONFIRMED,
  },
  {
    name: "creating a record with no confirmed field is denied",
    expectation: "DENY",
    method: "create",
    path: D("/emails/evil"),
    incoming: LEGACY,
  },

  // --- replay ---
  {
    name: "a spent link can no longer read the record",
    expectation: "DENY",
    method: "get",
    path: D("/emails/tok-1"),
    existing: CONFIRMED,
  },
  {
    name: "re-confirming a confirmed record is denied",
    expectation: "DENY",
    method: "update",
    path: D("/emails/tok-1"),
    existing: CONFIRMED,
    incoming: CONFIRMED,
  },

  // --- enumeration: the whole reason the token is a document id ---
  {
    name: "listing emails is denied",
    expectation: "DENY",
    method: "list",
    path: D("/emails/tok-1"),
    existing: PENDING,
  },
  {
    name: "listing emails-dev is denied",
    expectation: "DENY",
    method: "list",
    path: D("/emails-dev/tok-1"),
    existing: PENDING,
  },

  // --- tampering with the consent record ---
  {
    name: "changing the address while confirming is denied",
    expectation: "DENY",
    method: "update",
    path: D("/emails/tok-1"),
    existing: PENDING,
    incoming: {
      ...PENDING,
      email: "attacker@evil.com",
      confirmed: true,
      confirmedAt: T,
    },
  },
  {
    name: "changing consentText while confirming is denied",
    expectation: "DENY",
    method: "update",
    path: D("/emails/tok-1"),
    existing: PENDING,
    incoming: {
      ...PENDING,
      consentText: "forged",
      confirmed: true,
      confirmedAt: T,
    },
  },
  {
    name: "confirming a legacy record is denied",
    expectation: "DENY",
    method: "update",
    path: D("/emails/8hHysd66IHGnJF6MpjSD"),
    existing: LEGACY,
    incoming: { ...LEGACY, confirmed: true, confirmedAt: T },
  },
  {
    name: "un-confirming is denied",
    expectation: "DENY",
    method: "update",
    path: D("/emails/tok-1"),
    existing: CONFIRMED,
    incoming: { ...CONFIRMED, confirmed: false },
  },
  {
    name: "confirming without a confirmedAt is denied",
    expectation: "DENY",
    method: "update",
    path: D("/emails/tok-1"),
    existing: PENDING,
    incoming: { ...PENDING, confirmed: true },
  },
  {
    name: "deleting a signup is denied",
    expectation: "DENY",
    method: "delete",
    path: D("/emails/tok-1"),
    existing: PENDING,
  },

  // --- regression: this project is SHARED with an unrelated car-seats app, and
  //     the counters are read and written from the browser on every page view ---
  {
    name: "rnui get still allowed",
    expectation: "ALLOW",
    method: "get",
    path: D("/rnui/abc"),
    existing: { view_count: 1 },
  },
  {
    name: "rnui update still allowed",
    expectation: "ALLOW",
    method: "update",
    path: D("/rnui/abc"),
    existing: { view_count: 1 },
    incoming: { view_count: 2 },
  },
  {
    name: "rnui create still allowed",
    expectation: "ALLOW",
    method: "create",
    path: D("/rnui/abc"),
    incoming: { view_count: 1 },
  },
  {
    name: "rnui delete still denied",
    expectation: "DENY",
    method: "delete",
    path: D("/rnui/abc"),
    existing: { view_count: 1 },
  },
  {
    name: "rnui-dev get still allowed",
    expectation: "ALLOW",
    method: "get",
    path: D("/rnui-dev/abc"),
    existing: { view_count: 1 },
  },
  {
    name: "car-seats get still allowed",
    expectation: "ALLOW",
    method: "get",
    path: D("/car-seats/abc"),
    existing: { x: 1 },
  },
  {
    name: "car-seats update still allowed",
    expectation: "ALLOW",
    method: "update",
    path: D("/car-seats/abc"),
    existing: { x: 1 },
    incoming: { x: 2 },
  },
  {
    name: "car-seats-emails get still denied",
    expectation: "DENY",
    method: "get",
    path: D("/car-seats-emails/abc"),
    existing: LEGACY,
  },
  {
    name: "car-seats-emails create still allowed",
    expectation: "ALLOW",
    method: "create",
    path: D("/car-seats-emails/abc"),
    incoming: LEGACY,
  },
  {
    name: "car-seats-emails-dev create still allowed",
    expectation: "ALLOW",
    method: "create",
    path: D("/car-seats-emails-dev/abc"),
    incoming: LEGACY,
  },
  {
    name: "userFeedback get still denied",
    expectation: "DENY",
    method: "get",
    path: D("/userFeedback/abc"),
    existing: { firstName: "a" },
  },
]

async function main() {
  const source = readFileSync("firestore.rules", "utf8")
  const token = execFileSync("gcloud", ["auth", "print-access-token"], {
    encoding: "utf8",
  }).trim()

  const body = {
    source: { files: [{ name: "firestore.rules", content: source }] },
    testSuite: {
      testCases: CASES.map((c) => ({
        expectation: c.expectation,
        request: {
          auth: null,
          time: T,
          method: c.method,
          path: c.path,
          ...(c.incoming ? { resource: { data: c.incoming } } : {}),
        },
        ...(c.existing ? { resource: { data: c.existing } } : {}),
        expressionReportLevel: "NONE",
      })),
    },
  }

  const res = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT}:test`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "x-goog-user-project": PROJECT,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
  const out = (await res.json()) as {
    error?: unknown
    issues?: {
      severity: string
      description: string
      sourcePosition?: { line: number }
    }[]
    testResults?: { state: string }[]
  }

  if (out.error) {
    throw new Error(`rules test API failed: ${JSON.stringify(out.error)}`)
  }
  for (const issue of out.issues ?? []) {
    console.error(
      `COMPILE ${issue.severity} line ${issue.sourcePosition?.line}: ${issue.description}`
    )
  }

  let failed = 0
  ;(out.testResults ?? []).forEach((result, i) => {
    const ok = result.state === "SUCCESS"
    if (!ok) failed++
    console.log(`${ok ? "  ok  " : "FAIL  "} ${CASES[i].name}`)
  })

  const issuesFatal = (out.issues ?? []).some((i) => i.severity === "ERROR")
  console.log(`\n${CASES.length - failed}/${CASES.length} passed`)
  if (failed || issuesFatal) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
