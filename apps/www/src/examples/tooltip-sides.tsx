// Synced from shadcn/ui (apps/v4/examples/aria/tooltip-sides.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/components/button"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"

export function TooltipSides() {
  return (
    <div className="flex flex-wrap gap-2">
      {(["left", "top", "bottom", "right"] as const).map((side) => (
        <TooltipTrigger key={side}>
          <Button variant="outline" className="w-fit capitalize">
            {side}
          </Button>
          <Tooltip placement={side}>
            <p>Add to library</p>
          </Tooltip>
        </TooltipTrigger>
      ))}
    </div>
  )
}
