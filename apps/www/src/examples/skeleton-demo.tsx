// Synced from shadcn/ui (apps/v4/examples/aria/skeleton-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Skeleton } from "@tecton/react/components/skeleton"

export function SkeletonDemo() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}
