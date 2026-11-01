"use client"

import * as React from "react"
import {
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Cell,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
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

import { createFastSortedRowModel } from "./lib/fast-sorted-row-model"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
  depth: number
}

const FIELDS = [
  "Gullfaks",
  "Statfjord",
  "Snorre",
  "Oseberg",
  "Troll",
  "Heidrun",
]
const STATUSES: Array<Well["status"]> = ["Producing", "Shut in", "Drilling"]

/** 10,000 wells from a seeded generator: the same table on every render. */
const wells: Well[] = Array.from({ length: 10_000 }, (_, i) => {
  const seed = (i * 2654435761) % 2 ** 32
  return {
    id: `w${i}`,
    name: `${30 + (i % 7)}/${1 + (i % 12)}-${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
    field: FIELDS[seed % FIELDS.length],
    status: STATUSES[(seed >>> 3) % STATUSES.length],
    depth: 1200 + (seed % 3800),
  }
})

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

/** Row heights for each density: the table measures whichever is set. */
const density = {
  default: "",
  compact: "[&_th]:h-8 [&_td]:py-1 text-xs",
}

const features = tableFeatures({
  rowSortingFeature,
  // Sorts 10,000 rows in a few ms: see lib/fast-sorted-row-model.ts.
  sortedRowModel: createFastSortedRowModel(),
})
const columnHelper = createColumnHelper<typeof features, Well>()

/**
 * A cell's content: its renderer called as a plain function. The cell
 * renderers here use no hooks, so a component per cell (`FlexRender`)
 * would only add work to every row that scrolls into view.
 */
function cellContent<TValue>(cell: Cell<typeof features, Well, TValue>) {
  const render = cell.column.columnDef.cell
  return typeof render === "function" ? render(cell.getContext()) : render
}

/** A header that sorts its column. */
function SortButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button variant="ghost" size="sm" className="-ms-2" onClick={onClick}>
      {label}
      <ArrowUpDown />
    </Button>
  )
}

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <SortButton
        label="Well"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
  }),
  columnHelper.accessor("field", {
    header: ({ column }) => (
      <SortButton
        label="Field"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("depth", {
    header: ({ column }) => (
      <div className="flex justify-end">
        <SortButton
          label="TD (m)"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      </div>
    ),
    cell: ({ getValue }) => (
      <div className="text-end font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
])

export default function DataTableVirtual() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [mode, setMode] = React.useState<keyof typeof density>("default")
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { sorting },
    onSortingChange: setSorting,
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
      {/* The bounded height the table scrolls in. */}
      <div className="h-96 overflow-hidden rounded-md border">
        <Table aria-label="Wells" className={density[mode]} virtualized>
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
          {/* The rows' data and how to render one: only the rows in view
              are rendered, so a sort renders a screenful, not 10,000. */}
          <TableBody items={table.getRowModel().rows}>
            {(row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>{cellContent(cell)}</TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {wells.length.toLocaleString("en-US")} wells
      </p>
    </div>
  )
}
