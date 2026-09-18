# Data Table

Powerful table and datagrids built using TanStack Table.

Source: /docs/components/data-table.md  
React Aria docs: https://tanstack.com/table/latest/docs/overview

**Example — `data-table-demo`**

```tsx
"use client"

import * as React from "react"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button, buttonVariants } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Input } from "@tecton/react/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

// New in v9: declare the features this table uses — anything you don't
// register is tree-shaken out of the bundle.
const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

const columnHelper = createColumnHelper<typeof features, Payment>()

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@example.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@example.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@example.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@example.com",
  },
]

export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: () => <Checkbox slot="selection" />,
    cell: () => <Checkbox slot="selection" />,
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  }),
  columnHelper.accessor("email", {
    header: () => {
      return (
        <div className={buttonVariants({ variant: "ghost" })}>
          Email
          <ArrowUpDown />
        </div>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  }),
  columnHelper.accessor("amount", {
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))

      // Format the amount as a dollar amount.
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon-xs">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
          <DropdownMenu placement="bottom end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy payment ID
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      )
    },
  }),
])

export function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenuTrigger>
          <Button variant="outline" className="ml-auto">
            Columns <ChevronDown />
          </Button>
          <DropdownMenu placement="bottom end" className="w-44">
            <DropdownMenuGroup
              selectionMode="multiple"
              selectedKeys={table
                .getVisibleFlatColumns()
                .filter((column) => column.getCanHide())
                .map((column) => column.id)}
              onSelectionChange={(keys) => {
                table.setColumnVisibility(
                  Object.fromEntries(
                    table
                      .getAllFlatColumns()
                      .map((c) => [
                        c.id,
                        !c.getCanHide() || keys === "all" || keys.has(c.id),
                      ])
                  )
                )
              }}
            >
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      id={column.id}
                      className="capitalize"
                    >
                      {column.id}
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table
          aria-label="Tasks"
          selectionMode="multiple"
          selectedKeys={table.getSelectedRowModel().rows.map((row) => row.id)}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              table.toggleAllRowsSelected()
            } else {
              table.setRowSelection(
                Object.fromEntries([...selection].map((key) => [key, true]))
              )
            }
          }}
          sortDescriptor={
            sorting.length
              ? {
                  column: sorting[0].id,
                  direction: sorting[0].desc ? "descending" : "ascending",
                }
              : undefined
          }
          onSortChange={(sortDescriptor) => {
            table.setSorting([
              {
                id: "" + sortDescriptor.column,
                desc: sortDescriptor.direction === "descending",
              },
            ])
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 1}
                allowsSorting={header.column.getCanSort()}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No results."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            isDisabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            isDisabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## Introduction

Every data table or datagrid I've created has been unique. They all behave differently, have specific sorting and filtering requirements, and work with different data sources.

It doesn't make sense to combine all of these variations into a single component. If we do that, we'll lose the flexibility that [headless UI](https://tanstack.com/table/latest/docs/overview#what-is-headless-ui) provides.

So instead of a data-table component, I thought it would be more helpful to provide a guide on how to build your own.

We'll start with the basic `<Table />` component and build a complex data table from scratch.

> **Tip:** If you find yourself using the same table in multiple places in your app, you can always extract it into a reusable component.

## Table of Contents

This guide will show you how to use [TanStack Table](https://tanstack.com/table) and the `<Table />` component to build your own custom data table. We'll cover the following topics:

- [Set up Table Features](#set-up-table-features)
- [Basic Table](#basic-table)
- [Row Actions](#row-actions)
- [Pagination](#pagination)
- [Sorting](#sorting)
- [Filtering](#filtering)
- [Visibility](#visibility)
- [Row Selection](#row-selection)
- [Reusable Components](#reusable-components)

## Prerequisites

We are going to build a table to show recent payments. Here's what our data looks like:

```tsx showLineNumbers
type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

export const payments: Payment[] = [
  {
    id: "728ed52f",
    amount: 100,
    status: "pending",
    email: "m@example.com",
  },
  {
    id: "489e1d42",
    amount: 125,
    status: "processing",
    email: "user@example.com",
  },
  // ...
]
```

## Project Structure

Start by creating the following file structure:

```txt
app
└── payments
    ├── columns.tsx
    ├── data-table-features.ts
    ├── data-table.tsx
    └── page.tsx
