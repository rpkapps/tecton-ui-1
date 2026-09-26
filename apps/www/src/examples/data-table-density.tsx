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
        aria-label="Density"
        value={[mode]}
        onValueChange={(value) => {
          if (value[0]) setMode(value[0] as keyof typeof density)
        }}
      >
        <ToggleGroupItem value="default">Default</ToggleGroupItem>
        <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
      </ToggleGroup>
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Wells" className={density[mode]}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
      </div>
    </div>
  )
}
