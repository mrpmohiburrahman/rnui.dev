// app/termsofservice/page.tsx
//
// The second legal page (ticket 12 step 5). Same six changes as
// app/privacypolicy/page.tsx, weighted to what it is: 15 pageviews in 90 days,
// so the effort goes into type, tokens and markup, not decoration. The text is
// byte-identical to what it said before.

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of the rnui.dev catalogue.",
}

const body = "max-w-[520px] text-[13px] leading-[1.55] text-t2"

export default function TermsPage() {
  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        TERMS
      </span>
      <h1 className="m-0 text-hero text-t1">Terms of Service</h1>
      <p className="mt-[9px] font-mono text-[10px] uppercase tracking-[0.1em] text-t3 tabular-nums">
        Last Updated as of Dec 1, 2024
      </p>

      <div className="mt-[18px] flex flex-col gap-[14px]">
        <p className={body}>
          Welcome to our non-profit project! This website serves as a
          community-driven directory of React Native animations. By accessing,
          browsing, or using our free services, you agree to these Terms of
          Service. Please read these terms carefully before proceeding.
        </p>

        {/* Our Services */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Our services</h2>
          <p className={body}>
            We strive to provide a comprehensive directory of React Native
            animations contributed by the community. Our goal is to help
            developers easily discover, share, and learn from these open-source
            animations. As a non-profit endeavor, our services are offered
            freely, and we do not charge any membership fees or licensing costs.
          </p>
        </section>

        {/* Non-Profit Status */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Non-profit status</h2>
          <p className={body}>
            This directory is operated on a voluntary and non-commercial basis.
            Any donations or contributions received are used solely to cover
            operational costs (e.g., hosting) and to support the growth and
            maintenance of the community. We do not generate profit from user
            data, nor do we sell or share personal information for commercial
            gain.
          </p>
        </section>

        {/* User-Generated Content */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">
            User-generated content
          </h2>
          <p className={body}>
            Our directory relies heavily on community submissions. Contributors
            are responsible for ensuring that any content they submit does not
            violate intellectual property rights and that it adheres to any
            applicable open-source licenses. We reserve the right to remove or
            modify any content that does not meet our community guidelines or
            infringes on the rights of others.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">
            Limitation of liability
          </h2>
          <p className={body}>
            Because this is a free, non-profit resource, we provide the
            directory and its contents “as is.” We make no express or implied
            warranties of any kind regarding functionality, accuracy, or
            reliability. We are not liable for any direct, indirect,
            incidental, special, or consequential damages arising from the use
            or inability to use our services.
          </p>
        </section>

        {/* Modifications */}
        <section className="flex flex-col gap-[8px]">
          <h2 className="m-0 text-section text-t1">Modifications</h2>
          <p className={body}>
            We may update or revise these Terms of Service from time to time to
            reflect changes in our community guidelines or operational
            practices. We will notify users of any material changes by posting
            an updated version on this page.
          </p>
        </section>

        {/* Final Notice */}
        <section className="flex flex-col gap-[8px]">
          <div className="h-px w-full bg-line" />
          <p className={body}>
            By accessing or using our non-profit directory, you acknowledge
            and agree that you have carefully read, understood, and consent to
            all the terms and conditions outlined here, as well as any
            additional agreements or policies referenced within. We thank you
            for being part of our community and contributing to this shared
            resource for React Native developers.
          </p>
        </section>
      </div>
    </div>
  )
}