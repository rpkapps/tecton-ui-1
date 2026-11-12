---
component: Table
module: "@tecton/react/components/table"
family: data
exports: [Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption]
notFor:
  - need: records in an application, or rows that are sorted, searched, filtered, selected or paged
    use: DataTable
  - need: a list of rows with media, a title and actions rather than columns
    use: Item
  - need: rows or columns the user drags into another order
    use: Reorderable
related: [DataTable, Item, TreeView, Reorderable, TableColumnResizer]
---

## Use it when

- A short, static table is read rather than worked with: a spec sheet, a legend, the figures of a report or a dialog, a comparison in documentation.
- The layout is free-form: cells of your own, spans, a footer that totals the columns, a caption that names the table.

## Do

- Keep `Table` for content that is only read; records in an application go in a `DataTable`, so every records table looks and behaves the same.
- Compose plain HTML: `Table` > `TableHeader` > `TableRow` > `TableHead`, `TableBody` > `TableRow` > `TableCell`, optional `TableFooter` and `TableCaption`; open a record from a link in its identifying cell.
- Set `size="sm"` for a compact table of dense data, and `striped` to put every even body row on an alternate surface; hover and selected rows keep their fill over the stripe.
- For hundreds of rows or more, set `virtualized`, give the parent a bounded height (`h-96`, with the border) and pass `items` with a render function to `TableBody`; rows are one height within the table.
- Show an empty value as a muted em dash, with "No value" for screen readers, as `DataTable` draws it: `<TableCell><span aria-hidden className="text-muted-foreground">—</span><span className="sr-only">No value</span></TableCell>` (aligned as the column, never "N/A" or "-"); show an empty result as `Empty` in place of the table, or as `TableBody empty={…}` (one row across every column) when the header must stay; keep `className` on the parts to alignment and width (`text-end`, `w-24`).

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

### HIGH Density and stripes from classes

Wrong:

```tsx
<Table className="text-xs [&_td]:py-1 [&_tbody_tr:nth-child(even)]:bg-surface-alt">{rows}</Table>
```

Correct:

```tsx
<Table size="sm" striped>{rows}</Table>
```

Hand-written classes miss the header's height, paint the stripe over the hover and selected fill, and shift as a virtualized table mounts and unmounts rows, so the stripes flicker while it scrolls. `size` and `striped` set every part and keep each row on its stripe.

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

A `tr` has no role, no tab stop and no Enter key, so the row opens with a mouse only. A link in the identifying cell is reachable, announced and middle-clickable.
