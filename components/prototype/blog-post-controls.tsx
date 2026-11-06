"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSavedDemos } from "@/hooks/use-saved-demos"
import { SignInControl } from "@/components/sign-in-control"
import { StarControl } from "@/components/star-control"
import { ModeToggle } from "@/app/providers"

export type BlogVariant = "A" | "B" | "C"

const NAMES = {
  A: "Editorial",
  B: "Reference",
  C: "Story",
} as const
const VARIANTS: BlogVariant[] = ["A", "B", "C"]
const ROUTE = "/prototype/blog-post"
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-acc focus-visible:outline-offset-4"

export function BlogPrototypeHeader({ variant }: { variant: BlogVariant }) {
  const { ids } = useSavedDemos()
  const href = `${ROUTE}?variant=${variant}`

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-header backdrop-blur-[10px]">
      <div className="flex min-h-[62px] flex-wrap items-center gap-3 px-[14px] py-3 md:flex-nowrap md:px-[26px] md:py-0">
        <Link
          href="/"
          className={cn(
            "text-[16px] font-bold tracking-[-0.02em] text-t1",
            FOCUS
          )}
        >
          rnui<span className="text-acc">.dev</span>
        </Link>
        <nav
          aria-label="Prototype site navigation"
          className="order-3 flex w-full items-center gap-5 text-[12.5px] md:order-none md:w-auto"
        >
          <Link href="/" className={cn("text-t2 hover:text-t1", FOCUS)}>
            Catalogue
          </Link>
          <Link
            href={href}
            aria-current="page"
            className={cn(
              "border-b-2 border-acc py-2 font-medium text-acc",
              FOCUS
            )}
          >
            Blog
          </Link>
        </nav>
        <form
          action="/products"
          role="search"
          className="order-4 flex w-full items-center gap-2 rounded-chip border border-line bg-field px-3 md:order-none md:mx-auto md:max-w-[424px] md:flex-1"
        >
          <Search aria-hidden="true" className="size-4 shrink-0 text-t3" />
          <input
            name="search"
            aria-label="Search recordings"
            placeholder="Search recordings"
            className="h-9 w-full min-w-0 bg-transparent text-[12.5px] text-t1 outline-none placeholder:text-t3 focus-visible:ring-2 focus-visible:ring-acc"
          />
        </form>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <Link
            href="/bookmarks"
            aria-label={`Saved ${ids?.length ?? 0}`}
            className={cn(
              "rounded-chip border border-line px-2 py-2 text-xs text-t2",
              FOCUS
            )}
          >
            <span aria-hidden="true">
              ◆ <span className="hidden xl:inline">Saved </span>
              {ids?.length ?? 0}
            </span>
          </Link>
          <span className="hidden lg:inline">
            <StarControl variant="desktop" />
          </span>
          <SignInControl />
          <ModeToggle compact />
        </div>
      </div>
    </header>
  )
}

export function BlogPrototypeSwitcher({ variant }: { variant: BlogVariant }) {
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          "input, textarea, select, button, a, [contenteditable], [role='dialog']"
        )
      )
        return
      event.preventDefault()
      const index = VARIANTS.indexOf(variant)
      const next =
        VARIANTS[(index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3]
      router.replace(`${ROUTE}?variant=${next}`, { scroll: true })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [router, variant])

  if (process.env.NODE_ENV === "production") return null
  const index = VARIANTS.indexOf(variant)

  return (
    <nav
      aria-label="Prototype variants"
      className="fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2 items-center justify-between gap-1 rounded-panel border border-acc bg-panel p-2 text-xs shadow-e2"
    >
      <button
        aria-label="Previous variant"
        onClick={() =>
          router.replace(`${ROUTE}?variant=${VARIANTS[(index + 2) % 3]}`)
        }
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-chip text-acc hover:bg-acc-soft",
          FOCUS
        )}
      >
        <ArrowLeft className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p
          aria-live="polite"
          className="mb-1 text-center font-mono text-[9px] tracking-wider text-t3"
        >
          PROTOTYPE · {variant} / {NAMES[variant]}
        </p>
        <div className="flex justify-center gap-1">
          {VARIANTS.map((key) => (
            <Link
              key={key}
              href={`${ROUTE}?variant=${key}`}
              aria-current={variant === key ? "page" : undefined}
              className={cn(
                "rounded-badge px-3 py-2",
                variant === key
                  ? "bg-acc text-on-acc"
                  : "text-t2 hover:bg-well",
                FOCUS
              )}
            >
              {NAMES[key]}
            </Link>
          ))}
        </div>
      </div>
      <button
        aria-label="Next variant"
        onClick={() =>
          router.replace(`${ROUTE}?variant=${VARIANTS[(index + 1) % 3]}`)
        }
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-chip text-acc hover:bg-acc-soft",
          FOCUS
        )}
      >
        <ArrowRight className="size-4" />
      </button>
    </nav>
  )
}

export { NAMES as BLOG_VARIANT_NAMES }
