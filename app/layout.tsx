// app/layout.tsx
import type { ReactNode } from "react"

import "./globals.css"

import { getUniqueAuthors, getUniqueCategories } from "@/data/entry"
import { metadata } from "@/data/meta-data"
import { Analytics } from "@vercel/analytics/next"

import { CDN_ORIGIN } from "@/lib/cdn"
import { PostHogProvider } from "@/lib/posthog-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NavSidebar } from "@/components/nav/nav-side-bar"
import { TopNavBar } from "@/components/nav/top-nav-bar"
import { SiteFooter } from "@/components/site-footer"

import { ThemeProvider } from "./providers"

export { metadata }

export default function RootLayout({ children }: { children: ReactNode }) {
  const categories = getUniqueCategories()
  const authors = getUniqueAuthors()

  return (
    <html lang="en" className="font-sans">
      <head>
        {/* Every Demo and Poster comes from here, so warm the connection early. */}
        {CDN_ORIGIN && (
          <>
            <link rel="preconnect" href={CDN_ORIGIN} />
            <link rel="dns-prefetch" href={CDN_ORIGIN} />
          </>
        )}
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
              {/* Mirrors the header's own height, components/nav/top-nav-bar.tsx:18
                  (`h-[83px] fixed`), which only renders at `md` and up — so the
                  base pt-16 stays: below `md` there is no header, and that 64px
                  is what clears the mobile sheet trigger. It was 64px at every
                  width, so the header painted over the top 19px of every page. */}
              <div className="flex flex-1 pt-16 md:pt-[83px]">
                <NavSidebar categories={categories} authors={authors} />
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
