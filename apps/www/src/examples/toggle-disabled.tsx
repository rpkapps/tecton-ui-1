// Synced from shadcn/ui (apps/v4/examples/aria/toggle-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Toggle } from "@tecton/react/components/toggle"

export function ToggleDisabled() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle aria-label="Toggle disabled" isDisabled>
        Disabled
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle disabled outline" isDisabled>
        Disabled
      </Toggle>
    </div>
  )
}
