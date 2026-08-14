#!/usr/bin/env tsx
/**
 * Scrubs the production Firestore `emails` collection into a mailable list.
 * Run via: pnpm scrub:emails
 *
 * notify-and-preview ticket 03. Reads Firestore directly with a gcloud bearer
 * token, the way scripts/metrics-update.ts shells out to gh, because the client
 * SDK needs the app running and `.env.local` points at the -dev collections.
 *
 * Two things this deliberately does NOT do:
 *
 * 1. It never writes to Firestore. Map decision 10 keeps all 51 rows — they are
 *    cured and scrubbed, not deleted — and the `createdAt` on each is the only
 *    proof of opt-in that will ever exist. The scrub is a derived view.
 * 2. It never prints or commits an address. This repo is public and `.scratch/`
 *    is tracked, so the survivor list goes to a gitignored file and everything
 *    reportable is keyed by Firestore document id instead.
 */
import { execSync } from "node:child_process"
import { resolveMx } from "node:dns/promises"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const PROJECT = "rnui-pixellog-d1008"
const RESEARCH = resolve(process.cwd(), ".scratch/notify-and-preview/research")
/** Carries addresses — gitignored. */
const OUT = resolve(RESEARCH, "scrub-result.local.json")
/** Carries no addresses — committed, so the consent dates are auditable. */
const MANIFEST = resolve(RESEARCH, "scrub-survivors.json")

/**
 * RFC 2142 plus the generic mailboxes bulk verifiers treat as role accounts.
 * Consent cannot be attributed to one person behind a shared mailbox, and role
 * addresses are over-represented among spamtraps.
 */
const ROLE_LOCALS = new Set([
  "abuse",
  "admin",
  "administrator",
  "all",
  "billing",
  "careers",
  "contact",
  "dev",
  "developer",
  "everyone",
  "feedback",
  "help",
  "hello",
  "hostmaster",
  "hr",
  "info",
  "jobs",
  "legal",
  "mail",
  "marketing",
  "media",
  "noc",
  "no-reply",
  "noreply",
  "office",
  "orders",
  "postmaster",
  "press",
  "privacy",
  "root",
  "sales",
  "security",
  "service",
  "staff",
  "support",
  "sysadmin",
  "team",
  "webmaster",
  "www",
])

/**
 * A bot that filled the signup form and the contact form in one pass. Every
 * observed pair lands inside 43s; 120s is wide enough to survive clock skew and
 * still far tighter than a human doing both deliberately.
 */
const PAIR_WINDOW_MS = 120_000

type Doc = {
  name: string
  createTime?: string
  fields: Record<string, { stringValue?: string; timestampValue?: string }>
}

