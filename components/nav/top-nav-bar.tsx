// components/nav/top-nav-bar.tsx
//
// A client component, though nothing in here is interactive and every Radix
// primitive it uses is already one.
//
// As a server component its children crossed the RSC boundary as Flight data,
// and past a size threshold React stops inlining an element into the parent row
// and emits a lazy reference to a row of its own instead. Radix's `asChild`
// renders through `Slot`, which reads `children.props` — a lazy reference has
// none, so the child is silently erased and the `<li>` is served empty. It hit
// the last of the three items, because it is the one furthest down the row.
//
// The trigger was adding `suppressHydrationWarning` to the `<html>` tag in
// app/layout.tsx — a few bytes earlier in the same payload, nothing to do with
// this file. That is the tell: it is a size threshold, so anything that grows
// the tree can set it off again, and the two items that still rendered were
// only ever lucky. Marking the boundary here keeps the whole subtree out of
// Flight, so no `asChild` child in it can be outlined.
"use client"

import Link from "next/link"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import clsx from "clsx"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

import { Logo } from "../logo"

export function TopNavBar() {
  return (
    <header className="flex items-center justify-between bg-background px-4 h-[83px] fixed top-0 left-0 right-0 z-50">
      {/* Left Side: Animated Logo */}
      <div className="flex items-center">
        <Logo />
      </div>

      {/* Right Side: Navigation Links */}
      <div className="flex items-center space-x-4">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/bookmarks"
                  className={clsx(
                    navigationMenuTriggerStyle()
                    // " border dark:border-gray-500 border-gray-100"
                  )}
                >
                  Bookmarks
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/subscribe" className={navigationMenuTriggerStyle()}>
                  Subscribe
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="https://github.com/mrpmohiburrahman/awesome-react-native-ui"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    navigationMenuTriggerStyle(),
                    "border dark:border-gray-500 border-gray-100",
                    "gap-2"
                  )}
                >
                  <GitHubLogoIcon className="w-5 h-5" />
                  Star us on GitHub
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
