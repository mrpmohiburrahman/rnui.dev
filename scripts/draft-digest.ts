#!/usr/bin/env tsx
/**
 * Renders the first Digest and writes the draft to disk.
 * Run via: pnpm digest:draft
 *
 * notify-and-preview ticket 09. The ticket is a draft to react to, so this produces the
 * message exactly as it would land in an inbox: one file, one recipient's copy, with that
 * recipient's own signup date already in the sentence that names it.
 *
 * Nothing here sends. Ticket 10 owns the staged send and is still blocked by this ticket's
 * review.
 *
 * The consent date comes from `research/scrub-survivors.json`, which is committed and holds
 * only Firestore docIds and `createdAt`. The default is the **oldest** consent, because that
 * is the widest window and the least today-like date; `--date` renders any other. Addresses
 * are not read, printed or needed.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { renderDigest, UNSUBSCRIBE_TOKEN } from "../lib/digest"

const SURVIVORS = ".scratch/notify-and-preview/research/scrub-survivors.json"
const DEFAULT_OUT = ".scratch/notify-and-preview/digest-first-draft.html"

type Consent = { createdAt: string }

/** The oldest `createdAt` on the surviving list, which is the first person who signed up. */
export function oldestConsentDate(consent: Consent[]): string {
  const dates = consent.map((row) => row.createdAt).sort()
  if (dates.length === 0)
    throw new Error("the survivor list holds no createdAt")
  return dates[0]
}

function main() {
  const args = process.argv.slice(2)
  const dateFlag = args.indexOf("--date")
  const outFlag = args.indexOf("--out")
  const out = resolve(
    outFlag >= 0 ? (args[outFlag + 1] ?? DEFAULT_OUT) : DEFAULT_OUT
  )

  const signupDate =
    dateFlag >= 0
      ? (args[dateFlag + 1] ?? "")
      : oldestConsentDate(
          (
            JSON.parse(readFileSync(SURVIVORS, "utf8")) as {
              consent: Consent[]
            }
          ).consent
        )

  // The broadcast token, because a broadcast is the only send path with a working
  // unsubscribe link today. A per-recipient send would pass a real URL instead; ticket 10
  // owns which one it is, and lib/digest.ts records the tension.
  //
  // renderDigest throws if any `{{…}}` token other than this one survives, so the bytes
  // written below are the same bytes that guard checked.
  const { subject, html, content } = renderDigest({
    signupDate,
    unsubscribeUrl: UNSUBSCRIBE_TOKEN,
  })

  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html)

  console.log(`subject: ${subject}`)
  console.log(`signup date: ${signupDate}`)
  console.log(
    `recordings: ${content.total} total, ${content.shown.length} shown, ` +
      `${content.more} behind the link`
  )
  console.log(`window: ${content.firstAdded} → ${content.lastAdded} (UTC)`)
  console.log(`draft: ${out}`)
  console.log(
    "next: ticket 09's draft needs the maintainer's read before ticket 10 sends."
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main()
}
