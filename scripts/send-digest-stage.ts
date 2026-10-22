#!/usr/bin/env tsx
/**
 * Sends one Digest stage. Run via: pnpm digest:stage -- --stage maintainer --send
 *
 * notify-and-preview ticket 10. Without a flag it prints the stage sizes and
 * stops. --prepare builds a stage's segment, --send mails it, and --collect records
 * the counts of a stage whose send went out but whose fan-out wait did not finish.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { pathToFileURL } from "node:url"

import {
  renderBroadcastDigest,
  renderMaintainerDigest,
  UNSUBSCRIBE_TOKEN,
} from "../lib/digest"
import {
  countsExpired,
  decideUnsentPending,
  DROPPED_DOC_IDS,
  isPendingStageRow,
  mergeRefreshedOutcome,
  parseSendLog,
  planDigestStages,
  refuseBroadcastTarget,
  refuseCollect,
  refuseNextStage,
  refuseAnyComplaint,
  refuseRepeatStage,
  refuseSignupDateProperty,
  refuseStageOrder,
  refuseUnloggedStage,
  stageContactRows,
  stageOutcomeFromEvents,
  unsubscribeUrlFromHtml,
  YAHOO_LAST_DOC_IDS,
  type DigestStage,
  type PendingStageRow,
  type StageContactRow,
  type StageOutcome,
} from "../lib/digest-stages"
import {
  ensureContactWithProperties,
  getContactByEmail,
  resendRequest,
  type ContactPage,
} from "../lib/resend"
import { FROM, REPLY_TO } from "../lib/sender-identity"
import { refuseSendReason } from "./resend-broadcast"

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file)
  } catch {
    // optional
  }
}

const SURVIVORS = ".scratch/notify-and-preview/research/scrub-survivors.json"
const ADDRESSES =
  ".scratch/notify-and-preview/research/survivor-addresses.local.json"
const LOG = ".scratch/notify-and-preview/research/digest-stages.local.json"
const MAINTAINER = "mrpmohiburrahman@gmail.com"
const SEGMENT_NAME = "digest-stage-maintainer"
/**
 * One segment, rebuilt per stage.
 *
 * The free plan caps segments at three — measured 2026-10-22, a fourth
 * `POST /segments` answers 400 `Your plan includes 3 segments. Upgrade to add
 * more.` With `General` and `digest-stage-maintainer` already holding two slots,
 * every surviving stage shares this one. Who got which broadcast stays recoverable
 * from the fan-out email ids this script logs, not from the segment.
 */
const STAGE_SEGMENT = "digest-stage"

type StageLog = StageOutcome & {
  name: string
  broadcastId: string
  emailId: string | null
  segmentId: string
  lastEvent: string | null
  unsubscribeExercised: boolean
  /** The whole fan-out. A stage that mails one person leaves this unset. */
  emailIds?: string[]
  /** Resend's own event tally, so an unexpected event stays visible. */
  events?: Record<string, number>
}

type LogFile = { stages: (StageLog | PendingStageRow)[]; absent: boolean }

