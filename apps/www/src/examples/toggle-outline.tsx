// Synced from shadcn/ui (apps/v4/examples/base/toggle-outline.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { BoldIcon, ItalicIcon } from "lucide-react"

import { Toggle } from "@tecton/react/components/toggle"

export function ToggleOutline() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle italic">
        <ItalicIcon />
        Italic
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle bold">
        <BoldIcon />
        Bold
      </Toggle>
    </div>
  )
}
