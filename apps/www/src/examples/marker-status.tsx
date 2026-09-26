// Synced from shadcn/ui (apps/v4/examples/base/marker-status.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Marker, MarkerContent, MarkerIcon } from "@tecton/react/components/marker"
import { Spinner } from "@tecton/react/components/spinner"

export function MarkerStatusDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Compacting conversation</MarkerContent>
      </Marker>
      <Marker variant="separator" role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Running tests</MarkerContent>
      </Marker>
    </div>
  )
}