```

I'm using a Next.js example here but this works for any other React framework.

- `columns.tsx` (client component) will contain our column definitions.
- `data-table-features.ts` will contain the shared `features` object that tells TanStack Table which behavior to enable.
- `data-table.tsx` (client component) will contain our `<DataTable />` component.
- `page.tsx` (server component) is where we'll fetch data and render our table.

## Set up Table Features

TanStack Table v9 is feature-based: you opt into the behavior you want — sorting, filtering, pagination, and so on — by declaring it with `tableFeatures()`. Anything you don't list is tree-shaken out of your bundle. That includes the built-in filter and sort functions: register the ones your columns rely on under `filterFns` and `sortFns` (our email filter uses `includesString`, and string columns sort with `text` / `alphanumeric`).

```tsx showLineNumbers title="app/payments/data-table-features.ts"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table"

// New in v9: declare the features this table uses — anything you don't
// register is tree-shaken out of the bundle.
export const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

// Pass this as the first generic argument to `ColumnDef`, `Column`, `Table`,
// and `Row` so each type knows which feature APIs are available.
export type DataTableFeatures = typeof features
```

> **Note:** The core row model is always included, so you never register it yourself. Row models for optional features are created with `create*RowModel()` and registered on the features object — there are no more `get*RowModel` table options.

## Basic Table

Let's start by building a basic table.

### Column Definitions

First, we'll define our columns.

```tsx showLineNumbers title="app/payments/columns.tsx" {3,5,16-17,19-29}
"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { type DataTableFeatures } from "./data-table-features"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Payment>()

export const columns = columnHelper.columns([
  columnHelper.accessor("status", {
    header: "Status",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
  }),
])
```

> **Note:** Columns are where you define the core of what your table
> will look like. They define the data that will be displayed, how it will be
> formatted, sorted and filtered.

### `<DataTable />` component

Next, we'll create a `<DataTable />` component to render our table.

```tsx showLineNumbers title="app/payments/data-table.tsx"
"use client"

import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

import { features, type DataTableFeatures } from "./data-table-features"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
}

export function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    data,
    columns,
  })

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getFlatHeaders().map((header) => (
            <TableHead
              key={header.id}
              id={header.id}
              isRowHeader={header.index === 0}
            >
              {header.isPlaceholder ? null : (
                <table.FlexRender header={header} />
              )}
            </TableHead>
          ))}
        </TableHeader>
        <TableBody renderEmptyState={() => "No results."}>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} id={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

> **Tip**: If you find yourself using `<DataTable />` in multiple places, this is the component you could make reusable by extracting it to `@tecton/react/components/data-table.tsx`.
>
> `<DataTable columns={columns} data={data} />`

> **`<table.FlexRender />` vs `flexRender`:** This guide uses v9's `<table.FlexRender header={header} />` and `<table.FlexRender cell={cell} />` component, available right on the table instance — no extra import needed. The classic `flexRender(component, context)` helper from v8 still works too, if you prefer the function form (or need to render outside the component that owns `table`, where you can also import the standalone `<FlexRender />`).

### Render the table

Finally, we'll render our table in our page component.

```tsx showLineNumbers title="app/payments/page.tsx" {22}
import { columns, Payment } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ]
}

export default async function DemoPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
```

## Cell Formatting

Let's format the amount cell to display the dollar amount. We'll also align the cell to the right.

### Update columns definition

Update the `header` and `cell` definitions for amount as follows:

```tsx showLineNumbers title="app/payments/columns.tsx" {3-13}
export const columns = columnHelper.columns([
  columnHelper.accessor("amount", {
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  }),
])
```

You can use the same approach to format other cells and headers.

## Row Actions

Let's add row actions to our table. We'll use a `<Dropdown />` component for this.

### Update columns definition

Update our columns definition to add a new `actions` column. The `actions` cell returns a `<Dropdown />` component.

```tsx showLineNumbers title="app/payments/columns.tsx" {4,6-13,17-46}
"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export const columns = columnHelper.columns([
  // ...
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon-xs">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
          <DropdownMenu placement="bottom end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy payment ID
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      )
    },
  }),
  // ...
])
```

You can access the row data using `row.original` in the `cell` function. Use this to handle actions for your row eg. use the `id` to make a DELETE call to your API.

## Pagination

Next, we'll add pagination to our table.

### Pagination is already enabled

Because our features object includes `rowPaginationFeature` and `createPaginatedRowModel()`, the table automatically paginates rows into pages of 10 — there's nothing to add to `useTable`. See the [pagination docs](https://tanstack.com/table/latest/docs/framework/react/guide/pagination) for more information on customizing page size and implementing manual pagination.

### Add pagination controls

We can add pagination controls to our table using the `<Button />` component and the `table.previousPage()`, `table.nextPage()` API methods.

```tsx showLineNumbers title="app/payments/data-table.tsx" {1,20-37}
import { Button } from "@tecton/react/components/button"

export function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    data,
    columns,
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          { // .... }
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

See [Reusable Components](#reusable-components) section for a more advanced pagination component.

## Sorting

Let's make the email column sortable.

The `rowSortingFeature` and sorted row model are already registered in our features object, so all that's left is wiring up the sorting state.

### Update `<DataTable>`

```tsx showLineNumbers title="app/payments/data-table.tsx" showLineNumbers {3,8,15,21-24,31-46}
"use client"

import * as React from "react"
import {
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"

export function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table
          sortDescriptor={
            sorting.length
              ? {
                  column: sorting[0].id,
                  direction: sorting[0].desc ? "descending" : "ascending",
                }
              : undefined
          }
          onSortChange={(sortDescriptor) => {
            table.setSorting([
              {
                id: "" + sortDescriptor.column,
                desc: sortDescriptor.direction === "descending",
              },
            ]);
          }}>
          { ... }
        </Table>
      </div>
    </div>
  )
}
```

### Make header cell sortable

We can now update the `email` header cell to add sorting controls.

```tsx showLineNumbers title="app/payments/columns.tsx" {4,10-17}
"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { buttonVariants } from "@tecton/react/components/button"

