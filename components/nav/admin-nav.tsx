"use client"

import Link from "next/link"
import {
  BarChartIcon,
  FilterIcon,
  FolderOpenIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AdminNav({ pathname }: { pathname: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/admin"
            className={cn(
              "flex gap-2 md:gap-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
              {
                "bg-accent text-accent-foreground": pathname === "/admin",
              }
            )}
            prefetch={false}
          >
            <BarChartIcon className="h-5 w-5" />
            <span className="md:sr-only">Overview</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Dashboard</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/admin/products"
            className={cn(
              "flex gap-2 md:gap-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
              {
                "bg-accent text-accent-foreground":
                  pathname === "/admin/products",
              }
            )}
            prefetch={false}
          >
            <FolderOpenIcon className="h-5 w-5" />
            <span className="md:sr-only">Products</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Products</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/admin/users"
            className={cn(
              "flex gap-2 md:gap-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
              {
                "bg-accent text-accent-foreground": pathname === "/admin/users",
              }
            )}
            prefetch={false}
          >
            <UsersIcon className="h-5 w-5" />
            <span className="md:sr-only">Users</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Users</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/admin/filters"
            className={cn(
              "flex gap-2 md:gap-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
              {
                "bg-accent text-accent-foreground":
                  pathname === "/admin/filters",
              }
            )}
            prefetch={false}
          >
            <FilterIcon className="h-5 w-5" />
            <span className="md:sr-only">Filters</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Filters</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
