import {
  PanToolIcon,
  RulerIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  Canvas,
  CanvasLegend,
  CanvasLegendItem,
  CanvasOverlay,
  CanvasSurface,
  CanvasToolbar,
} from "@tecton/react/tecton/canvas"

export default function CanvasDemo() {
  return (
    <Canvas className="h-72 w-full max-w-2xl rounded-lg border">
      <CanvasSurface className="bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] [background-size:20px_20px]" />
      <CanvasOverlay position="top-left">
        <CanvasToolbar aria-label="Navigation">
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in">
            <ZoomInIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out">
            <ZoomOutIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Pan">
            <PanToolIcon />
          </Button>
        </CanvasToolbar>
      </CanvasOverlay>
      <CanvasOverlay position="top-right">
        <CanvasToolbar orientation="horizontal" aria-label="Measure">
          <Button variant="ghost" size="icon-sm" aria-label="Measure">
            <RulerIcon />
          </Button>
        </CanvasToolbar>
      </CanvasOverlay>
      <CanvasOverlay position="bottom-left">
        <CanvasLegend aria-label="Legend">
          <CanvasLegendItem swatch="var(--chart-1)">
            Existing fields
          </CanvasLegendItem>
          <CanvasLegendItem swatch="var(--chart-2)">Sub-basin</CanvasLegendItem>
          <CanvasLegendItem swatch="var(--chart-5)">
            Water bodies
          </CanvasLegendItem>
        </CanvasLegend>
      </CanvasOverlay>
    </Canvas>
  )
}
