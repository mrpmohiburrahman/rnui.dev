import Link from "next/link"

import { cn } from "@/lib/utils"

export type SectionName = "catalogue" | "blog"

const LINK =
  "text-[12.5px] transition-colors duration-150 ease-out hover:text-t1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc"

function linkClass(active: boolean) {
  return cn(
    LINK,
    active
      ? "border-b-2 border-acc pb-[2px] font-medium text-acc"
      : "text-t2"
  )
}

export function SectionLinks({
  active,
  className,
  catalogueClassName,
  as = "nav",
}: {
  active: SectionName | null
  className?: string
  catalogueClassName?: string
  as?: "nav" | "div"
}) {
  const Element = as

  return (
    <Element
      aria-label={as === "nav" ? "Site sections" : undefined}
      className={cn("flex items-center gap-[18px]", className)}
    >
      <Link
        href="/"
        aria-current={active === "catalogue" ? "page" : undefined}
        className={cn(linkClass(active === "catalogue"), catalogueClassName)}
      >
        Catalogue
      </Link>
      <Link
        href="/blog"
        aria-current={active === "blog" ? "page" : undefined}
        className={linkClass(active === "blog")}
      >
        Blog
      </Link>
    </Element>
  )
}
