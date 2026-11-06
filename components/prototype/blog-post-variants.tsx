/**
 * Three radically different layouts for the same Legend Stack post.
 * Question: what should this blog post look like on rnui.dev?
 * Content is fixed; only structure and illustration treatment change.
 */

import Link from "next/link"

import {
  IlluBackend,
  IlluEditor,
  IlluFAQ,
  IlluFramework,
  IlluHero,
  IlluLocalData,
  IlluMustHaves,
  IlluNavigation,
  IlluNineAreas,
  IlluServices,
  IlluState,
  IlluUI,
} from "@/components/prototype/blog-illustrations"

const FOCUS_LINK =
  "text-acc underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acc focus-visible:outline-offset-4"

const NINE = [
  {
    area: "Framework",
    pick: "Expo SDK 58, TypeScript",
    limit: "Move an old SDK up a couple of versions at a time",
  },
  {
    area: "Editor",
    pick: "Herdr for agents, Zed for hand edits",
    limit: "A brand-new agent harness can lag a few days",
  },
  {
    area: "Navigation",
    pick: "Expo Router",
    limit: "Since v56, old React Navigation imports need a one-time codemod",
  },
  {
    area: "Local data",
    pick: "Expo SQLite + Drizzle, MMKV for small values",
    limit: "You own migrations. MMKV needs a dev build",
  },
  {
    area: "State",
    pick: "Legend State, TanStack Query for HTTP",
    limit: "Observable model is new. Smaller community than Zustand",
  },
  {
    area: "Must-haves",
    pick: "Legend List or FlashList, React Hook Form + Zod, Gesture Handler, Reanimated",
    limit: "Chat and uneven feeds use Legend List. Uniform grids use FlashList",
  },
  {
    area: "Services",
    pick: "EAS, Clerk, Sentry, RevenueCat, CodeRabbit, PostHog",
    limit: "EAS costs money past the free tier. Decide which analytics events may leave the phone",
  },
  {
    area: "Backend",
    pick: "Supabase, Instant, or Expo API routes",
    limit: "Supabase means SQL. An API route is a thin handler, not a full backend",
  },
  {
    area: "UI",
    pick: "StyleSheet, then Unistyles, Uniwind, or Expo UI",
    limit: "Start at StyleSheet. Expo UI does not wrap every native component yet",
  },
]

