// Synced from shadcn/ui (apps/v4/examples/aria/button-rounded.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonRounded() {
  return (
    <div className="flex gap-2">
      <Button className="rounded-full">Get Started</Button>
      <Button variant="outline" size="icon" className="rounded-full">
        <ArrowUpIcon />
      </Button>
    </div>
  )
}
