// Synced from shadcn/ui (apps/v4/examples/aria/button-group-size.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { AddIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"

export default function ButtonGroupSize() {
  return (
    <div className="flex flex-col items-start gap-8">
      <ButtonGroup>
        <Button variant="outline" size="sm">
          Small
        </Button>
        <Button variant="outline" size="sm">
          Button
        </Button>
        <Button variant="outline" size="sm">
          Group
        </Button>
        <Button variant="outline" size="icon-sm">
          <AddIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Default</Button>
        <Button variant="outline">Button</Button>
        <Button variant="outline">Group</Button>
        <Button variant="outline" size="icon">
          <AddIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button variant="outline" size="lg">
          Button
        </Button>
        <Button variant="outline" size="lg">
          Group
        </Button>
        <Button variant="outline" size="icon-lg">
          <AddIcon />
        </Button>
      </ButtonGroup>
    </div>
  )
}
