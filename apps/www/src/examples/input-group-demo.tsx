// Synced from shadcn/ui (apps/v4/examples/aria/input-group-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { SearchIcon } from "@tecton/react/icons"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"

export function InputGroupDemo() {
  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
    </InputGroup>
  )
}
