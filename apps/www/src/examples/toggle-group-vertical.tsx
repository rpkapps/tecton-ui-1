// Synced from shadcn/ui (apps/v4/examples/aria/toggle-group-vertical.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { FormatBoldIcon, FormatItalicIcon, FormatUnderlinedIcon } from "@tecton/react/icons"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

export function ToggleGroupVertical() {
  return (
    <ToggleGroup
      selectionMode="multiple"
      orientation="vertical"
      spacing={1}
      defaultSelectedKeys={["bold", "italic"]}
    >
      <ToggleGroupItem id="bold" aria-label="Toggle bold">
        <FormatBoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem id="italic" aria-label="Toggle italic">
        <FormatItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem id="underline" aria-label="Toggle underline">
        <FormatUnderlinedIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