function firestore(collection: string): Doc[] {
  const token = execSync("gcloud auth print-access-token", {
    encoding: "utf8",
  }).trim()
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}?pageSize=300`
  const body = execSync(
    `curl -sS ${JSON.stringify(url)} -H ${JSON.stringify(`Authorization: Bearer ${token}`)}`,
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    }
  )
  const parsed = JSON.parse(body) as {
    documents?: Doc[]
    nextPageToken?: string
  }
  if (parsed.nextPageToken) {
    throw new Error(
      `${collection} paged past 300 documents — this script assumes one page`
    )
  }
  return parsed.documents ?? []
}

const id = (d: Doc) => d.name.split("/").pop()!
const str = (d: Doc, k: string) => d.fields[k]?.stringValue ?? ""
const time = (d: Doc, k: string) => d.fields[k]?.timestampValue ?? ""

/**
 * Gmail ignores dots in the local part, so the generator's dot-obfuscated
 * variants collapse onto the same underlying mailbox as their plain siblings.
 */
export function normalise(email: string): string {
  const [local, domain] = email.split("@")
  return domain === "gmail.com"
    ? `${local.replaceAll(".", "")}@${domain}`
    : email
}

/**
 * A generated string: long, unbroken by whitespace, and mixing case mid-word.
 * Real names and real feedback on this site have always had a space or been
 * short. Kept deliberately blunt — its only job is to tell a junk contact
 * submission from a real one before the timestamps are compared.
 */
export function isGeneratedString(s: string): boolean {
  return s.length >= 12 && !/\s/.test(s) && /[a-z]/.test(s) && /[A-Z]/.test(s)
}

const isJunkFeedback = (d: Doc) =>
  isGeneratedString(str(d, "message")) || isGeneratedString(str(d, "firstName"))

/**
 * The shape the bot's address generator produced: an optional leading vowel,
 * three or more consonant-vowel syllables, an optional trailing consonant, then
 * one to three digits.
 *
 * **This is not a drop rule and must not become one.** It is a second opinion on
 * the pairing below, and the only reason the bot finding rests on two
 * independent methods rather than one. Run over the real list on 2026-08-14 it
 * matched 17 of the 18 the pairing caught and nothing the pairing missed — the
 * 18th wore an ordinary human name, which is exactly why the pairing leads.
 *
 * The strict single-consonant syllable matters: relax it to admit digraphs and
 * it starts matching real people's names. Left as a check so that claim in
 * research/scrub-2026-08-14.md is reproducible instead of a one-off command.
 */
export function looksGenerated(email: string): boolean {
  const local = normalise(email).split("@")[0]
  return /^[aeiou]?(?:[bcdfghjklmnpqrstvwxyz][aeiou]){3,}[bcdfghjklmnpqrstvwxyz]?\d{1,3}$/.test(
    local
  )
}

/** In ladder order, so the summary below prints them the way they are applied. */
export const RULES = ["syntax", "mx", "bot", "role"] as const

export type Verdict =
  | { keep: true }
  | { keep: false; rule: (typeof RULES)[number]; detail: string }

/**
 * The rule ladder, in order. Bot beats role beats survivor: an address caught
 * by the contact-form pairing is dropped whatever its local part looks like,
 * which is the only thing that catches a bot wearing a plausible human name.
 */
export function verdict(
  email: string,
  createdAt: string,
  junkTimes: number[],
  hasMx: boolean
): Verdict {
  const [local, domain] = email.split("@")

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { keep: false, rule: "syntax", detail: "not a well-formed address" }
  }
  if (!hasMx) {
    return { keep: false, rule: "mx", detail: `${domain} publishes no MX` }
  }
  const paired = junkTimes.find(
    (t) => Math.abs(t - Date.parse(createdAt)) <= PAIR_WINDOW_MS
  )
  if (paired !== undefined) {
    const gap = Math.round((paired - Date.parse(createdAt)) / 1000)
    return {
      keep: false,
      rule: "bot",
      detail: `junk contact submission ${gap >= 0 ? "+" : ""}${gap}s away`,
    }
  }
  // Via normalise, so dots are folded only where gmail actually ignores them.
  // Off gmail a dot is significant and `in.fo@` is not `info@`.
  if (ROLE_LOCALS.has(normalise(email).split("@")[0])) {
    return { keep: false, rule: "role", detail: `${local}@ is a role mailbox` }
  }
  return { keep: true }
}

async function main() {
  const emails = firestore("emails")
  const feedback = firestore("userFeedback")

  // Every junk contact submission, by normalised address, with its timestamps.
  const junkByAddress = new Map<string, number[]>()
  for (const d of feedback) {
    if (!isJunkFeedback(d)) continue
    const key = normalise(str(d, "email").trim().toLowerCase())
    // createTime, not d.name — the name is a document path, and parsing it as a
    // date yields NaN, which would drop this junk row from the pairing and let
    // the bot it belongs to survive the scrub.
    const stamp = time(d, "submittedAt") || d.createTime
    const at = stamp ? Date.parse(stamp) : NaN
    if (Number.isNaN(at)) {
      console.warn(`skipped junk row ${id(d)}: no usable timestamp`)
      continue
    }
    junkByAddress.set(key, [...(junkByAddress.get(key) ?? []), at])
  }

  // Collapse duplicates onto the earliest createdAt — that is the consent date.
  type Row = {
    docId: string
    email: string
    createdAt: string
    duplicateOf: string[]
  }
  const byAddress = new Map<string, Row>()
  const rows = emails
    .map((d) => ({
      docId: id(d),
      email: str(d, "email").trim().toLowerCase(),
      createdAt: time(d, "createdAt"),
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  for (const r of rows) {
    const key = normalise(r.email)
    const seen = byAddress.get(key)
    if (seen) seen.duplicateOf.push(r.docId)
    else byAddress.set(key, { ...r, duplicateOf: [] })
  }

  // MX once per domain, not once per address.
  const domains = [
    ...new Set([...byAddress.values()].map((r) => r.email.split("@")[1])),
  ]
  const mx = new Map<string, boolean>()
  await Promise.all(
    domains.map(async (d) => {
      try {
        mx.set(d, (await resolveMx(d)).length > 0)
      } catch {
        mx.set(d, false)
      }
    })
  )

  const survivors: Row[] = []
  const dropped: {
    docId: string
    rule: (typeof RULES)[number]
    detail: string
  }[] = []

  for (const [key, row] of byAddress) {
    const v = verdict(
      row.email,
      row.createdAt,
      junkByAddress.get(key) ?? [],
      mx.get(row.email.split("@")[1]) ?? false
    )
    if (v.keep) survivors.push(row)
    else dropped.push({ docId: row.docId, rule: v.rule, detail: v.detail })
  }

  const collapsed = [...byAddress.values()].reduce(
    (n, r) => n + r.duplicateOf.length,
    0
  )

  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        generatedFrom: `firestore ${PROJECT}/emails`,
        rows: emails.length,
        unique: byAddress.size,
        survivors: survivors.length,
        verified: false, // ticket 03 bullet 5 — a paid bulk verifier has not run yet
        list: survivors.map((r) => ({
          email: r.email,
          createdAt: r.createdAt,
          docId: r.docId,
        })),
      },
      null,
      2
    )}\n`
  )

  // The same 29, minus the addresses, so the consent dates ticket 03 bullet 7
  // turns on are auditable in the repo. A Firestore document id identifies
  // nobody outside the project; rejoin it to an address there if you need one.
  writeFileSync(
    MANIFEST,
    `${JSON.stringify(
      {
        note: "Consent dates for the surviving list. Addresses deliberately absent — this file is committed to a public repo. Rejoin docId against Firestore emails/ for the address.",
        survivors: survivors.length,
        verified: false,
        consent: survivors
          .map((r) => ({ docId: r.docId, createdAt: r.createdAt }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      },
      null,
      2
    )}\n`
  )

  console.log(`rows                 ${emails.length}`)
  console.log(
    `unique               ${byAddress.size}  (${collapsed} duplicate rows collapsed)`
  )
  for (const rule of RULES) {
    const hits = dropped.filter((d) => d.rule === rule)
    if (hits.length) console.log(`dropped: ${rule.padEnd(12)}${hits.length}`)
  }
  console.log(`survivors            ${survivors.length}`)

  // The second opinion. `missed` is the number that matters: an address wearing
  // the generator's shape that no junk submission paired with is a bot the
  // pairing cannot see, and every one is a reason to distrust the count.
  const bots = dropped.filter((d) => d.rule === "bot")
  const corroborated = [...byAddress.values()].filter(
    (r) => looksGenerated(r.email) && bots.some((b) => b.docId === r.docId)
  ).length
  const missed = survivors.filter((r) => looksGenerated(r.email)).length
  console.log(
    `\nsignature check      ${corroborated}/${bots.length} of the bot drops match the generator shape` +
      `\n                     ${missed} survivor(s) match it without a pairing`
  )

  console.log(`\nwrote ${OUT} (gitignored)`)
  console.log(`wrote ${MANIFEST} (committed, no addresses)\n`)
  console.log("disposition by document id:")
  for (const d of dropped.sort((a, b) => a.rule.localeCompare(b.rule))) {
    console.log(`  ${d.docId}  ${d.rule.padEnd(7)} ${d.detail}`)
  }
}

// Only when run as a script — tests/scrub-email-list.test.ts imports the pure
// rules above and must not touch Firestore doing it.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
