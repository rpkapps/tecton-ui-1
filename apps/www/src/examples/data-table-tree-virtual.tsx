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

const FIELDS = [
  "Gullfaks",
  "Statfjord",
  "Snorre",
  "Oseberg",
  "Troll",
  "Heidrun",
  "Grane",
  "Kvitebjørn",
]
const STATUSES = ["Producing", "Shut in", "Drilling"] as const

/**
 * 40 fields × 25 platforms × 12 wells: 13,040 rows when every row is
 * open, from a seeded generator (the same tree on every render).
 */
const assets: Asset[] = Array.from({ length: 40 }, (_, f) => ({
  id: `f${f}`,
  name: `${FIELDS[f % FIELDS.length]} ${Math.floor(f / FIELDS.length) + 1}`,
  kind: "Field" as const,
  children: Array.from({ length: 25 }, (_, p) => ({
    id: `f${f}-p${p}`,
    name: `${FIELDS[f % FIELDS.length]} ${String.fromCharCode(65 + (p % 26))}${p >= 26 ? p : ""}`,
    kind: "Platform" as const,
    children: Array.from({ length: 12 }, (_, w) => {
      const seed = (((f * 25 + p) * 12 + w) * 2654435761) % 2 ** 32
      return {
        id: `f${f}-p${p}-w${w}`,
        name: `${30 + (f % 7)}/${1 + (p % 12)}-${String.fromCharCode(65 + (p % 26))}-${w + 1}`,
        kind: "Well" as const,
        status: STATUSES[seed % STATUSES.length],
        depth: 1200 + (seed % 3800),
      }
    }),
  })),
}))

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

export default function DataTableTreeVirtual() {
  const [expanded, setExpanded] = React.useState<ExpandedState>({
    f0: true,
    "f0-p0": true,
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
  const rows = table.getRowModel().rows

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.toggleAllRowsExpanded(!all)}
        >
          {all ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
          {all ? "Collapse all" : "Expand all"}
        </Button>
        <p className="text-sm text-muted-foreground tabular-nums">
          {rows.length.toLocaleString("en-US")} rows open
        </p>
      </div>
      {/* The bounded height the table scrolls in. */}
      <div className="h-96 overflow-hidden rounded-md border">
        <Table aria-label="Assets" virtualized>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    // Room for the deepest indent: the columns keep the
                    // widths they are first laid out with.
                    className={
                      header.column.id === "name" ? "w-[45%]" : undefined
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
          {/* The open rows, flattened in order: only those in view render. */}
          <TableBody items={rows}>
            {(row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
