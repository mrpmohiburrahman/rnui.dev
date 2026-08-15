// components/site-footer.tsx
//
// The mock's footer (Catalogue.dc.html:146-164), a server component: it reads no
// URL and no stored set, and the one interactive thing in it — the NOTIFY form —
// is the client component below it. footerBg and railBg are the same two colours
// in both modes, so `bg-rail` is the token that spells it.

import Link from "next/link"

import { DARK_MODE_STAMP, LIGHT_MODE_STAMP } from "@/lib/mode-stamp"
import { SIGNUP_HEADING } from "@/lib/sender-identity"
import { formatUpdatedFull, lastCommitDate } from "@/components/last-updated"
import NewsletterForm from "@/components/newsletter-form"

const LEGAL_LINKS = [
  ["About Us", "/aboutus"],
  ["Contact Us", "/contactus"],
  ["Terms & Conditions", "/termsofservice"],
  ["Privacy Policy", "/privacypolicy"],
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-rail px-[26px] pt-[24px] pb-[30px]">
      <div className="flex flex-wrap items-start gap-[40px]">
        {/* Column 1 — brand and the blurb (Catalogue.dc.html:148-149). The mock
            predates the vocabulary rename, so the copy says "recording", not the
            mock's "entry". */}
        <div className="max-w-[300px]">
          <div className="text-[13px] font-bold tracking-[-0.02em] text-t1">
            rnui<span className="text-acc">.dev</span>
          </div>
          <p className="mt-[6px] text-[11.5px] leading-[1.5] text-t2">
            An open catalogue of React Native UI recordings. Every recording
            belongs to its contributor.
          </p>
        </div>

        {/* Column 2 — CONTRIBUTE (Catalogue.dc.html:151-154). */}
        <div className="flex flex-col gap-[5px]">
          <span className="pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
            CONTRIBUTE
          </span>
          <Link
            href="https://github.com/mrpmohiburrahman/awesome-react-native-ui/issues"
            className="text-[11.5px] text-acc underline underline-offset-3"
          >
            Submit a recording <span aria-hidden="true">↗</span>
          </Link>
          <Link
            href="https://github.com/mrpmohiburrahman/awesome-react-native-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] text-acc underline underline-offset-3"
          >
            Repository <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {/* Column 3 — THIS DEVICE (Catalogue.dc.html:156-158). */}
        <div className="flex flex-col gap-[5px]">
          <span className="pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
            THIS DEVICE
          </span>
          <span className="max-w-[300px] text-[11.5px] leading-[1.5] text-t2">
            Your saves and votes are stored in this browser only. No account, no
            sign-in, nothing synced between devices.
          </span>
        </div>

        {/* Column 4 — NOTIFY, not drawn in any mock, so derived from decision 9:
            the column label treatment, a sentence of the same body type, the
            search field's own metrics for the input, and the primary button from
            Catalogue.dc.html:104. The link keeps /subscribe reachable, since the
            header nav link to it is gone. */}
        <div className="flex flex-col gap-[5px]">
          <span className="pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
            NOTIFY
          </span>
          {/* Ticket 06: this used to promise "an email when a new recording is
              added", which is a different promise from the one the form now
              makes and stores. The heading and the disclosure block inside
              NewsletterForm carry the real terms. */}
          <span className="max-w-[260px] text-[11.5px] leading-[1.5] text-t2">
            {SIGNUP_HEADING}.
          </span>
          <NewsletterForm />
          <Link
            href="/subscribe"
            className="text-[11.5px] text-acc underline underline-offset-3"
          >
            Manage subscription <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {/* Right block — the two-line mono stamp (Catalogue.dc.html:160-163).
            Line one is the same relative time the header's counter uses,
            uppercased with CSS rather than a second string, so the two cannot
            disagree. Line two flips by the same `dark` class the mode toggle
            flips on, not by reading the theme. */}
        <div className="ml-auto font-mono text-[9.5px] leading-[1.6] text-t3 text-right">
          <div className="uppercase">{formatUpdatedFull(lastCommitDate())}</div>
          <div>
            <span className="hidden dark:inline">{DARK_MODE_STAMP}</span>
            <span className="inline dark:hidden">{LIGHT_MODE_STAMP}</span>
          </div>
        </div>
      </div>

      {/* The four routes the old footer linked and the mock does not draw
          (Catalogue.dc.html:137-141 for the link-row pattern): deleting them
          would orphan four live routes from everywhere on the site. */}
      <div className="mt-[30px] flex flex-wrap items-center justify-center gap-x-[10px] gap-y-[6px] border-t border-line pt-[22px]">
        {LEGAL_LINKS.map(([label, href], index) => (
          <span key={href} className="flex items-center gap-[10px]">
            {index > 0 && <span className="text-t3">·</span>}
            <Link
              href={href}
              className="text-[12.5px] text-acc underline underline-offset-3"
            >
              {label}
            </Link>
          </span>
        ))}
      </div>
    </footer>
  )
}
