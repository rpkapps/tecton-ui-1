---
component: DataTable
module: "@tecton/react/data-table"
family: data
docs: "components/data-table"
exports: [DataTable, DataTableContent, DataTableToolbar, DataTableSearch, DataTableFilter, DataTableActiveFilters, DataTableGroupBy, DataTableColumnsMenu, DataTableRowActions, DataTableActionBar, DataTableFooter, DataTablePagination, createColumns, useDataTable]
notFor:
  - need: a short static table of a few rows that is only read, such as a spec sheet, a legend or the figures of a report
    use: Table
  - need: a hierarchy that is browsed, with no columns
    use: TreeView
  - need: a list of rows with media, a title and actions rather than columns
    use: Item
  - need: rows the user drags into an order of their own
    use: Reorderable
related: [Table, ActionBar, TreeView, Badge]
---

## Use it when

- An application shows records in columns: a data grid of wells, work orders, run results or documents. Use `DataTable` for every such table, even one that only sorts today, so all tables look and behave the same.
- Users sort, search, filter, group, select, page or open rows, or hide, pin, resize or reorder the columns.
- The rows are many (`virtualized`), load as the user scrolls or presses Show more (`hasMore`), come from a server (`dataMode="server"`), or form a tree (`itemToChildren`) or detail rows (`renderDetail`). Rows that arrive while the user watches, such as alarms, events or readings from a subscription, use `highlightChanges`.

## Do

- Make the columns once with `createColumns`, at module level or in a `React.useMemo`, each with an `id`, a plain-text `header` and a `type`. Return raw numbers and `Date`s from `accessor`, `null` for a missing value, and use `cell` only to draw a value differently.
- Turn features on at the root (`selectionMode`, `pagination`, `filterable`, `groupable`, the `…Columns` props), then place their parts. For a table people filter all day, use the power search `<DataTableSearch syntax="query" />`, never a query parser of your own. Its suggestions and "?" help come with it: add no syntax legend or suggestion list.
- Name the table with `aria-label` on `DataTableContent`. Open rows with `itemToHref` or `onActivate`, explain disabled rows with `itemToDisabledReason`, and put actions in `DataTableRowActions` and `DataTableActionBar`.
- Set `size="sm"` and `striped` for dense data. Show states with `loading`, `error` with `onRetry`, and `empty` / `noResults` on `DataTableContent`.
- In server mode, pass the page's `items`, `rowCount` and `loading`, and load from `onViewChange`, `onPageChange` and `onPageSizeChange`. For live data, set `highlightChanges` and never tint, animate or scroll rows yourself.

## Don't

### CRITICAL A records table hand-built on Table

Wrong:

```tsx
const rows = [...wells].sort(byDepth).slice(page * 10, page * 10 + 10)
<Table>
  <TableHeader>
    <TableRow>
      <TableHead><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
      <TableHead><button onClick={() => setSort("depth")}>Depth</button></TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>{rows.map((well) => <WellRow key={well.id} well={well} />)}</TableBody>
</Table>
<Button onClick={() => setPage(page + 1)}>Next</Button>
```

Correct:

```tsx
<DataTable items={wells} columns={columns} selectionMode="multiple" pagination>
  <DataTableContent aria-label="Wells" />
  <DataTableFooter>
    <DataTablePagination />
  </DataTableFooter>
</DataTable>
```

Every hand-built table sorts, selects and pages a little differently, with no `aria-sort`, no grid keyboard, no announcements and no selection across pages; `DataTable` gives every application the same table.

### HIGH Formatting values inside a cell

Wrong:

```tsx
const columns = createColumns<Well>([
  { id: "depth", header: "Depth (m)", cell: (well) => <div className="text-end">{well.depth.toLocaleString()}</div> },
])
```

Correct:

```tsx
const columns = createColumns<Well>([
  { id: "depth", header: "Depth (m)", type: "number", format: { maximumFractionDigits: 0 } },
])
```

Without `type` the column is text: it sits at the start, sorts and filters as text and has no sum, and `toLocaleString()` formats in the browser's locale, not the provider's.

### HIGH Placeholder text for missing values

Wrong:

```tsx
const columns = createColumns<Well>([{ id: "depth", header: "Depth (m)", type: "number", accessor: (well) => well.depth ?? "N/A" }])
```

Correct:

```tsx
const columns = createColumns<Well>([{ id: "depth", header: "Depth (m)", type: "number", accessor: (well) => well.depth }])
```

"N/A" is a value: it is drawn as text instead of the table's muted dash, read as "N/A" in every locale, written to the CSV, and the filters' "No value" does not find it.