const SECTIONS = [
  {
    id: "framework",
    illu: IlluFramework,
    title: "Framework",
    paras: [
      "Expo is the framework the React Native docs point new apps at. The forum threads about ejecting describe an older Expo. SDK 58 ships the New Architecture by default. You can still drop into Swift or Kotlin when a library is missing.",
      "The annoying part is the upgrade. If the app sits on a very old SDK, do not jump to 58 in one pull request. Move a couple of SDKs at a time. Simon Grimm's figure for apps that still need the bare workflow is about two percent, usually a requirement Expo cannot host. I have not audited that number.",
    ],
  },
  {
    id: "editor",
    illu: IlluEditor,
    title: "Editor",
    paras: [
      "Herdr is a free, open-source Rust terminal multiplexer for coding agents. I use it when two or three features should move at once, in panes, and I want to see which agent is blocked. New harnesses ship every week. Herdr will miss one of them for a few days.",
      "Zed is the other job. It opens fast. I use it when the fix is one line and waiting on a model is slower than typing. VS Code with Copilot, Windsurf, or Antigravity are fine if that is already where you work. The split is the point: agents in one place, hands in another.",
    ],
  },
  {
    id: "navigation",
    illu: IlluNavigation,
    title: "Navigation",
    paras: [
      "A file in app/ is a route. It has a URL, so a deep link is the same path the screen already uses.",
      "Expo Router v56 forked the React Navigation internals. Old @react-navigation/* imports move to expo-router/react-navigation. Expo ships a codemod for that edit. After it, you follow one release train. Native tabs and stacks, API routes, and server components live in the same folder.",
      "The file rules take an afternoon. I would budget that afternoon before the first feature, not during it.",
    ],
  },
  {
    id: "local-data",
    illu: IlluLocalData,
    title: "Local data",
    paras: [
      "These are two jobs.",
      "Expo SQLite is the database already on the phone. Drizzle keeps the schema in TypeScript and the CLI generates the SQL. Drizzle Studio is how I look at rows without building a debug screen. Migrations stay yours. If that work is the thing you wanted to avoid, this pick will annoy you.",
      "MMKV, from Marc Rousavy, holds the small values: theme, an intro-seen flag, a token. The number people repeat is about 30 times AsyncStorage, from JSI and a memory-mapped file. I have not re-run that benchmark. It does not run in Expo Go. A production app needs a dev build anyway.",
    ],
  },
  {
    id: "state",
    illu: IlluState,
    title: "State",
    paras: [
      "I do not start a new app's local state in Context. A theme provider is fine. A store that half the tree reads is where the extra renders show up.",
      "Legend State is signal-based. A component reads the field it needs, and the rest of the tree stays put. Jay Meistrich's line, from his App.js Conf 2026 talk, is that state is the large hidden cost, not the list. Persist on device goes through ObservablePersistMMKV. If the app has to work offline and catch up later, there are sync plugins for Supabase and Firebase.",
      "The cost is the model. If you think in reducers, the first week is clumsy. The community is smaller than Zustand. v3 is still moving. I would not rewrite a working Zustand app for sport. I would start the next one here.",
      "TanStack Query is a different job. It owns HTTP: cache, retry, and the loading flag, instead of a useEffect I will forget to cancel. I add it in the same sitting as the Expo template on any app that calls a server.",
    ],
  },
  {
    id: "must-haves",
    illu: IlluMustHaves,
    title: "Must-haves",
    paras: [
      "FlatList is what the docs show first. I leave it on short screens.",
      "A chat, or a feed with uneven row heights, goes to Legend List v3. It does not ask for an estimated item size. It can open on the newest message and stay pinned while new ones arrive. Same people as Legend State, which is why the two sit together.",
      "A long uniform list, products or posts with the same row, goes to FlashList v2. Swap the component name, recycle the cells, and it runs in Expo Go. FlashList has the larger community when you get stuck. Uneven and chat-like: Legend List. Same row, many times: FlashList.",
      "Forms are React Hook Form plus a Zod schema. The field you are typing in is the one that re-renders. The schema holds the rules, so the screen does not collect a pile of error strings.",
      "Gesture Handler and Reanimated ship with the Expo template. Gesture Handler is the finger: tap, pan, pinch, long press. Reanimated 4 runs that motion on the UI thread. I do not keep a second animation library around just in case.",
    ],
  },
  {
    id: "services",
    illu: IlluServices,
    title: "Services",
    paras: [
      "EAS is how the binary gets built, how it reaches the stores, how an update goes out, and where an API route can be hosted. Past the free tier it is a bill. I still use it. Standing up the same build, submit, and update path by hand is the slower job.",
      "Clerk is the auth UI. The React Native components got usable over the last year. The lock-in is real. Auth is rarely the part of the app I want to be clever about, so I accept it.",
      "Sentry goes in before the first TestFlight or internal track. Without it, the first crash is a guess. It also does session replay now. Turn that on only after you know what it records.",
      "RevenueCat is the purchase SDK. The name people mistype is RevenueKit. It can build the paywall and create the store products. You still have to read the store rejection email yourself.",
      "CodeRabbit reads the pull request, summarizes it, and marks the weak spots. Useful when you are the only reviewer. You still have to read the review. A summary is not a pass.",
      "PostHog is product analytics, session replay, feature flags, and surveys, and it has a React Native SDK. Before the first event, write down which ones may leave the device.",
    ],
  },
  {
    id: "backend",
    illu: IlluBackend,
    title: "Backend",
    paras: [
      "Plenty of teams already have a server. If I am choosing, I choose Supabase: Postgres, auth, storage, edge functions. You have to be willing to write some SQL. galaxies.dev runs on it, which is Simon's reason. Mine is that I would rather learn SQL once than invent a second data model.",
      "If SQL is a no, I would try Instant. It is closer to Firebase than to Postgres, and the client tooling is the part that has impressed people who used it for a real app, Simon included.",
      "The third option is an Expo API route on EAS Hosting. That is where an OpenAI key lives: env file on the server, called from the route, never shipped in the binary. Right size for a secret and a thin handler. Wrong size for billing rules or a job queue.",
    ],
  },
  {
    id: "ui",
    illu: IlluUI,
    title: "UI",
    paras: [
      "I still start with StyleSheet. The coding agents know it, and a lot of screens do not need a styling framework.",
      "When the app needs breakpoints, variants, or a theme without leaving that shape, I move to react-native-unistyles. You replace StyleSheet.create and keep most of the call sites. The overhead over plain StyleSheet is small.",
      "Uniwind is the Tailwind path, from the same author. I use it when the person writing the styles already thinks in utilities. The cost is that mental model, not raw speed. If nobody on the app wants Tailwind, do not adopt it to look current.",
      "Expo UI is the native rung. It wraps SwiftUI and Jetpack Compose components. What is wrapped feels like the platform. What is missing, you build yourself. Start at StyleSheet. Move one step when a screen forces it. Four styling libraries in one app is how a simple color change takes a day.",
    ],
  },
] as const

