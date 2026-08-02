// app/layout.tsx
import type { ReactNode } from "react"

import "./globals.css"

import { JetBrains_Mono, Space_Grotesk } from "next/font/google"
import { metadata } from "@/data/meta-data"
import { getUniqueCategories, getUniqueContributors } from "@/data/recording"
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
  const categories = getUniqueCategories()
  const contributors = getUniqueContributors()

  return (
    // suppressHydrationWarning because next-themes inlines a blocking script
    // that writes `class` and `style="color-scheme"` onto this element before
    // React hydrates, so the served html and the hydrated html cannot match. It
    // emits no attribute and moves no pixel.
    //
    // Adding it here also, on its own, deleted the "Star us on GitHub" item
    // from the server-rendered header. Not a coincidence and not about this
    // element: the extra props lengthen the RSC payload row, and past a
    // threshold React outlines a later element into its own row as a lazy
    // reference, which Radix's `asChild` Slot drops on the floor. The header is
    // a client component now (components/nav/top-nav-bar.tsx) so nothing in it
    // is Flight-serialized and the size stops mattering.
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
              <div className="hidden md:block">
                <TopNavBar />
              </div>
              {/* Mirrors the header's own height, components/nav/top-nav-bar.tsx:18
                  (`h-[83px] fixed`), which only renders at `md` and up — so the
                  base pt-16 stays: below `md` there is no header, and that 64px
                  is what clears the mobile sheet trigger. It was 64px at every
                  width, so the header painted over the top 19px of every page. */}
              <div className="flex flex-1 pt-16 md:pt-[83px]">
                <NavSidebar
                  categories={categories}
                  contributors={contributors}
                />
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
