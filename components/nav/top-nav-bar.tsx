// components/nav/top-nav-bar.tsx
import Link from "next/link"
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
            {/* <NavigationMenuItem>
              <Link href="/feedback" legacyBehavior passHref>
                <NavigationMenuLink
                  className={clsx(
                    navigationMenuTriggerStyle(),
                    " border dark:border-gray-500 border-gray-100"
                  )}
                >
                Feedback
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem> */}
            <NavigationMenuItem>
              <Link href="/bookmarks" legacyBehavior passHref>
                <NavigationMenuLink
                  className={clsx(
                    navigationMenuTriggerStyle()
                    // " border dark:border-gray-500 border-gray-100"
                  )}
                >
                  Bookmarks
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/subscribe" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Subscribe
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
