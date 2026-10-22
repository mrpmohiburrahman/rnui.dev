import { formatDigestDate, SIGNUP_DATE_FALLBACK } from "./digest"

export const DIGEST_DAILY_CAP = 100

export const GENERAL_AUDIENCE_ID = "958d64ec-630e-40ba-9cc7-3a9a9e64fedb"

export const RECORDED_SENDS = [
  {
    name: "maintainer",
    broadcastId: "0ba0dd5c-b85d-44f4-8f54-07e102aee1af",
  },
  {
    name: "five",
    broadcastId: "e6b9c9f5-f238-41d4-9ee6-eccec98e797b",
  },
] as const

function hasBroadcast(stages: readonly unknown[], broadcastId: string): boolean {
  return stages.some(
    (row) =>
      !!row &&
      typeof row === "object" &&
      (row as { broadcastId?: unknown }).broadcastId === broadcastId
  )
}

export function refuseRecordedSend(
  stages: readonly unknown[],
  name: string
): string | null {
  const recorded = RECORDED_SENDS.find((row) => row.name === name)
  if (!recorded) return null
  if (hasBroadcast(stages, recorded.broadcastId)) {
    return "this stage was already sent"
  }
  return (
    `the ${name} stage already has broadcast ${recorded.broadcastId}. ` +
    `This send log does not record that broadcast, so the ${name} stage cannot send again`
  )
}

export function refuseAbsentRecordedHistory(
  stages: readonly unknown[],
  name: string
): string | null {
  if (name === "maintainer") return null
  for (const recorded of RECORDED_SENDS) {
    if (recorded.name === name) continue
    if (!hasBroadcast(stages, recorded.broadcastId)) {
      return (
        `the send log has no row for the ${recorded.name} broadcast ` +
        `${recorded.broadcastId}, so the ${name} stage cannot send`
      )
    }
  }
  return null
}

export function copiesForStage<T extends { to: readonly string[] }>(
  stageName: string,
  copies: readonly T[],
  maintainerEmail: string
): T[] {
  if (stageName === "maintainer") return [...copies]
  const key = maintainerEmail.toLowerCase()
  return copies.filter(
    (copy) => !copy.to.some((addr) => addr.toLowerCase() === key)
  )
}

export function bounceIsRemoved(input: {
  contactFound: boolean
  deleted: boolean
  confirmedAbsent: boolean
}): boolean {
  if (input.contactFound) return input.deleted
  return input.confirmedAbsent
}

export function missingRecipients(
  wanted: readonly string[],
  found: readonly string[]
): string[] {
  const got = new Set(found.map((email) => email.toLowerCase()))
  return wanted.filter((email) => !got.has(email.toLowerCase()))
}

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
  missing?: number
  missingAcknowledged?: boolean
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

function hasCompleteOutcomeCounts(row: Partial<StageOutcome>): boolean {
  return (
    typeof row.hardBounces === "number" &&
    Number.isInteger(row.hardBounces) &&
    row.hardBounces >= 0 &&
    typeof row.complaints === "number" &&
    Number.isInteger(row.complaints) &&
    row.complaints >= 0 &&
    typeof row.hardBouncesRemoved === "boolean"
  )
}

function isCompleteStageRow(row: unknown): row is StageOutcome & { name?: string } {
  if (!row || typeof row !== "object") return false
  const candidate = row as Record<string, unknown>
  if ("pending" in candidate) return false
  if (
    "name" in candidate &&
    (typeof candidate.name !== "string" || candidate.name.trim().length === 0)
  ) {
    return false
  }
  if (typeof candidate.sentAt !== "string") return false
  if (Number.isNaN(new Date(candidate.sentAt).getTime())) return false
  if (!hasCompleteOutcomeCounts(candidate as Partial<StageOutcome>)) return false
  if (
    "lastEvent" in candidate &&
    (typeof candidate.lastEvent !== "string" ||
      candidate.lastEvent.trim().length === 0)
  ) {
    return false
  }
  if (
    candidate.name === "maintainer" &&
    "unsubscribeExercised" in candidate &&
    candidate.unsubscribeExercised !== true
  ) {
    return false
  }
  return true
}

