// components/prototype/subscribe-popup-spacing-prototype.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/subscribe-popup/`.
//
// The chosen disclosure (option C: address behind the policy link) at three
// levels of breathing room, so the maintainer can point at the one that is not
// cramped. Copy is fixed across all three so only the spacing is being judged.
//
// WHAT WAS CRAMPED, and the measurement behind each fix:
//
//   1. The field row. The panel is w-[320px] with p-[16px], so the content box
//      is 288px. Input and button sat side by side with gap-[9px]; the button
//      ("Subscribe", text-[11.5px], px-[14px]) measures about 88px, leaving the
//      input roughly 190px — narrower than the footer's own max-w-[220px]. Two
//      controls sharing one line is the main squeeze.
//   2. The disclosure at text-[10.5px] leading-[1.45]. Small enough that the
//      legal paragraph reads as texture rather than words.
//   3. Vertical gaps of 6px to 10px between every element, so the block reads
//      as one dense stack with no grouping.
//
// Variants keep the GateModal shell and change only the interior:
//
//   1 — Stack   Field full width, button full width under it. 320px shell kept.
//   2 — Air     As 1, plus the wider rhythm and the larger disclosure type.
//   3 — Room    As 2, at 400px. DEVIATES from ticket 03's "same centered modal
//               as GateModal" on width alone; everything else still matches.
//
// 1 and 2 keep the shell ticket 03 locked. 3 breaks it, and says so.

"use client"

import Link from "next/link"

import { PRIVACY_PATH, SIGNUP_PROMISE } from "@/lib/sender-identity"

type VariantKey = "1" | "2" | "3"

const HEADLINE = "Get the Digest"

/**
 * The pitch line. It does NOT say "unsubscribe anytime", which an earlier
 * draft did: the disclosure below already says "Unsubscribe any time", ten
 * pixels away, and saying the same thing twice is half of what made this card
 * look cramped.
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

/**
 * Option C, chosen. Same string the real SIGNUP_DISCLOSURE_BODY will carry.
 *
 * Two clauses came out of this one. "link in every email" explained where the
 * unsubscribe control lives, which is true of every email ever sent and adds
 * nothing at the moment of capture. CASL s.4(e) wants a statement that consent
 * can be withdrawn, which "Unsubscribe any time" is on its own; the mechanism
 * is evidenced by the stored record and by the link actually being in the mail
 * (lib/sender-identity.ts IDENTITY_BLOCK_HTML, and the Digest footer that
 * follows it).
 */
const DISCLOSURE_BODY =
  "Sent by MD. MOHIBUR RAHMAN from rnui.dev. Unsubscribe any time."
/**
 * The stock sentence, unchanged from what already ships
 * (lib/sender-identity.ts SIGNUP_DISCLOSURE_POLICY_SENTENCE). The chosen draft
 * had "for our postal address and how we handle your data" appended, on the
 * theory that naming what the link holds would satisfy CASL s.4(d). It does not
 * help: the address is one click away either way, and no page on this site
 * describes a policy link that way. The policy already prints the address at
 * app/privacypolicy/page.tsx:143, which is the honest place for it.
 */
const DISCLOSURE_POLICY = "See our Privacy Policy."

const VARIANTS: {
  key: VariantKey
  name: string
  note: string
  width: string
  gapField: string
  inputH: string
  fieldStack: boolean
  promiseTop: string
  promiseBottom: string
  disclosureMargin: string
  disclosureText: string
  notNowMargin: string
}[] = [
  {
    key: "1",
    name: "Stack",
    note: "Field and button stop sharing a line. Shell still 320px.",
    width: "w-[320px]",
    gapField: "gap-[8px]",
    inputH: "h-[38px]",
    fieldStack: true,
    promiseTop: "pt-[6px]",
    promiseBottom: "pb-[14px]",
    disclosureMargin: "mt-[12px]",
    disclosureText: "text-[10.5px] leading-[1.45]",
    notNowMargin: "mt-[10px]",
  },
  {
    key: "2",
    name: "Air",
    note: "Same stack, wider gaps and the disclosure at a readable size.",
    width: "w-[320px]",
    gapField: "gap-[9px]",
    inputH: "h-[40px]",
    fieldStack: true,
    promiseTop: "pt-[8px]",
    promiseBottom: "pb-[18px]",
    disclosureMargin: "mt-[16px]",
    disclosureText: "text-[11.5px] leading-[1.55]",
    notNowMargin: "mt-[14px]",
  },
  {
    key: "3",
    name: "Room",
    note: "As 2 at 400px. Breaks ticket 03 on width. Everything else matches.",
    width: "w-[400px]",
    gapField: "gap-[9px]",
    inputH: "h-[40px]",
    fieldStack: true,
    promiseTop: "pt-[8px]",
    promiseBottom: "pb-[18px]",
    disclosureMargin: "mt-[16px]",
    disclosureText: "text-[11.5px] leading-[1.55]",
    notNowMargin: "mt-[14px]",
  },
]

