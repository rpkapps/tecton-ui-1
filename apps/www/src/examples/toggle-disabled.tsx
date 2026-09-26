// Synced from shadcn/ui (apps/v4/examples/base/toggle-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Toggle } from "@tecton/react/components/toggle"

export function ToggleDisabled() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle aria-label="Toggle disabled" disabled>
        Disabled
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle disabled outline" disabled>
        Disabled
      </Toggle>
    </div>
  )
}