/**
 * A stage whose broadcast went out but whose fan-out counts were never read.
 *
 * The script writes this row the moment the send call returns, so a timeout or a
 * crash while it waits for the fan-out still leaves a record. That record blocks a
 * second send of the same stage and every later stage, and `--collect` turns it into
 * a complete row. It carries no counts, because zeros it did not measure would read
 * as a clean stage.
 */
export type PendingStageRow = {
  name: string
  sentAt: string
  broadcastId: string
  segmentId: string
  recipients: string[]
  pending: true
}

export function isPendingStageRow(row: unknown): row is PendingStageRow {
  if (!row || typeof row !== "object") return false
  const candidate = row as Record<string, unknown>
  return (
    candidate.pending === true &&
    Array.isArray(candidate.recipients) &&
    candidate.recipients.length > 0 &&
    candidate.recipients.every(
      (email) => typeof email === "string" && email.includes("@")
    ) &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.sentAt === "string" &&
    !Number.isNaN(new Date(candidate.sentAt).getTime()) &&
    typeof candidate.broadcastId === "string" &&
    candidate.broadcastId.length > 0 &&
    typeof candidate.segmentId === "string" &&
    candidate.segmentId.length > 0
  )
}

function collectInstruction(row: PendingStageRow): string {
  return (
    `the ${row.name} stage has no recorded counts: ` +
    `run --stage ${row.name} --collect`
  )
}

type LoggedStage = (Partial<StageOutcome> & { name?: string }) | PendingStageRow

