// Synced from shadcn/ui (apps/v4/examples/aria/toggle-text.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { FormatItalicIcon } from "@tecton/react/icons"

import { Toggle } from "@tecton/react/components/toggle"

export function ToggleText() {
  return (
    <Toggle aria-label="Toggle italic">
      <FormatItalicIcon />
      Italic
    </Toggle>
  )
}
