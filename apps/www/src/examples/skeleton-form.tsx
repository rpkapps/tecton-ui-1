// Synced from shadcn/ui (apps/v4/examples/aria/skeleton-form.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Skeleton } from "@tecton/react/components/skeleton"

export function SkeletonForm() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  )
}
