import type { Metadata } from "next"
import Link from "next/link"

import { contributorInitials } from "@/lib/contributor-initials"

// The route's own title; it merges with the root metadata rather than
// replacing it (ticket 12 step 6). No openGraph block — see
// app/contributors/page.tsx:29-42 for why that is deliberate.
export const metadata: Metadata = {
  title: "About",
  description:
    "What the rnui.dev catalogue is, who maintains it, and their other projects.",
}

// One external link per project, in the CONTRIBUTE column's treatment
// (Catalogue.dc.html:151-155): the link in acc at 11.5px with the ↗ the mock
// puts on every external link, then its kind in the mono eyebrow treatment.
const PROJECTS = [
  {
    name: "NotionKeys for Markdown",
    href: "https://github.com/mrpmohiburrahman/notionkeys-for-markdown",
    kind: "VS CODE EXTENSION",
  },
  {
    name: "Similar React Native Libraries",
    href: "https://chromewebstore.google.com/detail/similar-react-native-libr/pnmdlpajhacfhnfhonedgbiempafafbn",
    kind: "CHROME EXTENSION",
  },
  {
    name: "react-native-squish-button",
    href: "https://github.com/mrpmohiburrahman/react-native-squish-button",
    kind: "REACT NATIVE COMPONENT",
  },
  {
    // Fixed by ticket 12: this used to point at the squish-button repo, the
    // same URL as the recording directly above it.
    name: "react-native-cone-slider",
    href: "https://github.com/mrpmohiburrahman/react-native-cone-slider",
    kind: "REACT NATIVE COMPONENT",
  },
]

// The Detail's link row, inlined (recording-detail.tsx:538-556) because that
// helper is private and this page carries the maintainer's three networks, not
// a Recording's. An absent id states the absence rather than faking a link.
function socialLink(id: string | undefined, name: string) {
  if (!id) return <span className="text-xs text-t3">{name} not listed</span>
  const url =
    name === "X"
      ? `https://twitter.com/${id}`
      : name === "GitHub"
        ? `https://github.com/${id}`
        : `https://linkedin.com/in/${id}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-acc underline underline-offset-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"
    >
      {name} ↗
    </a>
  )
}

export default function AboutPage() {
  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        ABOUT
      </span>
      <h1 className="m-0 text-hero text-t1">About rnui.dev</h1>

      {/* The two claims the maintainer confirmed are true (ticket 12 open
          question 1): the availability badge stays, and the developer line is
          the page's lede. Both retokened — no literal colour. */}
      <div className="mt-[10px] flex items-center gap-[8px] rounded-badge border border-line bg-acc-soft px-[9px] py-[5px]">
        <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-acc" />
        <span className="font-mono text-[9px] tracking-[0.14em] text-t1">
          AVAILABLE FOR WORK
        </span>
      </div>
      <p className="mt-[10px] max-w-[520px] text-[13px] leading-[1.5] text-t2">
        Mobile App Developer (React Native)
      </p>

      {/* What this is */}
      <section className="mt-10">
        <h2 className="m-0 text-section text-t1">What this is</h2>
        <p className="mt-3 max-w-[520px] text-[13px] leading-[1.55] text-t2">
          This is the place to see what a React Native component actually does
          before you add it: each recording is played on a real device, and its
          view and vote counts are public. The catalogue is maintained by the
          community, for the community — the source is open, and every recording
          names its contributor.
        </p>
      </section>

      {/* Who maintains it — the Detail's Contributor card verbatim
          (Detail.dc.html:51-58), with the eyebrow changed to MAINTAINED BY. */}
      <section className="mt-10">
        <h2 className="m-0 text-section text-t1">Who maintains it</h2>
        <div className="mt-3 flex items-start gap-3 rounded-panel border border-line bg-well p-3.5">
          <div
            aria-hidden
            className="flex-none w-[38px] h-[38px] rounded-[10px] bg-acc-soft border border-line flex items-center justify-center font-mono text-[11px] text-acc"
          >
            {contributorInitials("MD. MOHIBUR RAHMAN")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="pb-[3px] font-mono text-[8.5px] tracking-[0.14em] text-t3">
              MAINTAINED BY
            </div>
            <div className="text-[14px] leading-[1.3] text-t1 [overflow-wrap:anywhere]">
              MD. MOHIBUR RAHMAN
            </div>
            <div className="flex flex-wrap gap-2.5 pt-[7px]">
              {socialLink("mrpmohiburrahman", "GitHub")}
              {socialLink(undefined, "X")}
              {socialLink(undefined, "LinkedIn")}
            </div>
            <div className="pt-2 text-[11.5px] leading-[1.45] text-t2">
              React Native developer with 4 years of experience, 3 of them
              remote. Active contributor to popular open-source projects and
              maintainer of React Native components, Chrome extensions and VS
              Code extensions used by the community. Some native Android and iOS
              experience too — widgets, integrations and performance work.
            </div>
          </div>
        </div>
      </section>

      {/* Other projects — the CONTRIBUTE column's treatment
          (Catalogue.dc.html:151-155). */}
      <section className="mt-10">
        <h2 className="m-0 text-section text-t1">Other projects</h2>
        <ul className="mt-3 flex flex-col gap-[10px]">
          {PROJECTS.map((project) => (
            <li
              key={project.name}
              className="flex flex-col items-start gap-[2px]"
            >
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11.5px] text-acc underline underline-offset-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"
              >
                {project.name} <span aria-hidden="true">↗</span>
              </a>
              <span className="pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
                {project.kind}
              </span>
            </li>
          ))}
        </ul>

        {/* Hire Me — a real destination now, never href="#" (ticket 12). */}
        <Link
          href="/contactus"
          className="mt-8 inline-block rounded-[9px] bg-acc px-[13px] py-[9px] text-[12.5px] font-medium text-on-acc focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
        >
          Hire me
        </Link>
      </section>
    </div>
  )
}
