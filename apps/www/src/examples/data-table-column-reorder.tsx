"use client"

import * as React from "react"
import {
  columnOrderingFeature,
  createColumnHelper,
  tableFeatures,
  useTable,
  type ColumnOrderState,
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
import { Reorderable, ReorderableItem } from "@tecton/react/tecton/reorderable"

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

const features = tableFeatures({ columnOrderingFeature })
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
    header: "TD (m)",
    cell: ({ getValue }) => (
      <span className="font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </span>
    ),
  }),
  columnHelper.accessor("operator", { header: "Operator" }),
])

/** The identifying column stays first; the others move. */
const PINNED = "name"

/** The column names, for the handles and the announcements. */
const labels: Record<string, string> = {
  name: "Well",
  field: "Field",
  status: "Status",
  depth: "TD",
  operator: "Operator",
}

export default function DataTableColumnReorder() {
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    Object.keys(labels)
  )
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { columnOrder },
    onColumnOrderChange: setColumnOrder,
  })

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-md border">
      {/* Around the table: the drop line is drawn beside it, not in it. */}
      <Reorderable
        orientation="horizontal"
        value={columnOrder.filter((id) => id !== PINNED)}
        onValueChange={(next) => setColumnOrder([PINNED, ...next])}
      >
        <Table aria-label="Wells">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const content = header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )
                  if (header.column.id === PINNED)
                    return <TableHead key={header.id}>{content}</TableHead>
                  return (
                    // No grip in a header: the header itself is dragged,
                    // or focused with Tab and moved with Enter and the arrows.
                    <ReorderableItem
                      key={header.id}
                      value={header.column.id}
                      label={labels[header.column.id]}
                      dragHandle={false}
                      render={<TableHead />}
                    >
                      {content}
                    </ReorderableItem>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Reorderable>
    </div>
  )
}
