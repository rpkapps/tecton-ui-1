// Synced from shadcn/ui (apps/v4/examples/aria/skeleton-card.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Card, CardContent, CardHeader } from "@tecton/react/components/card"
import { Skeleton } from "@tecton/react/components/skeleton"

export function SkeletonCard() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  )
}
