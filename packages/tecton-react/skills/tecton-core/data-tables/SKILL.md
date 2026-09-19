---
name: data-tables
description: >
  Building data tables and datagrids in a Tecton application with TanStack
  Table on top of the shadcn Table component. Load when building any table
  with sorting, filtering, pagination, column visibility or row selection, or
  when tempted to import a DataTable component. There is no DataTable
  component in @tecton/react and there is not meant to be one — Table,
  TableHeader, TableBody, TableRow, TableHead and TableCell are the markup,
  useReactTable from @tanstack/react-table is the state. Covers the flexRender
  pattern, wiring row selection to a Checkbox with isSelected/onChange, row
  actions through DropdownMenuTrigger, and the ActionBar for bulk actions on a
  selection.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
  - 'tecton-core/components'
sources:
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/components/data-table.mdx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/components/table.mdx'
---

# Tecton UI — Data tables

There is **no `DataTable` component**, and adding one would be a mistake.
Every table has different sorting, filtering and data-source requirements;
combining them into one component loses the flexibility headless UI provides.

The recipe is: **shadcn `Table` for the markup, TanStack Table for the state.**
`@tanstack/react-table` is already a dependency of `@tecton/react`.

## Non-negotiables

True everywhere in Tecton, whichever skill you loaded.

1. **Stock Tailwind colours emit no CSS.** `globals.css` resets
   `--color-*: initial`, so `bg-red-500` and `text-zinc-400` produce no rule
   and render unstyled — no error, no fallback. Use a semantic token
   (`bg-primary`, `text-success`) or a palette step (`bg-blue-120`).
   Detail: `tecton-core/styling`.
2. **Props are React Aria's, not Radix's.** `onPress` not `onClick`; `is*`
   state props (`isDisabled`, `isSelected`, `isRequired`); `id` not `value`
   on Select, Tabs, Accordion, ToggleGroup and Menu items; no `asChild`.
   Detail: `tecton-core/components`.

## Setup

```tsx
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@tecton/react/components/table"

export function WellsTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
```

Add features by adding row models: `getSortedRowModel`,
`getFilteredRowModel`, `getPaginationRowModel`, plus the matching state.

## Core patterns

### A selection column

The checkbox is a React Aria control, so it takes `isSelected` and an
`onChange` that receives a boolean.

```tsx
const columns: ColumnDef<Well>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        isSelected={table.getIsAllPageRowsSelected()}
        isIndeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onChange={(isSelected) => table.toggleAllPageRowsSelected(isSelected)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        isSelected={row.getIsSelected()}
        onChange={(isSelected) => row.toggleSelected(isSelected)}
      />
    ),
    enableSorting: false,
  },
]
```

### A row-actions column

```tsx
{
  id: "actions",
  cell: ({ row }) => (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon-sm" aria-label="Row actions">
        <MoreIcon />
      </Button>
      <DropdownMenu placement="bottom end">
        <DropdownMenuItem onAction={() => copyId(row.original.id)}>Copy ID</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onAction={() => remove(row.original.id)}>Delete</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  ),
}
```

### Bulk actions on a selection

Use the Tecton `ActionBar`, not a bespoke toolbar. It owns the selection
summary, the clear affordance and the collapse behaviour:

```tsx
import { ActionBar, ActionBarActions, ActionBarSelection } from "@tecton/react/tecton/action-bar"
import { OverflowItem, OverflowLabel } from "@tecton/react/tecton/overflow"

;<ActionBar
  isOpen={selectedCount > 0}
  onDismiss={() => table.resetRowSelection()}
  aria-label="Selected wells"
>
  <ActionBarSelection
    count={selectedCount}
    total={data.length}
    onClear={() => table.resetRowSelection()}
  />
  <ActionBarActions aria-label="Selection actions">
    <OverflowItem id="export" label="Export" icon={<ExportIcon />} onAction={exportSelected}>
      <Button variant="secondary" size="sm">
        <ExportIcon data-icon="inline-start" />
        <OverflowLabel>Export</OverflowLabel>
      </Button>
    </OverflowItem>
    <Button size="sm" variant="destructive" onPress={deleteSelected}>
      Delete
    </Button>
  </ActionBarActions>
</ActionBar>
```

`ActionBarActions` is an overflow row: wrap each action that may collapse in
an `OverflowItem` and leave the primary bare so it never leaves. See
`tecton-core/layout`.

### A sortable header

```tsx
header: ({ column }) => (
  <Button variant="ghost" onPress={() => column.toggleSorting(column.getIsSorted() === "asc")}>
    Well name <ArrowUpDownIcon data-icon="inline-end" />
  </Button>
)
```

## Common Mistakes

### HIGH Installing or inventing a `DataTable` component

Wrong:

```tsx
import { DataTable } from "@tecton/react/components/data-table"
```

Correct:

```tsx
import { Table, TableBody /* … */ } from "@tecton/react/components/table"
// state from useReactTable
```

`data-table` is a **guide**, not a module — the docs page of that name walks
through building one. The import does not resolve. Nor should you add a shared
`DataTable` to the design system: the docs are explicit that folding every
variation into one component is what headless UI exists to avoid. Extract a
reusable table in *your application* if you use the same one twice.

Source: `apps/www/content/docs/components/data-table.mdx § Introduction`

### HIGH `checked` / `onCheckedChange` in the selection column

Wrong:

```tsx
<Checkbox
  checked={row.getIsSelected()}
  onCheckedChange={(v) => row.toggleSelected(!!v)}
/>
```

Correct:

```tsx
<Checkbox
  isSelected={row.getIsSelected()}
  onChange={(isSelected) => row.toggleSelected(isSelected)}
/>
```

This snippet is the single most-copied block of stock shadcn table code, and
it is Radix-shaped. On the React Aria base neither prop exists: the checkbox
renders permanently unchecked and clicking it selects nothing, while the
rest of the table behaves normally — so it reads as a TanStack bug.

Source: `apps/www/content/docs/components/data-table.mdx`

### MEDIUM Forgetting `data-state` on a selected row

Wrong:

```tsx
<TableRow key={row.id}>
```

Correct:

```tsx
<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
```

`TableRow` styles its selected background from `data-state="selected"`.
Without it, rows still select in the table state but nothing in the UI shows
which ones — and the usual next step is to add a `className` with a stock
Tailwind colour, which renders nothing at all.

Source: `apps/www/content/docs/components/data-table.mdx § Row Selection`

### MEDIUM Building a bulk-action toolbar by hand

Wrong:

```tsx
{selectedCount > 0 && (
  <div className="fixed bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-lg bg-zinc-800 p-2">
    <span>{selectedCount} selected</span>
    <Button onPress={deleteSelected}>Delete</Button>
  </div>
)}
```

Correct:

```tsx
<ActionBar isOpen={selectedCount > 0}>
  <ActionBarSelection count={selectedCount} total={data.length} onClear={reset} />
  <ActionBarActions>
    <Button variant="destructive" onPress={deleteSelected}>Delete</Button>
  </ActionBarActions>
</ActionBar>
```

`ActionBar` already owns the placement, the enter/exit animation, the
`aria-live` count announcement and the collapse behaviour when the actions
outgrow the width. The hand-rolled version has none of that, and `bg-zinc-800`
emits no CSS.

Source: `docs/OVERFLOW-RULES.md § 8`

See also: `tecton-core/layout/SKILL.md` — `ActionBar` and the overflow rules.