const FAQ = [
  {
    q: "What React Native stack should I use in 2026?",
    a: "For a new production app I use Expo SDK 58 and TypeScript, Expo Router, Expo SQLite with Drizzle, MMKV, Legend State, TanStack Query, and either Legend List or FlashList. Forms are React Hook Form and Zod. Motion is Gesture Handler and Reanimated. I ship with EAS, Clerk, Sentry, RevenueCat, CodeRabbit, and PostHog. The backend is Supabase, Instant, or an Expo API route.",
  },
  {
    q: "Should I use Expo or the React Native CLI?",
    a: "Use Expo. The React Native docs send new apps there, and the eject threads are mostly stale. Simon Grimm puts the bare-workflow case at about two percent of apps. Everyone else can start with npx create-expo-app@latest and a dev build.",
  },
  {
    q: "Legend State or Zustand?",
    a: "Legend State, if the app is new. A screen can subscribe to one field. Persist is ObservablePersistMMKV, not a second library you wire by hand. Zustand is easier to hire for. I would leave a working Zustand app alone. I would not start the next one on Context.",
  },
  {
    q: "Legend List or FlashList?",
    a: "Legend List for chat and for feeds with uneven row heights. FlashList for a large grid where every row is the same shape. Both replace FlatList once the list is long enough to hitch. FlashList runs in Expo Go. Legend List is the one I pair with Legend State.",
  },
  {
    q: "Do I need Supabase?",
    a: "No. Supabase is the pick when you want Postgres. Instant is the pick when you do not want SQL. An Expo API route is enough when the only server job is hiding a secret. If the company already has an API, call that and put TanStack Query in front of it.",
  },
]

/* ------------------------------------------------------------------ */
/* Variant A — Editorial magazine                                      */
/* ------------------------------------------------------------------ */

