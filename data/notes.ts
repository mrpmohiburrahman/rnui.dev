export type Topic =
  | "Stack"
  | "Tools"
  | "Routing"
  | "Data"
  | "State"
  | "Lists"
  | "UI"
  | "Shipping"

export type NoteSection = {
  heading: string
  paragraphs: string[]
  gain?: string
  cost?: string
}

export type Note = {
  id: string
  topic: Topic
  date: string
  read: string
  title: string
  dek: string
  pull: string
  sections: NoteSection[]
  stack?: boolean
}

export const TOPICS: Topic[] = [
  "Stack",
  "Tools",
  "Routing",
  "Data",
  "State",
  "Lists",
  "UI",
  "Shipping",
]

export const MAINTAINER_NAME = "MD. Mohibur Rahman"
export const MAINTAINER_ROLE = "rnui.dev maintainer"
export const BYLINE = `${MAINTAINER_NAME} · ${MAINTAINER_ROLE}`

export const STACK_ROWS: { area: string; pick: string }[] = [
  { area: "Framework", pick: "Expo SDK 58 + TypeScript" },
  { area: "Tools", pick: "Herdr + Zed" },
  { area: "Routing", pick: "Expo Router v56" },
  { area: "Local data", pick: "Expo SQLite + Drizzle + MMKV" },
  { area: "State", pick: "Legend State + TanStack Query" },
  { area: "Lists", pick: "Legend List or FlashList" },
  { area: "Forms", pick: "React Hook Form + Zod" },
  { area: "Motion", pick: "Reanimated 4 + Gesture Handler" },
  { area: "Auth", pick: "Clerk" },
  { area: "Errors", pick: "Sentry" },
  { area: "Purchases", pick: "RevenueCat" },
  { area: "Reviews", pick: "CodeRabbit" },
  { area: "Insights", pick: "PostHog" },
  { area: "Backend", pick: "Supabase, Instant, or API routes" },
  { area: "UI", pick: "StyleSheet, then Unistyles, Uniwind, or Expo UI" },
  { area: "Ship", pick: "EAS Build, Submit, Update, Hosting" },
]

export const STACK_TEXT = STACK_ROWS.map((row) => `${row.area}: ${row.pick}`).join(
  "\n",
)

// The Blog's Notes. Empty until the first Note is written. Every consumer reads
// this list, so an empty Blog is a supported state and not a broken page.
export const NOTES: Note[] = []

export function findNote(notes: Note[], slug: string) {
  return notes.find((note) => note.id === slug)
}

export function noteAfter(notes: Note[], slug: string) {
  const index = notes.findIndex((note) => note.id === slug)
  if (index < 0) return undefined
  return notes[(index + 1) % notes.length]
}

export function noteBySlug(slug: string) {
  return findNote(NOTES, slug)
}

export function nextNote(slug: string) {
  return noteAfter(NOTES, slug)
}
