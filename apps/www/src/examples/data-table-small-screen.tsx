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
    header: () => <div className="text-end">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-end font-mono tabular-nums">
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={columnClassName[header.column.id]}
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
              <TableRow key={row.id}>
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