export const columns = columnHelper.columns([
  columnHelper.accessor("email", {
    header: ({ column }) => {
      return (
        <div className={buttonVariants({ variant: "ghost" })}>
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      )
    },
  }),
])
```

This will automatically sort the table (asc and desc) when the user toggles on the header cell.

## Filtering

Let's add a search input to filter emails in our table.

The `columnFilteringFeature` and filtered row model are already part of our features object, so we only need to wire up the filter state and render an input.

### Update `<DataTable>`

```tsx showLineNumbers title="app/payments/data-table.tsx" {7,13,20-22,29,32,38-46}
"use client"

import * as React from "react"
import {
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"

import { Button } from "@tecton/react/components/button"
import { Input } from "@tecton/react/components/input"

export function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>{ ... }</Table>
      </div>
    </div>
  )
}
```

Filtering is now enabled for the `email` column. You can add filters to other columns as well. See the [filtering docs](https://tanstack.com/table/latest/docs/framework/react/guide/column-filtering) for more information on customizing filters.

## Visibility

Adding column visibility is fairly simple using `@tanstack/react-table` visibility API.

### Update `<DataTable>`

```tsx showLineNumbers title="app/payments/data-table.tsx" {8,14-19,29-30,38,42,57-99}
"use client"

import * as React from "react"
import {
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={table.getColumn("email")?.getFilterValue() as string}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenuTrigger>
          <Button variant="outline" className="ml-auto">
            Columns
          </Button>
          <DropdownMenu placement="bottom end">
            <DropdownMenuGroup
              selectionMode="multiple"
              selectedKeys={
                table
                  .getVisibleFlatColumns()
                  .filter((column) => column.getCanHide())
                  .map(column => column.id)
              }
              onSelectionChange={(keys) => {
                table.setColumnVisibility(
                  Object.fromEntries(
                    table
                      .getAllFlatColumns()
                      .map((c) => [
                        c.id,
                        !c.getCanHide() || keys === "all" || keys.has(c.id),
                      ])
                  )
                )
              }}
            >
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      id={column.id}
                      className="capitalize"
                    >
                      {column.id}
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>{ ... }</Table>
      </div>
    </div>
  )
}
```

This adds a dropdown menu that you can use to toggle column visibility.

## Row Selection

Next, we're going to add row selection to our table.

### Update column definitions

```tsx showLineNumbers title="app/payments/columns.tsx" {6,9-15}
"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { Badge } from "@tecton/react/components/badge"
import { Checkbox } from "@tecton/react/components/checkbox"

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: () => <Checkbox slot="selection" />,
    cell: () => <Checkbox slot="selection" />,
    enableSorting: false,
    enableHiding: false,
  }),
])
```

### Update `<DataTable>`

```tsx showLineNumbers title="app/payments/data-table.tsx" {11,20,25,33-43}
export function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table
          selectionMode="multiple"
          selectedKeys={table.getSelectedRowModel().rows.map((row) => row.id)}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              table.toggleAllRowsSelected()
            } else {
              table.setRowSelection(
                Object.fromEntries([...selection].map((key) => [key, true]))
              )
            }
          }}
        />
      </div>
    </div>
  )
}
```

This adds a checkbox to each row and a checkbox in the header to select all rows.

### Show selected rows

You can show the number of selected rows using the `table.getFilteredSelectedRowModel()` API.

```tsx
<div className="flex-1 text-sm text-muted-foreground">
  {table.getFilteredSelectedRowModel().rows.length} of{" "}
  {table.getFilteredRowModel().rows.length} row(s) selected.
