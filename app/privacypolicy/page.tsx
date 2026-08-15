// app/privacypolicy/page.tsx
//
// One of the two legal pages (studio-dark ticket 12 step 5). Weighted to what it
// is: 1 pageview in 30 days, so no panels, no decoration — the effort is spent
// on type, tokens and markup.
//
// notify-and-preview ticket 07 replaced the text. What was here was a template:
// an address collected "voluntarily" and shared with "trusted third-party
// service providers", which named nothing and described neither the Digest nor
// any way out.
//
// EVERY CLAIM BELOW IS A CLAIM ABOUT CODE, so changing that code can make this
// page lie. The first draft of it did, in four places review caught: it said
// the already-seen list was localStorage (view-signal.ts uses sessionStorage),
// that browser lists are "never sent to us" (analytics.ts captures each
// bookmark and vote as it happens), that nothing records who voted for what
// (posthog-provider.tsx sets person_profiles: "always"), and that four
// processors covered it (cdn.rnui.dev is a fifth, and hello@ forwards to a
// sixth). None of those were sloppy prose — each was a true-sounding sentence
// nobody had checked against the file that decides it.
//
// So: if you touch analytics, storage, a processor, or the send path, re-read
// this page. The ticket's Comments list every source, including the two Resend
// tracking flags and the two storage regions, which came from the live APIs.
//
// The identity comes from lib/sender-identity.ts rather than being pasted.
// Ticket 04 requires this block byte-identical in the form, the policy and the
// Digest footer, and three copies of a postal address is three places to drift.

import type { Metadata } from "next"
import Link from "next/link"

import {
  CONTACT_EMAIL,
  FROM,
  POSTAL_ADDRESS,
  SENDER_NAME,
} from "@/lib/sender-identity"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What rnui.dev collects, why, who processes it, and how to get your data out or shut it off.",
}

/**
 * Bump both together, and never edit the text without bumping them. The pair
 * exists so the policy in force at any given signup is provable rather than
 * reconstructed from a deploy date — the same argument as CONSENT_FORM_VERSION
 * in lib/sender-identity.ts, which versions the disclosure a Subscriber agreed
 * to. They are separate numbers because the two documents change apart.
 */
const POLICY_VERSION = "1.0"
const POLICY_EFFECTIVE = "15 August 2026"

// `body` and `inBodyLink` are the two studio-dark ticket 12 gave both legal
// pages; the three below are local to this one, which has far more sections than
// /termsofservice. Not lifted into a shared module for two pages — if a third
// legal page ever appears, that is the moment.
const body = "max-w-[520px] text-[13px] leading-[1.55] text-t2"
const inBodyLink =
  "text-acc underline underline-offset-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"
const list = "m-0 flex list-disc flex-col gap-[8px] pl-5"
const section = "flex flex-col gap-[8px]"
const heading = "m-0 text-section text-t1"

/**
 * The contact address, as a link. Five sections of this policy end by pointing
 * at it, which is the point — every right it describes has to be exercisable,
 * and there is exactly one address to exercise them through.
 */
function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={inBodyLink}>
      {CONTACT_EMAIL}
    </a>
  )
}

