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
  // The selection column: the header checkbox selects every row (and shows
  // a dash while only some are), each cell checkbox its own row.
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all wells"
        checked={table.getIsAllRowsSelected()}
        indeterminate={
          table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
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
        <Table aria-label="Wells">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "select" ? "w-10" : undefined
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
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
