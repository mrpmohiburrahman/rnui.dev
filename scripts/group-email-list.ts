/**
 * notify-and-preview ticket 03 — the 51 signup rows, grouped by what happened to
 * each one, as markdown.
 *
 * Writes TWO files, and the split is the point. This repo is public and
 * `.scratch/` is tracked, so the grouping that gets committed carries document
 * ids, domains and dates but no addresses; the one that carries addresses is
 * named `*.local.md` and is gitignored. Publishing 51 people's addresses is
 * exactly what ticket 03 exists to prevent, and it has already happened once.
 *
 * Reads Firestore the same way `scrub-email-list.ts` does — a gcloud access
 * token against the REST API — because the dropped rows are recorded only by
 * document id, so their addresses exist nowhere on disk. Read-only: no Firestore
 * write happens here, and map decision 10 keeps all 51 rows in place regardless
 * of which group they land in.
 *
 * The verdicts are not re-derived. `verdict()` and `normalise()` are imported
 * from the scrub itself, so this file cannot drift from the rules that produced
 * the counts, and the Emailable results are read from the run's own output.
 */
import { execSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { type Doc, isJunkFeedback, normalise, verdict } from "./scrub-email-list"

const PROJECT = "rnui-pixellog-d1008"
const RESEARCH = resolve(
  import.meta.dirname,
  "../.scratch/notify-and-preview/research"
)
const VERIFY = resolve(RESEARCH, "verify-2026-08-16.local.json")
const PUBLIC_OUT = resolve(RESEARCH, "email-groups-2026-08-16.md")
const PRIVATE_OUT = resolve(RESEARCH, "email-groups-2026-08-16.local.md")

function firestore(collection: string): Doc[] {
  const token = execSync("gcloud auth print-access-token", {
    encoding: "utf8",
  }).trim()
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}?pageSize=300`
  const raw = execSync(
    `curl -sS ${JSON.stringify(url)} -H ${JSON.stringify(`Authorization: Bearer ${token}`)}`,
    { encoding: "utf8", maxBuffer: 1e8 }
  )
  return JSON.parse(raw).documents ?? []
}

// Same three accessors the scrub uses. `createdAt` and `submittedAt` come back
// as `timestampValue`, not `stringValue` — reading them with the wrong one gives
// "" rather than an error, which silently unpairs every bot and reports 0.
const str = (d: Doc, k: string) => d.fields[k]?.stringValue ?? ""
const time = (d: Doc, k: string) => d.fields[k]?.timestampValue ?? ""
const docId = (d: Doc) => d.name.split("/").pop()!
const domainOf = (e: string) => e.split("@")[1] ?? ""
const day = (iso: string) => (iso || "").slice(0, 10)

type Row = {
  docId: string
  email: string
  createdAt: string
  duplicateOf: string[]
}

async function main() {
  const emails = firestore("emails")
  const feedback = firestore("userFeedback")

  // Only *junk* feedback rows pair — a genuine submission from a real person
  // sharing an address with their own signup must not mark them a bot.
  const junkByAddress = new Map<string, number[]>()
  for (const d of feedback) {
    if (!isJunkFeedback(d)) continue
    const key = normalise(str(d, "email").trim().toLowerCase())
    const stamp = time(d, "submittedAt") || d.createTime
    const at = stamp ? Date.parse(stamp) : NaN
    if (Number.isNaN(at)) {
      console.warn(`skipped junk row ${docId(d)}: no usable timestamp`)
      continue
    }
    junkByAddress.set(key, [...(junkByAddress.get(key) ?? []), at])
  }

  // Sort ascending, then first-seen wins — that makes the kept row the earliest
  // createdAt, which is the date the consent record rests on.
  const byAddress = new Map<string, Row>()
  for (const r of emails
    .map((d) => ({
      docId: docId(d),
      email: str(d, "email").trim().toLowerCase(),
      createdAt: time(d, "createdAt"),
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const key = normalise(r.email)
    const seen = byAddress.get(key)
    if (seen) seen.duplicateOf.push(r.docId)
    else byAddress.set(key, { ...r, duplicateOf: [] })
  }

  // MX is not re-queried: every domain resolved on 2026-08-14 and nothing here
  // turns on it, since no address was dropped for MX. Passing `true` keeps the
  // ladder on the two rules that actually fired, bot and role.
  const groups = { bot: [] as Row[], role: [] as Row[], survivor: [] as Row[] }
  for (const [key, row] of byAddress) {
    const v = verdict(row.email, row.createdAt, junkByAddress.get(key) ?? [], true)
    if (v.keep) groups.survivor.push(row)
    else groups[v.rule as "bot" | "role"].push(row)
  }

  const verify = existsSync(VERIFY)
    ? JSON.parse(readFileSync(VERIFY, "utf8"))
    : null
  const stateOf = new Map<string, { state: string; reason: string; score: number }>(
    (verify?.rows ?? []).map((r: { email: string; state: string; reason: string; score: number }) => [
      normalise(r.email),
      { state: r.state, reason: r.reason, score: r.score },
    ])
  )

  const collapsed = [...byAddress.values()].reduce(
    (n, r) => n + r.duplicateOf.length,
    0
  )
  const survivors = groups.survivor
  const undeliverable = survivors.filter(
    (r) => stateOf.get(normalise(r.email))?.state === "undeliverable"
  )
  const risky = survivors.filter(
    (r) => stateOf.get(normalise(r.email))?.state === "risky"
  )
  const mailable = survivors.filter(
    (r) => stateOf.get(normalise(r.email))?.state === "deliverable"
  )

  const render = (withAddresses: boolean) => {
    const id = (r: Row) =>
      withAddresses ? `\`${r.email}\`` : `\`${r.docId}\``
    const col = withAddresses ? "address" : "document id"
    const table = (rows: Row[], extra?: (r: Row) => string) =>
      [
        `| # | ${col} | ${withAddresses ? "" : "domain | "}signed up |${extra ? " verifier |" : ""}`,
        `|---|---|${withAddresses ? "" : "---|"}---|${extra ? "---|" : ""}`,
        ...rows.map(
          (r, i) =>
            `| ${i + 1} | ${id(r)} | ${withAddresses ? "" : domainOf(r.email) + " | "}${day(r.createdAt)} |${extra ? ` ${extra(r)} |` : ""}`
        ),
      ].join("\n")

    const v = (r: Row) => {
      const s = stateOf.get(normalise(r.email))
      return s ? `\`${s.state}\` ${s.reason} (${s.score})` : "—"
    }

    return `# The signup list, grouped — 51 rows, and where each one went

Generated 2026-08-16 by \`pnpm scrub:group\` (\`scripts/group-email-list.ts\`) from Firestore
\`${PROJECT}/emails\`, joined to the Emailable run recorded in ticket 03. Regenerate rather than
edit; the verdicts come from \`verdict()\` in \`scripts/scrub-email-list.ts\`, not from a copy.

${
  withAddresses
    ? "**This is the private copy.** It carries real addresses and is gitignored via the `.local.` infix. Do not commit it, do not paste from it into a ticket, and do not attach it to anything."
    : "**Addresses are deliberately absent.** This repo is public and `.scratch/` is tracked, so rows are keyed by Firestore document id. The copy with addresses is `email-groups-2026-08-16.local.md`, which is gitignored."
}

## The arithmetic

\`\`\`
51   rows in Firestore
-${String(collapsed).padEnd(2)}  duplicate rows, collapsed onto the earliest createdAt
= ${byAddress.size} unique people
-${String(groups.bot.length).padEnd(2)}  bots
-${String(groups.role.length).padEnd(2)}  role mailbox
= ${survivors.length} survivors of the scrub
-${String(undeliverable.length).padEnd(2)}  undeliverable (Emailable, 2026-08-16)
= ${survivors.length - undeliverable.length} mailable
\`\`\`

Nothing was deleted. All 51 rows stand in Firestore — map decision 10 keeps the list *cured*,
not culled, and every group below is a view over rows that still exist.

## Group 1 — mailable (${mailable.length})

Survived the scrub and came back \`deliverable\`. This is what ticket 10 sends to.

${table(mailable, v)}

## Group 2 — risky, awaiting a decision (${risky.length})

Survived the scrub, and the mailboxes exist — Yahoo answers definitively. \`low_deliverability\`
means the mailbox looks dormant, not invalid. Ticket 03 recommends keeping them and placing them
last in ticket 10's staged ramp, so a bounce lands on an already-warmed domain.

${table(risky, v)}

## Group 3 — undeliverable, dropped (${undeliverable.length})

Rejects at SMTP, so a send is a guaranteed hard bounce. Dropped without a judgement call. The one
non-free address among the flagged, on a company domain — most likely someone who left.

${table(undeliverable, v)}

## Group 4 — bots (${groups.bot.length})

Not caught by guessing from the address. Caught by pairing: each of these also filed a junk
submission on the contact form within 43 seconds of signing up, median gap 20 seconds. One of them
reads as an ordinary human name and no pattern match would ever have flagged it.

${table(groups.bot)}

## Group 5 — role mailbox (${groups.role.length})

\`dev@\` on a one-person developer domain. Dropped by the rule because consent cannot be attributed
to a shared mailbox — but on a one-person domain it may simply be that person's inbox. Reversible:
remove \`"dev"\` from \`ROLE_LOCALS\` and re-run to put it back.

${table(groups.role)}

## Group 6 — duplicate rows (${collapsed})

The same person signing up more than once. Collapsed onto the **earliest** \`createdAt\`, because
that is the timestamp the consent record rests on. The rows themselves are untouched in Firestore.

${
  [...byAddress.values()]
    .filter((r) => r.duplicateOf.length)
    .map(
      (r, i) =>
        `${i + 1}. kept ${withAddresses ? `\`${r.email}\`` : `\`${r.docId}\``} at ${day(r.createdAt)}; also filed as ${r.duplicateOf.map((d) => `\`${d}\``).join(", ")}`
    )
    .join("\n") || "_none_"
}

## Not a group, but worth knowing

Two survivors share an identical local part across \`gmail.com\` and \`proton.me\`. Two mailboxes and
two consent records, correctly kept as two — but probably one human, who would receive the Digest
twice. Left as-is: inferring identity from a local part is the kind of guess this effort has
avoided. If they are one person the real headcount is one lower than the number above.
`
  }

  writeFileSync(PUBLIC_OUT, render(false))
  writeFileSync(PRIVATE_OUT, render(true))
  console.log(`unique ${byAddress.size}  bot ${groups.bot.length}  role ${groups.role.length}  survivors ${survivors.length}`)
  console.log(`mailable ${mailable.length}  risky ${risky.length}  undeliverable ${undeliverable.length}  duplicates ${collapsed}`)
  console.log(`public  -> ${PUBLIC_OUT}`)
  console.log(`private -> ${PRIVATE_OUT}  (gitignored)`)
}

main()
