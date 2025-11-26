// app/layout.tsx
import type { ReactNode } from "react"
import { Suspense } from "react"

import "./globals.css"

import { fontSans } from "@/data/font-sans"
import { getUniqueAuthors, getUniqueCategories } from "@/data/items"
import { metadata } from "@/data/meta-data"
import { Analytics } from "@vercel/analytics/next"

import { PostHogProvider } from "@/lib/posthog-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NavSidebar } from "@/components/nav/nav-side-bar"
import { TopNavBar } from "@/components/nav/top-nav-bar"
import { SiteFooter } from "@/components/site-footer"

import { ThemeProvider } from "./providers"

export { fontSans }
export { metadata }

export default function RootLayout({ children }: { children: ReactNode }) {
  const categories = getUniqueCategories()
  const authors = getUniqueAuthors()

  return (
    <html lang="en" className={`${fontSans.variable} font-sans`}>
      <head>
        {/* Resource hints for ImageKit.io - reduces latency for video/image requests */}
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
      </head>
      <PostHogProvider>
        <body className="flex flex-col min-h-screen">
          <ThemeProvider
            attribute="class"
            // defaultTheme="system"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <div className="hidden md:block">
                <TopNavBar />
              </div>
              <div className="flex flex-1 pt-16">
                {/* Wrap NavSidebar with Suspense */}
                <Suspense fallback={<div>Loading sidebar...</div>}>
                  <NavSidebar categories={categories} authors={authors} />
                </Suspense>
                {/* Add responsive left margin to main */}
                <main className="p-4 sm:ml-[10.5rem] w-full">{children}</main>
              </div>
            </TooltipProvider>
            <Toaster richColors />
          </ThemeProvider>
          <SiteFooter />
          <Analytics />
        </body>
      </PostHogProvider>
    </html>
  )
}
