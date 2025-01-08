// app/termsofservice/page.tsx

export default function TermsPage() {
  return (
    <section className="overflow-x-hidden">
      <div className="flex flex-col items-center justify-center px-5 md:px-10">
        {/* Title Container */}
        <div className="flex flex-col items-center justify-end bg-[#f2f2f7] dark:bg-gray-900 py-6 md:h-64 w-full">
          <div className="flex flex-col items-center gap-y-4 py-5">
            <h1 className="text-3xl font-bold md:text-5xl">TERMS OF SERVICE</h1>
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
              Welcome to our non-profit project! This website serves as a
              community-driven directory of React Native animations. By
              accessing, browsing, or using our free services, you agree to
              these Terms of Service. Please read these terms carefully before
              proceeding.
            </p>

            {/* Main Terms & Conditions Section */}
            <div className="flex flex-col gap-y-10">
              <div className="flex w-full py-4 border-b border-gray-300">
                <h6 className="text-base font-bold">
                  GENERAL TERMS & CONDITIONS
                </h6>
              </div>

              <div className="flex flex-col gap-y-10">
                {/* Services Section */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">OUR SERVICES</p>
                  <p className="text-sm">
                    We strive to provide a comprehensive directory of React
                    Native animations contributed by the community. Our goal is
                    to help developers easily discover, share, and learn from
                    these open-source animations. As a non-profit endeavor, our
                    services are offered freely, and we do not charge any
                    membership fees or licensing costs.
                  </p>
                </div>

                {/* Non-Profit Disclaimer Section */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">NON-PROFIT STATUS</p>
                  <p className="text-sm">
                    This directory is operated on a voluntary and non-commercial
                    basis. Any donations or contributions received are used
                    solely to cover operational costs (e.g., hosting) and to
                    support the growth and maintenance of the community. We do
                    not generate profit from user data, nor do we sell or share
                    personal information for commercial gain.
                  </p>
                </div>

                {/* User-Generated Content Section */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">USER-GENERATED CONTENT</p>
                  <p className="text-sm">
                    Our directory relies heavily on community submissions.
                    Contributors are responsible for ensuring that any content
                    they submit does not violate intellectual property rights
                    and that it adheres to any applicable open-source licenses.
                    We reserve the right to remove or modify any content that
                    does not meet our community guidelines or infringes on the
                    rights of others.
                  </p>
                </div>

                {/* Liability & Warranty Section */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">LIMITATION OF LIABILITY</p>
                  <p className="text-sm">
                    Because this is a free, non-profit resource, we provide the
                    directory and its contents “as is.” We make no express or
                    implied warranties of any kind regarding functionality,
                    accuracy, or reliability. We are not liable for any direct,
                    indirect, incidental, special, or consequential damages
                    arising from the use or inability to use our services.
                  </p>
                </div>

                {/* Modification of Terms Section */}
                <div className="flex flex-col items-start gap-y-3">
                  <p className="text-sm font-bold">MODIFICATIONS</p>
                  <p className="text-sm">
                    We may update or revise these Terms of Service from time to
                    time to reflect changes in our community guidelines or
                    operational practices. We will notify users of any material
                    changes by posting an updated version on this page.
                  </p>
                </div>

                {/* Final Notice */}
                <div className="w-full h-px bg-[#e2e2e2]" />
                <p className="text-sm">
                  By accessing or using our non-profit directory, you
                  acknowledge and agree that you have carefully read,
                  understood, and consent to all the terms and conditions
                  outlined here, as well as any additional agreements or
                  policies referenced within. We thank you for being part of our
                  community and contributing to this shared resource for React
                  Native developers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
