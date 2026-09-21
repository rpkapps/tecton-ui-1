// Synced from shadcn/ui (apps/v4/examples/aria/toggle-group-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { FormatBoldIcon, FormatItalicIcon, FormatUnderlinedIcon } from "@tecton/react/icons"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupDisabled() {
  return (
    <ToggleGroup isDisabled>
      <ToggleGroupItem id="bold" aria-label="Toggle bold">
        <FormatBoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem id="italic" aria-label="Toggle italic">
        <FormatItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem id="strikethrough" aria-label="Toggle strikethrough">
        <FormatUnderlinedIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
