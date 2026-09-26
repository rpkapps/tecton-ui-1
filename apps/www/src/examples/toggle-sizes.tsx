// Synced from shadcn/ui (apps/v4/examples/base/toggle-sizes.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Toggle } from "@tecton/react/components/toggle"

export function ToggleSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle small" size="sm">
        Small
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle default" size="default">
        Default
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle large" size="lg">
        Large
      </Toggle>
    </div>
  )
}