export function VariantA() {
  return (
    <article className="mx-auto max-w-[720px] pb-28">
      <p className="font-mono text-label text-acc">
        REACT NATIVE / STACK / 2026
      </p>
      <h1 className="mt-4 text-detail text-t1">
        The React Native stack I start with in 2026
      </h1>
      <p className="mt-5 text-[17px] leading-7 text-t2">
        Nine-area stack for 2026. Expo SDK 58, Legend State, Expo Router, and
        the limit on each pick.
      </p>
      <p className="mt-5 border-b border-line pb-5 font-mono text-[11px] text-t3">
        2026-11-06 · VIDEO COMPANION
      </p>

      <div className="mt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blog/legend-stack/hero-dev.jpg"
          alt="Laptop screen with code in a dark editor"
          width={1400}
          height={700}
          className="w-full rounded-panel border border-line object-cover"
          fetchPriority="high"
        />
        <p className="mt-2 font-mono text-[10px] text-t3">
          PHOTO · UNSPLASH LICENSE · FREE FOR COMMERCIAL USE
        </p>
      </div>

      <div className="prose-blog mt-10 space-y-6 text-[16px] leading-7 text-t2">
        <p>
          I start a production React Native app in 2026 on Expo SDK 58 and
          TypeScript. Navigation is Expo Router. Local UI state is Legend State.
          HTTP state is TanStack Query. A long list is Legend List or FlashList,
          chosen by the shape of the rows.
        </p>
        <p>
          The service list and the UI ladder come from Simon Grimm&apos;s video,{" "}
          <a
            href="https://youtu.be/LZFEr9QDIVg"
            className={FOCUS_LINK}
            target="_blank"
            rel="noreferrer"
          >
            Choosing the Right React Native Stack in 2026
          </a>
          . State and the editor are the swaps: Legend State instead of Zustand,
          Herdr and Zed instead of Cursor.
        </p>
      </div>

      <div className="mt-12">
        <IlluNineAreas title="Nine areas of the stack" />
      </div>

      <section className="mt-12">
        <h2 className="text-hero text-t1">The nine areas</h2>
        <div className="mt-6 overflow-hidden rounded-panel border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-well">
                <th className="px-4 py-3 font-mono text-label text-t3">AREA</th>
                <th className="px-4 py-3 font-mono text-label text-t3">PICK</th>
                <th className="px-4 py-3 font-mono text-label text-t3">LIMIT</th>
              </tr>
            </thead>
            <tbody>
              {NINE.map((row, i) => (
                <tr
                  key={row.area}
                  className={i % 2 ? "bg-well/50" : ""}
                >
                  <td className="border-b border-line px-4 py-3 align-top font-medium text-t1">
                    {row.area}
                  </td>
                  <td className="border-b border-line px-4 py-3 align-top text-t2">
                    {row.pick}
                  </td>
                  <td className="border-b border-line px-4 py-3 align-top text-t3">
                    {row.limit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-t3">
          Start with{" "}
          <code className="rounded-badge bg-well px-1.5 py-0.5 font-mono text-[12px] text-t1">
            npx create-expo-app@latest
          </code>
          . Use TypeScript from the first commit.
        </p>
      </section>

      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="mt-16 scroll-mt-24">
          <IlluIlluBlock Illu={s.illu} title={s.title} />
          <h2 className="mt-8 text-hero text-t1">{s.title}</h2>
          <div className="mt-5 space-y-5 text-[16px] leading-7 text-t2">
            {s.paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-16" id="faq">
        <IlluIlluBlock Illu={IlluFAQ} title="Questions" />
        <h2 className="mt-8 text-hero text-t1">Questions I keep getting</h2>
        <dl className="mt-6 space-y-8">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-line pb-8">
              <dt className="text-section font-medium text-t1">{item.q}</dt>
              <dd className="mt-3 text-[16px] leading-7 text-t2">{item.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-[16px] leading-7 text-t2">
          If you ship a different library in one of the nine slots, the useful
          reply is the name and the bug it saved you from.
        </p>
      </section>

      <footer className="mt-16 rounded-panel border border-line bg-well p-6">
        <p className="font-mono text-label text-acc">BROWSE</p>
        <p className="mt-3 text-sm text-t2">
          The stack helps you choose tools. The catalogue shows React Native UI
          through community Recordings.
        </p>
        <Link href="/" className={`mt-4 inline-block text-sm ${FOCUS_LINK}`}>
          Browse community Recordings →
        </Link>
      </footer>
    </article>
  )
}

function IlluIlluBlock({
  Illu,
  title,
}: {
  Illu: (props: { className?: string; title?: string }) => React.ReactElement
  title: string
}) {
  return (
    <div className="overflow-hidden rounded-panel">
      <Illu title={`Illustration for ${title}`} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Variant B — Reference manual                                        */
/* ------------------------------------------------------------------ */

export function VariantB() {
  return (
    <div className="flex gap-8 pb-28">
      <aside className="sticky top-20 hidden w-[220px] shrink-0 self-start lg:block">
        <p className="font-mono text-label text-acc">ON THIS PAGE</p>
        <nav className="mt-4 space-y-2 border-l border-line pl-3 text-[13px] leading-5">
          <a href="#overview" className="block text-t2 hover:text-t1">
            Overview
          </a>
          <a href="#nine" className="block text-t2 hover:text-t1">
            Nine areas
          </a>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block text-t2 hover:text-t1">
              {s.title}
            </a>
          ))}
          <a href="#faq" className="block text-t2 hover:text-t1">
            FAQ
          </a>
        </nav>
      </aside>

      <article className="min-w-0 flex-1">
        <p className="font-mono text-label text-acc">GUIDE / REFERENCE</p>
        <h1 className="mt-3 max-w-[720px] text-detail text-t1">
          The React Native stack I start with in 2026
        </h1>
        <p className="mt-4 max-w-[640px] text-sm leading-6 text-t2">
          Nine areas. One pick each. The limit under every pick is what a logo
          list usually leaves out.
        </p>
        <p className="mt-4 border-b border-line pb-4 font-mono text-[11px] text-t3">
          UPDATED 2026-11-06 · EXPO SDK 58
        </p>

        <section id="overview" className="mt-8 scroll-mt-24">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-panel border border-line bg-well p-5">
              <p className="font-mono text-label text-t3">START HERE</p>
              <p className="mt-3 font-mono text-[13px] leading-6 text-t1">
                npx create-expo-app@latest
              </p>
              <p className="mt-3 text-sm leading-6 text-t2">
                TypeScript from the first commit. Dev build when a library needs
                native code.
              </p>
            </div>
            <div className="rounded-panel border border-line bg-well p-5">
              <p className="font-mono text-label text-t3">SOURCES</p>
              <p className="mt-3 text-sm leading-6 text-t2">
                Service list and UI ladder from Simon Grimm&apos;s video. State
                and editor are my swaps: Legend State, Herdr, Zed.
              </p>
              <a
                href="https://youtu.be/LZFEr9QDIVg"
                className={`mt-3 inline-block text-sm ${FOCUS_LINK}`}
                target="_blank"
                rel="noreferrer"
              >
                Watch the video →
              </a>
            </div>
          </div>
        </section>

        <section id="nine" className="mt-10 scroll-mt-24">
          <h2 className="text-section text-t1">1 · The nine areas</h2>
          <div className="mt-4 rounded-panel border border-line">
            <IlluNineAreas title="Nine areas map" className="border-0" />
          </div>
          <div className="mt-4 overflow-x-auto rounded-panel border border-line">
            <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-well">
                  <th className="px-3 py-2.5 font-mono text-label text-t3">AREA</th>
                  <th className="px-3 py-2.5 font-mono text-label text-t3">PICK</th>
                  <th className="px-3 py-2.5 font-mono text-label text-t3">LIMIT</th>
                </tr>
              </thead>
              <tbody>
                {NINE.map((row, i) => (
                  <tr key={row.area} className={i % 2 ? "bg-well/40" : ""}>
                    <td className="border-b border-line px-3 py-2.5 align-top font-medium text-t1">
                      {row.area}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 align-top text-t2">
                      {row.pick}
                    </td>
                    <td className="border-b border-line px-3 py-2.5 align-top text-t3">
                      {row.limit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {SECTIONS.map((s, idx) => (
          <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-label text-acc">
                {String(idx + 2).padStart(2, "0")}
              </span>
              <h2 className="text-section text-t1">{s.title}</h2>
            </div>
            <div className="mt-3 overflow-hidden rounded-panel border border-line">
              <s.illu title={`Illustration for ${s.title}`} />
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-t2">
              {s.paras.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section id="faq" className="mt-10 scroll-mt-24">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-label text-acc">11</span>
            <h2 className="text-section text-t1">FAQ</h2>
          </div>
          <div className="mt-3 overflow-hidden rounded-panel border border-line">
            <IlluFAQ title="FAQ" />
          </div>
          <div className="mt-4 divide-y divide-line rounded-panel border border-line">
            {FAQ.map((item) => (
              <div key={item.q} className="p-4">
                <p className="text-sm font-medium text-t1">{item.q}</p>
                <p className="mt-2 text-sm leading-6 text-t2">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-t2">
            If you ship a different library in one of the nine slots, the useful
            reply is the name and the bug it saved you from.
          </p>
        </section>
      </article>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Variant C — Story / scrollytelling                                  */
/* ------------------------------------------------------------------ */

export function VariantC() {
  return (
    <div className="pb-28">
      <header className="relative mx-auto max-w-[960px]">
        <IlluHero title="Stack hero illustration" />
        <div className="relative -mt-24 px-2">
          <div className="rounded-panel border border-line bg-panel/95 p-6 shadow-e2 backdrop-blur-sm md:p-8">
            <p className="font-mono text-label text-acc">
              THE LEGEND STACK · 2026
            </p>
            <h1 className="mt-3 text-detail text-t1">
              The React Native stack I start with in 2026
            </h1>
            <p className="mt-4 max-w-[560px] text-[16px] leading-7 text-t2">
              Nine areas. One pick each. Limits included. Built from Simon
              Grimm&apos;s breakdown and my own swaps.
            </p>
            <p className="mt-4 font-mono text-[11px] text-t3">
              2026-11-06 · EXPO SDK 58 · LEGEND STATE
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-14 max-w-[960px] px-2">
        <div className="grid gap-10 md:grid-cols-[200px_1fr]">
          <aside className="sticky top-20 hidden h-fit md:block">
            <p className="font-mono text-label text-acc">JUMP</p>
            <nav className="mt-3 space-y-1.5 border-l border-line pl-3 text-[12.5px]">
              <a href="#areas" className="block text-t2 hover:text-t1">
                Nine areas
              </a>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-t2 hover:text-t1"
                >
                  {s.title}
                </a>
              ))}
              <a href="#faq" className="block text-t2 hover:text-t1">
                FAQ
              </a>
            </nav>
          </aside>

          <div className="min-w-0">
            <section id="areas" className="scroll-mt-24">
              <div className="rounded-panel border border-line bg-well p-6">
                <p className="font-mono text-label text-t3">THE TABLE</p>
                <h2 className="mt-3 text-hero text-t1">The nine areas</h2>
                <div className="mt-5 space-y-3">
                  {NINE.map((row, i) => (
                    <div
                      key={row.area}
                      className="flex flex-col gap-1 rounded-chip border border-line bg-panel px-4 py-3 sm:flex-row sm:gap-4"
                    >
                      <span className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-wider text-acc">
                        {String(i + 1).padStart(2, "0")} {row.area}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-t1">
                        {row.pick}
                      </span>
                      <span className="text-sm text-t3 sm:max-w-[240px]">
                        {row.limit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {SECTIONS.map((s, i) => {
              const flip = i % 2 === 1
              return (
                <section
                  key={s.id}
                  id={s.id}
                  className="mt-16 scroll-mt-24"
                >
                  <div
                    className={`grid items-center gap-8 ${
                      flip ? "md:grid-cols-[1fr_1fr]" : "md:grid-cols-[1fr_1fr]"
                    }`}
                  >
                    <div
                      className={
                        flip ? "md:order-2" : "md:order-1"
                      }
                    >
                      <p className="font-mono text-label text-acc">
                        CHAPTER {String(i + 1).padStart(2, "0")}
                      </p>
                      <h2 className="mt-3 text-hero text-t1">{s.title}</h2>
                      <div className="mt-4 space-y-4 text-[15px] leading-7 text-t2">
                        {s.paras.map((p, j) => (
                          <p key={j}>{p}</p>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`${flip ? "md:order-1" : "md:order-2"}`}
                    >
                      <s.illu title={`Illustration for ${s.title}`} />
                    </div>
                  </div>
                </section>
              )
            })}

            <section id="faq" className="mt-16 scroll-mt-24">
              <div className="rounded-panel border border-line bg-well p-6">
                <IlluFAQ title="FAQ" className="border-0 bg-transparent" />
                <h2 className="mt-6 text-hero text-t1">
                  Questions I keep getting
                </h2>
                <div className="mt-6 space-y-6">
                  {FAQ.map((item, i) => (
                    <div
                      key={item.q}
                      className="rounded-panel border border-line bg-panel p-5"
                    >
                      <p className="font-mono text-label text-acc">
                        Q{String(i + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-section font-medium text-t1">
                        {item.q}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-t2">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-[15px] leading-7 text-t2">
                  If you ship a different library in one of the nine slots, the
                  useful reply is the name and the bug it saved you from.
                </p>
              </div>
            </section>

            <footer className="mt-14 rounded-panel border border-line p-6">
              <p className="font-mono text-label text-acc">NEXT</p>
              <p className="mt-3 text-sm text-t2">
                Browse community Recordings on the catalogue.
              </p>
              <Link
                href="/"
                className={`mt-4 inline-block text-sm ${FOCUS_LINK}`}
              >
                Open the catalogue →
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
