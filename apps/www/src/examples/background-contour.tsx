import { ContourBackground } from "@tecton/react/tecton/background"

export default function BackgroundContour() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="relative isolate flex h-48 items-end overflow-hidden rounded-lg border bg-background p-3">
        <ContourBackground intensity="high" />
        <span className="text-sm font-medium">palette="map"</span>
      </div>
      <div className="relative isolate flex h-48 items-end overflow-hidden rounded-lg border bg-background p-3">
        <ContourBackground palette="tone" tone="azure" intensity="high" />
        <span className="text-sm font-medium">palette="tone"</span>
      </div>
      <div className="relative isolate flex h-48 items-end overflow-hidden rounded-lg border bg-background p-3">
        <ContourBackground grid intensity="high" />
        <span className="text-sm font-medium">grid</span>
      </div>
    </div>
  )
}
