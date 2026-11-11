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
 * indent, and is the row's link with `itemToHref`.
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

import type { DataTableActions } from "./context"
import type { EngineColumn, Formatter, ItemRow } from "./engine/index"

/** What every row of a table renders with; one object while none of it changes. */
type RowShared<T> = {
  /** The columns shown, in order. */
  columns: ReadonlyArray<EngineColumn<T>>
  /** The column that names the row. */
  rowHeader: EngineColumn<T> | undefined
  formatter: Formatter<T>
  /** A selection checkbox column comes first. */
  selection: boolean
  /** Rows have a level: a tree, or groups. */
  levelled: boolean
  tree: boolean
  /** `disabledBehavior="all"`: a disabled row is disabled in the grid too. */
  disableRows: boolean
  /** Row headers are links (`itemToHref`). */
  linked: boolean
  /** Columns may wrap: not in a virtualized table, whose rows are one height. */
  wrap: boolean
  /** Every column, the selection column included. */
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
  /** Columns are pinned: the row is opaque, each cell draws its border. */
  pinned: boolean
  actions: DataTableActions<T>
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

/** The chevron (or its space) and indent before a tree row's header. */
function TreeIndent<T>({
  row,
  actions,
  children,
}: {
  row: ItemRow<T>
  actions: DataTableActions<T>
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-1"
      style={{ paddingInlineStart: `${row.depth * INDENT}rem` }}
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
          onClick={(event) =>
            actions.setRowExpanded(
              row.id,
              !row.expanded,
              "item-press",
              event.nativeEvent
            )
          }
          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground"
        >
          <ChevronRightIcon
            className={cn(
              "size-4 transition-transform rtl:-scale-x-100",
              row.expanded && "rotate-90 rtl:-rotate-90"
            )}
          />
        </button>
      ) : (
        <span aria-hidden className="size-6 shrink-0" />
      )}
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
  if (shared.tree)
    content = (
      <TreeIndent row={row} actions={shared.actions}>
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
  cellBorderClassName,
  cellContent,
  columnClassName,
  pinnedCellClassName,
  pinnedHeadClassName,
  pinnedRowClassName,
  pinStyle,
  renderCell,
  rowText,
}
export type { CellPin, RowShared }
