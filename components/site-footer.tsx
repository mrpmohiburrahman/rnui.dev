import type * as React from "react"
import Link from "next/link"
// Import necessary icons from lucide-react
import { FileText, Info, Mail, Shield } from "lucide-react"

import { cn } from "@/lib/utils"

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("block", className)}>
      {/* Container */}
      <div className="py-16 md:py-20 mx-auto w-full max-w-7xl px-5 md:px-10 md:pl-36">
        {/* About Us, Contact Us, Terms, Privacy */}
        <div className="sm:flex-row flex justify-between flex-col">
          <h2 className="font-bold text-3xl md:text-5xl w-full max-w-xl">
            Awesome React Native UI
          </h2>
          <div className="mt-8 md:mt-0">
            {/* About Us */}
            <Link
              href="/aboutus"
              className="mb-4 flex items-start justify-start transition hover:text-blue-600 hover:underline"
            >
              <Info className="inline-block mr-3 w-5 h-5 text-gray-500" />
              <p className="text-gray-500 text-sm sm:text-base">About Us</p>
            </Link>
            {/* Contact Us */}
            <Link
              href="/contactus"
              className="mb-4 flex items-start justify-start transition hover:text-blue-600 hover:underline"
            >
              <Mail className="inline-block mr-3 w-5 h-5 text-gray-500" />
              <p className="text-gray-500 text-sm sm:text-base">Contact Us</p>
            </Link>
            {/* Terms & Conditions */}
            <Link
              href="/termsofservice"
              className="mb-4 flex items-start justify-start transition hover:text-blue-600 hover:underline"
            >
              <FileText className="inline-block mr-3 w-5 h-5 text-gray-500" />
              <p className="text-gray-500 text-sm sm:text-base">
                Terms & Conditions
              </p>
            </Link>
            {/* Privacy Policy */}
            <Link
              href="/privacypolicy"
              className="mb-4 flex items-start justify-start transition hover:text-blue-600 hover:underline"
            >
              <Shield className="inline-block mr-3 w-5 h-5 text-gray-500" />
              <p className="text-gray-500 text-sm sm:text-base">
                Privacy Policy
              </p>
            </Link>
          </div>
        </div>
        <div className="mb-14 w-full border-b border-gray-500 mt-16" />
        {/* Copy Right Section */}
        <div className="md:flex-row flex justify-between items-center flex-col">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
            {/* Social Media Icons */}
            {/* <SocialMediaIcons /> */}
            {/* Additional Icons or Links can be added here */}
          </div>
          <div className="mt-8 md:mt-0 text-right w-full md:w-auto">
            <p className="text-sm leading-loose dark:text-[#b4b4b4] text-gray-900">
              &copy; 2024{" "}
              <Link
                href="/"
                className="font-medium dark:text-white text-black underline underline-offset-4"
              >
                Awesome React Native UI
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