</div>
```

## Reusable Components

Here are some components you can use to build your data tables. This is from the [Tasks](https://ui.shadcn.com/examples/tasks) demo, which shares its features object (and the matching `TasksTableFeatures` type) across every component via a `data-table-features.ts` module — the same pattern we set up in [Set up Table Features](#set-up-table-features).

### Column header

Make any column header sortable and hideable.

> The source of this file lives in the upstream shadcn/ui repository: [data-table-column-header.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/(app)/examples/tasks/components/data-table-column-header.tsx).

```tsx showLineNumbers {4}
export const columns = columnHelper.columns([
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  }),
])
```

### Pagination

Add pagination controls to your table including page size and selection count.

> The source of this file lives in the upstream shadcn/ui repository: [data-table-pagination.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/(app)/examples/tasks/components/data-table-pagination.tsx).

```tsx
<DataTablePagination table={table} />
```

### Column toggle

A component to toggle column visibility.

> The source of this file lives in the upstream shadcn/ui repository: [data-table-view-options.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/(app)/examples/tasks/components/data-table-view-options.tsx).

```tsx
<DataTableViewOptions table={table} />
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `data-table-rtl`**

```tsx
"use client"

import * as React from "react"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Input } from "@tecton/react/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import { buttonVariants } from "@tecton/react/components/button"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      filterEmails: "Filter emails...",
      columns: "Columns",
      status: "Status",
      email: "Email",
      amount: "Amount",
      actions: "Actions",
      copyPaymentId: "Copy payment ID",
      viewCustomer: "View customer",
      viewPaymentDetails: "View payment details",
      selectAll: "Select all",
      selectRow: "Select row",
      openMenu: "Open menu",
      noResults: "No results.",
      rowsSelected: "of",
      rowsSelectedSuffix: "row(s) selected.",
      previous: "Previous",
      next: "Next",
      success: "Success",
      processing: "Processing",
      failed: "Failed",
      pending: "Pending",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      filterEmails: "تصفية البريد الإلكتروني...",
      columns: "الأعمدة",
      status: "الحالة",
      email: "البريد الإلكتروني",
      amount: "المبلغ",
      actions: "الإجراءات",
      copyPaymentId: "نسخ معرف الدفع",
      viewCustomer: "عرض العميل",
      viewPaymentDetails: "عرض تفاصيل الدفع",
      selectAll: "تحديد الكل",
      selectRow: "تحديد الصف",
      openMenu: "فتح القائمة",
      noResults: "لا توجد نتائج.",
      rowsSelected: "من",
      rowsSelectedSuffix: "صف(وف) محدد.",
      previous: "السابق",
      next: "التالي",
      success: "ناجح",
      processing: "قيد المعالجة",
      failed: "فشل",
      pending: "قيد الانتظار",
    },
  },
  he: {
    dir: "rtl",
    values: {
      filterEmails: "סנן אימיילים...",
      columns: "עמודות",
      status: "סטטוס",
      email: "אימייל",
      amount: "סכום",
      actions: "פעולות",
      copyPaymentId: "העתק מזהה תשלום",
      viewCustomer: "צפה בלקוח",
      viewPaymentDetails: "צפה בפרטי תשלום",
      selectAll: "בחר הכל",
      selectRow: "בחר שורה",
      openMenu: "פתח תפריט",
      noResults: "אין תוצאות.",
      rowsSelected: "מתוך",
      rowsSelectedSuffix: "שורות נבחרו.",
      previous: "הקודם",
      next: "הבא",
      success: "הצליח",
      processing: "מעבד",
      failed: "נכשל",
      pending: "ממתין",
    },
  },
}

// New in v9: declare the features this table uses — anything you don't
// register is tree-shaken out of the bundle.
const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

const columnHelper = createColumnHelper<typeof features, Payment>()

type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@example.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@example.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@example.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@example.com",
  },
]

export function DataTableRtl() {
  const { t, dir, language } = useTranslation(translations, "ar")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => <Checkbox slot="selection" />,
          cell: ({ row }) => <Checkbox slot="selection" />,
          enableSorting: false,
          enableHiding: false,
        }),
        columnHelper.accessor("status", {
          header: t.status,
          cell: ({ row }) => {
            const status = row.getValue("status") as string
            const statusMap: Record<string, string> = {
              success: t.success,
              processing: t.processing,
              failed: t.failed,
              pending: t.pending,
            }
            return <div className="capitalize">{statusMap[status]}</div>
          },
        }),
        columnHelper.accessor("email", {
          header: () => {
            return (
              <div className={buttonVariants({ variant: "ghost" })}>
                {t.email}
                <ArrowUpDown />
              </div>
            )
          },
          cell: ({ row }) => (
            <div className="lowercase">{row.getValue("email")}</div>
          ),
        }),
        columnHelper.accessor("amount", {
          header: () => <div className="text-start">{t.amount}</div>,
          cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat(
              dir === "rtl" ? "ar-SA" : "en-US",
              {
                style: "currency",
                currency: "USD",
              }
            ).format(amount)

            return <div className="text-start font-medium">{formatted}</div>
          },
        }),
        columnHelper.display({
          id: "actions",
          enableHiding: false,
          cell: ({ row }) => {
            const payment = row.original

            return (
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon-xs">
                  <span className="sr-only">{t.openMenu}</span>
                  <MoreHorizontal />
                </Button>
                <DropdownMenu
                  placement={dir === "rtl" ? "bottom start" : "bottom end"}
                  data-lang={dir === "rtl" ? language : undefined}
                  className="w-40"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(payment.id)}
                    >
                      {t.copyPaymentId}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>{t.viewCustomer}</DropdownMenuItem>
                    <DropdownMenuItem>{t.viewPaymentDetails}</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenu>
              </DropdownMenuTrigger>
            )
          },
        }),
      ]),
    [t, dir, language]
  )

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder={t.filterEmails}
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenuTrigger>
          <Button variant="outline" className="ms-auto">
            {t.columns} <ChevronDown />
          </Button>
          <DropdownMenu
            placement={dir === "rtl" ? "bottom start" : "bottom end"}
            data-lang={dir === "rtl" ? language : undefined}
          >
            <DropdownMenuGroup
              selectionMode="multiple"
              selectedKeys={table
                .getVisibleFlatColumns()
                .filter((column) => column.getCanHide())
                .map((column) => column.id)}
              onSelectionChange={(keys) => {
                table.setColumnVisibility(
                  Object.fromEntries(
                    table
                      .getAllFlatColumns()
                      .map((c) => [
                        c.id,
                        !c.getCanHide() || keys === "all" || keys.has(c.id),
                      ])
                  )
                )
              }}
            >
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      id={column.id}
                      className="capitalize"
                    >
                      {column.id}
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table
          aria-label="Tasks"
          selectionMode="multiple"
          onSelectionChange={(selection) => {
            if (selection === "all") {
              table.toggleAllRowsSelected()
            } else {
              table.setRowSelection(
                Object.fromEntries([...selection].map((key) => [key, true]))
              )
            }
          }}
          sortDescriptor={
            sorting.length
              ? {
                  column: sorting[0].id,
                  direction: sorting[0].desc ? "descending" : "ascending",
                }
              : undefined
          }
          onSortChange={(sortDescriptor) => {
            table.setSorting([
              {
                id: "" + sortDescriptor.column,
                desc: sortDescriptor.direction === "descending",
              },
            ])
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 1}
                allowsSorting={header.column.getCanSort()}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => t.noResults}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} {t.rowsSelected}{" "}
          {table.getFilteredRowModel().rows.length} {t.rowsSelectedSuffix}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            isDisabled={!table.getCanPreviousPage()}
          >
            {t.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            isDisabled={!table.getCanNextPage()}
          >
            {t.next}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## Tecton recipes

Tecton ships no `DataTable` component: build tables directly with [TanStack Table](https://tanstack.com/table/latest) and the `Table` primitives, exactly as the guide above does. The recipes below are copy-paste starting points for the layouts a Tecton application usually needs; each one is a self-contained example built on `useTable` and the shadcn `Table` components.

### Density and alternating rows

Density is nothing more than Tailwind classes on the `Table`: an emphasised header (`[&_thead]:bg-muted`), alternating rows (`[&_tbody_tr:nth-child(even)]:bg-surface-alt`) and, for the compact variant, shorter rows and smaller text (`[&_th]:h-8 [&_td]:py-1 text-xs`).

**Example — `data-table-density`**

```tsx
"use client"

