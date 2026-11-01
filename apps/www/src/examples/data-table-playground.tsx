"use client"

import * as React from "react"
import { cn } from "cn"
import {
  columnOrderingFeature,
  columnSizingFeature,
  createColumnHelper,
  createExpandedRowModel,
  createPaginatedRowModel,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Column,
  type Cell,
  type ColumnOrderState,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Label } from "@tecton/react/components/label"
import { Switch } from "@tecton/react/components/switch"
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
import {
  Reorderable,
  ReorderableHandle,
  ReorderableItem,
} from "@tecton/react/tecton/reorderable"
import { TableColumnResizer } from "@tecton/react/tecton/table-column-resizer"

import { createFastSortedRowModel } from "./lib/fast-sorted-row-model"

// MARK: Data

type Asset = {
  id: string
  name: string
  kind: "Field" | "Platform" | "Well"
  field: string
  status?: "Producing" | "Shut in" | "Drilling"
  depth?: number
  operator?: string
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
const OPERATORS = ["Equinor", "Aker BP", "Vår Energi", "ConocoPhillips"]
const FIELD_COUNT = 40
const PLATFORMS = 25

const fieldName = (f: number) =>
  `${FIELDS[f % FIELDS.length]} ${Math.floor(f / FIELDS.length) + 1}`
const platformName = (f: number, p: number) =>
  `${fieldName(f)} ${String.fromCharCode(65 + (p % 26))}`

/** `count` wells from a seeded generator, made once per count. */
const wellCache = new Map<number, Asset[]>()
function wellsOf(count: number) {
  let wells = wellCache.get(count)
  if (wells) return wells
  wells = Array.from({ length: count }, (_, i) => {
    const seed = (i * 2654435761) % 2 ** 32
    const f = i % FIELD_COUNT
    const p = Math.floor(i / FIELD_COUNT) % PLATFORMS
    return {
      id: `w${i}`,
      name: `${30 + (f % 7)}/${1 + (p % 12)}-${String.fromCharCode(65 + (p % 26))}-${i + 1}`,
      kind: "Well" as const,
      field: fieldName(f),
      status: STATUSES[seed % STATUSES.length],
      depth: 1200 + (seed % 3800),
      operator: OPERATORS[(seed >>> 4) % OPERATORS.length],
    }
  })
  wellCache.set(count, wells)
  return wells
}

/** The same wells under their fields and platforms, made once per count. */
const treeCache = new Map<number, Asset[]>()
function treeOf(count: number) {
  let tree = treeCache.get(count)
  if (tree) return tree
  const fields: Asset[] = Array.from({ length: FIELD_COUNT }, (_, f) => ({
    id: `f${f}`,
    name: fieldName(f),
    kind: "Field",
    field: fieldName(f),
    children: Array.from({ length: PLATFORMS }, (_, p) => ({
      id: `f${f}-p${p}`,
      name: platformName(f, p),
      kind: "Platform" as const,
      field: fieldName(f),
      children: [] as Asset[],
    })),
  }))
  wellsOf(count).forEach((well, i) => {
    const f = i % FIELD_COUNT
    const p = Math.floor(i / FIELD_COUNT) % PLATFORMS
    fields[f].children?.[p].children?.push(well)
  })
  tree = fields
  treeCache.set(count, tree)
  return tree
}

// MARK: Table

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const density = {
  default: "",
  compact: "[&_th]:h-8 [&_td]:py-1 text-xs",
}

/** Every feature the toggles use, registered once. */
const features = tableFeatures({
  rowSortingFeature,
  // Sorts 100,000 rows in a few ms: see lib/fast-sorted-row-model.ts.
  sortedRowModel: createFastSortedRowModel(),
  rowSelectionFeature,
  columnSizingFeature,
  columnOrderingFeature,
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})
const columnHelper = createColumnHelper<typeof features, Asset>()

/**
 * A cell's content: its renderer called as a plain function. The cell
 * renderers here use no hooks, so a component per cell (`FlexRender`)
 * would only add work to every row that scrolls into view.
 */
function cellContent<TValue>(cell: Cell<typeof features, Asset, TValue>) {
  const render = cell.column.columnDef.cell
  return typeof render === "function" ? render(cell.getContext()) : render
}

/**
 * One page of every row while scrolling virtually. A constant: a new
 * object each render would make the table page its rows again.
 */
const EVERY_ROW: PaginationState = {
  pageIndex: 0,
  pageSize: Number.MAX_SAFE_INTEGER,
}

/** The columns that stay first, before the ones that move. */
const PINNED = ["select", "drag"]
const DATA_COLUMNS = ["name", "field", "status", "depth", "operator"]
const LABELS: Record<string, string> = {
  name: "Name",
  field: "Field",
  status: "Status",
  depth: "TD (m)",
  operator: "Operator",
}

/** A header that sorts its column, with the direction it sorts in. */
function SortButton<TValue>({
  column,
}: {
  column: Column<typeof features, Asset, TValue>
}) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ms-2"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {LABELS[column.id]}
      {sorted === "asc" ? (
        <ArrowUpIcon />
      ) : sorted === "desc" ? (
        <ArrowDownIcon />
      ) : (
        <ArrowUpDownIcon className="opacity-50" />
      )}
    </Button>
  )
}

