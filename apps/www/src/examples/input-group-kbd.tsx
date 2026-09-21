// Synced from shadcn/ui (apps/v4/examples/aria/input-group-kbd.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { SearchIcon } from "@tecton/react/icons"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import { Kbd } from "@tecton/react/components/kbd"

export function InputGroupKbd() {
  return (
    <InputGroup className="max-w-sm">
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <SearchIcon className="text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}
