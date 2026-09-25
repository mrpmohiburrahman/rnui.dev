// scripts/notify-submission.ts
//
// Tell a Contributor their Demo is live. The second of the three messages.
//
//   pnpm submissions:notify --key <submission-key> --recording <recording-id> --email <address>
//   pnpm submissions:notify ... --dry-run    print it and send nothing
//   pnpm submissions:notify ... --yes        skip the confirmation prompt
//   pnpm submissions:notify ... --again      send even though the log says it already went
//   pnpm submissions:notify --key <k> --no-address
//                                            the deliberate skip, when the address is gone
//
// **Why a command rather than a step inside add-recording.** The skill is prose a session
// follows, and prose cannot be tested; this can, in both directions, and it runs from a plain
// local shell where RESEND_API_KEY already lives. The skill's last step is the one line that
// runs it.
//
// **Where the address comes from, and why not from Firestore.** submission-receipt ticket 09
// decided the maintainer's inbox: the notification already prints the address in its `Reply
// to` row. Reading it from the consent record would need `firestore.rules` relaxed, and the
// collection denies every read on purpose so that it can never publish who submitted what.
//
// **The guard against sending twice is the log file, not the prompt.** `.scratch` is tracked
// and this repo is public, so the log deliberately carries no address: the submission key is
// a ULID, and the file records only which key, which Recording, and when.
//
// Public-submissions ticket 09 built the notification this sits beside, and
// submission-receipt tickets 09 and 11 are where this shape was decided.

import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { createInterface } from "node:readline/promises"

import { allRecordings } from "../data/catalogue"
import type { Recording } from "../data/recording"
import { publicationNotice } from "../lib/publication-notice"
import { sendEmail } from "../lib/resend"

const args = process.argv.slice(2)
const has = (name: string) => args.includes(name)
const value = (name: string) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}

const dryRun = has("--dry-run")
const assumeYes = has("--yes")
const again = has("--again")
const noAddress = has("--no-address")

const key = value("--key")
const recordingId = value("--recording")
const email = value("--email")

const LOG_DIR = join(".scratch", "submission-receipt", "notices")

function stop(lines: string[]): never {
  for (const line of lines) console.error(line)
  process.exit(1)
}

function usage(): never {
  stop([
    "usage: pnpm submissions:notify --key <submission-key> --recording <recording-id> --email <address>",
    "       pnpm submissions:notify --key <k> --recording <id> --email <a> --dry-run",
    "       pnpm submissions:notify --key <k> --recording <id> --email <a> --yes",
    "       pnpm submissions:notify --key <k> --recording <id> --email <a> --again",
    "       pnpm submissions:notify --key <k> --recording <id> --no-address",
    "",
    "  --key        the Submission's object key, which is also the consent record's id",
    "  --recording  the Recording's id, as written in data/<category>.ts",
    "  --email      the address from the notification's Reply to row",
    "  --no-address the address is gone, so skip the notice and say so",
    "  --dry-run    print the message and send nothing",
    "  --yes        do not ask for confirmation",
    "  --again      override the sent-log, for a deliberate second send",
  ])
}

if (!key || !recordingId) usage()

/**
 * A missing `--email` is a skip, and a misspelled flag is a usage error.
 *
 * Those have to be told apart, so the skip is requested explicitly rather than inferred from
 * absence: `--emial` would otherwise be indistinguishable from "the address could not be
 * found", and the loudest case would be the one that looked most like success.
 */
if (!email) {
  if (!noAddress) usage()
  // The deliberate skip. Loud, named, and not a state the caller has to interpret: a notice
  // that was not sent is exactly what a reader needs to see, and the key is what lets them
  // find the address again.
  stop([
    `NO NOTICE SENT for ${key}: the address could not be found.`,
    "",
    "The consent record denies every read by design, so the address lives in one of two",
    "places: the notification email's Reply to row, or the Firebase console.",
    `The Submission's object is ${key} in rnui-submissions, and the`,
    "lifecycle rule deletes it 30 days after it arrived.",
  ])
}

// The row that was just written, so the name, the caption and the Category are read rather
// than retyped. Ticket 09 is why: a hand typed Contributor name one space out lands on an
// empty catalogue page, and the filter URL would look correct while showing nothing.
const recording = allRecordings.find(
  (candidate) => candidate.id === recordingId
)
if (!recording) {
  stop([
    `no Recording with id "${recordingId}" in the catalogue.`,
    "Nothing was sent. Check the id written in data/<category>.ts, or the caption and",
    "Contributor that derived it.",
  ])
}

const logPath = join(LOG_DIR, `${key}.json`)
if (existsSync(logPath) && !again) {
  stop([
    `a notice for ${key} has already been logged at ${logPath}.`,
    "Nothing was sent. This message cannot be unsent, so a second one is a deliberate act:",
    "pass --again if you mean it.",
  ])
}

// Everything above this line is synchronous and ends in `process.exit`, which is what makes
// the guards cheap. The send is async, and this package's tsx output is CommonJS, where
// top-level await is a transform error, so the tail is a function that is called once.
async function main(input: {
  to: string
  key: string
  recording: Recording
}): Promise<void> {
  const { to, key, recording } = input

  const message = publicationNotice({
    contributor: recording.contributor,
    caption: recording.caption,
    category: recording.category,
    recordingId: recording.id,
  })

  console.log(`to:        ${to}`)
  console.log(
    `recording: ${recording.id} (${recording.caption} by ${recording.contributor})`
  )
  console.log(`subject:   ${message.subject}`)

  if (dryRun) {
    console.log("\n--dry-run, so nothing was sent. The body:")
    console.log(flatten(message.html))
    return
  }

  // The print above is only a guard if it is read, so a question follows it rather than the
  // send. `--yes` exists for a scripted run, not for a habit.
  if (!assumeYes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question("send it? [y/N] ")
    rl.close()
    if (!/^y(es)?$/i.test(answer.trim())) {
      console.log("not sent.")
      return
    }
  }

  try {
    await sendEmail({ to, ...message })
  } catch (error) {
    // Loud, and the log is not written: nothing went, so the guard must still refuse a retry
    // until somebody passes --again on purpose.
    console.error(
      `SEND FAILED for ${key}. The log was not written, so the guard still holds.`
    )
    console.error(error)
    process.exit(1)
  }

  await mkdir(LOG_DIR, { recursive: true })
  await writeFile(
    logPath,
    `${JSON.stringify(
      { key, recording: recording.id, at: new Date().toISOString() },
      null,
      2
    )}\n`
  )

  console.log(`sent, and logged at ${logPath}`)
}

/** The HTML as a reader sees it, for --dry-run. */
function flatten(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

main({ to: email, key, recording }).catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
