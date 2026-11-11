"use client"

/**
 * A body row's cells, as plain function calls rather than a component per
 * cell: a page of rows renders as few components as rows. A column's
 * `cell` draws its own content; otherwise the type decides (§4.1): text
 * and dates as their display text, numbers at the end in tabular digits,
 * options as an outline `Badge` with the option's label, booleans as a
 * check (with Yes / No for screen readers).
 *
 * The row header column (`rowHeader`, the first column by default) is a
 * `th scope="row"` that names the row, carries the tree's chevron and
 * indent (or the chevron of a row with a detail row), and is the row's
 * link with `itemToHref`.
 *
 * A pinned column's cells stick to their edge (`position: sticky`, at a
 * variable of the frame's, `column-sizing.ts`) with their row's
 * background: the row is then opaque, and its cells inherit its fill, so
 * stripes, hover and selection show on them too. A stuck cell would be
 * painted over the row's collapsed border (unevenly, by browser), so a
 * table with pinned columns draws each cell's border itself, in separate
 * borders.
 */
import * as React from "react"
import { cn } from "cn"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Spinner } from "@tecton/react/components/spinner"
import { TableCell, TableHead } from "@tecton/react/components/table"
import { Link } from "@tecton/react/tecton/link"

import type { Store } from "../store"
import type { DataTableActions } from "./context"
import type { EngineColumn, Formatter, GroupRow, ItemRow } from "./engine/index"
import type { RowOrder } from "./row-order"

/** What detail rows draw: `renderDetail`, kept apart so a new one renders only them. */
type DetailStore = Store<{ render: ((item: never) => React.ReactNode) | null }>

/** What every row of a table renders with; one object while none of it changes. */
type RowShared<T> = {
  /** The columns shown, in order. */
  columns: ReadonlyArray<EngineColumn<T>>
  /** The column that names the row. */
  rowHeader: EngineColumn<T> | undefined
  formatter: Formatter<T>
  /** A selection checkbox column comes before the data columns. */
  selection: boolean
  /** A drag handle column comes first (`reorderableRows`). */
  handle: boolean
  /** The rows' order, while they can be moved; `null` hides the handles. */
  order: RowOrder | null
  size: "default" | "sm"
  /** Rows open to show a detail row (`renderDetail`). */
  detail: DetailStore | null
  /** Rows have a level: a tree, or groups. */
  levelled: boolean
  tree: boolean
  /** Rows are in groups: their row headers are indented under them. */
  grouped: boolean
  /** Multiple selection: a group row's checkbox selects its rows. */
  multiple: boolean
  /** Every column, shown or not, by id: a group row names its column. */
  columnsById: ReadonlyMap<string, EngineColumn<T>>
  /** Where a group row's label goes (`groupCellsOf`). */
  groupCells: GroupCells
  /**
   * A group row's name ("Field: Gullfaks"): whole, and in parts, the
   * value apart from the column's name around it.
   */
  groupLabel: (row: GroupRow) => GroupLabel
  /** `disabledBehavior="all"`: a disabled row is disabled in the grid too. */
  disableRows: boolean
  /** Row headers are links (`itemToHref`). */
  linked: boolean
  /** Columns may wrap: not in a virtualized table, whose rows are one height. */
  wrap: boolean
  /** Only the rows in view are rendered. */
  virtualized: boolean
  /** Every column, the handle and selection columns included. */
  columnCount: number
  /**
   * On pages: a row's place among every page's rows (the engine's), for its
   * `aria-rowindex`; a parent repeated at the top of a page keeps its own.
   */
  rowIndexOf: ((id: string) => number) | null
  /** The header's rows, which `aria-rowindex` counts first. */
  headerRows: number
  /** Columns have fixed widths: what does not fit a cell is cut with an ellipsis. */
  fixed: boolean
  /** Each column's pin, by its place in `columns`. */
  pins: ReadonlyArray<CellPin | undefined>
  /** The selection column's pin: at the start while a column is pinned there. */
  selectionPin: CellPin | undefined
  /** The handle column's pin, likewise. */
  handlePin: CellPin | undefined
  /** Columns are pinned: the row is opaque, each cell draws its border. */
  pinned: boolean
  actions: DataTableActions<T>
}

/** A group row's name, and its parts: the column's name before and after the value. */
type GroupLabel = {
  text: string
  before: string
  value: string
  after: string
}

/** The widths a table can differ at: below `sm`, then from each breakpoint on. */
type Tier = "base" | "sm" | "md" | "lg"