export default function PrivacyPage() {
  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        PRIVACY
      </span>
      <h1 className="m-0 text-hero text-t1">Privacy Policy</h1>
      <p className="mt-[9px] font-mono text-[10px] uppercase tracking-[0.1em] text-t3 tabular-nums">
        Version {POLICY_VERSION} · Effective {POLICY_EFFECTIVE}
      </p>

      <div className="mt-[18px] flex flex-col gap-[14px]">
        <p className={body}>
          rnui.dev is a free catalogue of React Native Recordings, run by one
          person. It carries no advertising, no sponsorship and no paid
          placement. This policy says what personal data the site collects, why,
          who else handles it, and how to get it removed. It describes what the
          site actually does, not what a template says it might.
        </p>

        {/* Who runs rnui.dev */}
        <section className={section}>
          <h2 className={heading}>Who runs rnui.dev</h2>
          <p className={body}>
            rnui.dev is operated by {SENDER_NAME}, and they are the data
            controller for everything described here.
          </p>
          {/* Two paragraphs rather than one line-break-separated block:
              studio-dark ticket 12 banned break tags from the legal pages, and
              its e2e gate asserts zero of them on the rendered page.
              POSTAL_ADDRESS still renders as the single line ticket 04
              requires. */}
          <p className={body}>{POSTAL_ADDRESS}</p>
          <p className={body}>
            <ContactLink />
          </p>
          <p className={body}>
            That address receives mail and is the right place for anything in
            this policy, including a request to delete your data.
          </p>
        </section>

        {/* The Digest */}
        <section className={section}>
          <h2 className={heading}>The Digest, and the address you give us</h2>
          <p className={body}>
            The Digest is one email naming the Recordings added to rnui.dev
            since the last one. It goes out weekly, and only in a week where at
            least one new Recording was actually added — a quiet week means no
            email. It is sent from {FROM}. It carries no sponsor mail, no
            third-party marketing, and no promotion of other products.
          </p>
          <p className={body}>
            Signing up does not subscribe you. Your address is stored as a
            pending address and sent one confirmation email; you become a
            Subscriber only when you click the link in it. An address that is
            never confirmed is never added to the sending list and receives
            nothing further.
          </p>
          <p className={body}>When you sign up, the following is recorded:</p>
          <ul className={list}>
            <li className={body}>your email address;</li>
            <li className={body}>the date and time you submitted it;</li>
            <li className={body}>
              the exact wording of the disclosure shown to you at the time, and
              its version number, so what you agreed to is provable from the
              record itself;
            </li>
            <li className={body}>
              the IP address the submission came from, and whether the address
              has since been confirmed.
            </li>
          </ul>
          <p className={body}>
            <strong className="text-t1">
              The lawful basis is your consent
            </strong>{" "}
            (GDPR Article 6(1)(a), with ePrivacy Article 13 / PECR regulation
            22). You can withdraw it at any time, with no reason and no account
            needed, using the unsubscribe link in every Digest or by writing to{" "}
            <ContactLink />. Withdrawing does not make the earlier processing
            unlawful.
          </p>
          <p className={body}>
            The Digest does not use open or click tracking. Nothing reports back
            whether you opened it or which links you followed.
          </p>
          <p className={body}>
            Some addresses on the list were collected by an earlier version of
            the signup form, which did not carry the disclosures above and did
            not ask for confirmation. Those addresses receive the same Digest,
            with the same identification and the same one-click unsubscribe, and
            they are not used for anything else.
          </p>
        </section>

        {/* Contact form */}
        <section className={section}>
          <h2 className={heading}>When you write to us</h2>
          <p className={body}>
            The{" "}
            <Link href="/contactus" className={inBodyLink}>
              contact form
            </Link>{" "}
            records the first and last name, email address and message you type
            into it, and the time you sent it. It is used to answer you. It is
            not added to the Digest list — the two are separate, and filling in
            the contact form never subscribes you to anything.
          </p>
        </section>

        {/* Analytics, cookies, local storage */}
        <section className={section}>
          <h2 className={heading}>
            Analytics, cookies, and what stays in your browser
          </h2>
          <p className={body}>
            The site uses PostHog to understand how it is used. It records page
            views, which Recordings are opened and played, which filters and
            searches are run, errors the site throws, and{" "}
            <strong className="text-t1">
              when you bookmark a Recording or vote for one
            </strong>
            . PostHog sets cookies and gives each browser a persistent random
            identifier, so those events accumulate against the same profile over
            time. That profile is pseudonymous — it is not linked to your name
            or email address, and signing up for the Digest does not attach your
            address to it — but it is a per-browser record, not an anonymous
            tally, and it is fair to assume that over enough visits it describes
            your browsing of this site.
          </p>
          <p className={body}>
            PostHog also records session replays of page interactions.{" "}
            <strong className="text-t1">
              Form inputs are masked before the replay leaves your browser
            </strong>
            , so what you type into the signup or contact form is not in the
            recording. Vercel Analytics additionally counts page views without
            cookies.
          </p>
          <p className={body}>
            Separately from that, the site keeps a running total of views and
            votes for each Recording. Those totals are stored per Recording and
            carry nothing about who contributed to them.
          </p>
          <p className={body}>
            Your list of bookmarks and the list of Recordings you have voted for
            are kept in your own browser&apos;s local storage. The list of
            Recordings you have already seen is kept in session storage and is
            discarded when you close the tab. Clearing your browser data deletes
            all three, and the lists themselves are never sent to us — but note
            the paragraph above: the individual act of bookmarking or voting is
            reported to PostHog as it happens, even though the list is not. You
            can block or clear cookies in your browser settings; the catalogue
            works without them.
          </p>
        </section>

        {/* Processors */}
        <section className={section}>
          <h2 className={heading}>Who else processes this data, and where</h2>
          <p className={body}>
            No personal data is sold, rented, or shared with sponsors or
            advertisers. These are the service providers that handle any of it,
            and there are no others:
          </p>
          <ul className={list}>
            <li className={body}>
              <strong className="text-t1">Resend</strong> — sends the
              confirmation email and the Digest, and holds the list of confirmed
              addresses. Stored in the United States.
            </li>
            <li className={body}>
              <strong className="text-t1">Google Firebase</strong> — stores the
              signup records, contact form messages, and the per-Recording
              counts. Stored in the United States.
            </li>
            <li className={body}>
              <strong className="text-t1">PostHog</strong> — the analytics and
              session replay described above. Stored in the United States.
            </li>
            <li className={body}>
              <strong className="text-t1">Vercel</strong> — hosts the site and
              provides the cookieless page view count.
            </li>
            <li className={body}>
              <strong className="text-t1">Cloudflare</strong> — serves every
              Demo and Poster from <code>cdn.rnui.dev</code>, so your IP address
              reaches Cloudflare whenever a Recording loads, and forwards mail
              sent to {CONTACT_EMAIL} on to the maintainer&apos;s inbox.
              Cloudflare serves from whichever of its locations is nearest you,
              so this one is not United States only.
            </li>
            <li className={body}>
              <strong className="text-t1">Google Gmail</strong> — receives that
              forwarded mail, so anything you send to {CONTACT_EMAIL} lands in a
              Gmail inbox.
            </li>
          </ul>
          <p className={body}>
            Data may also be disclosed where the law actually requires it. If
            that ever happens it will be the minimum demanded, not a bulk
            handover.
          </p>
        </section>

        {/* Retention */}
        <section className={section}>
          <h2 className={heading}>How long it is kept</h2>
          <ul className={list}>
            <li className={body}>
              A Subscriber&apos;s address and consent record are kept for as
              long as they stay subscribed. The consent record is the evidence
              that the email was asked for, so it is kept alongside the address
              rather than separately.
            </li>
            <li className={body}>
              If you unsubscribe, your address stops receiving the Digest
              immediately. A record that it unsubscribed is kept, because the
              alternative is a later import silently re-adding you. Ask and that
              record will be erased outright instead.
            </li>
            <li className={body}>
              A pending address that is never confirmed stays in the signup
              record and is never mailed again.
            </li>
            <li className={body}>
              Contact form messages are kept while they are useful for answering
              and for any follow-up.
            </li>
          </ul>
          <p className={body}>
            Addresses that stop engaging with the Digest should eventually be
            dropped, and that is the intention here. No period is stated because
            none has been set: the Digest has not been sent yet, and the site
            deliberately does not track opens or clicks, so there is currently
            no measurement to base one on. This section will be updated with a
            concrete rule, and the version above bumped, before any such removal
            happens. Nothing is being held on the strength of a rule that does
            not exist — you can leave at any time regardless.
          </p>
        </section>

        {/* Rights */}
        <section className={section}>
          <h2 className={heading}>Your rights</h2>
          <p className={body}>
            Depending on where you live, you have some or all of the following
            rights over your data:
          </p>
          <ul className={list}>
            <li className={body}>
              <strong className="text-t1">Access</strong> — get a copy of what
              is held about you.
            </li>
            <li className={body}>
              <strong className="text-t1">Rectification</strong> — have
              something inaccurate corrected.
            </li>
            <li className={body}>
              <strong className="text-t1">Erasure</strong> — have it deleted.
            </li>
            <li className={body}>
              <strong className="text-t1">Objection and restriction</strong> —
              object to processing, or have it paused.
            </li>
            <li className={body}>
              <strong className="text-t1">Portability</strong> — receive it in a
              machine-readable form.
            </li>
            <li className={body}>
              <strong className="text-t1">Withdrawal of consent</strong> — at
              any time, as described above.
            </li>
          </ul>
          <p className={body}>
            To exercise any of them, write to <ContactLink /> or use the{" "}
            <Link href="/contactus" className={inBodyLink}>
              contact form
            </Link>
            . There is no charge and no form to fill in. If you are in the UK,
            the EU or another jurisdiction with a data protection authority, you
            also have the right to complain to it directly.
          </p>
        </section>

        {/* Children's privacy */}
        <section className={section}>
          <h2 className={heading}>Children&apos;s privacy</h2>
          <p className={body}>
            rnui.dev is a catalogue for software developers and is not intended
            for children under 13, and no data is knowingly collected from them.
            If you believe a child has submitted an address or a message, write
            to <ContactLink /> and it will be removed.
          </p>
        </section>

        {/* Changes */}
        <section className={section}>
          <h2 className={heading}>Changes to this policy</h2>
          <p className={body}>
            Any change to this policy raises the version number and the
            effective date at the top of the page, so the version in force when
            you signed up can be identified. A change that materially affects
            Subscribers will be said plainly in the next Digest rather than
            published quietly here.
          </p>
        </section>

        <section className={section}>
          <div className="h-px w-full bg-line" />
          <p className={body}>
            Questions about any of this go to <ContactLink />.
          </p>
        </section>
      </div>
    </div>
  )
}
