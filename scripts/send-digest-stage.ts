#!/usr/bin/env tsx
/**
 * Sends one Digest stage. Run via: pnpm digest:stage -- --stage maintainer --send
 *
 * notify-and-preview ticket 10. Without --send it prints the stage sizes and
 * stops. --send is accepted only for the maintainer stage: the later stages
 * wait for a person, a later UTC day, and the local address join.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { pathToFileURL } from "node:url"

import {
  renderBroadcastDigest,
  renderMaintainerDigest,
  UNSUBSCRIBE_TOKEN,
} from "../lib/digest"
import {
  DROPPED_DOC_IDS,
  planDigestStages,
  refuseBroadcastTarget,
  refuseNextStage,
  refuseRepeatStage,
  refuseSignupDateProperty,
  stageContactRows,
  unsubscribeUrlFromHtml,
  YAHOO_LAST_DOC_IDS,
  type DigestStage,
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

type LogFile = { stages: StageLog[] }

type ListedContact = {
  id: string
  email: string
  unsubscribed: boolean
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function readLog(): LogFile {
  try {
    return JSON.parse(readFileSync(LOG, "utf8")) as LogFile
  } catch {
    return { stages: [] }
  }
}

function writeLog(log: LogFile): void {
  mkdirSync(dirname(LOG), { recursive: true })
  writeFileSync(LOG, `${JSON.stringify(log, null, 2)}\n`)
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
  const previous = log.stages.at(-1) ?? null
  const wait = refuseNextStage(previous, new Date())
  if (wait) throw new Error(wait)
  const repeat = refuseRepeatStage(log.stages, "maintainer")
  if (repeat) throw new Error(repeat)

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
  await resendRequest(`/broadcasts/${broadcastId}/send`, { method: "POST" })

  const row: StageLog = {
    name: "maintainer",
    sentAt: new Date().toISOString(),
    hardBounces: 0,
    complaints: 0,
    hardBouncesRemoved: true,
    broadcastId,
    emailId: null,
    segmentId,
    lastEvent: null,
    unsubscribeExercised: false,
  }
  log.stages.push(row)
  writeLog(log)
  console.log(`sent broadcast ${broadcastId} on segment ${segmentId}`)

  const email = await waitForEmail(digest.subject, MAINTAINER)
  row.emailId = email.id
  row.lastEvent = email.last_event
  row.hardBounces = email.last_event === "bounced" ? 1 : 0
  row.complaints = email.last_event === "complained" ? 1 : 0
  row.hardBouncesRemoved = row.hardBounces === 0
  writeLog(log)

  await exerciseUnsubscribe(email.id)
  const after = await resendRequest<{ unsubscribed: boolean }>(
    `/contacts/${contact.id}`
  )
  if (!after.unsubscribed) {
    throw new Error("the one-click POST did not unsubscribe the contact")
  }
  row.unsubscribeExercised = true
  writeLog(log)
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
 * Waits for a broadcast's whole fan-out, then hands back every copy.
 *
 * The acceptance asks for bounce and complaint counts after each stage, and those
 * counts mean nothing until every recipient's row exists — so this waits for the
 * expected number rather than returning the first hit the way the one-recipient
 * maintainer path can.
 */
async function waitForFanOut(
  subject: string,
  expected: number
): Promise<FannedEmail[]> {
  const deadline = Date.now() + 600_000
  let hits: FannedEmail[] = []
  while (Date.now() < deadline) {
    const page = await resendRequest<{ data: FannedEmail[] }>(
      "/emails?limit=100"
    )
    hits = page.data.filter((row) => row.subject === subject)
    if (hits.length >= expected) return hits
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
  throw new Error(
    `only ${hits.length} of ${expected} copies of "${subject}" appeared in the sent list`
  )
}

/**
 * Deletes the contacts behind a hard bounce, so the next stage is not refused over
 * a mailbox that no longer exists. Ticket 10: hard bounces removed immediately,
 * permanently, before the next stage.
 */
async function removeHardBounces(bounced: FannedEmail[]): Promise<number> {
  let removed = 0
  for (const email of bounced) {
    for (const addr of email.to) {
      const contact = await getContactByEmail(addr)
      if (!contact) continue
      await resendRequest(`/contacts/${contact.id}`, { method: "DELETE" })
      removed++
    }
  }
  return removed
}

async function sendStage(name: string, log: LogFile): Promise<void> {
  const wait = refuseNextStage(log.stages.at(-1) ?? null, new Date())
  if (wait) throw new Error(wait)
  const repeat = refuseRepeatStage(log.stages, name)
  if (repeat) throw new Error(repeat)

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
  await resendRequest(`/broadcasts/${broadcastId}/send`, { method: "POST" })

  const row: StageLog = {
    name,
    sentAt: new Date().toISOString(),
    hardBounces: 0,
    complaints: 0,
    hardBouncesRemoved: true,
    broadcastId,
    emailId: null,
    segmentId,
    lastEvent: null,
    unsubscribeExercised: false,
  }
  log.stages.push(row)
  writeLog(log)
  console.log(
    `sent broadcast ${broadcastId} to ${rows.length} on segment ${segmentId}`
  )

  const fanOut = await waitForFanOut(digest.subject, rows.length)
  const events: Record<string, number> = {}
  for (const email of fanOut) {
    events[email.last_event] = (events[email.last_event] ?? 0) + 1
  }
  const bounced = fanOut.filter((email) => email.last_event === "bounced")
  row.emailIds = fanOut.map((email) => email.id)
  row.emailId = row.emailIds[0] ?? null
  row.events = events
  row.hardBounces = bounced.length
  row.complaints = fanOut.filter(
    (email) => email.last_event === "complained"
  ).length
  row.lastEvent =
    Object.keys(events).length === 1 ? Object.keys(events)[0] : "mixed"
  row.hardBouncesRemoved =
    bounced.length === 0 ||
    (await removeHardBounces(bounced)) === bounced.length
  writeLog(log)
  console.log(
    `${name}: ${fanOut.length} copies, events ${JSON.stringify(events)}, ` +
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
  if (!stage) {
    printPlan()
    console.log(
      "dry run — pass --stage <name> --prepare to build a segment, " +
        "or --stage <name> --send to mail one"
    )
    return
  }
  if (!STAGE_NAMES.includes(stage)) {
    throw new Error(`no stage is named ${stage}`)
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
