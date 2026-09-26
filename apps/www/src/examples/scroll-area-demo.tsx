// Synced from shadcn/ui (apps/v4/examples/base/scroll-area-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import * as React from "react"

import { ScrollArea } from "@tecton/react/components/scroll-area"
import { Separator } from "@tecton/react/components/separator"

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
)

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
        {tags.map((tag) => (
          <React.Fragment key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </React.Fragment>
        ))}
      </div>
    </ScrollArea>
  )
}
