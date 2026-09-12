// Synced from shadcn/ui (apps/v4/examples/aria/skeleton-avatar.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Skeleton } from "@tecton/react/components/skeleton"

export function SkeletonAvatar() {
  return (
    <div className="flex w-fit items-center gap-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  )
}
