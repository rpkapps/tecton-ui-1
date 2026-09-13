import {
  FlowBackground,
  SeismicBackground,
} from "@tecton/react/tecton/background"

/** `animate={false}` freezes an effect on its first frame; reduced motion does the same. */
export default function BackgroundStatic() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="relative isolate flex h-40 items-end overflow-hidden rounded-lg border bg-background p-3">
        <SeismicBackground tone="lime" animate={false} />
        <span className="text-sm font-medium">Seismic, static</span>
      </div>
      <div className="relative isolate flex h-40 items-end overflow-hidden rounded-lg border bg-background p-3">
        <FlowBackground tone="lime" speed="slow" />
        <span className="text-sm font-medium">Flow, slow</span>
      </div>
    </div>
  )
}
