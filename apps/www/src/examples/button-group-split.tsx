// Synced from shadcn/ui (apps/v4/examples/aria/button-group-split.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@tecton/react/components/button-group"

export default function ButtonGroupSplit() {
  return (
    <ButtonGroup>
      <Button variant="secondary">Button</Button>
      <ButtonGroupSeparator />
      <Button size="icon" variant="secondary">
        <PlusIcon />
      </Button>
    </ButtonGroup>
  )
}
