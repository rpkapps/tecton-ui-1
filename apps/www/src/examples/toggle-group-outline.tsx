// Synced from shadcn/ui (apps/v4/examples/aria/toggle-group-outline.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupOutline() {
  return (
    <ToggleGroup variant="outline" defaultSelectedKeys={["all"]}>
      <ToggleGroupItem id="all" aria-label="Toggle all">
        All
      </ToggleGroupItem>
      <ToggleGroupItem id="missed" aria-label="Toggle missed">
        Missed
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
