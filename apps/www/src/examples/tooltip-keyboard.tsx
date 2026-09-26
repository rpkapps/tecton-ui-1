// Synced from shadcn/ui (apps/v4/examples/base/tooltip-keyboard.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { SaveIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Kbd } from "@tecton/react/components/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/components/tooltip"

export function TooltipKeyboard() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon-sm" />}>
        <SaveIcon />
      </TooltipTrigger>
      <TooltipContent>
        Save Changes <Kbd>S</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}