export function refuseNextStage(
  previous: LoggedStage | null,
  now: Date
): string | null {
  if (previous === null) return null
  if (isPendingStageRow(previous)) return collectInstruction(previous)
  if (typeof previous.complaints === "number" && previous.complaints > 0) {
    return "a complaint stops the sequence"
  }
  if (!isCompleteStageRow(previous)) {
    return "the previous stage row is incomplete: it needs a send time and bounce and complaint counts"
  }
  if (previous.hardBounces > 0 && !previous.hardBouncesRemoved) {
    return "hard bounces must be removed before the next stage"
  }
  if (
    typeof previous.missing === "number" &&
    previous.missing > 0 &&
    previous.missingAcknowledged !== true
  ) {
    const stageName =
      "name" in previous && typeof previous.name === "string"
        ? previous.name
        : "previous"
    return (
      `the ${stageName} stage has ${previous.missing} recipients with no copy. ` +
      `Run --stage ${stageName} --collect --accept-missing after you check them`
    )
  }
  const sent = new Date(previous.sentAt)
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

export function refuseStageOrder(
  logged: readonly unknown[],
  planned: readonly string[],
  stage: string
): string | null {
  const expected = planned[logged.length]
  if (expected === undefined) return "every planned stage is already in the send log"
  if (stage !== expected) return `the next stage is ${expected}, not ${stage}`
  return null
}

export type MeasuredOutcome = {
  hardBounces: number
  complaints: number
  events: Record<string, number>
  lastEvent: string
}

/**
 * Counts one stage's copies by their latest Resend event. Refuses an empty list,
 * because a stage with no copies has no counts to record.
 */
export function stageOutcomeFromEvents(
  lastEvents: readonly string[]
): MeasuredOutcome {
  if (lastEvents.length === 0) {
    throw new Error("the stage has no copies, so it has no counts")
  }
  const events: Record<string, number> = {}
  for (const event of lastEvents) events[event] = (events[event] ?? 0) + 1
  const kinds = Object.keys(events)
  return {
    hardBounces: events.bounced ?? 0,
    complaints: events.complained ?? 0,
    events,
    lastEvent: kinds.length === 1 ? kinds[0] : "mixed",
  }
}

/**
 * Merges counts read again from Resend into the stored counts. A count never goes
 * down: `last_event` keeps only the latest event, so a later event can hide a
 * complaint or a bounce that the stored row already recorded.
 */
export function mergeRefreshedOutcome(
  stored: Pick<StageOutcome, "hardBounces" | "complaints">,
  measured: Pick<MeasuredOutcome, "hardBounces" | "complaints">
): Pick<StageOutcome, "hardBounces" | "complaints"> {
  return {
    hardBounces: Math.max(stored.hardBounces, measured.hardBounces),
    complaints: Math.max(stored.complaints, measured.complaints),
  }
}

/** A complaint on any stage stops the sequence, not only on the last stage. */
export function refuseAnyComplaint(
  stages: readonly unknown[]
): string | null {
  for (const row of stages) {
    if (!isCompleteStageRow(row)) continue
    if (row.complaints > 0) {
      return `a complaint on the ${row.name ?? "earlier"} stage stops the sequence`
    }
  }
  return null
}

/** Resend keeps email data for 30 days, so older counts cannot be read again. */
export const EMAIL_RETENTION_DAYS = 30

export function countsExpired(sentAt: string, now: Date): boolean {
  return (
    now.getTime() - new Date(sentAt).getTime() >
    EMAIL_RETENTION_DAYS * DAY_MS
  )
}

export type PendingDecision =
  | { action: "drop" }
  | { action: "collect" }
  | { action: "refuse"; reason: string }

const SENDING_STATUSES = new Set(["queued", "sending", "sent"])

/**
 * Decides what a collect does with a pending row. A draft with no sent copy, 10
 * minutes after the send, is a broadcast that never went out, so its row can go. A draft with a sent copy is a
 * send that Resend has not finished reporting, so the collect waits for it.
 */
export const DRAFT_SETTLE_MS = 10 * 60 * 1000

export function decideUnsentPending(
  status: string,
  copiesFound: number,
  ageMs: number
): PendingDecision {
  if (status === "draft") {
    if (copiesFound > 0) return { action: "collect" }
    if (ageMs < DRAFT_SETTLE_MS) {
      return {
        action: "refuse",
        reason:
          "the broadcast still reads as a draft less than 10 minutes after the send, so run --collect again later",
      }
    }
    return { action: "drop" }
  }
  if (SENDING_STATUSES.has(status)) return { action: "collect" }
  return {
    action: "refuse",
    reason: `the broadcast status is ${status}, so a person must check it in Resend`,
  }
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
 *
 * Only the last row may be a `PendingStageRow`. Any other row without counts throws.
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
      `the send log is not JSON, so no stage can send: ${(err as Error).message}`
    )
  }
  const stages = (parsed as { stages?: unknown } | null)?.stages
  if (!Array.isArray(stages)) {
    throw new Error("the send log has no stages array, so no stage can send")
  }
  if (stages.length === 0) {
    throw new Error(
      "the send log has no recorded stages, so no stage can send"
    )
  }
  stages.forEach((row, index) => {
    if (isPendingStageRow(row)) {
      if (index !== stages.length - 1) {
        throw new Error(
          `the send log has a pending ${row.name} row before a later stage, so no stage can send`
        )
      }
      return
    }
    if (
      !isCompleteStageRow(row) ||
      typeof (row as { name?: unknown }).name !== "string"
    ) {
      const complaints = (row as { complaints?: unknown } | null)?.complaints
      if (typeof complaints === "number" && complaints > 0) {
        throw new Error("a complaint stops the sequence")
      }
      throw new Error(
        "the send log has an incomplete stage row without bounce or complaint counts, so no stage can send"
      )
    }
  })
  return { stages: stages as T[], absent: false }
}

export function refuseCollect(
  stages: readonly unknown[],
  name: string
): string | null {
  const last = stages.at(-1)
  if (!isPendingStageRow(last)) {
    return "the last stage in the send log is not pending, so there is nothing to collect"
  }
  if (last.name !== name) {
    return `the pending stage is ${last.name}, not ${name}`
  }
  return null
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
  absent: boolean,
  previous?: LoggedStage | null
): string | null {
  if (isPendingStageRow(previous)) return collectInstruction(previous)
  if (name === "maintainer") {
    if (previous !== undefined && previous !== null && !isCompleteStageRow(previous)) {
      return "the previous stage row in the send log is incomplete"
    }
    return null
  }
  if (absent) {
    return `no send log exists, so the ${name} stage has no history to gate on`
  }
  if (!previous) {
    return `the send log has no history for the ${name} stage to gate on`
  }
  if (!isCompleteStageRow(previous)) {
    return `the previous stage row for the ${name} stage is incomplete`
  }
  return null
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
