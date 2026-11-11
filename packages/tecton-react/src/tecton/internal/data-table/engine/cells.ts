/**
 * The cell selection (§5.8) over the rows and columns as they are shown.
 * A range names its rows and its columns by id, each axis either between
 * two corners or, left out, whole:
 *
 * - `{ rows, columns }`: the rectangle between two cells. It is positional,
 *   as in a spreadsheet: after a sort, a filter or new data it covers the
 *   rows now between its corner rows (and likewise for columns).
 * - `{ rows }`: whole rows (Shift + Space), every column shown, whichever
 *   columns there are; `{ columns }`: whole columns (Ctrl + Space), every row
 *   shown, whatever the sort, filters or data; `{}`: every cell (Ctrl + A).
 *
 * - The rows are the body's rows in display order, on every page
 *   (`DataTableRowModel.allRows`). Group rows between a range's rows are
 *   passed over (not cells of data): not selected, copied, summed or
 *   written. Rows not shown (in a closed group or tree row, filtered out)
 *   are not in a range.
 * - The columns are the view's shown columns in display order
 *   (`ColumnLayout.columns`), but those hidden below the breakpoint the
 *   window is at (`hideBelow`): those are passed over like group rows.
 * - A corner column the view hides is placed where the view's order puts
 *   it among the shown ones: the range keeps the shown columns between its
 *   corners. A range whose corner row is not shown (filtered out, in a
 *   closed group), or that keeps no column, is set aside while it is: not
 *   drawn, copied or summed. It is still in the selection, and comes back
 *   with its rows or columns.
 *
 * Nothing here reads the DOM: the cells of rows out of view are read from
 * their items (`cell-ranges.ts` walks, counts and sums them).
 */
import type { EngineColumn } from "./columns"
import type { DataTableRowModel } from "./engine"
import type { EngineRow } from "./rows"
import type { DataTableCellRange } from "./types"

/** A range in the order shown: body row indices (`allRows`) and column indices, inclusive. */
type CellRect = {
  readonly top: number
  readonly bottom: number
  readonly first: number
  readonly last: number
}

/** The cell selection, resolved against the rows and columns shown. */
type CellGrid<T> = {
  readonly ranges: ReadonlyArray<DataTableCellRange>
  /** The ranges in effect, in their order (those set aside left out). */
  readonly rects: ReadonlyArray<CellRect>
  readonly rows: ReadonlyArray<EngineRow<T>>
  /** The columns shown, in display order (as the rows render them). */
  readonly columns: ReadonlyArray<EngineColumn<T>>
  /** Per column of `columns`, 1 for one hidden below the window's breakpoint; `null` for none. */
  readonly skip: Uint8Array | null
  /** Those columns' indices, as text (`decodeMarks`): the same while they are. */
  readonly skipped: string
  readonly model: DataTableRowModel<T>
  /** A column's index among those shown; -1 when hidden. */
  columnIndex: (id: string) => number
  /** The first and last item rows shown (indices into `rows`); `null` without any. */
  itemRows: () => { first: number; last: number } | null
  /** The first and last columns that hold cells (indices into `columns`); `null` without any. */
  cellColumns: () => { first: number; last: number } | null
  /**
   * What a row's cells show of the selection, as text that is the same
   * while they show the same (`""` for none): what a row re-renders on.
   * `decodeMarks` reads it.
   */
  rowMarks: (id: string) => string
  /** Other ranges, resolved the same way. */
  resolve: (ranges: ReadonlyArray<DataTableCellRange>) => CellGrid<T>
}

/** A cell's part in the selection, as flags (`decodeMarks`). */
const SELECTED = 1
const TOP = 2
const BOTTOM = 4
const START = 8
const END = 16

const NO_RECTS: ReadonlyArray<CellRect> = []

type ResolveOptions = {
  /** Every leaf column in the view's order, hidden ones included (`view.columns.order`). */
  order: ReadonlyArray<string>
  /** The shown columns hidden below the window's breakpoint, by id. */
  hiddenBelow?: ReadonlySet<string>
}

/**
 * Every column in display order, the hidden ones each after the shown
 * column before it in the view's order: where a hidden corner column is.
 */
function fullOrder(shown: ReadonlyArray<string>, order: ReadonlyArray<string>) {
  const isShown = new Set(shown)
  const after = new Map<string, Array<string>>()
  let previous = ""
  for (const id of order) {
    if (isShown.has(id)) {
      previous = id
      continue
    }
    const list = after.get(previous) ?? []
    list.push(id)
    after.set(previous, list)
  }
  const ids = [...(after.get("") ?? [])]
  for (const id of shown) ids.push(id, ...(after.get(id) ?? []))
  return new Map(ids.map((id, index) => [id, index]))
}

