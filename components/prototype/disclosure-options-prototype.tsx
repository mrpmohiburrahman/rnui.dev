// components/prototype/disclosure-options-prototype.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/subscribe-popup/`.
//
// The consent paragraph, three ways, side by side, inside the real popup
// shell. The maintainer asked to see all the options before choosing, so this
// page exists only to render that choice; it is not part of the popup.
//
// The question behind the three: the paragraph currently prints the
// maintainer's postal address, because CASL's Electronic Commerce Protection
// Regulations s.4(d) requires a consent request to carry "the mailing
// address" of the person seeking consent. The same address is required a
// second time, independently, by CAN-SPAM 16 CFR 316.4(c)(1) — but that one
// binds the MESSAGE, so it belongs in the Digest footer, not on the site.
// Two obligations, two places, and the site one is the one that can go.
//
// Nothing here is wired to lib/sender-identity.ts. Each option hardcodes its
// own copy so the three can be compared as strings; whichever wins is written
// back into SIGNUP_DISCLOSURE_BODY with CONSENT_FORM_VERSION bumped, because
// that string is the consent evidence stored on every record.
//
//   A — keep the address (today's wording, frequency promise fixed)
//   B — drop the address from the site, keep it in the Digest footer
//   C — keep a short identity line, full address behind the policy link
//
// CAN-SPAM's address is never optional in what gets sent, so every option
// here says so out loud rather than pretending the obligation disappears.

"use client"

import Link from "next/link"

import { PRIVACY_PATH, SIGNUP_PROMISE } from "@/lib/sender-identity"

type OptionKey = "A" | "B" | "C"

const HEADLINE = "Get the Digest"

/**
 * The pitch line. It does NOT say "unsubscribe anytime", which an earlier
 * draft did: the disclosure below already says "Unsubscribe any time", ten
 * pixels away, and reading the same promise twice is half of what made this
 * card feel cramped.
 *
 * The disclosure is the one that counts, and not by taste. subscribeEmail
 * stores `consentText: SIGNUP_DISCLOSURE` on every record
 * (app/actions/subscribe-email.ts:127), and that constant is the grey
 * paragraph alone. The pitch line is never stored, never sent in the
 * confirmation email, and never asserted in tests. CASL s.4(e)'s withdrawal
 * statement therefore has to be in the disclosure, so that is where it stays.
 *
 * Read from the real constant, not restated here, so the prototype cannot show
 * copy that the shipped form does not.
 */
const PROMISE = SIGNUP_PROMISE

type Disclosure = {
  /** The paragraph as it would render under the email field. */
  text: string
}

const OPTIONS: Record<OptionKey, Disclosure> = {
  A: {
    text:
      "Sent by MD. MOHIBUR RAHMAN, Halima Nagar, Cumilla 3502, Bangladesh, " +
      "hello@rnui.dev. No sponsor mail, no third-party marketing, and your " +
      "address is never shared. Unsubscribe any time, link in every email. " +
      "See our Privacy Policy.",
  },
  B: {
    text:
      "Sent by MD. MOHIBUR RAHMAN from rnui.dev. No sponsor mail, no " +
      "third-party marketing, and your address is never shared. Unsubscribe " +
      "any time, link in every email. See our Privacy Policy.",
  },
  C: {
    // CHOSEN, and now shipped: this is the live SIGNUP_DISCLOSURE_BODY. Two
    // clauses came out of this one, both at the maintainer's
    // instruction. "link in every email" explained where the unsubscribe
    // control lives, which is true of every email ever sent and adds nothing
    // at the moment of capture; CASL s.4(e) wants a statement that consent can
    // be withdrawn, which "Unsubscribe any time" is on its own. And the earlier
    // draft ended "for our postal address and how we handle your data", on the
    // theory that naming what the link holds would satisfy s.4(d). It does not
    // help, and no page on this site describes a policy link that way. The
    // policy already prints the address at app/privacypolicy/page.tsx:143,
    // which is the honest place for it.
    text:
      "Sent by MD. MOHIBUR RAHMAN from rnui.dev. Unsubscribe any time. " +
      "See our Privacy Policy.",
  },
}

/** What each option costs, stated in the page rather than in a ticket. */
const TRADEOFF: Record<OptionKey, string> = {
  A:
    "Today. Nothing changes. CASL s.4(d) is satisfied on the site itself and CAN-SPAM is satisfied in the Digest footer.",
  B:
    "CASL s.4(d) is no longer satisfied on the site, so consent from a Canadian signup is formally defective. Low real risk while there is no sponsor or paid link; CASL only reaches commercial email. It stops being low the day that changes.",
  C:
    "CHOSEN. The address leaves the site and stays in the Privacy Policy, which already prints it in full. CASL s.4(d) is not satisfied by a link, which is the same exposure as B — the difference is B kept the no-sponsor-mail promise and C did not.",
}