/**
 * A cell of a group row: the label's, from a column (`column`) over the
 * `span` columns shown from it, or a column's own (its subtotal). `shown`
 * is whether it is laid out at each of `GroupCells.tiers`.
 *
 * - `subtotal`: every column shown sums something, so the label is in the
 *   first one, with that column's subtotal after it.
 * - `reach`: the label, in the first column pinned to the start, may go on
 *   over the empty columns that scroll after it (`GroupCells.reach`).
 */
type GroupCell =
  | {
      kind: "label"
      column: number
      span: number
      subtotal: boolean
      reach: boolean
      shown: ReadonlyArray<boolean>
    }
  | { kind: "column"; column: number; shown: ReadonlyArray<boolean> }

/**
 * A group row's cells (`groupCellsOf`), in order. At each width, the label
 * is in the first column shown that sums nothing, over the columns shown
 * after it that sum nothing and are pinned as it is; the columns before
 * it and after those have their own cells, with their subtotals. A column
 * hidden below a breakpoint moves the label where it is hidden: a label
 * cell per place, each laid out only at its widths (`shownClassName`).
 *
 * Pinned to the start, the label in the first column may go on over the
 * empty columns that scroll after it, on its row's fill: it stays in view
 * with the pinned columns, cut only where a column sums something.
 * `reach` is the number of columns it may cover (0 when it keeps to its
 * cell); their width is the frame's `--data-table-group-label`
 * (`groupLabelWidth`), so a resize renders no row. Scrolled sideways, the
 * label keeps to its cell (`content.tsx`).
 */
type GroupCells = {
  tiers: ReadonlyArray<Tier>
  cells: ReadonlyArray<GroupCell>
  reach: number
}

/** Where a pinned column's cells stick: the edge, and how far from it (a CSS length). */
type CellPin = { side: "start" | "end"; offset: string }

function pinStyle(pin: CellPin): React.CSSProperties {
  return pin.side === "start"
    ? { insetInlineStart: pin.offset }
    : { insetInlineEnd: pin.offset }
}

/**
 * A pinned body cell: over the cells scrolled under it, in its row's fill
 * (a row header's own transparent fill too). It covers its part of the
 * focused row's outline, so it draws that part: the ring along its top and
 * bottom, and on the row's first and last cell its outer side.
 */
const pinnedCellClassName = cn(
  "sticky z-[1] bg-inherit [&[scope=row]]:bg-inherit",
  "[tr:focus-visible>&]:shadow-[inset_0_2px_0_var(--color-ring),inset_0_-2px_0_var(--color-ring)]",
  "[tr:focus-visible>&:first-child]:shadow-[inset_0_2px_0_var(--color-ring),inset_0_-2px_0_var(--color-ring),inset_2px_0_0_var(--color-ring)]",
  "rtl:[tr:focus-visible>&:first-child]:shadow-[inset_0_2px_0_var(--color-ring),inset_0_-2px_0_var(--color-ring),inset_-2px_0_0_var(--color-ring)]",
  "[tr:focus-visible>&:last-child]:shadow-[inset_0_2px_0_var(--color-ring),inset_0_-2px_0_var(--color-ring),inset_-2px_0_0_var(--color-ring)]",
  "rtl:[tr:focus-visible>&:last-child]:shadow-[inset_0_2px_0_var(--color-ring),inset_0_-2px_0_var(--color-ring),inset_2px_0_0_var(--color-ring)]"
)

/** A pinned header cell: over the other header cells and their resizers. */
const pinnedHeadClassName = "sticky z-20"

/** A row with pinned cells is opaque, for its cells to take its fill. */
const pinnedRowClassName = "bg-[var(--surface,var(--color-background))]"

/**
 * Every body cell of a table with pinned columns: the row's border, drawn
 * by the cell (but on the last row) in the table's separate borders.
 */
const cellBorderClassName =
  "border-b border-border-subtle [tr:last-child>&]:border-b-0"

/** Each tree level is indented by the width of a chevron and its gap. */
const INDENT = 1.25

const ALIGN = {
  start: undefined,
  center: "text-center",
  end: "text-end",
} as const

/** Written out whole, so Tailwind finds them. */
const HIDE_BELOW = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const

function sameSide(a: CellPin | undefined, b: CellPin | undefined) {
  return a?.side === b?.side
}

const RANK = { base: 0, sm: 1, md: 2, lg: 3 } as const

/** Written out whole, so Tailwind finds them: a cell's display from a breakpoint on. */
const DISPLAY = {
  sm: { shown: "sm:table-cell", hidden: "sm:hidden" },
  md: { shown: "md:table-cell", hidden: "md:hidden" },
  lg: { shown: "lg:table-cell", hidden: "lg:hidden" },
} as const

