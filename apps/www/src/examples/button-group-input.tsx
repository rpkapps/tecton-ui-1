// Synced from shadcn/ui (apps/v4/examples/base/button-group-input.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { SearchIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import { Input } from "@tecton/react/components/input"

export default function ButtonGroupInput() {
  return (
    <ButtonGroup>
      <Input placeholder="Search..." />
      <Button variant="outline" aria-label="Search">
        <SearchIcon />
      </Button>
    </ButtonGroup>
  )
}