type ListedContact = {
  id: string
  email: string
  unsubscribed: boolean
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

/**
 * Reads the send log through `parseSendLog`, so a log that exists but will not parse
 * throws instead of reading as empty. Only a genuinely absent file comes back as
 * `absent`, and `refuseUnloggedStage` decides what that may and may not do.
 */
function readLog(): LogFile {
  let raw: string | null = null
  try {
    raw = readFileSync(LOG, "utf8")
  } catch (err) {
    if ((err as { code?: string }).code !== "ENOENT") {
      throw new Error(
        `cannot read the send log at ${LOG}: ${(err as Error).message}`
      )
    }
  }
  return parseSendLog<StageLog | PendingStageRow>(raw)
}

/**
 * Writes the history only. `absent` describes the read that produced this object,
 * not the record, so it never reaches the file. The write goes to a temporary file
 * and is then renamed, so a crash cannot leave a half-written log behind.
 */
function writeLog(log: LogFile): void {
  mkdirSync(dirname(LOG), { recursive: true })
  const temporary = `${LOG}.tmp`
  writeFileSync(temporary, `${JSON.stringify({ stages: log.stages }, null, 2)}\n`)
  renameSync(temporary, LOG)
}

type ConsentRow = { docId: string; createdAt: string }

function readConsent(): ConsentRow[] {
  return (JSON.parse(readFileSync(SURVIVORS, "utf8")) as {
    consent: ConsentRow[]
  }).consent
}

/**
 * The docId → address join. Gitignored at `.gitignore:84`, so the committed tree
 * still holds docIds only and this read fails loudly rather than mailing nobody.
 */
function readAddresses(): Record<string, string> {
  const file = JSON.parse(readFileSync(ADDRESSES, "utf8")) as {
    addresses?: Record<string, string>
  }
  if (!file.addresses) throw new Error(`${ADDRESSES} holds no addresses`)
  return file.addresses
}

function plannedStages(): DigestStage[] {
  const excluded = new Set<string>([...YAHOO_LAST_DOC_IDS, ...DROPPED_DOC_IDS])
  return planDigestStages({
    deliverableDocIds: readConsent()
      .map((row) => row.docId)
      .filter((id) => !excluded.has(id)),
    yahooDocIds: [...YAHOO_LAST_DOC_IDS],
    droppedDocIds: [...DROPPED_DOC_IDS],
  })
}

function stageByName(name: string): DigestStage {
  const found = plannedStages().find((stage) => stage.name === name)
  if (!found) throw new Error(`no stage is named ${name}`)
  return found
}

function rowsForStage(name: string): StageContactRow[] {
  return stageContactRows({
    docIds: stageByName(name).docIds,
    consent: readConsent(),
    addresses: readAddresses(),
  })
}

function printPlan(): void {
  for (const stage of plannedStages()) {
    const size = stage.name === "maintainer" ? 1 : stage.docIds.length
    console.log(`${stage.name}\t${size}`)
  }
}

async function ensureSegment(name: string): Promise<string> {
  const listed = await resendRequest<{ data: { id: string; name: string }[] }>(
    "/segments"
  )
  const found = listed.data.find((segment) => segment.name === name)
  if (found) return found.id
  const created = await resendRequest<{ id: string }>("/segments", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
  return created.id
}

async function findContact(email: string): Promise<ListedContact> {
  const page = await resendRequest<{ data: ListedContact[]; has_more?: boolean }>(
    "/contacts?limit=100"
  )
  if (page.has_more) {
    throw new Error("the contact list is longer than one page")
  }
  const key = email.trim().toLowerCase()
  const found = page.data.find((contact) => contact.email.toLowerCase() === key)
  if (!found) throw new Error("the maintainer is not a Resend contact")
  return found
}

async function addToSegment(contactId: string, segmentId: string): Promise<void> {
  try {
    await resendRequest(`/contacts/${contactId}/segments/${segmentId}`, {
      method: "POST",
    })
  } catch (err) {
    if ((err as { status?: number }).status !== 409) throw err
  }
}

async function waitForEmail(
  subject: string,
  to: string
): Promise<{ id: string; last_event: string }> {
  const deadline = Date.now() + 180_000
  const key = to.toLowerCase()
  while (Date.now() < deadline) {
    const page = await resendRequest<{
      data: {
        id: string
        to: string[]
        subject: string
        last_event: string
      }[]
    }>("/emails")
    const hit = page.data.find(
      (row) =>
        row.subject === subject &&
        row.to.some((addr) => addr.toLowerCase() === key)
    )
    if (hit) return { id: hit.id, last_event: hit.last_event }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error("the maintainer copy did not appear in the sent list")
}

async function exerciseUnsubscribe(emailId: string): Promise<void> {
  const email = await resendRequest<{ html: string | null }>(`/emails/${emailId}`)
  if (!email.html) throw new Error("the sent email has no HTML")
  const url = unsubscribeUrlFromHtml(email.html)
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "List-Unsubscribe=One-Click",
  })
  if (!res.ok) {
    throw new Error(`one-click unsubscribe POST → ${res.status}`)
  }
}

async function sendMaintainer(log: LogFile): Promise<void> {
  await refuseToSend(log, "maintainer")

  const contact = await findContact(MAINTAINER)
  if (contact.unsubscribed) {
    throw new Error("the maintainer is unsubscribed, so the send would reach nobody")
  }

  const segmentId = await ensureSegment(SEGMENT_NAME)
  const target = refuseBroadcastTarget({ segmentId })
  if (target) throw new Error(target)
  await addToSegment(contact.id, segmentId)

  const page = await resendRequest<ContactPage>(
    `/segments/${segmentId}/contacts`
  )
  const blocked = refuseSendReason(page, MAINTAINER)
  if (blocked) throw new Error(`refusing to send: ${blocked}`)

  const digest = renderMaintainerDigest({ unsubscribeUrl: UNSUBSCRIBE_TOKEN })
  const broadcastId = (
    await resendRequest<{ id: string }>("/broadcasts", {
      method: "POST",
      body: JSON.stringify({
        segment_id: segmentId,
        from: FROM,
        reply_to: REPLY_TO,
        subject: digest.subject,
        html: digest.html,
      }),
    })
  ).id
  recordPending(log, "maintainer", broadcastId, segmentId, [MAINTAINER])
  await resendRequest(`/broadcasts/${broadcastId}/send`, { method: "POST" })
  console.log(`sent broadcast ${broadcastId} on segment ${segmentId}`)

  await collectMaintainer(log, true)
}

/**
 * Runs every gate before a send. Every stage's counts are read again from Resend
 * first, because a complaint or a bounce can arrive days after a stage was
 * collected, and a stored count would miss it.
 */
async function refuseToSend(log: LogFile, name: string): Promise<void> {
  await refreshCompleted(log)
  const previous = log.stages.at(-1) ?? null
  const refusal =
    refuseUnloggedStage(name, log.absent, previous) ??
    refuseAnyComplaint(log.stages) ??
    refuseNextStage(previous, new Date()) ??
    refuseRepeatStage(log.stages, name) ??
    refuseStageOrder(
      log.stages,
      plannedStages().map((stage) => stage.name),
      name
    )
  if (refusal) throw new Error(refusal)
}

/** Paces the reads and waits out a rate limit, so a refresh does not fail on 429. */
async function readEmail(id: string): Promise<FannedEmail> {
  for (let attempt = 0; ; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    try {
      return await resendRequest<FannedEmail>(`/emails/${id}`)
    } catch (err) {
      if ((err as { status?: number }).status !== 429 || attempt >= 5) throw err
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
    }
  }
}

async function refreshCompleted(log: LogFile): Promise<void> {
  const now = new Date()
  let changed = false
  for (const row of log.stages) {
    if (isPendingStageRow(row)) continue
    if (countsExpired(row.sentAt, now)) {
      console.warn(
        `${row.name}: older than Resend's retention window, so its stored counts stand`
      )
      continue
    }
    const ids = row.emailIds ?? (row.emailId ? [row.emailId] : [])
    if (ids.length === 0) {
      throw new Error(
        `the ${row.name} stage has no email ids, so its counts cannot be read again`
      )
    }
    const copies: FannedEmail[] = []
    for (const id of ids) copies.push(await readEmail(id))
    const outcome = stageOutcomeFromEvents(copies.map((copy) => copy.last_event))
    const merged = mergeRefreshedOutcome(row, outcome)
    const bounced = copies.filter((copy) => copy.last_event === "bounced")
    const removedNow =
      bounced.length === 0 ||
      (await removeHardBounces(bounced)) === bounced.length
    const removed =
      merged.hardBounces === 0 ||
      (removedNow &&
        (bounced.length >= merged.hardBounces || row.hardBouncesRemoved))
    if (
      merged.hardBounces !== row.hardBounces ||
      merged.complaints !== row.complaints ||
      removed !== row.hardBouncesRemoved
    ) {
      changed = true
    }
    row.hardBounces = merged.hardBounces
    row.complaints = merged.complaints
    row.hardBouncesRemoved = removed
    console.log(
      `${row.name} read again: events ${JSON.stringify(outcome.events)}, ` +
        `hard_bounces=${row.hardBounces}, complaints=${row.complaints}`
    )
  }
  if (changed) writeLog(log)
}

/**
 * Logs a stage after its broadcast exists and before the send call, so a failed
 * response, a timeout or a crash cannot erase the fact of the send. The row holds no
 * counts until a collect measures them.
 */
function recordPending(
  log: LogFile,
  name: string,
  broadcastId: string,
  segmentId: string,
  recipients: string[]
): void {
  log.stages.push({
    name,
    sentAt: new Date().toISOString(),
    broadcastId,
    segmentId,
    recipients,
    pending: true,
  })
  writeLog(log)
}

/**
 * Reads the broadcast and decides whether the pending row stands. A draft with no
 * sent copy never went out: the row goes first and the draft after, so a crash
 * between the two leaves only a draft that cannot send. Returns true when it removed
 * the row.
 */
async function dropUnsentPending(
  log: LogFile,
  pending: PendingStageRow,
  subject: string
): Promise<boolean> {
  const broadcast = await resendRequest<{ status: string }>(
    `/broadcasts/${pending.broadcastId}`
  )
  const copies =
    broadcast.status === "draft"
      ? await countSentCopies(subject, pending.recipients)
      : 0
  const decision = decideUnsentPending(
    broadcast.status,
    copies,
    Date.now() - new Date(pending.sentAt).getTime()
  )
  if (decision.action === "refuse") throw new Error(decision.reason)
  if (decision.action === "collect") return false
  log.stages.pop()
  writeLog(log)
  try {
    await resendRequest(`/broadcasts/${pending.broadcastId}`, {
      method: "DELETE",
    })
  } catch (err) {
    console.warn(`the draft ${pending.broadcastId} stays in Resend: ${(err as Error).message}`)
  }
  console.log(
    `broadcast ${pending.broadcastId} was never sent: the pending ` +
      `${pending.name} row is removed, so --send may run again`
  )
  return true
}

async function countSentCopies(
  subject: string,
  recipients: readonly string[]
): Promise<number> {
  const wanted = new Set(recipients.map((email) => email.toLowerCase()))
  const page = await resendRequest<{ data: FannedEmail[] }>("/emails?limit=100")
  return page.data.filter(
    (row) =>
      row.subject === subject &&
      row.to.some((addr) => wanted.has(addr.toLowerCase()))
  ).length
}

function pendingRow(log: LogFile, name: string): PendingStageRow {
  const refusal = refuseCollect(log.stages, name)
  if (refusal) throw new Error(refusal)
  const last = log.stages.at(-1)
  if (!isPendingStageRow(last)) throw new Error(`the ${name} stage is not pending`)
  return last
}

function completeRow(log: LogFile, row: StageLog): void {
  log.stages[log.stages.length - 1] = row
  writeLog(log)
}

/**
 * The maintainer row stays pending until the unsubscribe is exercised, because a
 * maintainer row without that proof is incomplete and would block every later stage.
 */
async function collectMaintainer(
  log: LogFile,
  justSent = false
): Promise<void> {
  const pending = pendingRow(log, "maintainer")
  const digest = renderMaintainerDigest({ unsubscribeUrl: UNSUBSCRIBE_TOKEN })
  if (!justSent && (await dropUnsentPending(log, pending, digest.subject))) return
  const contact = await findContact(MAINTAINER)
  const email = await waitForEmail(digest.subject, MAINTAINER)
  const hardBounces = email.last_event === "bounced" ? 1 : 0

  await exerciseUnsubscribe(email.id)
  const after = await resendRequest<{ unsubscribed: boolean }>(
    `/contacts/${contact.id}`
  )
  if (!after.unsubscribed) {
    throw new Error("the one-click POST did not unsubscribe the contact")
  }
  const row: StageLog = {
    name: pending.name,
    sentAt: pending.sentAt,
    hardBounces,
    complaints: email.last_event === "complained" ? 1 : 0,
    hardBouncesRemoved: hardBounces === 0,
    broadcastId: pending.broadcastId,
    emailId: email.id,
    segmentId: pending.segmentId,
    lastEvent: email.last_event,
    unsubscribeExercised: true,
  }
  completeRow(log, row)
  console.log(
    `unsubscribe exercised; last_event=${row.lastEvent}; hard_bounces=${row.hardBounces}; complaints=${row.complaints}`
  )
}

type SegmentMember = {
  id: string
  email: string
  unsubscribed: boolean
}

/**
 * Reads the segment back and refuses unless its membership is exactly this stage's
 * addresses and every one of them carries a readable `signup_date`.
 *
 * Membership is compared as a **set, not a count**, because the segment is rebuilt
 * per stage: a member left over from the stage before would mail the wrong person,
 * and an equal count would hide it.
 *
 * `signup_date` is read one contact at a time. Measured 2026-10-22: both
 * `GET /segments/{id}/contacts` and `GET /contacts` omit `properties`, while
 * `GET /contacts/{email}` returns them as `{value, type}`. A member with no
 * property renders "a date we could not read" into a real inbox, which is the
 * failure ticket 04's design exists to prevent.
 */
async function verifySegment(
  segmentId: string,
  rows: readonly StageContactRow[]
): Promise<void> {
  const page = await resendRequest<{ data: SegmentMember[] }>(
    `/segments/${segmentId}/contacts`
  )
  const actual = new Set(page.data.map((m) => m.email.toLowerCase()))
  const wanted = new Set(rows.map((r) => r.email.toLowerCase()))
  const extra = [...actual].filter((email) => !wanted.has(email)).length
  const missing = [...wanted].filter((email) => !actual.has(email)).length
  if (extra > 0 || missing > 0) {
    throw new Error(
      `the segment does not hold exactly the ${rows.length} this stage plans: ` +
        `${extra} left over, ${missing} absent`
    )
  }
  for (const member of page.data) {
    if (member.unsubscribed) {
      throw new Error(`${member.id} unsubscribed since this stage was prepared`)
    }
    const contact = await getContactByEmail(member.email)
    const refusal = refuseSignupDateProperty(
      contact?.properties?.signup_date?.value ?? null
    )
    if (refusal) throw new Error(`${member.id}: ${refusal}`)
  }
}

/** Empties the reused segment, so nobody from an earlier stage rides along. */
async function clearSegment(segmentId: string): Promise<number> {
  const page = await resendRequest<{ data: SegmentMember[] }>(
    `/segments/${segmentId}/contacts`
  )
  for (const member of page.data) {
    await resendRequest(`/contacts/${member.id}/segments/${segmentId}`, {
      method: "DELETE",
    })
  }
  return page.data.length
}

/**
 * Builds this stage's membership and puts a `signup_date` on every one of them.
 * Sends nothing, so it runs on the day the addresses are joined and again on the
 * day the stage mails: `ensureContactWithProperties` reads before it writes, so a
 * re-run PATCHes the property rather than POSTing over a suppression flag.
 */
async function prepareStage(name: string): Promise<void> {
  const rows = rowsForStage(name)
  if (rows.length === 0) throw new Error(`the ${name} stage has nobody in it`)
  const segmentId = await ensureSegment(STAGE_SEGMENT)
  const cleared = await clearSegment(segmentId)
  let created = 0
  for (const row of rows) {
    const contact = await ensureContactWithProperties({
      email: row.email,
      properties: { signup_date: row.signupDate },
    })
    await addToSegment(contact.id, segmentId)
    if (contact.created) created++
  }
  await verifySegment(segmentId, rows)
  console.log(
    `prepared ${name}: segment ${segmentId} emptied of ${cleared}, ` +
      `${rows.length} members, ${created} created, every one carries signup_date`
  )
}

type FannedEmail = {
  id: string
  to: string[]
  subject: string
  last_event: string
}

/**
 * Waits for a broadcast's whole fan-out, then hands back one copy per recipient.
 *
 * Matched on the recipient and not on the subject alone. Every stage shares one
 * subject line, so a subject match absorbs the earlier stages' copies: measured
 * 2026-10-22, the five stage tallied six emails because the maintainer's copy of
 * the same subject was still in the list, and the bounce and complaint counts that
 * the acceptance asks for were then counts of the wrong set.
 */
async function waitForFanOut(
  subject: string,
  recipients: readonly string[]
): Promise<FannedEmail[]> {
  const wanted = new Set(recipients.map((email) => email.toLowerCase()))
  const deadline = Date.now() + 600_000
  let matched = new Map<string, FannedEmail>()
  while (Date.now() < deadline) {
    const page = await resendRequest<{ data: FannedEmail[] }>(
      "/emails?limit=100"
    )
    matched = new Map()
    for (const row of page.data) {
      if (row.subject !== subject) continue
      // The list is newest first, so the first hit per recipient is the latest one.
      const to = row.to?.[0]?.toLowerCase()
      if (to && wanted.has(to) && !matched.has(to)) matched.set(to, row)
    }
    if (matched.size >= wanted.size) return [...matched.values()]
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error(
    `only ${matched.size} of ${wanted.size} copies of "${subject}" reached this stage's recipients`
  )
}

/**
 * Deletes the contacts behind a hard bounce, so the next stage is not refused over
 * a mailbox that no longer exists. Ticket 10: hard bounces removed immediately,
 * permanently, before the next stage. A contact that is already gone counts as
 * removed, so a collect that runs again after a partial removal can finish.
 */
async function removeHardBounces(bounced: FannedEmail[]): Promise<number> {
  let removed = 0
  for (const email of bounced) {
    for (const addr of email.to) {
      const contact = await getContactByEmail(addr)
      if (contact) {
        await resendRequest(`/contacts/${contact.id}`, { method: "DELETE" })
      }
    }
    removed++
  }
  return removed
}

async function sendStage(name: string, log: LogFile): Promise<void> {
  await refuseToSend(log, name)

  const rows = rowsForStage(name)
  const segmentId = await ensureSegment(STAGE_SEGMENT)
  const target = refuseBroadcastTarget({ segmentId })
  if (target) throw new Error(target)
  // Re-verified here rather than trusted from prepare time. The segment is shared
  // across stages and suppression can move between the two, so this read is the one
  // that decides who the broadcast reaches.
  await verifySegment(segmentId, rows)

  const digest = renderBroadcastDigest({ unsubscribeUrl: UNSUBSCRIBE_TOKEN })
  const broadcastId = (
    await resendRequest<{ id: string }>("/broadcasts", {
      method: "POST",
      body: JSON.stringify({
        segment_id: segmentId,
        from: FROM,
        reply_to: REPLY_TO,
        subject: digest.subject,
        html: digest.html,
      }),
    })
  ).id
  recordPending(
    log,
    name,
    broadcastId,
    segmentId,
    rows.map((row) => row.email)
  )
  await resendRequest(`/broadcasts/${broadcastId}/send`, { method: "POST" })
  console.log(
    `sent broadcast ${broadcastId} to ${rows.length} on segment ${segmentId}`
  )

  await collectStage(name, log, true)
}

async function collectStage(
  name: string,
  log: LogFile,
  justSent = false
): Promise<void> {
  const pending = pendingRow(log, name)
  const digest = renderBroadcastDigest({ unsubscribeUrl: UNSUBSCRIBE_TOKEN })
  if (!justSent && (await dropUnsentPending(log, pending, digest.subject))) return
  const fanOut = await waitForFanOut(digest.subject, pending.recipients)
  const outcome = stageOutcomeFromEvents(fanOut.map((email) => email.last_event))
  const bounced = fanOut.filter((email) => email.last_event === "bounced")
  const emailIds = fanOut.map((email) => email.id)
  const row: StageLog = {
    name: pending.name,
    sentAt: pending.sentAt,
    hardBounces: outcome.hardBounces,
    complaints: outcome.complaints,
    hardBouncesRemoved:
      bounced.length === 0 ||
      (await removeHardBounces(bounced)) === bounced.length,
    broadcastId: pending.broadcastId,
    emailId: emailIds[0] ?? null,
    segmentId: pending.segmentId,
    lastEvent: outcome.lastEvent,
    unsubscribeExercised: false,
    emailIds,
    events: outcome.events,
  }
  completeRow(log, row)
  console.log(
    `${name}: ${fanOut.length} copies, events ${JSON.stringify(outcome.events)}, ` +
      `hard_bounces=${row.hardBounces}, complaints=${row.complaints}`
  )
  if (row.complaints > 0) {
    console.log(
      "a complaint stops the sequence — this stage hands back to the maintainer"
    )
  }
}

const STAGE_NAMES = ["maintainer", "five", "ten", "remainder", "yahoo"]

async function main(): Promise<void> {
  const stage = arg("--stage")
  const send = process.argv.includes("--send")
  const prepare = process.argv.includes("--prepare")
  const collect = process.argv.includes("--collect")
  if (!stage) {
    printPlan()
    console.log(
      "dry run — pass --stage <name> --prepare to build a segment, " +
        "--stage <name> --send to mail one, " +
        "or --stage <name> --collect to record a pending stage's counts"
    )
    return
  }
  if (!STAGE_NAMES.includes(stage)) {
    throw new Error(`no stage is named ${stage}`)
  }
  if ([prepare, send, collect].filter(Boolean).length > 1) {
    throw new Error("pass only one of --prepare, --send and --collect")
  }
  if (collect) {
    if (stage === "maintainer") await collectMaintainer(readLog())
    else await collectStage(stage, readLog())
    return
  }
  if (!prepare && !send) {
    const count = stage === "maintainer" ? 1 : rowsForStage(stage).length
    console.log(`${stage}: ${count} recipient(s), nothing sent`)
    console.log("pass --prepare to build the segment, or --send to mail it")
    return
  }
  if (prepare) {
    if (stage === "maintainer") {
      throw new Error(
        "the maintainer stage is sent, so there is nothing left to prepare"
      )
    }
    await prepareStage(stage)
    return
  }
  if (stage === "maintainer") {
    await sendMaintainer(readLog())
    return
  }
  await sendStage(stage, readLog())
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