/** The classes that lay a cell out only at the tiers it is `shown` at. */
function shownClassName(
  tiers: ReadonlyArray<Tier>,
  shown: ReadonlyArray<boolean>
) {
  if (shown.every(Boolean)) return undefined
  return cn(
    !shown[0] && "hidden",
    tiers.map((tier, index) =>
      tier === "base" || shown[index] === shown[index - 1]
        ? undefined
        : DISPLAY[tier][shown[index] ? "shown" : "hidden"]
    )
  )
}

/** Where the group rows of these columns put their label (`GroupCells`). */
function groupCellsOf<T>(
  columns: ReadonlyArray<EngineColumn<T>>,
  pins: ReadonlyArray<CellPin | undefined>
): GroupCells {
  const tiers: Array<Tier> = ["base"]
  for (const tier of ["sm", "md", "lg"] as const)
    if (columns.some((column) => column.definition.hideBelow === tier))
      tiers.push(tier)
  const visible = (index: number, tier: Tier) => {
    const below = columns[index].definition.hideBelow
    return !below || RANK[below] <= RANK[tier]
  }
  const sums = (index: number) => columns[index].aggregate !== null
  // At each tier: where the label is, and the columns it covers.
  const labels: Array<{ column: number; span: number; subtotal: boolean }> = []
  const covered = tiers.map((tier) => {
    const shown = columns.flatMap((_, index) =>
      visible(index, tier) ? [index] : []
    )
    const start = shown.find((index) => !sums(index))
    const label =
      start === undefined
        ? { column: shown[0] ?? 0, span: 1, subtotal: true }
        : { column: start, span: 1, subtotal: false }
    const cover = [label.column]
    if (!label.subtotal)
      for (const index of shown.slice(shown.indexOf(label.column) + 1)) {
        if (sums(index) || !sameSide(pins[index], pins[label.column])) break
        cover.push(index)
      }
    label.span = cover.length
    labels.push(label)
    return new Set(cover)
  })
  // The label in the first column may run on over the empty columns that
  // scroll after it (pinned columns stay, hidden ones take no room).
  let reach = 0
  if (pins[0]?.side === "start" && columns.length > 0 && !sums(0)) {
    let end = 1
    while (
      end < columns.length &&
      !sums(end) &&
      (pins[end] === undefined || pins[end]?.side === "start")
    )
      end++
    // Only past the pinned columns: within them, the label's own cell.
    for (let index = 1; index < end; index++)
      if (pins[index] === undefined) reach = end
  }
  const cells: Array<GroupCell> = []
  columns.forEach((_, index) => {
    // The label cells that start here, one per place it takes.
    const here = new Map<string, Array<boolean>>()
    labels.forEach((label, tier) => {
      if (label.column !== index) return
      const key = `${label.span}:${label.subtotal}`
      const shown = here.get(key) ?? tiers.map(() => false)
      shown[tier] = true
      here.set(key, shown)
    })
    for (const shown of here.values()) {
      const label = labels[shown.indexOf(true)]
      cells.push({
        kind: "label",
        ...label,
        reach: reach > 0 && index === 0 && !label.subtotal,
        shown,
      })
    }
    const own = tiers.map(
      (tier, at) => visible(index, tier) && !covered[at].has(index)
    )
    if (own.some(Boolean))
      cells.push({ kind: "column", column: index, shown: own })
  })
  return { tiers, cells, reach }
}

/**
 * The frame's variables for the group rows' label: the width of the
 * columns it may cover (`GroupCells.reach`), from the columns' fixed
 * widths (none for a column hidden at this width); none when it keeps to
 * its cell.
 */
function groupLabelWidth(
  cells: GroupCells,
  widths: ReadonlyArray<number> | undefined
): Record<string, string> | undefined {
  if (cells.reach === 0 || !widths) return undefined
  const width = widths.slice(0, cells.reach).reduce((sum, at) => sum + at, 0)
  return { "--data-table-group-label": `${width}px` }
}

/** A column's alignment and breakpoint, for its header and its cells. */
function columnClassName<T>(column: EngineColumn<T>) {
  const { hideBelow } = column.definition
  return cn(ALIGN[column.align], hideBelow && HIDE_BELOW[hideBelow])
}

function bodyClassName<T>(
  column: EngineColumn<T>,
  pin: CellPin | undefined,
  shared: RowShared<T>
) {
  return cn(
    columnClassName(column),
    column.type === "number" && "tabular-nums",
    shared.fixed && "overflow-hidden text-ellipsis",
    shared.pinned && cellBorderClassName,
    shared.wrap && column.definition.wrap && "whitespace-normal",
    pin && pinnedCellClassName
  )
}

