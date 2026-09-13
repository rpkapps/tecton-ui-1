import { ContourBackground } from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

export default function BackgroundContour() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      <BackgroundPreview
        className="h-48"
        background={<ContourBackground intensity="high" />}
      >
        <span className="text-sm font-medium">palette="map"</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={
          <ContourBackground palette="tone" tone="azure" intensity="high" />
        }
      >
        <span className="text-sm font-medium">palette="tone"</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={<ContourBackground grid intensity="high" />}
      >
        <span className="text-sm font-medium">grid</span>
      </BackgroundPreview>
    </div>
  )
}
