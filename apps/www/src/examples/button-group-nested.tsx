// Synced from shadcn/ui (apps/v4/examples/aria/button-group-nested.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { AddIcon, GraphicEqIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import { Input } from "@tecton/react/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/components/input-group"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function ButtonGroupNested() {
  return (
    <ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="icon">
          <AddIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <InputGroup>
          <InputGroupInput placeholder="Send a message..." />
          <TooltipTrigger>
            <InputGroupAddon align="inline-end">
              <GraphicEqIcon />
            </InputGroupAddon>
            <Tooltip>Voice Mode</Tooltip>
          </TooltipTrigger>
        </InputGroup>
      </ButtonGroup>
    </ButtonGroup>
  )
}
