// Synced from shadcn/ui (apps/v4/examples/base/shimmer-marker.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Marker, MarkerContent, MarkerIcon } from "@tecton/react/components/marker"
import { Spinner } from "@tecton/react/components/spinner"

export function ShimmerMarker() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
      </Marker>
      <Marker variant="separator" role="status">
        <MarkerContent className="shimmer">Reading 4 files</MarkerContent>
      </Marker>
    </div>
  )
}
