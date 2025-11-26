import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

function ResourceCardSkeleton() {
  return (
    <div className="w-full sm:w-[221px] rounded-lg overflow-hidden shadow-elevationLight bg-white dark:bg-[#1E1E1E]">
      {/* Video placeholder - 9:16 aspect ratio */}
      <Skeleton className="w-full aspect-[9/16] rounded-t-lg" />

      {/* Card content */}
      <div className="p-4 space-y-3">
        {/* Author title */}
        <Skeleton className="h-4 w-3/4" />

        {/* Caption lines */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Social icons */}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>

        {/* View/Vote counts */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function GridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <ResourceCardSkeleton key={i} />
      ))}
    </div>
  )
}

export { Skeleton, ResourceCardSkeleton, GridSkeleton }

