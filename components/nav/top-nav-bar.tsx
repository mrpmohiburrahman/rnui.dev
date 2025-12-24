// components/nav/top-nav-bar.tsx
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