/** Each tree level is indented by the width of a chevron and its gap. */
const INDENT = 1.25

function columnsFor({
  tree,
  select,
  reorderRows,
}: {
  tree: boolean
  select: boolean
  reorderRows: boolean
}) {
  return columnHelper.columns([
    ...(select
      ? [
          columnHelper.display({
            id: "select",
            size: 44,
            enableSorting: false,
            header: ({ table }) => (
              <Checkbox
                aria-label="Select all rows"
                checked={table.getIsAllRowsSelected()}
                indeterminate={
                  table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
                }
                onCheckedChange={(checked) =>
                  table.toggleAllRowsSelected(checked)
                }
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                aria-label={`Select ${row.original.name}`}
                checked={row.getIsSelected()}
                indeterminate={row.getIsSomeSelected()}
                onCheckedChange={(checked) => row.toggleSelected(checked)}
              />
            ),
          }),
        ]
      : []),
    ...(reorderRows
      ? [
          columnHelper.display({
            id: "drag",
            size: 44,
            enableSorting: false,
            header: () => <span className="sr-only">Move</span>,
            cell: () => <ReorderableHandle />,
          }),
        ]
      : []),
    columnHelper.accessor("name", {
      size: 220,
      header: ({ column }) => <SortButton column={column} />,
      cell: ({ row, getValue }) =>
        tree ? (
          <div
            className="flex items-center gap-1"
            style={{ paddingInlineStart: `${row.depth * INDENT}rem` }}
          >
            {row.getCanExpand() ? (
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
              <span aria-hidden className="size-6 shrink-0" />
            )}
            <span className="truncate">{getValue()}</span>
          </div>
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("field", {
      size: 150,
      header: ({ column }) => <SortButton column={column} />,
    }),
    columnHelper.accessor("status", {
      size: 130,
      header: ({ column }) => <SortButton column={column} />,
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
      size: 120,
      header: ({ column }) => <SortButton column={column} />,
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">
          {getValue()?.toLocaleString("en-US")}
        </span>
      ),
    }),
    columnHelper.accessor("operator", {
      size: 150,
      header: ({ column }) => <SortButton column={column} />,
    }),
  ])
}

// MARK: Timing

/**
 * How long the last click or key press took to paint: the time from the
 * event to the frame after its render. Kept outside React state, so
 * showing it re-renders nothing but the readout.
 */
function useInteractionTiming() {
  const [store] = React.useState(() => {
    let value: number | null = null
    const listeners = new Set<() => void>()
    return {
      get: () => value,
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => void listeners.delete(listener)
      },
      start: () => {
        const started = performance.now()
        requestAnimationFrame(() => {
          // The next task after the frame: the frame has painted.
          const channel = new MessageChannel()
          channel.port1.onmessage = () => {
            value = performance.now() - started
            listeners.forEach((listener) => listener())
          }
          channel.port2.postMessage(null)
        })
      },
    }
  })
  return store
}

function TimingReadout({
  timing,
}: {
  timing: ReturnType<typeof useInteractionTiming>
}) {
  const ms = React.useSyncExternalStore(
    timing.subscribe,
    timing.get,
    () => null
  )
  return (
    <span className="tabular-nums" aria-live="off">
      {ms === null
        ? "Click anything"
        : `Last interaction: ${Math.round(ms)} ms to paint`}
    </span>
  )
}

// MARK: Playground

function Toggle({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  )
}

export default function DataTablePlayground() {
  const id = React.useId()
  const timing = useInteractionTiming()

  // The toggles.
  const [count, setCount] = React.useState(10_000)
  const [display, setDisplay] = React.useState<"virtual" | "pages">("virtual")
  const [mode, setMode] = React.useState<keyof typeof density>("default")
  const [tree, setTree] = React.useState(false)
  const [select, setSelect] = React.useState(true)
  const [resize, setResize] = React.useState(false)
  const [reorderColumns, setReorderColumns] = React.useState(false)
  const [reorderRowsOn, setReorderRows] = React.useState(false)

  // The table's state.
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({ f0: true })
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })
  // The wells' own order, for row reordering; reset with the row count.
  const [order, setOrder] = React.useState<Asset[] | null>(null)

  // Rows reorder only in a flat, unsorted list: a sort or a tree has no
  // manual order.
  const reorderRows = reorderRowsOn && !tree && sorting.length === 0
  const virtual = display === "virtual"

  const data = React.useMemo(
    () => (tree ? treeOf(count) : (order ?? wellsOf(count))),
    [tree, count, order]
  )
  const columns = React.useMemo(
    () => columnsFor({ tree, select, reorderRows }),
    [tree, select, reorderRows]
  )

  const table = useTable({
    features,
    data,
    columns,
    getRowId: (row) => row.id,
    getSubRows: tree ? (row) => row.children : undefined,
    state: {
      sorting,
      rowSelection,
      columnSizing,
      columnOrder,
      expanded,
      pagination: virtual ? EVERY_ROW : pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
  })
  const rows = table.getRowModel().rows
  const rowIds = React.useMemo(
    () => (reorderRows ? rows.map((row) => row.id) : []),
    [reorderRows, rows]
  )
  const total = table.getPrePaginatedRowModel().rows.length
  const allExpanded = tree && table.getIsAllRowsExpanded()

  // The columns that move, in their current order.
  const movable = table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((columnId) => !PINNED.includes(columnId))
  const selected = Object.keys(rowSelection).length

  return (
    <div
      className="flex w-full max-w-5xl flex-col gap-4"
      onClickCapture={timing.start}
      onKeyDownCapture={timing.start}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Rows"
          value={[String(count)]}
          onValueChange={(value) => {
            if (!value[0]) return
            setCount(Number(value[0]))
            setOrder(null)
            setRowSelection({})
            setPagination((page) => ({ ...page, pageIndex: 0 }))
          }}
        >
          <ToggleGroupItem value="1000">1,000</ToggleGroupItem>
          <ToggleGroupItem value="10000">10,000</ToggleGroupItem>
          <ToggleGroupItem value="100000">100,000</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Display"
          value={[display]}
          onValueChange={(value) => {
            if (value[0]) setDisplay(value[0] as "virtual" | "pages")
          }}
        >
          <ToggleGroupItem value="virtual">Virtual scroll</ToggleGroupItem>
          <ToggleGroupItem value="pages">Pages</ToggleGroupItem>
        </ToggleGroup>
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
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Toggle
          id={`${id}-tree`}
          label="Tree"
          checked={tree}
          onCheckedChange={(on) => {
            setTree(on)
            setRowSelection({})
          }}
        />
        <Toggle
          id={`${id}-select`}
          label="Selection"
          checked={select}
          onCheckedChange={setSelect}
        />
        <Toggle
          id={`${id}-resize`}
          label="Resize columns"
          checked={resize}
          onCheckedChange={setResize}
        />
        <Toggle
          id={`${id}-columns`}
          label="Reorder columns"
          checked={reorderColumns}
          onCheckedChange={setReorderColumns}
        />
        <Toggle
          id={`${id}-rows`}
          label="Reorder rows"
          checked={reorderRowsOn}
          disabled={tree}
          onCheckedChange={setReorderRows}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {total.toLocaleString("en-US")} rows
          {selected ? ` · ${selected.toLocaleString("en-US")} selected` : ""}
        </span>
        {tree ? (
          <Button
            variant="outline"
            size="xs"
            onClick={() => table.toggleAllRowsExpanded(!allExpanded)}
          >
            {allExpanded ? <ChevronsDownUpIcon /> : <ChevronsUpDownIcon />}
            {allExpanded ? "Collapse all" : "Expand all"}
          </Button>
        ) : null}
        {sorting.length ? (
          <Button variant="outline" size="xs" onClick={() => setSorting([])}>
            Clear sort
          </Button>
        ) : null}
        {reorderRowsOn && !reorderRows ? (
          <span>Row reordering is off while the rows are sorted.</span>
        ) : null}
        <span className="ms-auto">
          <TimingReadout timing={timing} />
        </span>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-md border",
          virtual && "h-[28rem]"
        )}
      >
        {/* Always mounted, off when their toggle is: the table keeps its
            place in the tree, and its scroll, as the toggles change. */}
        <Reorderable
          orientation="horizontal"
          disabled={!reorderColumns}
          value={movable}
          onValueChange={(next) =>
            setColumnOrder([
              ...PINNED.filter((pinned) =>
                table.getAllLeafColumns().some((c) => c.id === pinned)
              ),
              ...next,
            ])
          }
          className="h-full"
        >
          <Reorderable
            disabled={!reorderRows}
            value={rowIds}
            onValueChange={(ids) => {
              const byId = new Map(data.map((asset) => [asset.id, asset]))
              setOrder(ids.map((rowId) => byId.get(rowId)!))
            }}
            className="h-full"
          >
            <Table
              aria-label="Wells"
              virtualized={virtual}
              className={cn(density[mode], resize && "table-fixed")}
              style={resize ? { width: table.getTotalSize() } : undefined}
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const { column } = header
                      const sorted = column.getIsSorted()
                      const content = header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )
                      const props = {
                        "aria-sort": sorted
                          ? sorted === "asc"
                            ? ("ascending" as const)
                            : ("descending" as const)
                          : undefined,
                        className: cn(
                          resize && "relative",
                          !resize && PINNED.includes(column.id) && "w-11"
                        ),
                        style: resize ? { width: header.getSize() } : undefined,
                      }
                      const resizer =
                        resize && DATA_COLUMNS.includes(column.id) ? (
                          <TableColumnResizer
                            label={LABELS[column.id]}
                            value={column.getSize()}
                            min={80}
                            max={480}
                            resetValue={column.columnDef.size}
                            onValueChange={(size) =>
                              setColumnSizing((sizes) => ({
                                ...sizes,
                                [column.id]: size,
                              }))
                            }
                          />
                        ) : null
                      if (reorderColumns && !PINNED.includes(column.id))
                        return (
                          <ReorderableItem
                            key={header.id}
                            value={column.id}
                            label={LABELS[column.id]}
                            dragHandle={false}
                            render={<TableHead {...props} />}
                          >
                            {content}
                            {resizer}
                          </ReorderableItem>
                        )
                      return (
                        <TableHead key={header.id} {...props}>
                          {content}
                          {resizer}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody items={rows}>
                {(row) => {
                  const cells = row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={resize ? "truncate" : undefined}
                    >
                      {cellContent(cell)}
                    </TableCell>
                  ))
                  const state = row.getIsSelected() ? "selected" : undefined
                  return reorderRows ? (
                    <ReorderableItem
                      key={row.id}
                      value={row.id}
                      label={row.original.name}
                      render={<TableRow data-state={state} />}
                    >
                      {cells}
                    </ReorderableItem>
                  ) : (
                    <TableRow key={row.id} data-state={state}>
                      {cells}
                    </TableRow>
                  )
                }}
              </TableBody>
            </Table>
          </Reorderable>
        </Reorderable>
      </div>

      {display === "pages" ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground tabular-nums">
            Page {pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount()).toLocaleString("en-US")}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