const LINK_TEXT =
  "See our Privacy Policy."

/**
 * The paragraph, laid out with the metrics `SignupDisclosure` uses
 * (`mt-[8px] text-[10.5px] leading-[1.45] text-t3`), so line count and density
 * compare honestly between the three.
 *
 * All three are split the same way: the policy sentence is cut off the end so
 * it can render as a real link, exactly as SignupDisclosure does. Option A only
 * looks different because it carries more text before that point.
 */
function Disclosure({ option }: { option: OptionKey }) {
  const { text } = OPTIONS[option]
  const link = (
    <Link
      href={PRIVACY_PATH}
      className="text-acc underline underline-offset-3 focus-visible:rounded-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
    >
      {LINK_TEXT}
    </Link>
  )

  // Each option's copy ends with the policy sentence as plain text, so cutting
  // it off the end is what lets it render as a link.
  const idx = text.lastIndexOf(LINK_TEXT)
  const body = idx === -1 ? text : text.slice(0, idx).trim()

  return (
    <p className="mt-[8px] text-[10.5px] leading-[1.45] text-t3">
      {body}{" "}
      {link}
    </p>
  )
}

function Card({ option }: { option: OptionKey }) {
  return (
    <div className="w-[320px] max-w-full shrink-0 rounded-card border border-line2 bg-header p-[16px] shadow-2xl">
      <div className="px-[6px]">
        <h2 className="m-0 text-[15px] font-medium tracking-[-0.01em] text-t1">
          {HEADLINE}
        </h2>
      </div>
      <div className="px-[6px]">
        <p className="m-0 pb-[10px] pt-[6px] text-[12.5px] leading-[1.5] text-t2">
          {PROMISE}
        </p>
        <div className="flex items-center gap-[9px]">
          <input
            type="email"
            placeholder="youremail@example.com"
            aria-label={`Email address, option ${option}`}
            className="h-[34px] w-full min-w-0 rounded-[10px] border border-line bg-field px-[11px] text-[12px] text-t1 placeholder:text-t3 focus:outline-none focus-visible:ring-2 focus-visible:ring-acc"
          />
          <button
            type="button"
            className="h-[34px] shrink-0 rounded-[9px] bg-acc px-[14px] text-[11.5px] font-medium text-on-acc transition-colors duration-120 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
          >
            Subscribe
          </button>
        </div>
        <Disclosure option={option} />
        <p className="mt-[8px] w-full rounded-[6px] py-[6px] text-center text-[11.5px] text-t3">
          Not now
        </p>
      </div>
    </div>
  )
}

function OptionColumn({ option }: { option: OptionKey }) {
  const names: Record<OptionKey, string> = {
    A: "Keep the address",
    B: "Address off the site",
    C: "Address behind the link",
  }
  return (
    <div className="flex flex-col items-center gap-[12px]">
      <div className="text-center">
        <div className="font-mono text-[11px] text-t3">
          {option} · {names[option]}
        </div>
      </div>
      <Card option={option} />
      <p className="max-w-[320px] text-center text-[11px] leading-[1.5] text-t3">
        {TRADEOFF[option]}
      </p>
    </div>
  )
}

export function DisclosureOptionsPrototype() {
  return (
    <div className="min-h-screen bg-page">
      <div className="border-b border-line bg-field/60 px-[26px] py-[10px] font-mono text-[10.5px] text-t3">
        PROTOTYPE · consent paragraph, three ways · same popup shell, same
        field, same button — only the small grey paragraph differs · narrow the
        window to phone width and each card is still the same centered 320px
        modal
      </div>

      <div className="px-[26px] py-[32px]">
        <div className="flex flex-wrap items-start justify-center gap-[40px]">
          <OptionColumn option="A" />
          <OptionColumn option="B" />
          <OptionColumn option="C" />
        </div>

        <div className="mx-auto mt-[48px] max-w-[900px] border-t border-line pt-[20px] text-[11.5px] leading-[1.6] text-t3">
          <p className="m-0">
            All three send the postal address in every Digest footer. That one
            is CAN-SPAM 16 CFR 316.4(c)(1) and it binds the message, so it does
            not move. CASL Electronic Commerce Protection Regulations s.4(d)
            binds the consent request on the site, and that is the one these
            three are choosing about.
          </p>
          <p className="m-0 mt-[8px]">
            SHIPPED. All three now read as option C, and that string is live in
            SIGNUP_DISCLOSURE_BODY. The weekly promise left the paragraph and
            the heading together, because the undecided schedule would break
            either one. The frequency now lives in SIGNUP_PROMISE, shown above
            the field on every surface.
          </p>
        </div>
      </div>
    </div>
  )
}