import * as React from "react"
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"

import { Badge } from "@tecton/react/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
  depth: number
  operator: string
}

const wells: Well[] = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    status: "Producing",
    depth: 3250,
    operator: "Equinor",
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "Shut in",
    depth: 2980,
    operator: "Equinor",
  },
  {
    id: "c7",
    name: "33/9-C-7",
    field: "Statfjord",
    status: "Drilling",
    depth: 1420,
    operator: "Equinor",
  },
  {
    id: "d2",
    name: "34/7-D-2",
    field: "Snorre",
    status: "Producing",
    depth: 2735,
    operator: "Equinor",
  },
]

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({})
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Well" }),
  columnHelper.accessor("field", { header: "Field" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("depth", {
    header: () => <div className="text-right">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
  columnHelper.accessor("operator", { header: "Operator" }),
])

// Density is only Tailwind classes on the table: an emphasised header,
// alternating rows and, for the compact variant, shorter rows and smaller text.
const density = {
  default: "[&_thead]:bg-muted [&_tbody_tr:nth-child(even)]:bg-surface-alt",
  compact:
    "text-xs [&_thead]:bg-muted [&_tbody_tr:nth-child(even)]:bg-surface-alt [&_th]:h-8 [&_td]:py-1",
}

export default function DataTableDensity() {
  const [mode, setMode] = React.useState<keyof typeof density>("default")
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <ToggleGroup
        variant="outline"
        size="sm"
        disallowEmptySelection
        selectedKeys={[mode]}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0]
          if (key) setMode(key as keyof typeof density)
        }}
      >
        <ToggleGroupItem id="default">Default</ToggleGroupItem>
        <ToggleGroupItem id="compact">Compact</ToggleGroupItem>
      </ToggleGroup>
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Wells" className={density[mode]}>
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 0}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No wells."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

