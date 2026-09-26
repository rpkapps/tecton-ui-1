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
related: [Item, TreeView, "TanStack Table"]
---

## Use it when

- Records of the same shape have to line up in columns: invoices, wells, run results.
- A footer totals the columns, or a caption names the table.
- The rows are read, compared or opened; interaction beyond that (sorting, paging) comes from TanStack Table on these parts.

## Do

- Compose plain HTML: `Table` > `TableHeader` > `TableRow` > `TableHead`, `TableBody` > `TableRow` > `TableCell`, optional `TableFooter` and `TableCaption`.
- Select rows with a `Checkbox` per row (and one in the header for all) driven by your own state, and mark a selected row with `data-state="selected"` for the `bg-table-active` fill.
- Open a record from a link in its identifying cell, not from a handler on the row.
- Show an empty result as `Empty` in place of the table, or inside one `TableCell colSpan={n}` when the header must stay; keep `className` on the parts to alignment and width (`text-right`, `w-24`).

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

### HIGH selectionMode and selectedKeys on the table

Wrong:

```tsx
<Table aria-label="Wells" selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected}>
  <TableHeader><TableHead isRowHeader>Well</TableHead></TableHeader>
  <TableBody renderEmptyState={() => "No wells"}>{rows}</TableBody>
</Table>
```

Correct:

```tsx
<Table>
  <TableHeader><TableRow><TableHead>Well</TableHead></TableRow></TableHeader>
  <TableBody>{rows.length ? rows : <TableRow><TableCell><Empty>No wells</Empty></TableCell></TableRow>}</TableBody>
</Table>
```

`Table` is a plain `table`: `selectionMode`, `selectedKeys`, `isRowHeader` and `renderEmptyState` land on the DOM as unknown attributes, so nothing is selectable and an empty body renders nothing.

### HIGH Activating a row with onClick

Wrong:

```tsx
<TableRow onClick={() => openWell(well.id)}>
  <TableCell>{well.name}</TableCell>
</TableRow>
```

Correct:

```tsx
<TableRow>
  <TableCell><Link href={`/wells/${well.id}`}>{well.name}</Link></TableCell>
</TableRow>
```

A `tr` has no role, no tab stop and no Enter key, so the row opens with a mouse only; a link in the identifying cell is reachable, announced and middle-clickable.
