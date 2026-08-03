// app/layout.tsx
import type { ReactNode } from "react"

import "./globals.css"

import { JetBrains_Mono, Space_Grotesk } from "next/font/google"
import { allRecordings } from "@/data/catalogue"
import { metadata } from "@/data/meta-data"
import {
  contributorsByCount,
  getUniqueCategories,
  RECORDINGS_PER_CATEGORY,
} from "@/data/recording"
import { Analytics } from "@vercel/analytics/next"

import { CDN_ORIGIN } from "@/lib/cdn"
import { PostHogProvider } from "@/lib/posthog-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NavSidebar } from "@/components/nav/nav-side-bar"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

import { ThemeProvider } from "./providers"

export { metadata }

// Both families, self-hosted at build time and served from this origin — no
// third-party font CDN hop, so no preconnect for them (the only preconnect on
// the page stays the CDN one below, which exists for Demos and Posters). The
// `variable` names are the strings tailwind.config.ts's fontFamily keys read,
// and the design-tokens test pins the two together.
//
// No `weight` key: that requests the variable font, one file per family
// covering Space Grotesk's wght 300-700 and JetBrains Mono's wght 100-800,
// rather than five static instances for the five weights the design uses.
// `display: "swap"` and `adjustFontFallback: true` are next/font's defaults;
// the latter synthesises a metric-matched fallback face so the swap moves no
// pixel, which is what lets two webfonts into a site with a 0.549 field CLS.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-grotesk",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-jetbrains",
})

export default function RootLayout({ children }: { children: ReactNode }) {
  // The rail's two lists, count-bearing: 18 Categories alphabetically, 24
  // Contributors ranked by their whole-catalogue counts (ticket 05). The counts
  // are never of the filtered result set, so a layout — which is never handed
  // searchParams — is exactly where they belong.
  const categories = getUniqueCategories().map((name) => ({
    name,
    count: RECORDINGS_PER_CATEGORY[name] ?? 0,
  }))
  const contributors = contributorsByCount()

  return (
    // suppressHydrationWarning because next-themes inlines a blocking script
    // that writes `class` and `style="color-scheme"` onto this element before
    // React hydrates, so the served html and the hydrated html cannot match. It
    // emits no attribute and moves no pixel.
    <html
      lang="en"
      className={`${grotesk.variable} ${jetbrains.variable} font-sans`}
      suppressHydrationWarning
    >
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
            // The device setting, on a first visit. next-themes only calls
            // matchMedia when the resolved name is literally "system", so with
            // "light" here `enableSystem` was inert on that path and a
            // dark-device visitor got light as a steady state, not a flash.
            // Nothing is persisted until the toggle is used, so this is the
            // answer for everyone who has never opened it. Dark is already
            // built; this only picks which finished appearance starts.
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <SiteHeader
                recordingCount={allRecordings.length}
                contributorCount={contributors.length}
                categories={categories}
                contributors={contributors}
              />
              <div className="flex flex-1 items-stretch">
                <NavSidebar
                  categories={categories}
                  contributors={contributors}
                />
                {/* The mock's main gutter: 22px top, 26px sides, 34px bottom
                    (Catalogue.dc.html:59). `min-w-0` so a wide child cannot push
                    the document past the viewport. */}
                <main className="w-full flex-1 min-w-0 p-[22px_26px_34px]">
                  {children}
                </main>
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
