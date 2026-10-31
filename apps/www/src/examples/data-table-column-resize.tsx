"use client"

import * as React from "react"
import {
  columnSizingFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
  type ColumnSizingState,
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
import { TableColumnResizer } from "@tecton/react/tecton/table-column-resizer"

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

const features = tableFeatures({ columnSizingFeature })
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Well", size: 160, minSize: 112 }),
  columnHelper.accessor("field", { header: "Field", size: 140 }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 140,
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("depth", {
    header: () => <div className="text-end">TD (m)</div>,
    size: 120,
    cell: ({ getValue }) => (
      <div className="text-end font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
  columnHelper.accessor("operator", { header: "Operator", size: 140 }),
])

/** The column names, for the resizers' accessible names. */
const labels: Record<string, string> = {
  name: "Well",
  field: "Field",
  status: "Status",
  depth: "TD",
  operator: "Operator",
}

export default function DataTableColumnResize() {
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    // The resizers' limits, unless a column sets its own.
    defaultColumn: { minSize: 80, maxSize: 400 },
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
  })

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-md border">
      {/* `table-fixed` and a total width: each column keeps its own width. */}
      <Table
        aria-label="Wells"
        className="table-fixed"
        style={{ width: table.getTotalSize() }}
      >
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const { column } = header
                return (
                  <TableHead
                    key={header.id}
                    className="relative"
                    style={{ width: header.getSize() }}
                  >
                    <div className="truncate">
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </div>
                    <TableColumnResizer
                      label={labels[column.id]}
                      value={column.getSize()}
                      min={column.columnDef.minSize}
                      max={column.columnDef.maxSize}
                      resetValue={column.columnDef.size}
                      onValueChange={(size) =>
                        setColumnSizing((sizes) => ({
                          ...sizes,
                          [column.id]: size,
                        }))
                      }
                    />
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} className="truncate">
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
