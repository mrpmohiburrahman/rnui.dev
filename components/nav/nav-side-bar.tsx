// components/nav/nav-side-bar.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Bookmark, HomeIcon, PanelLeftIcon, Rss } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/app/providers"

import { Logo } from "../logo"
import { AdminNav } from "./admin-nav"
import { ProductNav } from "./product-nav"

type NavSidebarProps = {
  categories: string[]
  authors?: string[]
  labels?: string[]
  tags?: string[]
}

export function NavSidebar({
  authors,
  categories,
  labels,
  tags,
}: NavSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSheetOpen, setSheetOpen] = useState(false)

  const handleLinkClick = () => {
    setSheetOpen(false)
  }

  return (
    <>
      <aside
        className={cn(
          pathname.includes("admin")
            ? "w-16 border-r border-black/10 dark:border-white/10"
            : "w-42",
          "fixed inset-y-0 left-0 z-10 hidden sm:flex flex-col bg-[#FAFAFA] justify-center dark:bg-background pt-10" // Added pt-4 here
        )}
        // style={{ borderWidth: 1, borderColor: "black" }}
      >
        {/* Navigation Section */}
        <nav className="flex flex-col items-center gap-4 px-2 py-5">
          {pathname.includes("admin") ? (
            <>
              <Logo />
              <AdminNav pathname={pathname} />
            </>
          ) : (
            <ProductNav
              categories={categories}
              labels={labels}
              tags={tags}
              authors={authors}
              searchParams={searchParams}
            />
          )}
        </nav>

        {/* Bottom Controls: Avatar and ModeToggle */}
        <div
          className={
            pathname.includes("admin")
              ? "flex flex-col gap-4 items-center py-5 mt-auto px-2 mx-2"
              : " flex flex-col justify-center gap-4 items-start pl-4"
          }
        >
          {/* Mode Toggle */}
          <ModeToggle />
        </div>
      </aside>

      {/* Mobile Header and Sheet */}
      <div
        className="flex flex-col gap-4 pb-2 px-2"
        style={{
          // borderWidth: 1,
          borderColor: "black",
          position: "absolute",
          top: 10,
        }}
      >
        <header
          className={
            "sticky top-0 z-30 flex h-10 mx-1 rounded-b-lg items-center gap-4 bg-background dark:bg-[#1E1E1E] sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"
          }
        >
          {/* Mobile Menu Trigger */}
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden bg-accent">
                <PanelLeftIcon />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            {/* Logo in Mobile Header */}
            {/* <div className="ml-auto mt-1 md:hidden">
              <Logo />
            </div> */}
            {/* Mobile Sheet Content */}
            <SheetContent
              side="left"
              className="sm:max-w-[15rem] py-4 pl-1 border-r border-primary/10"
            >
              <div className="ml-4 mt-1 md:hidden">
                <Logo />
              </div>
              <nav className="flex flex-col justify-between h-full">
                {/* Navigation Links */}
                <div className="flex flex-col items-start gap-4 px-2 py-1">
                  {pathname.includes("admin") ? (
                    <>
                      <Logo />
                      <AdminNav pathname={pathname} />
                    </>
                  ) : (
                    <>
                      <ProductNav
                        categories={categories}
                        labels={labels}
                        tags={tags}
                        handleLinkClick={handleLinkClick}
                        searchParams={searchParams}
                      />
                      <div className="my-4 space-y-3">
                        <Link
                          href="/subscribe"
                          className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          prefetch={false}
                          onClick={handleLinkClick}
                        >
                          <Rss className="h-5 w-5" />
                          Subscribe
                        </Link>
                        <Link
                          href="/bookmarks"
                          className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          prefetch={false}
                          onClick={handleLinkClick}
                        >
                          <Bookmark className="h-5 w-5" />
                          Bookmarks
                        </Link>
                        <Link
                          href="/"
                          className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          prefetch={false}
                          onClick={handleLinkClick}
                        >
                          <HomeIcon className="h-5 w-5" />
                          Home
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Controls: Avatar and ModeToggle */}
                <div className="flex flex-col items-start pl-4">
                  <nav className="mb-6 flex flex-col gap-4">
                    {/* Mode Toggle */}
                    <ModeToggle />
                  </nav>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </header>
      </div>
    </>
  )
}
