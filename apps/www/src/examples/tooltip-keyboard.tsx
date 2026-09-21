// Synced from shadcn/ui (apps/v4/examples/aria/tooltip-keyboard.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { SaveIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { Kbd } from "@tecton/react/components/kbd"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function TooltipKeyboard() {
  return (
    <TooltipTrigger>
      <Button variant="outline" size="icon-sm">
        <SaveIcon />
      </Button>
      <Tooltip>
        Save Changes <Kbd>S</Kbd>
      </Tooltip>
    </TooltipTrigger>
  )
}