### Row selection

Add a display column with a React Aria `Checkbox slot="selection"` in the header and in each cell, turn on `selectionMode="multiple"` on the `Table` and mirror its selection into TanStack's `rowSelection` state. Summarise the selection below the table.

**Example — `data-table-selection`**

```tsx
"use client"

import * as React from "react"
import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { RowSelectionState } from "@tanstack/react-table"

import { Badge } from "@tecton/react/components/badge"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
  depth: number
  operator: string
}

const wells: Well[] = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    status: "Producing",
    depth: 3250,
    operator: "Equinor",
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "Shut in",
    depth: 2980,
    operator: "Equinor",
  },
  {
    id: "c7",
    name: "33/9-C-7",
    field: "Statfjord",
    status: "Drilling",
    depth: 1420,
    operator: "Equinor",
  },
  {
    id: "d2",
    name: "34/7-D-2",
    field: "Snorre",
    status: "Producing",
    depth: 2735,
    operator: "Equinor",
  },
]

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({ rowSelectionFeature })
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  // `slot="selection"` wires the checkbox to the React Aria table selection:
  // the header checkbox selects all rows, the cell checkbox its own row.
  columnHelper.display({
    id: "select",
    header: () => <Checkbox slot="selection" aria-label="Select all wells" />,
    cell: () => <Checkbox slot="selection" aria-label="Select well" />,
  }),
  columnHelper.accessor("name", { header: "Well" }),
  columnHelper.accessor("field", { header: "Field" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("depth", {
    header: () => <div className="text-right">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
  columnHelper.accessor("operator", { header: "Operator" }),
])

export default function DataTableSelection() {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="overflow-hidden rounded-md border">
        <Table
          aria-label="Wells"
          selectionMode="multiple"
          selectedKeys={table.getSelectedRowModel().rows.map((row) => row.id)}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              table.toggleAllRowsSelected(true)
            } else {
              table.setRowSelection(
                Object.fromEntries([...selection].map((key) => [key, true]))
              )
            }
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 1}
                className={header.column.id === "select" ? "w-10" : undefined}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No wells."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {table.getSelectedRowModel().rows.length} of{" "}
        {table.getRowModel().rows.length} row(s) selected.
      </p>
    </div>
  )
}
```

