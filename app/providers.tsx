// app/providers.tsx
"use client"

import * as React from "react"
import { MotionConfig } from "framer-motion"
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from "next-themes"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {/* Reduced motion is answered once, here, rather than in each animated
          component: `reducedMotion="user"` makes every framer animation below
          drop its transforms and keep its opacity when the OS asks for it.
          Before this it was honoured in exactly one file. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  )
}

export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { setTheme } = useTheme()

  // The chip the mock draws (Catalogue.dc.html:31): `◐ Dark` in dark, `◑ Light`
  // in light. Both labels are in the markup and CSS picks by the `dark` class
  // next-themes writes onto <html> before first paint, so the served document
  // already shows the right one and hydration cannot mismatch — reading
  // `resolvedTheme` instead would need a mount gate and cost a layout shift,
  // because the two labels are not the same width. The dropdown stays: decision 5
  // keeps System as the default, and a two-state switch would delete the way back
  // to it (ui-ux-overhaul ticket 13's Work section).
  return (
    // `modal={false}` so opening this does not lock body scroll. The default
    // locks it, which removes the scrollbar and adds a compensating
    // `padding-right` measured in visual pixels — written into a document the
    // canvas zoom then scales, so the compensation overshoots and the whole
    // header slides left the moment the menu opens. Nothing here needs a
    // modal: it is a three-item theme menu that already closes on outside
    // click, Escape and scroll. Visitors whose platform draws overlay
    // scrollbars never saw it, because for them the compensation is zero.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center rounded-chip border border-line text-[12.5px] text-t2",
          compact
            ? // 38, not the mock's `min-height:36px`: content-box plus the 1px
              // border the trigger already carries above.
              "min-h-[38px] bg-field px-[10px] text-[12px]"
            : "px-[9px] py-[6px]"
        )}
      >
        {/* The phone draws the glyph alone — CatalogueMobile.dc.html:17's
            `modeToggle` is `◐` / `◑` with no word beside it, where the desktop
            header draws `◐ Dark` (Catalogue.dc.html:31, :243). The name is in
            the sr-only label either way, so nothing is lost when it goes. */}
        <span className="hidden dark:inline">
          <span aria-hidden="true">◐</span>
          {!compact && " Dark"}
        </span>
        <span className="inline dark:hidden">
          <span aria-hidden="true">◑</span>
          {!compact && " Light"}
        </span>
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border border-primary/40">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
