"use client"

import * as React from "react"
import { cn } from "cn"
import {
  createColumnHelper,
  createExpandedRowModel,
  rowExpandingFeature,
  tableFeatures,
  useTable,
  type ExpandedState,
} from "@tanstack/react-table"
import {
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react"

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

type Asset = {
  id: string
  name: string
  kind: "Field" | "Platform" | "Well"
  status?: "Producing" | "Shut in" | "Drilling"
  depth?: number
  children?: Asset[]
}

const assets: Asset[] = [
  {
    id: "gullfaks",
    name: "Gullfaks",
    kind: "Field",
    children: [
      {
        id: "gfa",
        name: "Gullfaks A",
        kind: "Platform",
        children: [
          {
            id: "a12",
            name: "34/10-A-12",
            kind: "Well",
            status: "Producing",
            depth: 3250,
          },
          {
            id: "a14",
            name: "34/10-A-14",
            kind: "Well",
            status: "Producing",
            depth: 3105,
          },
        ],
      },
      {
        id: "gfb",
        name: "Gullfaks B",
        kind: "Platform",
        children: [
          {
            id: "b3",
            name: "34/10-B-3",
            kind: "Well",
            status: "Shut in",
            depth: 2980,
          },
        ],
      },
    ],
  },
  {
    id: "statfjord",
    name: "Statfjord",
    kind: "Field",
    children: [
      {
        id: "sfc",
        name: "Statfjord C",
        kind: "Platform",
        children: [
          {
            id: "c7",
            name: "33/9-C-7",
            kind: "Well",
            status: "Drilling",
            depth: 1420,
          },
        ],
      },
    ],
  },
]

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
})
const columnHelper = createColumnHelper<typeof features, Asset>()

/** Each level is indented by the width of a chevron and its gap. */
const INDENT = 1.25

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Name",
    cell: ({ row, getValue }) => (
      <div
        className="flex items-center gap-1"
        style={{ paddingInlineStart: `${row.depth * INDENT}rem` }}
      >
        {row.getCanExpand() ? (
          // The chevron of a Tree View row: quiet, not a pressed button.
          <button
            type="button"
            aria-expanded={row.getIsExpanded()}
            aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${getValue()}`}
            onClick={() => row.toggleExpanded()}
            className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronRightIcon
              className={cn(
                "size-4 transition-transform rtl:-scale-x-100",
                row.getIsExpanded() && "rotate-90 rtl:-rotate-90"
              )}
            />
          </button>
        ) : (
          // Leaves line up with their parent's name, past the chevron.
          <span aria-hidden className="size-6 shrink-0" />
        )}
        <span className={row.depth === 0 ? "font-medium" : undefined}>
          {getValue()}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("kind", { header: "Type" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue()
      return status ? (
        <Badge variant={statusVariant[status]} appearance="outline">
          {status}
        </Badge>
      ) : null
    },
  }),
  columnHelper.accessor("depth", {
    header: () => <div className="text-end">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-end font-mono tabular-nums">
        {getValue()?.toLocaleString("en-US")}
      </div>
    ),
  }),
])

export default function DataTableTree() {
  const [expanded, setExpanded] = React.useState<ExpandedState>({
    gullfaks: true,
  })
  const table = useTable({
    features,
    data: assets,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    state: { expanded },
    onExpandedChange: setExpanded,
  })
  const all = table.getIsAllRowsExpanded()

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.toggleAllRowsExpanded(!all)}
        >
          {all ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
          {all ? "Collapse all" : "Expand all"}
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Assets">
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
