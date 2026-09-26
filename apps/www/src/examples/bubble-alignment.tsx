// Synced from shadcn/ui (apps/v4/examples/base/bubble-alignment.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Bubble, BubbleContent } from "@tecton/react/components/bubble"

export function BubbleAlignmentDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble variant="muted">
        <BubbleContent>
          This bubble is aligned to the start. This is the default alignment.
        </BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>
          This bubble is aligned to the end. Use this for user messages.
        </BubbleContent>
      </Bubble>
    </div>
  )
}
