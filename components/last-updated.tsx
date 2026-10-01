import data from "@/scripts/lastCommitDate.json"
import { format } from "timeago.js"

// The one reader of the build-time JSON is this module, and the header's counter
// line and the footer's stamp both take their relative time from it here rather
// than reading the file themselves — so the two strings cannot disagree.

const COMPACT_UNIT: Record<string, string> = {
  second: "s",
  minute: "m",
  hour: "h",
  day: "d",
  week: "w",
  month: "mo",
  year: "y",
}

/** "13 hours ago" → "13h ago": the counter line's compact relative time. */
export function formatUpdatedCompact(date: string | Date): string {
  return format(new Date(date)).replace(
    /^(\d+) (second|minute|hour|day|week|month|year)s? ago$/,
    (_match, count: string, unit: string) => `${count}${COMPACT_UNIT[unit]} ago`
  )
}

/** "Updated: 13 hours ago", the same words the default export renders. */
export function formatUpdatedFull(date: string | Date): string {
  return `Updated: ${format(new Date(date))}`
}

/** The commit date the build captured, for every relative-time reader. */
export function lastCommitDate(): Date {
  return new Date(data.lastCommitDate)
}

// A build-time JSON import: nothing was ever loading, and the `Loading last updated
// date...` placeholder only shifted the row a render in. The suppression sits on the
// <strong> because React applies it one level deep and that is the element owning the
// text that can differ — server and client either side of a timeago bucket boundary.
const LastUpdated: React.FC = () => (
  <p>
    <strong suppressHydrationWarning>
      {formatUpdatedFull(lastCommitDate())}
    </strong>
  </p>
)
export default LastUpdated
