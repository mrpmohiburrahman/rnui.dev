// app/privacypolicy/page.tsx
//
// One of the two legal pages (ticket 12 step 5). Weighted to what it is: 14
// pageviews in 90 days, so no panels, no decoration — the effort is spent on
// type, tokens and markup. The text is byte-identical to what it said before;
// only the markup, the colours and the heading structure changed.

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How rnui.dev collects, uses and protects the personal information you choose to share.",
}

// The prose body and list, shared by the two legal pages' six changes.
const body =
  "max-w-[520px] text-[13px] leading-[1.55] text-t2"
const inBodyLink =
  "text-acc underline underline-offset-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"

export default function PrivacyPage() {
  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        PRIVACY
      </span>
      <h1 className="m-0 text-hero text-t1">Privacy Policy</h1>
      <p className="mt-[9px] font-mono text-[10px] uppercase tracking-[0.1em] text-t3 tabular-nums">
        Last Updated as of Dec 1, 2024
      </p>

      <div className="mt-[18px] flex flex-col gap-[14px]">
        <p className={body}>
          Welcome to our non-profit project! We value your privacy and are
          committed to protecting your personal information. This Privacy Policy
          outlines the types of data we collect, how we use it, and the measures
          we take to safeguard it. By continuing to use our website, you
          acknowledge that you have read and agree to this policy in its
          entirety.
        </p>

        {/* Information We Collect */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Information we collect</h2>
          <p className={body}>
            1. Personal Information: This may include data you provide
            voluntarily—such as your name or email address—when you submit an
            animation, or contact us or give us a feedback.
          </p>
          <p className={body}>
            2. Non-Personal Information: We may automatically collect technical
            data like IP address, browser type, and device identifiers to help
            us understand how you interact with our site.
          </p>
        </section>

        {/* How We Use Your Information */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">
            How we use your information
          </h2>
          <p className={body}>
            Since we are a non-profit, community-driven directory, we primarily
            use your information to:
          </p>
          <ul className="m-0 flex list-disc flex-col gap-[8px] pl-5">
            <li className={body}>
              Improve and maintain our website and its features, including the
              React Native animation directory.
            </li>
            <li className={body}>
              Communicate with you regarding support, updates, or community
              announcements.
            </li>
            <li className={body}>
              Analyze aggregated data to understand our audience and optimize
              user experience.
            </li>
          </ul>
        </section>

        {/* Cookies & Tracking Technologies */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">
            Cookies &amp; tracking technologies
          </h2>
          <p className={body}>
            We use cookies and similar technologies to personalize content,
            remember your preferences, and analyze site traffic. You can manage
            or disable cookies in your browser settings, but please note this
            may affect certain website features.
          </p>
        </section>

        {/* Sharing Your Information */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">
            Sharing your information
          </h2>
          <p className={body}>
            We do not sell or rent personal information for commercial gain.
            Your data may be shared in the following limited circumstances:
          </p>
          <ul className="m-0 flex list-disc flex-col gap-[8px] pl-5">
            <li className={body}>
              With trusted third-party service providers (e.g., hosting,
              analytics) who assist in operating our website under strict
              confidentiality obligations.
            </li>
            <li className={body}>
              To comply with applicable laws, regulations, or legal processes
              if required.
            </li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Data security</h2>
          <p className={body}>
            We take reasonable administrative, technical, and physical
            safeguards to protect your information from unauthorized access,
            alteration, or disclosure. However, please note that no method of
            data transmission or storage can be guaranteed to be completely
            secure.
          </p>
        </section>

        {/* Your Rights */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Your rights</h2>
          <p className={body}>
            You may have certain rights under data protection laws, depending
            on your jurisdiction. These may include the right to:
          </p>
          <ul className="m-0 flex list-disc flex-col gap-[8px] pl-5">
            <li className={body}>
              Access and review the personal information we hold about you.
            </li>
            <li className={body}>
              Request corrections, updates, or deletion of your data.
            </li>
            <li className={body}>
              Withdraw consent for certain data processing activities.
            </li>
          </ul>
          <p className={body}>
            To exercise any of these rights, please{" "}
            <Link href="/contactus" className={inBodyLink}>
              contact us
            </Link>{" "}
            so we can address your concerns promptly.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Children&apos;s privacy</h2>
          <p className={body}>
            Our services are not intended for individuals under the age of 13.
            We do not knowingly collect personal information from children. If
            you believe we have inadvertently gathered data from a minor,
            please{" "}
            <Link href="/contactus" className={inBodyLink}>
              contact us
            </Link>{" "}
            so we can remove it.
          </p>
        </section>

        {/* Policy Updates */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Policy updates</h2>
          <p className={body}>
            We may update this Privacy Policy to reflect changes in our
            community guidelines or operational needs. Any modifications will
            be posted with a revised “Last Updated” date. Your continued use of
            our services after any changes indicates your acceptance of the
            updated terms.
          </p>
        </section>

        {/* Contact Information */}
        <section className="flex flex-col gap-[8px]">
          <div className="h-px w-full bg-line" />
          <p className={body}>
            If you have any questions or concerns about this Privacy Policy,
            please{" "}
            <Link href="/contactus" className={inBodyLink}>
              contact us
            </Link>
            . As a non-profit platform, we appreciate your support and
            cooperation in keeping our community a safe space for React Native
            animation enthusiasts.
          </p>
        </section>
      </div>
    </div>
  )
}
