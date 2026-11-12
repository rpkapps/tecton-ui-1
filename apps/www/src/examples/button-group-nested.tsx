// Synced from shadcn/ui (apps/v4/examples/base/button-group-nested.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { AudioLinesIcon, PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/button"
import { ButtonGroup } from "@tecton/react/button-group"
import { Input } from "@tecton/react/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@tecton/react/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/tooltip"

export function ButtonGroupNested() {
  return (
    <ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="icon">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <InputGroup>
          <InputGroupInput placeholder="Send a message..." />
          <Tooltip>
            <TooltipTrigger render={<InputGroupAddon align="inline-end" />}>
              <AudioLinesIcon />
            </TooltipTrigger>
            <TooltipContent>Voice Mode</TooltipContent>
          </Tooltip>
        </InputGroup>
      </ButtonGroup>
    </ButtonGroup>
  )
}