### Bulk actions

While rows are selected, replace the table toolbar with an [Action Bar](/docs/tecton/action-bar.md): the count and a Clear control, then the actions in an overflow toolbar that collapses into a More menu when the table is narrow. Escape, while focus is in the bar, clears the selection.

**Example — `action-bar-demo`**

```tsx
"use client"

import * as React from "react"
import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { RowSelectionState } from "@tanstack/react-table"
import {
  ArchiveIcon,
  DownloadIcon,
  TagIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Input } from "@tecton/react/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import {
  ActionBar,
  ActionBarActions,
  ActionBarSelection,
} from "@tecton/react/tecton/action-bar"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
} from "@tecton/react/tecton/overflow"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
}

const wells: Well[] = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", status: "Producing" },
  { id: "b3", name: "34/10-B-3", field: "Gullfaks", status: "Shut in" },
  { id: "c7", name: "33/9-C-7", field: "Statfjord", status: "Drilling" },
  { id: "d2", name: "34/7-D-2", field: "Snorre", status: "Producing" },
  { id: "e9", name: "34/7-E-9", field: "Snorre", status: "Shut in" },
]

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({ rowSelectionFeature })
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: () => <Checkbox slot="selection" aria-label="Select all wells" />,
    cell: () => <Checkbox slot="selection" aria-label="Select well" />,
  }),
  columnHelper.accessor("name", { header: "Well" }),
  columnHelper.accessor("field", { header: "Field" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
])

export default function ActionBarDemo() {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({
    a12: true,
    c7: true,
  })
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })
  const selected = table.getSelectedRowModel().rows.length
  const clear = () => table.resetRowSelection(true)

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {/* The table toolbar; the action bar replaces it while rows are selected. */}
      <div className="grid min-h-11 items-center">
        {selected > 0 ? (
          <ActionBar
            placement="toolbar"
            aria-label="Selected wells"
            onDismiss={clear}
          >
            <ActionBarSelection
              count={selected}
              total={wells.length}
              onClear={clear}
            />
            <ActionBarActions aria-label="Selection actions">
              <OverflowItem
                id="assign"
                label="Assign"
                icon={<UserPlusIcon />}
                priority={2}
              >
                <Button variant="outline" size="sm">
                  <UserPlusIcon data-icon="inline-start" />
                  <OverflowLabel>Assign</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem
                id="tag"
                label="Add tag"
                icon={<TagIcon />}
                priority={1}
              >
                <Button variant="outline" size="sm">
                  <TagIcon data-icon="inline-start" />
                  <OverflowLabel>Add tag</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem id="export" label="Export" icon={<DownloadIcon />}>
                <Button variant="outline" size="sm">
                  <DownloadIcon data-icon="inline-start" />
                  <OverflowLabel>Export</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem id="archive" label="Archive" icon={<ArchiveIcon />}>
                <Button variant="outline" size="sm">
                  <ArchiveIcon data-icon="inline-start" />
                  <OverflowLabel>Archive</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowDivider />
              <OverflowItem
                id="delete"
                label="Delete"
                icon={<Trash2Icon />}
                variant="destructive"
                labelBehavior="keep"
              >
                <Button variant="destructive" size="sm">
                  <Trash2Icon data-icon="inline-start" />
                  Delete
                </Button>
              </OverflowItem>
            </ActionBarActions>
          </ActionBar>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              aria-label="Filter wells"
              placeholder="Filter wells"
              className="max-w-56"
            />
            <Button variant="outline" size="sm" className="ms-auto">
              New well
            </Button>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table
          aria-label="Wells"
          selectionMode="multiple"
          selectedKeys={table.getSelectedRowModel().rows.map((row) => row.id)}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              table.toggleAllRowsSelected(true)
            } else {
              table.setRowSelection(
                Object.fromEntries([...selection].map((key) => [key, true]))
              )
            }
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 1}
                className={header.column.id === "select" ? "w-10" : undefined}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No wells."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

### Pagination

Register `rowPaginationFeature` with `createPaginatedRowModel()`, keep the `pagination` state in React and render previous/next buttons, a page-size `Select` and a "Page x of y" label in a footer line.

**Example — `data-table-pagination`**

```tsx
"use client"

