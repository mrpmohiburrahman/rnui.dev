import { formatDigestDate, SIGNUP_DATE_FALLBACK } from "./digest"

export const DIGEST_DAILY_CAP = 100

export const GENERAL_AUDIENCE_ID = "958d64ec-630e-40ba-9cc7-3a9a9e64fedb"

export const YAHOO_LAST_DOC_IDS = [
  "duKc4YA4EuS4EGyoAysq",
  "IC7ykrHB9bnXjbZzMzVJ",
] as const

export const DROPPED_DOC_IDS = ["C9vQTJfUlhpw6uveV65w"] as const

const DIGEST_DATE = /^\d{1,2} [A-Z][a-z]+ \d{4}$/

export function refuseSignupDateProperty(
  value: string | null | undefined
): string | null {
  if (!value || value === SIGNUP_DATE_FALLBACK) return "signup_date is missing"
  if (!DIGEST_DATE.test(value)) return "signup_date is not a Digest date"
  return null
}

export type DigestStageName =
  | "maintainer"
  | "five"
  | "ten"
  | "remainder"
  | "yahoo"

export type DigestStage = {
  name: DigestStageName
  docIds: string[]
}

export type StageOutcome = {
  sentAt: string
  hardBounces: number
  complaints: number
  hardBouncesRemoved: boolean
}

function unique(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function chunks(ids: readonly string[], size: number): string[][] {
  const out: string[][] = []
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size))
  return out
}

export function planDigestStages(input: {
  deliverableDocIds: readonly string[]
  yahooDocIds: readonly string[]
  droppedDocIds?: readonly string[]
}): DigestStage[] {
  const dropped = new Set(input.droppedDocIds ?? [])
  const yahoo = new Set(input.yahooDocIds)
  const deliverable = unique(input.deliverableDocIds).filter(
    (id) => !yahoo.has(id) && !dropped.has(id)
  )
  const yahooIds = unique(input.yahooDocIds).filter((id) => !dropped.has(id))
  if (yahooIds.length > DIGEST_DAILY_CAP) {
    throw new Error("the yahoo stage exceeds the daily cap")
  }

  const stages: DigestStage[] = [{ name: "maintainer", docIds: [] }]
  const five = deliverable.splice(0, 5)
  if (five.length > 0) stages.push({ name: "five", docIds: five })
  const ten = deliverable.splice(0, 10)
  if (ten.length > 0) stages.push({ name: "ten", docIds: ten })
  for (const part of chunks(deliverable, DIGEST_DAILY_CAP)) {
    stages.push({ name: "remainder", docIds: part })
  }
  if (yahooIds.length > 0) stages.push({ name: "yahoo", docIds: yahooIds })
  return stages
}

function utcDay(value: Date): string {
  return value.toISOString().slice(0, 10)
}

const DAY_MS = 24 * 60 * 60 * 1000

export function refuseNextStage(
  previous: StageOutcome | null,
  now: Date
): string | null {
  if (previous === null) return null
  if (previous.complaints > 0) return "a complaint stops the sequence"
  if (previous.hardBounces > 0 && !previous.hardBouncesRemoved) {
    return "hard bounces must be removed before the next stage"
  }
  const sent = new Date(previous.sentAt)
  if (Number.isNaN(sent.getTime())) {
    return "the previous stage has no send time"
  }
  if (utcDay(sent) === utcDay(now) || now.getTime() < sent.getTime() + DAY_MS) {
    return "the next stage waits until the next UTC day"
  }
  return null
}

export function refuseBroadcastTarget(input: {
  segmentId: string
  audienceId?: string
}): string | null {
  if (input.audienceId) return "a Digest stage never targets an audience"
  if (!input.segmentId || input.segmentId === GENERAL_AUDIENCE_ID) {
    return "a Digest stage needs its own segment"
  }
  return null
}

export function unsubscribeUrlFromHtml(html: string): string {
  const match = html.match(/<a href="([^"]+)">Unsubscribe<\/a>/)
  if (!match) throw new Error("the Digest has no unsubscribe link")
  const href = match[1].split("&" + "amp;").join("&")
  if (href.includes("{{")) {
    throw new Error("the unsubscribe link is still a token")
  }
  if (!href.startsWith("https://")) {
    throw new Error("the unsubscribe link is not an https URL")
  }
  return href
}

export function refuseRepeatStage(
  sent: readonly { name: string }[],
  stage: string
): string | null {
  if (sent.some((row) => row.name === stage)) {
    return "this stage was already sent"
  }
  return null
}

export type StageContactRow = {
  docId: string
  email: string
  signupDate: string
}

/**
 * Reads a send log's text, and refuses to guess when it cannot.
 *
 * `null` means the file is not there, and comes back as `absent` rather than as an
 * empty log — the difference is load-bearing. A log that exists but will not parse
 * **throws**, because the old behaviour of returning `{stages: []}` reads as
 * "nothing has ever been sent" and silently disables every gate in
 * `refuseNextStage`: the 24 hour wait, the repeat refusal and the complaint stop all
 * key off the previous row. That fail-open cost a real send on 2026-10-22, when the
 * five stage mailed an hour after the maintainer stage because the log it should
 * have gated on was not in the tree the script ran from.
 */
export function parseSendLog<T>(
  raw: string | null
): { stages: T[]; absent: boolean } {
  if (raw === null) return { stages: [], absent: true }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(
      `the send log is not JSON, so no stage may send: ${(err as Error).message}`
    )
  }
  const stages = (parsed as { stages?: unknown } | null)?.stages
  if (!Array.isArray(stages)) {
    throw new Error("the send log has no stages array, so no stage may send")
  }
  return { stages: stages as T[], absent: false }
}

/**
 * Refuses a survivor stage that has no log to gate on.
 *
 * The maintainer stage is the one send that legitimately has no history: it is the
 * bootstrap, and it goes to one person who runs the project. Every later stage mails
 * strangers, and its whole safety case is the row before it — so an absent log is a
 * reason to stop, not a reason to start.
 */
export function refuseUnloggedStage(
  name: string,
  absent: boolean
): string | null {
  if (!absent || name === "maintainer") return null
  return `no send log exists, so the ${name} stage has no history to gate on`
}

/**
 * Joins one stage's docIds to an address and a consent date, and formats the date
 * the way the broadcast's merge tag reads it.
 *
 * The addresses live in a gitignored file and the consent dates in a committed
 * one, so this is the only place the two meet. Every refusal names the docId: a
 * stage that cannot be built completely must not send partially, and whoever reads
 * the error has to know which consent row to fix.
 */
export function stageContactRows(input: {
  docIds: readonly string[]
  consent: readonly { docId: string; createdAt: string }[]
  addresses: Readonly<Record<string, string>>
}): StageContactRow[] {
  const consentByDocId = new Map(
    input.consent.map((row) => [row.docId, row.createdAt])
  )
  return input.docIds.map((docId) => {
    const email = input.addresses[docId]
    if (!email) throw new Error(`no address for ${docId}`)
    const createdAt = consentByDocId.get(docId)
    if (!createdAt) throw new Error(`no consent date for ${docId}`)
    const signupDate = formatDigestDate(createdAt)
    const refusal = refuseSignupDateProperty(signupDate)
    if (refusal) throw new Error(`${docId}: ${refusal}`)
    return { docId, email, signupDate }
  })
}
