---
component: SwapGrid
module: "@tecton/react/tecton/swap-grid"
family: data
exports: [SwapGrid, SwapGridSlot, SwapGridItem, SwapGridHandle]
notFor:
  - need: a list, a table's rows or columns, or a grid of equal cards put in order
    use: Reorderable
  - need: open workspace tabs the user drags into another order
    use: DocumentTabs
  - need: files dropped from the desktop
    use: Dropzone
related: [Card, Stat, Meter, Reorderable]
---

## Use it when

- The user rearranges tiles of several sizes on a fixed layout: a bento grid of KPIs, a well overview, a control-room wall.
- The layout is fixed and the user decides which tile goes where; moving one tile must leave the others in place.
- Some places of the layout may stay empty until the user fills them.

## Do

- Keep the layout as data: the slots with their sizes (`col-span-2 row-span-2`), rendered as `SwapGridSlot`s in a fixed order inside your grid classes on `SwapGrid`.
- Keep which tile each slot holds in state, `{ [slot]: tile | null }`, pass it as `value` and write `onValueChange`'s map back.
- Render the tile from the slot's children function argument, `{(tile) => tile && <SwapGridItem …/>}`, so the swap shows while dragging.
- Give every `SwapGridItem` a `label` and a `SwapGridHandle` (or `dragHandle={false}`), and render it as the tile: `render={<Card size="sm" />}`.
- Make each slot a size container (`[container-type:size]`) and show a tile's detail only when its slot has room (`@min-[14rem]:grid`), since any tile can land in any slot.

## Don't

### CRITICAL Rendering the tile from your own state

Wrong:

```tsx
<SwapGridSlot value={slot}>
  {layout[slot] && <SwapGridItem value={layout[slot]} label={names[layout[slot]]} />}
</SwapGridSlot>
```

Correct:

```tsx
<SwapGridSlot value={slot}>
  {(tile) => tile && <SwapGridItem value={tile} label={names[tile]} />}
</SwapGridSlot>
```

The children function receives the swapped tile while a drag hovers a slot; reading your own state shows nothing until the drop, so the user cannot see which tile will move where.

### HIGH Tiles of several sizes in a Reorderable

Wrong:

```tsx
<Reorderable orientation="grid" value={order} onValueChange={setOrder} className="grid grid-cols-4">
  {order.map((id) => <ReorderableItem key={id} value={id} className={spans[id]} />)}
</Reorderable>
```

Correct:

```tsx
<SwapGrid value={layout} onValueChange={setLayout} className="grid grid-cols-4">
  {SLOTS.map((slot) => <SwapGridSlot key={slot.id} value={slot.id} className={slot.span}>{renderTile}</SwapGridSlot>)}
</SwapGrid>
```

A `Reorderable` keeps an order, and CSS grid places mixed-size tiles from it: moving one tile re-places every tile after it and opens holes no drop can reach. A swap grid's slots never move, so only the two swapped tiles change.