function resolveCells<T>(
  ranges: ReadonlyArray<DataTableCellRange>,
  model: DataTableRowModel<T>,
  columns: ReadonlyArray<EngineColumn<T>>,
  options: ResolveOptions
): CellGrid<T> {
  const { order, hiddenBelow } = options
  const rows = model.allRows
  let byId: Map<string, number> | undefined
  const columnIndex = (id: string) => {
    byId ??= new Map(columns.map((column, index) => [column.id, index]))
    return byId.get(id) ?? -1
  }
  const below = columns.flatMap((column, index) =>
    hiddenBelow?.has(column.id) ? [index] : []
  )
  const skip = below.length ? new Uint8Array(columns.length) : null
  for (const index of below) if (skip) skip[index] = 1
  const holds = (index: number) => skip?.[index] !== 1
  const rowIndex = (id: string) => {
    const index = model.indexOfRow(id)
    return index >= 0 && rows[index]?.kind === "item" ? index : -1
  }
  let items: { first: number; last: number } | null | undefined
  const itemRows = () => {
    if (items !== undefined) return items
    let first = 0
    while (first < rows.length && rows[first].kind !== "item") first++
    let last = rows.length - 1
    while (last > first && rows[last].kind !== "item") last--
    items = first < rows.length ? { first, last } : null
    return items
  }
  let cells: { first: number; last: number } | null | undefined
  const cellColumns = () => {
    if (cells !== undefined) return cells
    let first = 0
    while (first < columns.length && !holds(first)) first++
    let last = columns.length - 1
    while (last > first && !holds(last)) last--
    cells = first < columns.length ? { first, last } : null
    return cells
  }
  let full: Map<string, number> | undefined
  /** The shown columns between two corner columns, as display indices of the first and last that hold cells. */
  const columnSpan = (start: string, end: string) => {
    full ??= fullOrder(
      columns.map((column) => column.id),
      order
    )
    const a = full.get(start)
    const b = full.get(end)
    if (a === undefined || b === undefined) return null
    const [low, high] = a < b ? [a, b] : [b, a]
    let first = -1
    let last = -1
    columns.forEach((column, index) => {
      const at = full?.get(column.id) ?? -1
      if (at < low || at > high || !holds(index)) return
      if (first < 0) first = index
      last = index
    })
    return first < 0 ? null : { first, last }
  }

  const rects: Array<CellRect> = []
  for (const range of ranges) {
    let top: number
    let bottom: number
    if (range.rows) {
      const a = rowIndex(range.rows.start)
      const b = rowIndex(range.rows.end)
      if (a < 0 || b < 0) continue
      ;[top, bottom] = a < b ? [a, b] : [b, a]
    } else {
      const whole = itemRows()
      if (!whole) continue
      ;({ first: top, last: bottom } = whole)
    }
    const span = range.columns
      ? columnSpan(range.columns.start, range.columns.end)
      : cellColumns()
    if (!span) continue
    rects.push({ top, bottom, first: span.first, last: span.last })
  }
  const resolved = rects.length ? rects : NO_RECTS
  return {
    ranges,
    rects: resolved,
    rows,
    columns,
    skip,
    skipped: below.join(","),
    model,
    columnIndex,
    itemRows,
    cellColumns,
    resolve: (others) => resolveCells(others, model, columns, options),
    rowMarks: (id) => {
      if (resolved.length === 0) return ""
      const index = rowIndex(id)
      if (index < 0) return ""
      let marks = ""
      for (const rect of resolved) {
        if (index < rect.top || index > rect.bottom) continue
        marks += `${marks ? "|" : ""}${rect.first}-${rect.last}${index === rect.top ? "t" : ""}${index === rect.bottom ? "b" : ""}`
      }
      return marks
    },
  }
}

/**
 * Each column's flags (`SELECTED`, `TOP`…) from a row's marks; `null` for
 * none. The columns `skipped` (`CellGrid.skipped`) hold no selected cell.
 */
function decodeMarks(
  marks: string,
  columns: number,
  skipped = ""
): Uint8Array | null {
  if (!marks) return null
  const flags = new Uint8Array(columns)
  const skip = new Set(skipped ? skipped.split(",").map(Number) : [])
  for (const part of marks.split("|")) {
    const match = /^(\d+)-(\d+)(t?)(b?)$/.exec(part)
    if (!match) continue
    const first = Number(match[1])
    const last = Math.min(Number(match[2]), columns - 1)
    for (let column = first; column <= last; column++) {
      if (skip.has(column)) continue
      let flag = flags[column] | SELECTED
      if (match[3]) flag |= TOP
      if (match[4]) flag |= BOTTOM
      if (column === first) flag |= START
      if (column === last) flag |= END
      flags[column] = flag
    }
  }
  return flags
}

export { BOTTOM, decodeMarks, END, resolveCells, SELECTED, START, TOP }
export type { CellGrid, CellRect, ResolveOptions }
