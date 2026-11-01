---
component: Reorderable
module: "@tecton/react/tecton/reorderable"
family: data
exports: [Reorderable, ReorderableItem, ReorderableHandle]
notFor:
  - need: open workspace tabs the user drags into another order
    use: DocumentTabs
  - need: moving rows between folders of a hierarchy
    use: TreeView
  - need: sorting rows by a column's values
    use: TanStack Table
related: [Table, TableColumnResizer, Item, "TanStack Table"]
---

## Use it when

- The user puts rows of a table in their own order: a drilling queue, a run sequence, a playlist of logs.
- The user moves the columns of a data table into the order they read them in.
- A short stack of items (steps, tracks, layers) has an order the user decides.

## Do

- Keep the order in state as an array of item values, pass it as `value`, render the items in that order and write `onValueChange`'s array back.
- Wrap the whole `Table` in `Reorderable` and render each row as `ReorderableItem` with `render={<TableRow />}`, or each header with `render={<TableHead />}` and `orientation="horizontal"`.
- Give every item a `label` (the row's or column's name) and a `ReorderableHandle` in a row; a column header gets `dragHandle={false}` instead and is dragged and focused itself, with no grip.
- To reorder rows and columns of one table, nest the two `Reorderable`s around it: an item joins the nearest one whose `value` holds it.
- Leave a column that must stay put (the identifying or selection column) out of `value` and render it as a plain `TableHead`; turn every handle off with `disabled` while a sort is applied.

## Don't

### CRITICAL Hand-rolled drag events on table rows

Wrong:

```tsx
<TableRow draggable onDragStart={() => setDragged(well.id)} onDrop={() => move(dragged, well.id)}>
  <TableCell>{well.name}</TableCell>
</TableRow>
```

Correct:

```tsx
<ReorderableItem value={well.id} label={well.name} render={<TableRow />}>
  <TableCell><ReorderableHandle /></TableCell>
  <TableCell>{well.name}</TableCell>
</ReorderableItem>
```

Native drag events never fire from the keyboard, a screen reader or a touch screen, so the order cannot be changed without a mouse.

### HIGH Reorderable placed inside the table body

Wrong:

```tsx
<TableBody>
  <Reorderable value={order} onValueChange={setOrder}>{rows}</Reorderable>
</TableBody>
```

Correct:

```tsx
<Reorderable value={order} onValueChange={setOrder}>
  <Table><TableBody>{rows}</TableBody></Table>
</Reorderable>
```

`Reorderable` renders a `div` holding the drop line and the keyboard drop targets, which is invalid inside `tbody` and breaks the row layout.

### HIGH Reorder callbacks from other libraries

Wrong:

```tsx
<Reorderable items={order} onReorder={(from, to) => move(from, to)}>{rows}</Reorderable>
```

Correct:

```tsx
<Reorderable value={order} onValueChange={(next) => setOrder(next)}>{rows}</Reorderable>
```

The order is `value` and the whole new array arrives in `onValueChange`; `items` and `onReorder` are ignored, so nothing moves.
