// Synced from shadcn/ui (apps/v4/examples/aria/marker-shimmer.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Marker, MarkerContent } from "@tecton/react/components/marker"

export function MarkerShimmerDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8 py-12">
      <Marker role="status">
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
      </Marker>
      <Marker variant="separator" role="status">
        <MarkerContent className="shimmer">Reading 4 files</MarkerContent>
      </Marker>
    </div>
  )
}
