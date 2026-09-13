import {
  FlowBackground,
  SeismicBackground,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

/** `animate={false}` freezes an effect on its first frame; reduced motion does the same. */
export default function BackgroundStatic() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      <BackgroundPreview
        className="h-40"
        background={<SeismicBackground tone="lime" animate={false} />}
      >
        <span className="text-sm font-medium">Seismic, static</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-40"
        background={<FlowBackground tone="lime" speed="slow" />}
      >
        <span className="text-sm font-medium">Flow, slow</span>
      </BackgroundPreview>
    </div>
  )
}
