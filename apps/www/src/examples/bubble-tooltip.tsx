// Synced from shadcn/ui (apps/v4/examples/aria/bubble-tooltip.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { CheckIcon } from "@tecton/react/icons"

import {
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function BubbleTooltipDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 py-12">
      <Bubble variant="secondary">
        <BubbleContent>Did you remove the stale route?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Yes, removed it from the registry.</BubbleContent>
        <BubbleReactions>
          <TooltipTrigger>
            <Button variant="ghost" size="icon-xs">
              <CheckIcon />
            </Button>
            <Tooltip>Read on Jan 5, 2026 at 4:32 PM</Tooltip>
          </TooltipTrigger>
        </BubbleReactions>
      </Bubble>
    </div>
  )
}