function Disclosure({ v }: { v: (typeof VARIANTS)[number] }) {
  return (
    <p className={`text-t3 ${v.disclosureMargin} ${v.disclosureText}`}>
      {DISCLOSURE_BODY}{" "}
      <Link
        href={PRIVACY_PATH}
        className="text-acc underline underline-offset-3 focus-visible:rounded-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
      >
        {DISCLOSURE_POLICY}
      </Link>
    </p>
  )
}

function Field({ v }: { v: (typeof VARIANTS)[number] }) {
  const input = (
    <input
      type="email"
      placeholder="youremail@example.com"
      aria-label={`Email address, variant ${v.key}`}
      className={`${v.inputH} w-full min-w-0 rounded-[10px] border border-line bg-field px-[12px] text-[12.5px] text-t1 placeholder:text-t3 focus:outline-none focus-visible:ring-2 focus-visible:ring-acc`}
    />
  )
  const button = (
    <button
      type="button"
      className={`${v.inputH} shrink-0 rounded-[10px] bg-acc px-[14px] text-[12px] font-medium text-on-acc transition-colors duration-120 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3`}
    >
      Subscribe
    </button>
  )

  return (
    <div className={`flex ${v.fieldStack ? "flex-col" : "flex-row items-center"} ${v.gapField}`}>
      {input}
      {button}
    </div>
  )
}

function Card({ v }: { v: (typeof VARIANTS)[number] }) {
  return (
    <div
      className={`${v.width} max-w-[calc(100vw-48px)] shrink-0 rounded-card border border-line2 bg-header p-[16px] shadow-2xl`}
    >
      <div className="px-[6px]">
        <h2 className="m-0 text-[15px] font-medium tracking-[-0.01em] text-t1">
          {HEADLINE}
        </h2>
      </div>
      <div className="px-[6px]">
        <p
          className={`m-0 text-[12.5px] leading-[1.5] text-t2 ${v.promiseTop} ${v.promiseBottom}`}
        >
          {PROMISE}
        </p>
        <Field v={v} />
        <Disclosure v={v} />
        <p className={`w-full rounded-[6px] py-[7px] text-center text-[11.5px] text-t3 ${v.notNowMargin}`}>
          Not now
        </p>
      </div>
    </div>
  )
}

export function SubscribePopupSpacingPrototype() {
  return (
    <div className="min-h-screen bg-page">
      <div className="border-b border-line bg-field/60 px-[26px] py-[10px] font-mono text-[10.5px] text-t3">
        PROTOTYPE · option C copy, three spacings · same popup shell in all
        three · 1 and 2 keep the 320px width ticket 03 locked, 3 does not
      </div>

      <div className="px-[26px] py-[36px]">
        <div className="flex flex-wrap items-start justify-center gap-[36px]">
          {VARIANTS.map((v) => (
            <div key={v.key} className="flex flex-col items-center gap-[12px]">
              <div className="font-mono text-[11px] text-t3">
                {v.key} · {v.name}
              </div>
              <Card v={v} />
              <p className="max-w-[400px] text-center text-[11px] leading-[1.5] text-t3">
                {v.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-[52px] max-w-[900px] border-t border-line pt-[20px] text-[11.5px] leading-[1.6] text-t3">
          <p className="m-0">
            The copy is option C throughout, so nothing else moves between the
            three. Narrow the window to phone width and 1 and 2 fill the
            screen edge to edge against the same 48px gutter; 3 stops at 400px
            and leaves more page visible behind it.
          </p>
        </div>
      </div>
    </div>
  )
}