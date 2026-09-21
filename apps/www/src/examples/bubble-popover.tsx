// Synced from shadcn/ui (apps/v4/examples/aria/bubble-popover.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { InfoIcon } from "@tecton/react/icons"

import {
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@tecton/react/components/bubble"
import { Button } from "@tecton/react/components/button"
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@tecton/react/components/popover"

export function BubblePopoverDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 py-12">
      <Bubble align="end">
        <BubbleContent>Run the build script.</BubbleContent>
      </Bubble>
      <Bubble variant="destructive">
        <BubbleContent>Failed to run the command.</BubbleContent>
        <BubbleReactions>
          <PopoverTrigger>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Show error details"
              className="aria-expanded:text-destructive"
            >
              <InfoIcon />
            </Button>
            <Popover>
              <PopoverHeader>
                <PopoverTitle className="text-sm">
                  Command failed with exit code 1
                </PopoverTitle>
                <PopoverDescription className="text-sm">
                  ENOENT: no such file or directory, open pnpm-lock.yaml
                </PopoverDescription>
              </PopoverHeader>
            </Popover>
          </PopoverTrigger>
        </BubbleReactions>
      </Bubble>
    </div>
  )
}
