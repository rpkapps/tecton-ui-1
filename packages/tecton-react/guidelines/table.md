---
component: Table
module: "@tecton/react/components/table"
family: data
exports: [Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption]
notFor:
  - need: sorting, filtering, paging or column visibility over the rows
    use: TanStack Table
  - need: a list of rows with media, a title and actions rather than columns
    use: Item
  - need: rows or columns the user drags into another order
    use: Reorderable
related: [Item, TreeView, Reorderable, TableColumnResizer, TableSelectionCheckbox, "TanStack Table"]
---

## Use it when

- Records of the same shape have to line up in columns: invoices, wells, run results.
- A footer totals the columns, or a caption names the table; the rows are read, compared, selected or opened, with sorting and paging from TanStack Table on these parts.

## Do

- Compose plain HTML: `Table` > `TableHeader` > `TableRow` > `TableHead`, `TableBody` > `TableRow` > `TableCell`, optional `TableFooter` and `TableCaption`.
- When rows are selected or opened, set `grid`: the table is one tab stop the arrow keys move through. Give every `TableRow` a `value`, select with `selectionMode` and `value` / `onValueChange` (a `TableSelectionCheckbox` in the header and in each row) and open a row with `onActivate`; a tree table's rows take `level`, `expanded` and `onExpandedChange`.
- Leave a table that is only read without `grid` (screen readers read a grid as something to operate, not as a document); open its records from a link in the identifying cell.
- For hundreds of rows or more, set `virtualized`, give the parent a bounded height (`h-96`, with the border) and pass `items` with a render function to `TableBody`; rows are one height within the table.
- Show an empty result as `Empty` in place of the table, or as `TableBody empty={…}` (one row across every column) when the header must stay; keep `className` on the parts to alignment and width (`text-end`, `w-24`).

## Don't

### CRITICAL A table built from divs and grid classes

Wrong:

```tsx
<div className="grid grid-cols-2 text-sm">
  <div className="bg-zinc-100 px-4 py-3 font-medium">Well</div>
  <div className="bg-zinc-100 px-4 py-3 font-medium">Status</div>
  <div className="px-4 py-3">34/10-A-12</div>
  <div className="px-4 py-3">Producing</div>
</div>
```

Correct:

```tsx
<Table>
  <TableHeader>
    <TableRow><TableHead>Well</TableHead><TableHead>Status</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>34/10-A-12</TableCell><TableCell>Producing</TableCell></TableRow>
  </TableBody>
</Table>
```

The grid emits no table semantics, so assistive technology reads a stream of unassociated cells with no row or column count, and `bg-zinc-100` is stock Tailwind the reset palette emits no CSS for — the header band is `bg-table-header` on `TableHead`.

### HIGH selectedKeys, onSelectionChange and renderEmptyState on the table

Wrong:

```tsx
<Table aria-label="Wells" selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected}>
  <TableHeader><TableHead isRowHeader>Well</TableHead></TableHeader>
  <TableBody renderEmptyState={() => "No wells"}>{rows}</TableBody>
</Table>
```

Correct:

```tsx
<Table grid aria-label="Wells" selectionMode="multiple" value={selected} onValueChange={setSelected}>
  <TableHeader><TableRow><TableHead><TableSelectionCheckbox /></TableHead><TableHead>Well</TableHead></TableRow></TableHeader>
  <TableBody empty={<Empty>No wells</Empty>}>{rows}</TableBody>
</Table>
```

Selection is `grid` with `selectionMode` and `value` / `onValueChange` (each `TableRow` with its `value`), and an empty body is `empty` on `TableBody`: `selectedKeys`, `onSelectionChange`, `isRowHeader` and `renderEmptyState` are not `Table` props, so nothing is selectable and an empty body renders nothing. Without `grid`, `selectionMode` does not compile.

### HIGH Activating a row with onClick

Wrong:

```tsx
<TableRow onClick={() => openWell(well.id)}>
  <TableCell>{well.name}</TableCell>
</TableRow>
```

Correct:

```tsx
<Table grid onActivate={(id) => openWell(id)}>
  <TableBody><TableRow value={well.id}><TableCell>{well.name}</TableCell></TableRow></TableBody>
</Table>
```

A `tr` has no role, no tab stop and no Enter key, so the row opens with a mouse only. In a `grid` table, `onActivate` opens the row from Enter and a click (a double click when rows select); in a table that is only read, a link in the identifying cell is reachable, announced and middle-clickable.
