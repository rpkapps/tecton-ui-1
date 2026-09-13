import { Button } from "@tecton/react/components/button"
import { PipelineGridBackground } from "@tecton/react/tecton/background"

/** The pointer reveals the grid around it; the effect stays quiet otherwise. */
export default function BackgroundInteractive() {
  return (
    <div className="relative isolate flex h-64 w-full max-w-3xl flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border bg-background p-6 text-center">
      <PipelineGridBackground tone="blue" interactive />
      <h3 className="text-2xl font-medium">Move the pointer over this area</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Pointer reactivity is opt in. Keep it for landing and onboarding
        surfaces, not behind dashboards people stare at all day.
      </p>
      <Button size="sm">Open pipeline map</Button>
    </div>
  )
}