import * as React from "react"
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { PaginationState } from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
  depth: number
  operator: string
}

const fields = ["Gullfaks", "Statfjord", "Snorre", "Visund"]
const statuses = ["Producing", "Producing", "Shut in", "Drilling"] as const
const wells: Well[] = Array.from({ length: 23 }, (_, i) => ({
  id: `w${i + 1}`,
  name: `34/10-${String.fromCharCode(65 + (i % 6))}-${i + 1}`,
  field: fields[i % fields.length],
  status: statuses[(i * 7) % statuses.length],
  depth: 1800 + ((i * 137) % 2200),
  operator: i % 5 === 4 ? "Petoro" : "Equinor",
}))

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Well" }),
  columnHelper.accessor("field", { header: "Field" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("depth", {
    header: () => <div className="text-right">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
  columnHelper.accessor("operator", { header: "Operator" }),
])

const pageSizes = [5, 10, 25]

export default function DataTablePagination() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
  })

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Wells">
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 0}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No wells."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-muted-foreground">
        <span className="mr-auto tabular-nums">{wells.length} wells</span>
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            aria-label="Rows per page"
            selectedKey={String(pagination.pageSize)}
            onSelectionChange={(key) => table.setPageSize(Number(key))}
          >
            <SelectTrigger size="sm" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem
                  key={size}
                  id={String(size)}
                  textValue={String(size)}
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="tabular-nums">
          Page {pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            onPress={() => table.previousPage()}
            isDisabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            onPress={() => table.nextPage()}
            isDisabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Small screens

Hide low-priority columns below `md` with `hidden md:table-cell` on both the header and the cell, and let the primary cell carry that information as a subtitle so nothing is lost on a phone.

**Example — `data-table-small-screen`**

```tsx
"use client"

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"

import { Badge } from "@tecton/react/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
  depth: number
  operator: string
}

const wells: Well[] = [
  {
    id: "a12",
    name: "34/10-A-12",
    field: "Gullfaks",
    status: "Producing",
    depth: 3250,
    operator: "Equinor",
  },
  {
    id: "b3",
    name: "34/10-B-3",
    field: "Gullfaks",
    status: "Shut in",
    depth: 2980,
    operator: "Equinor",
  },
  {
    id: "c7",
    name: "33/9-C-7",
    field: "Statfjord",
    status: "Drilling",
    depth: 1420,
    operator: "Equinor",
  },
  {
    id: "d2",
    name: "34/7-D-2",
    field: "Snorre",
    status: "Producing",
    depth: 2735,
    operator: "Equinor",
  },
]

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({})
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  // Primary column: on small screens it also carries the field and operator
  // as a subtitle, because their own columns are hidden below `md`.
  columnHelper.accessor("name", {
    header: "Well",
    cell: ({ getValue, row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{getValue()}</span>
        <span className="text-xs text-muted-foreground md:hidden">
          {row.original.field} · {row.original.operator}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("field", { header: "Field" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("depth", {
    header: () => <div className="text-right">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
  columnHelper.accessor("operator", { header: "Operator" }),
])

// Low-priority columns only get a cell from `md` upwards.
const columnClassName: Record<string, string> = {
  field: "hidden md:table-cell",
  operator: "hidden md:table-cell",
}

export default function DataTableSmallScreen() {
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Wells">
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 0}
                className={columnClassName[header.column.id]}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No wells."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={columnClassName[cell.column.id]}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Resize the viewport: below <code>md</code> the Field and Operator
        columns collapse into the Well cell.
      </p>
    </div>
  )
}
```
