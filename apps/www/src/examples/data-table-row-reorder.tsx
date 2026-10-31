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
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
} from "@tecton/react/tecton/reorderable"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
  depth: number
  operator: string
}

const initialWells: Well[] = [
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
  // The handle: drag it, or press Enter or Space on it and use the arrow keys.
  columnHelper.display({
    id: "drag",
    header: () => <span className="sr-only">Move</span>,
    cell: () => <ReorderableHandle />,
  }),
  columnHelper.display({
    id: "priority",
    header: "#",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.index + 1}</span>
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
    header: () => <div className="text-end">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-end font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
])

export default function DataTableRowReorder() {
  const [wells, setWells] = React.useState(initialWells)
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-md border">
      {/* The order is the data's: the rows are listed by id. */}
      <Reorderable
        value={wells.map((well) => well.id)}
        onValueChange={(order) =>
          setWells((current) =>
            order.map((id) => current.find((well) => well.id === id)!)
          )
        }
      >
        <Table aria-label="Drilling queue">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "drag"
                        ? "w-10"
                        : header.column.id === "priority"
                          ? "w-8"
                          : undefined
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
              <ReorderableItem
                key={row.id}
                value={row.id}
                label={row.original.name}
                render={<TableRow />}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </ReorderableItem>
            ))}
          </TableBody>
        </Table>
      </Reorderable>
    </div>
  )
}