/** The cell's content: the column's `cell`, or its type's display. */
function cellContent<T>(
  column: EngineColumn<T>,
  row: ItemRow<T>,
  formatter: Formatter<T>
): React.ReactNode {
  const value = column.getValue(row.item)
  const text = formatter.format(column, value)
  const { cell } = column.definition
  if (cell)
    return cell(row.item, {
      id: row.id,
      column: column.id,
      value,
      text,
      depth: row.depth,
    })
  if (text === "") return null
  switch (column.type) {
    case "boolean":
      // `true`, or a value that reads as it ("true", 1).
      return text === formatter.format(column, true) ? (
        <>
          <CheckIcon aria-hidden className="inline size-4" />
          <span className="sr-only">{text}</span>
        </>
      ) : (
        <span className="sr-only">{text}</span>
      )
    case "options": {
      const index = column.optionIndex.get(String(value))
      const option = index === undefined ? undefined : column.options[index]
      return (
        <Badge variant={option?.variant ?? "outline"} appearance="outline">
          {text}
        </Badge>
      )
    }
    default:
      return text
  }
}

/**
 * The chevron (or its space) and indent before a tree row's header, the
 * chevron of a row with a detail row (`indent` off), or the indent of a
 * row in groups.
 */
function TreeIndent<T>({
  row,
  actions,
  indent,
  spacer,
  children,
}: {
  row: ItemRow<T>
  actions: DataTableActions<T>
  indent: boolean
  /** A row without a chevron keeps its space (a tree's leaf, beside its siblings). */
  spacer: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-1"
      style={
        indent ? { paddingInlineStart: `${row.depth * INDENT}rem` } : undefined
      }
    >
      {row.loading ? (
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center text-muted-foreground"
        >
          <Spinner />
        </span>
      ) : row.expandable ? (
        // For the pointer: the row says whether it is expanded, and the
        // keyboard opens it with Right / Left.
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          data-slot="data-table-chevron"
          // Not focused by a press: its row is, and becomes the tab stop.
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.currentTarget.closest("tr")?.focus({ preventScroll: true })
            actions.setRowExpanded(
              row.id,
              !row.expanded,
              "item-press",
              event.nativeEvent
            )
          }}
          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground"
        >
          <ChevronRightIcon
            className={cn(
              "size-4 transition-transform rtl:-scale-x-100",
              row.expanded && "rotate-90 rtl:-rotate-90"
            )}
          />
        </button>
      ) : spacer ? (
        <span aria-hidden className="size-6 shrink-0" />
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

/** A row's plain text, for type-ahead and announcements: its row header's. */
function rowText<T>(item: T, shared: RowShared<T>) {
  return shared.rowHeader ? shared.formatter.text(shared.rowHeader, item) : ""
}

/** A body cell of an item row; `index` is the column's place in `shared.columns`. */
function renderCell<T>(
  column: EngineColumn<T>,
  index: number,
  row: ItemRow<T>,
  shared: RowShared<T>
): React.ReactNode {
  let content = cellContent(column, row, shared.formatter)
  const pin = shared.pins[index]
  const className = bodyClassName(column, pin, shared)
  const style = pin && pinStyle(pin)
  if (column !== shared.rowHeader)
    return (
      <TableCell key={column.id} className={className} style={style}>
        {content}
      </TableCell>
    )
  const href = shared.linked ? shared.actions.hrefOf(row.item) : undefined
  // A row disabled for everything is not followed either.
  if (href !== undefined)
    content = (
      // The link colour, and underlined: the colour alone is under 3:1
      // against the row's text in both themes, so the line tells it apart
      // without a hover (WCAG 1.4.1).
      <Link
        href={href}
        variant="primary"
        className="underline"
        data-slot="data-table-row-link"
        disabled={shared.disableRows && row.disabled}
      >
        {content}
      </Link>
    )
  if (shared.tree || shared.detail || shared.grouped)
    content = (
      <TreeIndent
        row={row}
        actions={shared.actions}
        indent={shared.tree || shared.grouped}
        // In groups, a row has no chevron of its own (nor its siblings):
        // only its level's indent, the name's room kept.
        spacer={shared.tree}
      >
        {content}
      </TreeIndent>
    )
  // A row header takes the look of its row's cells (the table's own).
  return (
    <TableHead key={column.id} scope="row" className={className} style={style}>
      {content}
    </TableHead>
  )
}

export {
  ALIGN,
  cellBorderClassName,
  cellContent,
  columnClassName,
  groupCellsOf,
  groupLabelWidth,
  HIDE_BELOW,
  INDENT,
  pinnedCellClassName,
  pinnedHeadClassName,
  pinnedRowClassName,
  pinStyle,
  renderCell,
  rowText,
  shownClassName,
}
export type {
  CellPin,
  DetailStore,
  GroupCell,
  GroupCells,
  GroupLabel,
  RowShared,
}
