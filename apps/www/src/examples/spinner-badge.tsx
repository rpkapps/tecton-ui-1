// Synced from shadcn/ui (apps/v4/examples/aria/spinner-badge.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Badge } from "@tecton/react/components/badge"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerBadge() {
  return (
    <div className="flex items-center gap-4 [--radius:1.2rem]">
      <Badge>
        <Spinner data-icon="inline-start" />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Spinner data-icon="inline-start" />
        Updating
      </Badge>
      <Badge variant="outline">
        <Spinner data-icon="inline-start" />
        Processing
      </Badge>
    </div>
  )
}
