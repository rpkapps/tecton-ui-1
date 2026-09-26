---
component: Canvas
module: "@tecton/react/tecton/canvas"
family: presentation
exports: [Canvas, CanvasSurface, CanvasOverlay, CanvasToolbar, CanvasToolbarButton, CanvasLegend, CanvasLegendItem, canvasOverlayVariants, canvasToolbarVariants]
notFor:
  - need: a titled tool surface with a scrolling body and a pinned footer
    use: Panel
  - need: a self-contained block of content in a grid
    use: Card
  - need: the application frame around the work area
    use: AppShell
  - need: a decorative themed texture behind ordinary content
    use: Background
related: [Panel, AppShell, Background]
---

## Use it when

- A map, a schematic, a seismic section or a 3D view owns the whole work area and the chrome floats over it.
- The surface is pannable or zoomable, so the controls must not steal the drags that pass between them.
- The view fills whatever height is left in its column rather than a height the design picked.

## Do

- Compose it: `CanvasSurface` for the engine, then one `CanvasOverlay` per edge or corner holding `CanvasToolbar`s and a `CanvasLegend`.
- Write the symbology as `CanvasLegendItem`s inside a `CanvasLegend`: it is a list of items, each a decorative swatch followed by its name, and `swatch` takes a CSS colour string (`"var(--chart-1)"`) or a node for a pattern.
- Pin chrome with `position` on `CanvasOverlay` (the eight edges and corners, `top-start` … `bottom-end`); side and corner overlays stack their children down the column, `top` and `bottom` across.
- Set a rail's direction with `orientation` on `CanvasToolbar` and give it an `aria-label`; it is a `role="toolbar"` (arrow keys along the rail, stopping at its ends, Tab out of it) and already carries the floating surface, blur and shadow.
- Fill a rail with `CanvasToolbarButton`s (a ghost icon `Button`; compose a menu or popover trigger through `render`), and give the canvas its height from the column it sits in: a flex-column parent, or `className="h-72"` when it is embedded.

## Don't

### HIGH Floating chrome positioned by hand

Wrong:

```tsx
<Canvas className="h-full">
  <CanvasSurface><MapEngine /></CanvasSurface>
  <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50/90 p-1 shadow-md">
    <Button variant="ghost" size="icon-sm" aria-label="Zoom in"><ZoomInIcon /></Button>
    <Button variant="ghost" size="icon-sm" aria-label="Zoom out"><ZoomOutIcon /></Button>
  </div>
</Canvas>
```

Correct:

```tsx
<Canvas className="h-full">
  <CanvasSurface><MapEngine /></CanvasSurface>
  <CanvasOverlay position="top-start">
    <CanvasToolbar aria-label="Navigation">
      <CanvasToolbarButton aria-label="Zoom in"><ZoomInIcon /></CanvasToolbarButton>
      <CanvasToolbarButton aria-label="Zoom out"><ZoomOutIcon /></CanvasToolbarButton>
    </CanvasToolbar>
  </CanvasOverlay>
</Canvas>
```

`CanvasOverlay` is `pointer-events-none` with `*:pointer-events-auto`, so the gaps between its children still pan the map; a hand-placed box swallows every drag that starts in its padding, has no `role="toolbar"`, and `border-slate-200` and `bg-slate-50` are stock Tailwind that the reset palette turns into no CSS at all.

### MEDIUM A canvas dropped into a block wrapper

Wrong:

```tsx
<AppShellMain>
  <div className="p-6">
    <Canvas>
      <CanvasSurface><MapEngine /></CanvasSurface>
    </Canvas>
  </div>
</AppShellMain>
```

Correct:

```tsx
<AppShellMain className="flex flex-col overflow-hidden">
  <Canvas>
    <CanvasSurface><MapEngine /></CanvasSurface>
  </Canvas>
</AppShellMain>
```

`Canvas` is `min-h-0 flex-1` and takes its height from a flex column; in a block wrapper `flex-1` does nothing, and because `CanvasSurface` is `absolute inset-0` there is no in-flow content left to give the canvas a height, so it collapses to zero and nothing renders.
