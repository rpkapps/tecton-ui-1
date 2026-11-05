---
component: WidgetGrid
module: "@tecton/react/tecton/widget-grid"
family: surfaces
exports: [WidgetGrid, WidgetGridContent, WidgetGridItem, WidgetGridHandle, WidgetGridResizeHandle, WidgetGridRemove, WidgetGridSource, useWidgetGridItem]
notFor:
  - need: cards in a layout the user never changes
    use: Card
  - need: bento tiles that trade fixed slots, or cards of one size put in order
    use: Reorderable
  - need: two or three panes the user drags apart
    use: ResizablePanelGroup
related: [Panel, Reorderable, Empty, toast, DropdownMenu]
---

## Use it when

- The user arranges their own dashboard: moves widgets, resizes them by whole cells, adds them from a catalog and removes them.
- The layout is saved per user and restored later, as plain data (`{ id, x, y, w, h }` per widget).
- Widgets of several sizes share a grid of columns and rows and must never overlap or leave holes.

## Do

- Keep the layout in state, pass it as `value` and write `onValueChange`'s layout back; keep what each widget shows in a map keyed by `id`, apart from the layout, and render the widgets in the layout's order (`layout.map`).
- Render each `WidgetGridItem` with `render={<Panel />}`, a `label`, the `WidgetGridHandle` first in its `PanelHeader`, `WidgetGridRemove` in `PanelActions` and a `WidgetGridResizeHandle` inside it.
- Put the toolbar and the catalog inside `WidgetGrid`, around `WidgetGridContent`: each `WidgetGridSource` has the new widget's `value`, `label`, `w` and `h`.
- Turn the edit mode on with `editable` from an **Edit layout** button, keep the layout the edit started from so **Cancel** restores it, and offer an undo `toast` when `eventDetails.reason` is `"remove"` instead of asking first.
- Give every widget a menu built on `useWidgetGridItem()` (`move`, `canMove`, `resize` with named size presets, `remove`) to arrange without dragging; set its limits in its entry (`minW`, `minH`), and render an `Empty` spanning the grid (`col-span-full row-span-4 row-start-1`) when the layout is empty.

## Don't

### CRITICAL Positioning widgets by hand or with a drag library

Wrong:

```tsx
<div className="relative">
  {layout.map((item) => <div key={item.id} draggable style={{ position: "absolute", left: item.x * 100 }}><Panel>…</Panel></div>)}
</div>
```

Correct:

```tsx
<WidgetGridContent>
  {layout.map((item) => (
    <WidgetGridItem key={item.id} value={item.id} label={names[item.id]} render={<Panel />}>
      <PanelHeader><WidgetGridHandle /><PanelTitle>{names[item.id]}</PanelTitle></PanelHeader>
      <WidgetGridResizeHandle />
    </WidgetGridItem>
  ))}
</WidgetGridContent>
```

Absolute pixel positions do not mirror in a right-to-left page or follow the width of the grid, and native drag events never fire from the keyboard, a screen reader or a touch screen; `WidgetGrid` places the widgets on CSS grid cells and resolves every overlap.

### HIGH Layout props from other grid libraries

Wrong:

```tsx
<WidgetGrid layout={layout} onLayoutChange={setLayout} cols={12}>
  <WidgetGridItem key="a" data-grid={{ i: "a", x: 0, y: 0, w: 4, h: 2 }} />
</WidgetGrid>
```

Correct:

```tsx
<WidgetGrid value={[{ id: "a", x: 0, y: 0, w: 4, h: 2 }]} onValueChange={setLayout} columns={12}>
  <WidgetGridContent>
    <WidgetGridItem value="a" label="Production" />
  </WidgetGridContent>
</WidgetGrid>
```

The layout is `value` with an `id` per entry, the change arrives in `onValueChange` and the column count is `columns`; `layout`, `onLayoutChange`, `cols`, `i` and `data-grid` are ignored, so nothing is placed.

### HIGH Widgets outside WidgetGridContent

Wrong:

```tsx
<WidgetGrid value={layout} onValueChange={setLayout} className="grid grid-cols-12 gap-4">
  {layout.map((item) => <WidgetGridItem key={item.id} value={item.id} label={names[item.id]} />)}
</WidgetGrid>
```

Correct:

```tsx
<WidgetGrid value={layout} onValueChange={setLayout}>
  <WidgetGridContent className="gap-4">
    {layout.map((item) => <WidgetGridItem key={item.id} value={item.id} label={names[item.id]} />)}
  </WidgetGridContent>
</WidgetGrid>
```

`WidgetGrid` holds the layout and the catalog around the grid; only `WidgetGridContent` sets the columns and rows the items are placed on, measures the grid for a drag and draws the cells and the placeholder.
