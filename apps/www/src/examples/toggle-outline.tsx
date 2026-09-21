// Synced from shadcn/ui (apps/v4/examples/aria/toggle-outline.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { FormatBoldIcon, FormatItalicIcon } from "@tecton/react/icons"

import { Toggle } from "@tecton/react/components/toggle"

export function ToggleOutline() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle italic">
        <FormatItalicIcon />
        Italic
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle bold">
        <FormatBoldIcon />
        Bold
      </Toggle>
    </div>
  )
}
