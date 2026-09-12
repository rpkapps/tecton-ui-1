// Synced from shadcn/ui (apps/v4/examples/aria/button-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}
