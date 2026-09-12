// Synced from shadcn/ui (apps/v4/examples/aria/button-with-icon.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { GitBranchIcon, GitForkIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"

export default function ButtonWithIcon() {
  return (
    <div className="flex gap-2">
      <Button variant="outline">
        <GitBranchIcon data-icon="inline-start" /> New Branch
      </Button>
      <Button variant="outline">
        Fork
        <GitForkIcon data-icon="inline-end" />
      </Button>
    </div>
  )
}
