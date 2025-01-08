// app/privacypolicy/page.tsx

import React from "react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <section className="overflow-x-hidden">
      <div className="flex flex-col items-center justify-center px-5 md:px-10">
        {/* Title Container */}
        <div className="flex flex-col items-center justify-end bg-[#f2f2f7] dark:bg-gray-900 py-6 md:h-64 w-full">
          <div className="flex flex-col items-center gap-y-4 py-5">
            <h1 className="text-3xl font-bold md:text-5xl">PRIVACY POLICY</h1>
            <p className="text-sm text-[#808080] sm:text-base">
              Last Updated as of Dec 1, 2024
            </p>
          </div>
        </div>
        {/* Content Container */}
        <div className="mx-auto w-full max-w-5xl py-12 md:py-16 lg:py-20 px-4">
          {/* Intro Paragraph */}
          <div className="flex flex-col items-center gap-y-14">
            <p className="max-w-3xl text-center text-sm sm:text-base">
              Welcome to our non-profit project! We value your privacy and are
              committed to protecting your personal information. This Privacy
              Policy outlines the types of data we collect, how we use it, and
              the measures we take to safeguard it. By continuing to use our
              website, you acknowledge that you have read and agree to this
              policy in its entirety.
            </p>

            {/* Main Privacy Policy Section */}
            <div className="flex flex-col gap-y-10">
              <div className="flex w-full py-4 border-b border-gray-300">
                <h6 className="text-base font-bold">PRIVACY POLICY</h6>
              </div>

              <div className="flex flex-col gap-y-10">
                {/* Information We Collect */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">INFORMATION WE COLLECT</p>
                  <p className="text-sm">
                    1. Personal Information: This may include data you provide
                    voluntarily—such as your name or email address—when you
                    submit an animation, or contact us or give us a feedback.
                    <br />
                    2. Non-Personal Information: We may automatically collect
                    technical data like IP address, browser type, and device
                    identifiers to help us understand how you interact with our
                    site.
                  </p>
                </div>

                {/* How We Use Your Information */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">
                    HOW WE USE YOUR INFORMATION
                  </p>
                  <p className="text-sm">
                    Since we are a non-profit, community-driven directory, we
                    primarily use your information to:
                    <br />• Improve and maintain our website and its features,
                    including the React Native animation directory. <br />•
                    Communicate with you regarding support, updates, or
                    community announcements. <br />• Analyze aggregated data to
                    understand our audience and optimize user experience.
                  </p>
                </div>

                {/* Cookies & Tracking */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">
                    COOKIES & TRACKING TECHNOLOGIES
                  </p>
                  <p className="text-sm">
                    We use cookies and similar technologies to personalize
                    content, remember your preferences, and analyze site
                    traffic. You can manage or disable cookies in your browser
                    settings, but please note this may affect certain website
                    features.
                  </p>
                </div>

                {/* Sharing Your Information */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">SHARING YOUR INFORMATION</p>
                  <p className="text-sm">
                    We do not sell or rent personal information for commercial
                    gain. Your data may be shared in the following limited
                    circumstances:
                    <br />• With trusted third-party service providers (e.g.,
                    hosting, analytics) who assist in operating our website
                    under strict confidentiality obligations. <br />• To comply
                    with applicable laws, regulations, or legal processes if
                    required.
                  </p>
                </div>

                {/* Data Security */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">DATA SECURITY</p>
                  <p className="text-sm">
                    We take reasonable administrative, technical, and physical
                    safeguards to protect your information from unauthorized
                    access, alteration, or disclosure. However, please note that
                    no method of data transmission or storage can be guaranteed
                    to be completely secure.
                  </p>
                </div>

                {/* Your Rights */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">YOUR RIGHTS</p>
                  <p className="text-sm">
                    You may have certain rights under data protection laws,
                    depending on your jurisdiction. These may include the right
                    to:
                    <br />
                    • Access and review the personal information we hold about
                    you. <br />• Request corrections, updates, or deletion of
                    your data. <br />• Withdraw consent for certain data
                    processing activities.
                    <br />
                    To exercise any of these rights, please{" "}
                    <Link href="/contactus">
                      <span className="underline text-purple-400">
                        contact us
                      </span>
                    </Link>{" "}
                    so we can address your concerns promptly.
                  </p>
                </div>

                {/* Children's Privacy */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">CHILDREN&apos;S PRIVACY</p>
                  <p className="text-sm">
                    Our services are not intended for individuals under the age
                    of 13. We do not knowingly collect personal information from
                    children. If you believe we have inadvertently gathered data
                    from a minor, please{" "}
                    <Link href="/contactus">
                      <span className="underline text-purple-400">
                        contact us
                      </span>
                    </Link>{" "}
                    so we can remove it.
                  </p>
                </div>

                {/* Policy Updates */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">POLICY UPDATES</p>
                  <p className="text-sm">
                    We may update this Privacy Policy to reflect changes in our
                    community guidelines or operational needs. Any modifications
                    will be posted with a revised “Last Updated” date. Your
                    continued use of our services after any changes indicates
                    your acceptance of the updated terms.
                  </p>
                </div>

                {/* Contact Information */}
                <div className="w-full h-px bg-[#e2e2e2]" />
                <p className="text-sm">
                  If you have any questions or concerns about this Privacy
                  Policy, please{" "}
                  <Link href="/contactus">
                    <span className="underline text-purple-400">
                      contact us
                    </span>
                  </Link>
                  . As a non-profit platform, we appreciate your support and
                  cooperation in keeping our community a safe space for React
                  Native animation enthusiasts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
