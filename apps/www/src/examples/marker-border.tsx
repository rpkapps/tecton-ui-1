// Synced from shadcn/ui (apps/v4/examples/aria/marker-border.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { AccountTreeIcon, DescriptionIcon, SearchIcon } from "@tecton/react/icons"

import { Marker, MarkerContent, MarkerIcon } from "@tecton/react/components/marker"

export function MarkerBorderDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 py-12">
      <Marker variant="border">
        <MarkerIcon>
          <AccountTreeIcon />
        </MarkerIcon>
        <MarkerContent>Switched to release-candidate</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <SearchIcon />
        </MarkerIcon>
        <MarkerContent>Reviewed 8 related files</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <DescriptionIcon />
        </MarkerIcon>
        <MarkerContent>Opened implementation notes</MarkerContent>
      </Marker>
    </div>
  )
}
