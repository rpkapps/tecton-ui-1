import { HandIcon, RulerIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

import {
  Canvas,
  CanvasLegend,
  CanvasLegendItem,
  CanvasOverlay,
  CanvasSurface,
  CanvasToolbar,
  CanvasToolbarButton,
} from "@tecton/react/tecton/canvas"

export default function CanvasDemo() {
  return (
    <Canvas className="h-72 w-full max-w-2xl rounded-lg border">
      <CanvasSurface className="bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] [background-size:20px_20px]" />
      <CanvasOverlay position="top-start">
        <CanvasToolbar aria-label="Navigation">
          <CanvasToolbarButton aria-label="Zoom in">
            <ZoomInIcon />
          </CanvasToolbarButton>
          <CanvasToolbarButton aria-label="Zoom out">
            <ZoomOutIcon />
          </CanvasToolbarButton>
          <CanvasToolbarButton aria-label="Pan">
            <HandIcon />
          </CanvasToolbarButton>
        </CanvasToolbar>
      </CanvasOverlay>
      <CanvasOverlay position="top-end">
        <CanvasToolbar orientation="horizontal" aria-label="Measure">
          <CanvasToolbarButton aria-label="Measure">
            <RulerIcon />
          </CanvasToolbarButton>
        </CanvasToolbar>
      </CanvasOverlay>
      <CanvasOverlay position="bottom-start">
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
