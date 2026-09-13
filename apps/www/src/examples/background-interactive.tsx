import {
  GridBackground,
  HexagonsBackground,
  TerrainGridBackground,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

/** The pointer reveals the pattern around it; the effects stay quiet otherwise. */
export default function BackgroundInteractive() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      <BackgroundPreview
        className="h-48"
        background={<GridBackground tone="blue" interactive />}
      >
        <span className="text-sm font-medium">grid</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={<HexagonsBackground tone="blue" interactive />}
      >
        <span className="text-sm font-medium">hexagons</span>
      </BackgroundPreview>
      <BackgroundPreview
        className="h-48"
        background={<TerrainGridBackground tone="blue" interactive />}
      >
        <span className="text-sm font-medium">terrain-grid</span>
      </BackgroundPreview>
    </div>
  )
}
