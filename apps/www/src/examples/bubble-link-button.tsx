// Synced from shadcn/ui (apps/v4/examples/base/bubble-link-button.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { toast } from "@tecton/react/toast"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
} from "@tecton/react/bubble"

export function BubbleLinkButtonDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble variant="muted">
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={
              <button onClick={() => toast.add({ title: "You clicked forgot password" })} />
            }
          >
            I forgot my password
          </BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={
              <button
                onClick={() => toast.add({ title: "You clicked help with subscription" })}
              />
            }
          >
            I need help with my subscription
          </BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={
              <button
                onClick={() =>
                  toast.add({ title: "You clicked something else. Talk to a human." })
                }
              />
            }
          >
            Something else. Talk to a human.
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  )
}
