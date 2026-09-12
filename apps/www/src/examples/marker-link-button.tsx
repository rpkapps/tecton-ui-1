// Synced from shadcn/ui (apps/v4/examples/aria/marker-link-button.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { GitBranchIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { Marker, MarkerContent, MarkerIcon } from "@tecton/react/components/marker"

export function MarkerLinkButtonDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Marker render={(props) => <a href="#links-and-buttons" {...props} />}>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>View the pull request</MarkerContent>
      </Marker>
      <Marker
        className="transition-colors hover:text-foreground"
        render={(props) => (
          <button
            {...props}
            type="button"
            onClick={() => toast("You clicked the revert button")}
          />
        )}
      >
        <MarkerIcon>
          <RotateCcwIcon />
        </MarkerIcon>
        <MarkerContent>Revert this change</MarkerContent>
      </Marker>
    </div>
  )
}
