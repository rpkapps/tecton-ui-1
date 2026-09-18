# Canvas

Full-bleed work surface (map, schematic, 3D view) with floating chrome: overlays pinned to edges and corners, tool rails and a legend.

Source: /docs/tecton/canvas.md

**Example — `canvas-demo`**

```tsx
import { HandIcon, RulerIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

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
            <HandIcon />
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
```

## Usage

```tsx
import {
  Canvas,
  CanvasSurface,
  CanvasOverlay,
  CanvasToolbar,
  CanvasLegend,
  CanvasLegendItem,
} from "@tecton/react/tecton/canvas"
```

```tsx
<Canvas>
  <CanvasSurface>
    <MapEngine />
  </CanvasSurface>
  <CanvasOverlay position="top-left">
    <CanvasToolbar aria-label="Navigation">
      <Button variant="ghost" size="icon-sm" aria-label="Zoom in"><ZoomInIcon /></Button>
    </CanvasToolbar>
  </CanvasOverlay>
  <CanvasOverlay position="bottom-left">
    <CanvasLegend aria-label="Legend">
      <CanvasLegendItem swatch="var(--chart-1)">Existing fields</CanvasLegendItem>
    </CanvasLegend>
  </CanvasOverlay>
</Canvas>
```

> `Canvas` is `flex-1` and fills the remaining height of its column, so place it directly in `AppShellMain` or a `SidebarInset`. Overlays ignore pointer events between their children, so the surface stays interactive around the floating controls.

## Composition

```text
Canvas
├── CanvasSurface
└── CanvasOverlay (position) …
    ├── CanvasToolbar (orientation)
    │   └── Button size="icon-sm" …
    └── CanvasLegend
        └── CanvasLegendItem
```

## API Reference

### Canvas

Relative, isolated container; `flex-1 min-h-0` so it takes the remaining space.

### CanvasSurface

Absolutely positioned layer filling the canvas. Put the map, SVG or WebGL view here.

### CanvasOverlay

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `"top-left" \| "top" \| "top-right" \| "left" \| "right" \| "bottom-left" \| "bottom" \| "bottom-right"` | "top-left" | Edge or corner the overlay is pinned to. Corners and sides stack children vertically, `top` and `bottom` horizontally. |

### CanvasToolbar

Floating surface with `role="toolbar"`; give it an `aria-label`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"vertical" \| "horizontal"` | "vertical" | Direction of the rail. |

### CanvasLegend, CanvasLegendItem

A `dl` of symbols. `CanvasLegendItem` takes `swatch`: a CSS colour string or a node for patterns.
