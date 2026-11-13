// Synced from shadcn/ui (apps/v4/examples/base/kbd-tooltip.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/button"
import { ButtonGroup } from "@tecton/react/button-group"
import { Kbd, KbdGroup } from "@tecton/react/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@tecton/react/tooltip"

export default function KbdTooltip() {
  return (
    <div className="flex flex-wrap gap-4">
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            Save
          </TooltipTrigger>
          <TooltipContent>
            Save Changes <Kbd>S</Kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            Print
          </TooltipTrigger>
          <TooltipContent>
            Print Document{" "}
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </ButtonGroup>
    </div>
  )
}
