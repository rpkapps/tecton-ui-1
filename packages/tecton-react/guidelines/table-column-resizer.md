---
component: TableColumnResizer
module: "@tecton/react/tecton/table-column-resizer"
family: data
exports: [TableColumnResizer]
notFor:
  - need: splitting a view into panes the user resizes
    use: ResizablePanelGroup
  - need: a value picked along a track
    use: Slider
related: [Table, Reorderable, "TanStack Table"]
---

## Use it when

- The user widens a data table column to read long values, or narrows one they do not need.
- Column widths are state the application keeps (TanStack Table's `columnSizing`, a saved layout).

## Do

- Put one `TableColumnResizer` last in each resizable `TableHead`, give that head `className="relative"` and `style={{ width }}` from the same state.
- Give the `Table` `className="table-fixed"`, its total width and `minWidth: "100%"`, leave the last column's width unset so it fills the rest, and let cells `truncate`.
- Name it with `label` (the column's name: "Resize Field"), bound it with `min` and `max`, and pass `resetValue` for Enter and a double click.
- Write `onValueChange` back to the width state; save a layout from `onValueCommitted`, which fires once a drag ends.

## Don't

### CRITICAL A pointer-only resize grip

Wrong:

```tsx
<TableHead className="relative">
  Field
  <div onMouseDown={header.getResizeHandler()} className="absolute inset-y-0 end-0 w-1 cursor-col-resize" />
</TableHead>
```

Correct:

```tsx
<TableHead className="relative" style={{ width: column.getSize() }}>
  Field
  <TableColumnResizer label="Field" value={column.getSize()} onValueChange={(size) => setColumnSizing((s) => ({ ...s, [column.id]: size }))} />
</TableHead>
```

A bare grip is neither focusable nor announced, so keyboard and screen reader users cannot resize the column at all.

### HIGH Widths on an auto-layout table

Wrong:

```tsx
<Table>
  <TableHeader><TableRow>{heads}</TableRow></TableHeader>
</Table>
```

Correct:

```tsx
<Table className="table-fixed" style={{ width: table.getTotalSize() }}>
  <TableHeader><TableRow>{heads}</TableRow></TableHeader>
</Table>
```

An auto-layout table sizes columns from their content and spreads them across the container, so the resizer's value and the column's width drift apart.
