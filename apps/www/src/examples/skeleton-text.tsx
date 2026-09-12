// Synced from shadcn/ui (apps/v4/examples/aria/skeleton-text.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Skeleton } from "@tecton/react/components/skeleton"

export function SkeletonText() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
