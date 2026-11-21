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

export const STACK_TEXT = STACK_ROWS.map(
  (row) => `${row.area}: ${row.pick}`
).join("\n")

// The Blog's Notes, newest first. Every consumer reads this list, so an empty
// Blog is a supported state and not a broken page.
//
// `id` is the URL: `/blog/<id>` is the address the site published for this Note,
// and changing it breaks the link that already exists outside the site.
export const NOTES: Note[] = [
  {
    id: "react-native-stack-2026",
    topic: "Stack",
    date: "6 Nov 2026",
    read: "9 min",
    title: "The React Native stack I start with in 2026",
    dek: "Nine-area stack for 2026. Expo SDK 58, Legend State, Expo Router, and the limit on each pick.",
    pull: "Nine areas. One pick each. The limit under every pick is what a logo list usually leaves out.",
    stack: true,
    sections: [
      {
        heading: "The nine areas",
        paragraphs: [
          "I start a production React Native app in 2026 on Expo SDK 58 and TypeScript. Navigation is Expo Router. Local UI state is Legend State. HTTP state is TanStack Query. A long list is Legend List or FlashList, chosen by the shape of the rows.",
          "The service list and the UI ladder come from Simon Grimm's video, Choosing the Right React Native Stack in 2026. State and the editor are the swaps: Legend State instead of Zustand, Herdr and Zed instead of Cursor.",
          "Framework — Expo SDK 58 and TypeScript. The limit: move an old SDK up a couple of versions at a time.",
          "Editor — Herdr for agents, Zed for hand edits. The limit: a brand-new agent harness can lag a few days.",
          "Navigation — Expo Router. The limit: since v56, old React Navigation imports need a one-time codemod.",
          "Local data — Expo SQLite with Drizzle, plus MMKV for small values. The limit: you own the migrations, and MMKV needs a dev build.",
          "State — Legend State, with TanStack Query for HTTP. The limit: the observable model is new, and its community is smaller than Zustand's.",
          "Must-haves — Legend List or FlashList, React Hook Form with Zod, Gesture Handler, Reanimated. The limit: chat and uneven feeds use Legend List, while uniform grids use FlashList.",
          "Services — EAS, Clerk, Sentry, RevenueCat, CodeRabbit, PostHog. The limit: EAS costs money past the free tier, and you must decide which analytics events may leave the phone.",
          "Backend — Supabase, Instant, or an Expo API route. The limit: Supabase means SQL, and an API route is a thin handler rather than a full backend.",
          "UI — StyleSheet, then Unistyles, Uniwind, or Expo UI. The limit: start at StyleSheet, because Expo UI does not wrap every native component yet.",
          "Start with npx create-expo-app@latest. Use TypeScript from the first commit.",
        ],
      },
      {
        heading: "Framework",
        paragraphs: [
          "Expo is the framework the React Native docs point new apps at. The forum threads about ejecting describe an older Expo. SDK 58 ships the New Architecture by default. You can still drop into Swift or Kotlin when a library is missing.",
          "The annoying part is the upgrade. If the app sits on a very old SDK, do not jump to 58 in one pull request. Move a couple of SDKs at a time. Simon Grimm's figure for apps that still need the bare workflow is about two percent, usually a requirement Expo cannot host. I have not audited that number.",
        ],
      },
      {
        heading: "Editor",
        paragraphs: [
          "Herdr is a free, open-source Rust terminal multiplexer for coding agents. I use it when two or three features should move at once, in panes, and I want to see which agent is blocked. New harnesses ship every week. Herdr will miss one of them for a few days.",
          "Zed is the other job. It opens fast. I use it when the fix is one line and waiting on a model is slower than typing. VS Code with Copilot, Windsurf, or Antigravity are fine if that is already where you work. The split is the point: agents in one place, hands in another.",
        ],
      },
      {
        heading: "Navigation",
        paragraphs: [
          "A file in app/ is a route. It has a URL, so a deep link is the same path the screen already uses.",
          "Expo Router v56 forked the React Navigation internals. Old React Navigation imports move to expo-router/react-navigation. Expo ships a codemod for that edit. After it, you follow one release train. Native tabs and stacks, API routes, and server components live in the same folder.",
          "The file rules take an afternoon. I would budget that afternoon before the first feature, not during it.",
        ],
      },
      {
        heading: "Local data",
        paragraphs: [
          "These are two jobs.",
          "Expo SQLite is the database already on the phone. Drizzle keeps the schema in TypeScript and the CLI generates the SQL. Drizzle Studio is how I look at rows without building a debug screen. Migrations stay yours. If that work is the thing you wanted to avoid, this pick will annoy you.",
          "MMKV, from Marc Rousavy, holds the small values: theme, an intro-seen flag, a token. The number people repeat is about 30 times AsyncStorage, from JSI and a memory-mapped file. I have not re-run that benchmark. It does not run in Expo Go. A production app needs a dev build anyway.",
        ],
      },
      {
        heading: "State",
        paragraphs: [
          "I do not start a new app's local state in Context. A theme provider is fine. A store that half the tree reads is where the extra renders show up.",
          "Legend State is signal-based. A component reads the field it needs, and the rest of the tree stays put. Jay Meistrich's line, from his App.js Conf 2026 talk, is that state is the large hidden cost, not the list. Persist on device goes through ObservablePersistMMKV. If the app has to work offline and catch up later, there are sync plugins for Supabase and Firebase.",
          "The cost is the model. If you think in reducers, the first week is clumsy. The community is smaller than Zustand. v3 is still moving. I would not rewrite a working Zustand app for sport. I would start the next one here.",
          "TanStack Query is a different job. It owns HTTP: cache, retry, and the loading flag, instead of a useEffect I will forget to cancel. I add it in the same sitting as the Expo template on any app that calls a server.",
        ],
      },
      {
        heading: "Must-haves",
        paragraphs: [
          "FlatList is what the docs show first. I leave it on short screens.",
          "A chat, or a feed with uneven row heights, goes to Legend List v3. It does not ask for an estimated item size. It can open on the newest message and stay pinned while new ones arrive. Same people as Legend State, which is why the two sit together.",
          "A long uniform list, products or posts with the same row, goes to FlashList v2. Swap the component name, recycle the cells, and it runs in Expo Go. FlashList has the larger community when you get stuck. Uneven and chat-like: Legend List. Same row, many times: FlashList.",
          "Forms are React Hook Form plus a Zod schema. The field you are typing in is the one that re-renders. The schema holds the rules, so the screen does not collect a pile of error strings.",
          "Gesture Handler and Reanimated ship with the Expo template. Gesture Handler is the finger: tap, pan, pinch, long press. Reanimated 4 runs that motion on the UI thread. I do not keep a second animation library around just in case.",
        ],
      },
      {
        heading: "Services",
        paragraphs: [
          "EAS is how the binary gets built, how it reaches the stores, how an update goes out, and where an API route can be hosted. Past the free tier it is a bill. I still use it. Standing up the same build, submit, and update path by hand is the slower job.",
          "Clerk is the auth UI. The React Native components got usable over the last year. The lock-in is real. Auth is rarely the part of the app I want to be clever about, so I accept it.",
          "Sentry goes in before the first TestFlight or internal track. Without it, the first crash is a guess. It also does session replay now. Turn that on only after you know what it records.",
          "RevenueCat is the purchase SDK. The name people mistype is RevenueKit. It can build the paywall and create the store products. You still have to read the store rejection email yourself.",
          "CodeRabbit reads the pull request, summarizes it, and marks the weak spots. Useful when you are the only reviewer. You still have to read the review. A summary is not a pass.",
          "PostHog is product analytics, session replay, feature flags, and surveys, and it has a React Native SDK. Before the first event, write down which ones may leave the device.",
        ],
      },
      {
        heading: "Backend",
        paragraphs: [
          "Plenty of teams already have a server. If I am choosing, I choose Supabase: Postgres, auth, storage, edge functions. You have to be willing to write some SQL. galaxies.dev runs on it, which is Simon's reason. Mine is that I would rather learn SQL once than invent a second data model.",
          "If SQL is a no, I would try Instant. It is closer to Firebase than to Postgres, and the client tooling is the part that has impressed people who used it for a real app, Simon included.",
          "The third option is an Expo API route on EAS Hosting. That is where an OpenAI key lives: env file on the server, called from the route, never shipped in the binary. Right size for a secret and a thin handler. Wrong size for billing rules or a job queue.",
        ],
      },
      {
        heading: "UI",
        paragraphs: [
          "I still start with StyleSheet. The coding agents know it, and a lot of screens do not need a styling framework.",
          "When the app needs breakpoints, variants, or a theme without leaving that shape, I move to react-native-unistyles. You replace StyleSheet.create and keep most of the call sites. The overhead over plain StyleSheet is small.",
          "Uniwind is the Tailwind path, from the same author. I use it when the person writing the styles already thinks in utilities. The cost is that mental model, not raw speed. If nobody on the app wants Tailwind, do not adopt it to look current.",
          "Expo UI is the native rung. It wraps SwiftUI and Jetpack Compose components. What is wrapped feels like the platform. What is missing, you build yourself. Start at StyleSheet. Move one step when a screen forces it. Four styling libraries in one app is how a simple color change takes a day.",
        ],
      },
      {
        heading: "Questions I keep getting",
        paragraphs: [
          "What React Native stack should I use in 2026? For a new production app I use Expo SDK 58 and TypeScript, Expo Router, Expo SQLite with Drizzle, MMKV, Legend State, TanStack Query, and either Legend List or FlashList. Forms are React Hook Form and Zod. Motion is Gesture Handler and Reanimated. I ship with EAS, Clerk, Sentry, RevenueCat, CodeRabbit, and PostHog. The backend is Supabase, Instant, or an Expo API route.",
          "Should I use Expo or the React Native CLI? Use Expo. The React Native docs send new apps there, and the eject threads are mostly stale. Simon Grimm puts the bare-workflow case at about two percent of apps. Everyone else can start with npx create-expo-app@latest and a dev build.",
          "Legend State or Zustand? Legend State, if the app is new. A screen can subscribe to one field. Persist is ObservablePersistMMKV, not a second library you wire by hand. Zustand is easier to hire for. I would leave a working Zustand app alone. I would not start the next one on Context.",
          "Legend List or FlashList? Legend List for chat and for feeds with uneven row heights. FlashList for a large grid where every row is the same shape. Both replace FlatList once the list is long enough to hitch. FlashList runs in Expo Go. Legend List is the one I pair with Legend State.",
          "Do I need Supabase? No. Supabase is the pick when you want Postgres. Instant is the pick when you do not want SQL. An Expo API route is enough when the only server job is hiding a secret. If the company already has an API, call that and put TanStack Query in front of it.",
          "If you ship a different library in one of the nine slots, the useful reply is the name and the bug it saved you from.",
        ],
      },
    ],
  },
]

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
