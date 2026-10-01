// scripts/send-outcome.ts
//
// The third message: something went wrong with a Submission, and here is what it was. The
// maintainer writes the reason every time, so this asks rather than templating.
//
//   pnpm submissions:outcome
//   pnpm submissions:outcome --dry-run
//   pnpm submissions:outcome --email <address> --caption "Radial FAB" --reason-file <path>
//   pnpm submissions:outcome ... --yes     skip the confirmation, for a scripted run
//
// **Why a command rather than a reply to the notification**, which ticket 13 considered and
// rejected on two counts that are worth keeping: a reply to the notification does not reach the
// Contributor at all, because that message is sent with `to: hello@rnui.dev` and
// `reply_to: hello@rnui.dev`, so it comes straight back to the maintainer. And quoting it would
// put the object key and `pnpm submissions:open <key>` in a stranger's inbox.
//
// **The address is pasted, never looked up.** Same answer as the publication notice and for the
// same reason: `firestore.rules` denies every read of the consent collection on purpose. It is in
// the notification's `Reply to` row.
//
// Ticket 13 is the decision and ticket 14 is this build.

import { readFile } from "node:fs/promises"
import { createInterface } from "node:readline/promises"

import { outcomeMessage } from "../lib/outcome-message"
import { sendEmail } from "../lib/resend"

const args = process.argv.slice(2)
const has = (name: string) => args.includes(name)
const value = (name: string) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}

const dryRun = has("--dry-run")
const assumeYes = has("--yes")

/**
 * Usage, so the command is discoverable without reading this file.
 *
 * `--help` rather than only printing it on a failure, because the failure paths here are
 * reached by answering prompts, so there is no wrong-arguments route to discovery.
 */
function printUsage(): void {
  console.log(
    [
      "usage: pnpm submissions:outcome",
      "       pnpm submissions:outcome --dry-run",
      "       pnpm submissions:outcome --email <address> --caption <caption> --reason-file <path>",
      "       pnpm submissions:outcome ... --name <Contributor> --yes",
      "",
      "Writes to a Contributor whose Demo is not going to be published. Asks for the address,",
      "the caption and the reason unless they are given, then prints the message and asks",
      "before sending.",
      "",
      "  --email        the address from the notification's Reply to row",
      "  --caption      which Submission this is about, from the notification's subject",
      "  --name         the Contributor's name, optional; blank greets them as Hello",
      "  --reason-file  read the reason from a file instead of typing it",
      "  --dry-run      print the message and send nothing",
      "  --yes          do not ask for confirmation",
      "  --help         this",
    ].join("\n")
  )
}

if (has("--help") || has("-h")) {
  printUsage()
  process.exit(0)
}

function stop(lines: string[]): never {
  for (const line of lines) console.error(line)
  process.exit(1)
}

/** The HTML as a reader sees it, which is the only way to judge prose. */
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

/**
 * The reason, read line by line until a line that is only a full stop.
 *
 * A prompt rather than an argument, because the whole point of this message is that its text is
 * written on the spot: `--reason "..."` would have to survive shell quoting, and prose full of
 * apostrophes is exactly where that goes wrong.
 */
async function askReason(
  rl: ReturnType<typeof createInterface>
): Promise<string> {
  console.log(
    "What went wrong? Type or paste it. A blank line separates paragraphs, and a line\ncontaining only a full stop finishes."
  )
  const lines: string[] = []
  for (;;) {
    const line = await rl.question(lines.length === 0 ? "> " : "  ")
    if (line.trim() === ".") break
    lines.push(line)
  }
  return lines.join("\n").trim()
}

async function main(): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (flag: string, question: string, fallback = "") => {
    const given = value(flag)
    if (given !== undefined) return given.trim()
    return (await rl.question(question)).trim() || fallback
  }

  const to = await ask(
    "--email",
    "address to send to (the notification's Reply to row): "
  )
  if (!to) {
    rl.close()
    stop([
      "no address given, so nothing was sent.",
      "It is in the notification email's Reply to row, or in the Firebase console.",
    ])
  }

  const caption = await ask(
    "--caption",
    "what is it about (the caption, from the notification's subject): "
  )
  if (!caption) {
    rl.close()
    stop([
      "no caption given, so nothing was sent. It is in the notification's subject.",
    ])
  }

  const contributor = await ask(
    "--name",
    "Contributor's name (blank to just say Hello): "
  )

  const reasonFile = value("--reason-file")
  let reason: string
  if (reasonFile) {
    // A missing or unreadable file is a person's mistake, not a crash, so it says so in one
    // line rather than in a stack trace.
    try {
      reason = (await readFile(reasonFile, "utf8")).trim()
    } catch (error) {
      rl.close()
      stop([
        `could not read --reason-file ${reasonFile}: ${error instanceof Error ? error.message : String(error)}`,
        "Nothing was sent.",
      ])
    }
  } else {
    reason = await askReason(rl)
  }

  rl.close()

  if (!reason) {
    stop([
      "the reason is empty, so nothing was sent. An outcome message with no outcome is worse than none.",
    ])
  }

  const message = outcomeMessage({ contributor, caption, reason })

  console.log(`\nto:      ${to}`)
  console.log(`subject: ${message.subject}`)
  console.log(`\n${flatten(message.html)}`)

  if (dryRun) {
    console.log("\n--dry-run, so nothing was sent.")
    return
  }

  if (!assumeYes) {
    const confirm = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    const answer = await confirm.question("\nsend it? [y/N] ")
    confirm.close()
    if (!/^y(es)?$/i.test(answer.trim())) {
      console.log("not sent.")
      return
    }
  }

  try {
    await sendEmail({ to, ...message })
  } catch (error) {
    console.error("SEND FAILED. Nothing was sent, and nothing is retried.")
    console.error(error)
    process.exit(1)
  }

  console.log(`sent to ${to}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
