// Synced from shadcn/ui (apps/v4/examples/aria/toggle-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { BookmarkIcon } from "lucide-react"

import { Toggle } from "@tecton/react/components/toggle"

export function ToggleDemo() {
  return (
    <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
      <BookmarkIcon className="group-aria-pressed/toggle:fill-foreground" />
      Bookmark
    </Toggle>
  )
}
