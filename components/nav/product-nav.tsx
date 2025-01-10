// components/nav/product-nav.tsx

"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { BoxIcon, Hash, TagIcon, User } from "lucide-react"

import { cn, truncateString } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"


type ProductNavProps = {
  authors?: string[]
  categories?: string[]
  tags?: string[]
  labels?: string[]
  handleLinkClick?: () => void
  searchParams: URLSearchParams
  children?: ReactNode
}

export function ProductNav({
  authors,
  categories,
  labels,
  tags,
  handleLinkClick,
  searchParams,
  children,
}: ProductNavProps) {
  // console.log("🚀 ~ authors -  ProductNav:", authors)
  return (
    <div className="">
      {/* <Logo /> */}
      {children}
      <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-200px)] flex flex-col gap-4 pl-2">
        {/* Categories Section */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <BoxIcon className="size-5 stroke-pink-400" />
            <p className="text-sm md:hidden">Categories</p>
          </div>
        )}
        <ul className="mt-2 w-36 flex flex-col gap-2 items-start justify-center py-2">
          {categories?.map((category, index) => (
            <li key={`category-${index}-${category}`}>
              <Link
                href={`/products?category=${encodeURIComponent(category)}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
                  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
                  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
                  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
                  searchParams.get("category") === category
                    ? "bg-yellow-400 text-black dark:text-black"
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1">{truncateString(category, 12)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {/* Authors */}
        {authors && authors.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <User className="size-5 stroke-pink-400" />
            <p className="text-sm md:hidden">Authors</p>
          </div>
        )}
        <ul className="mt-2 w-36 flex flex-col gap-2 items-start justify-center py-2">
          {authors?.map((author, index) => (
            <li key={`category-${index}-${author}`}>
              <Link
                href={`/products?author=${encodeURIComponent(author)}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
                  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
                  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
                  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
                  searchParams.get("author") === author
                    ? "bg-yellow-400 text-black dark:text-black"
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1">{truncateString(author, 12)}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Tags Section */}
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <TagIcon className="size-5 stroke-pink-400" />
            <p className="text-sm md:hidden">Tags</p>
          </div>
        )}
        <ul className="mt-2 md:w-36 flex flex-col gap-2 items-start justify-center py-2">
          {tags?.map((tag, index) => (
            <li key={`tag-${index}-${tag}`}>
              <Link
                href={`/products?tag=${encodeURIComponent(tag)}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
                  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
                  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
                  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
                  searchParams.get("tag") === tag
                    ? "bg-pink-400 text-black dark:text-black"
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1 truncate">{truncateString(tag, 12)}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Labels Section */}
        {labels && labels.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <Hash className="size-5 stroke-cyan-400" />
            <p className="text-sm md:hidden">Labels</p>
          </div>
        )}
        <ul className="mt-2 w-36 flex flex-col gap-2 items-start justify-center py-2">
          {labels?.map((label, index) => (
            <li key={`label-${index}-${label}`}>
              <Link
                href={`/products?label=${encodeURIComponent(label)}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
                  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
                  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
                  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
                  searchParams.get("label") === label
                    ? "bg-cyan-400 text-black dark:text-black"
                    : ""
                )}
                prefetch={false}
              >
                <span className="text-ellipsis overflow-hidden">
                  {truncateString(label, 12)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
