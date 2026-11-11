/**
 * The cells of a cell selection (`cells.ts`), read from their items: each
 * selected cell once (ranges that overlap share theirs), their number, and
 * the figures `DataTableCellSummary` shows. Group rows inside a range are
 * passed over, and so are the columns hidden below the window's
 * breakpoint. The count and the summary are kept per selection (`CellGrid`):
 * reading them again costs nothing. Kept apart from `cells.ts` (what the rows read to draw the
 * selection), so a table that never walks its cells up front (no summary;
 * the code that copies and writes loads on demand) does not bundle this
 * with it.
 */
import type { CellGrid, CellRect } from "./cells"
import type { EngineColumn } from "./columns"
import type { EngineRow, ItemRow } from "./rows"
import { isEmptyValue, toNumber } from "./values"

/** Whether a cell is in a rect before `before` (cells counted once, in the first rect that has them). */
function inEarlier(
  rects: ReadonlyArray<CellRect>,
  before: number,
  row: number,
  column: number
) {
  for (let k = 0; k < before; k++) {
    const rect = rects[k]
    if (
      row >= rect.top &&
      row <= rect.bottom &&
      column >= rect.first &&
      column <= rect.last
    )
      return true
  }
  return false
}

/**
 * Calls `visit` for each selected cell of an item row, once each (ranges
 * that overlap count their shared cells once), range by range, row by row.
 */
function forEachCell<T>(
  grid: CellGrid<T>,
  visit: (
    row: ItemRow<T>,
    column: EngineColumn<T>,
    rowIndex: number,
    columnIndex: number
  ) => void
) {
  const { rects, rows, columns, skip } = grid
  rects.forEach((rect, k) => {
    for (let r = rect.top; r <= rect.bottom; r++) {
      const row = rows[r]
      if (row.kind !== "item") continue
      for (let c = rect.first; c <= rect.last; c++) {
        if (skip?.[c] === 1) continue
        if (k > 0 && inEarlier(rects, k, r, c)) continue
        visit(row, columns[c], r, c)
      }
    }
  })
}

/** The item rows' indices in `[top, bottom]`. */
function itemRowsIn<T>(
  rows: ReadonlyArray<EngineRow<T>>,
  top: number,
  bottom: number
) {
  const indices: Array<number> = []
  for (let r = top; r <= bottom; r++)
    if (rows[r]?.kind === "item") indices.push(r)
  return indices
}

const counts = new WeakMap<object, number>()

/** The number of selected cells, each counted once. */
function cellCount<T>(grid: CellGrid<T>) {
  const count = counts.get(grid)
  if (count !== undefined) return count
  const { rects, rows, skip } = grid
  let total = 0
  // Without group rows (a flat list, a tree), one rect is its area.
  if (rects.length === 1 && grid.model.groupKeys().length === 0) {
    const [rect] = rects
    let across = 0
    for (let c = rect.first; c <= rect.last; c++) if (skip?.[c] !== 1) across++
    total = (rect.bottom - rect.top + 1) * across
  } else
    rects.forEach((rect, k) => {
      for (const r of itemRowsIn(rows, rect.top, rect.bottom))
        for (let c = rect.first; c <= rect.last; c++)
          if (skip?.[c] !== 1 && (k === 0 || !inEarlier(rects, k, r, c)))
            total++
    })
  counts.set(grid, total)
  return total
}

/** What `DataTableCellSummary` shows of the selected cells. */
type CellSummary<T> = {
  /** The cells with a value (`false` too). */
  count: number
  /** The cells of number columns with a number. */
  numericCount: number
  /** Their sum; `null` without any. */
  sum: number | null
  /** Their mean; `null` without any. */
  average: number | null
  /** The number columns the numbers came from, in order. */
  numberColumns: ReadonlyArray<EngineColumn<T>>
}

const summaries = new WeakMap<object, CellSummary<never>>()

/** Counts and sums the selected cells, from their items. */
function summarizeCells<T>(grid: CellGrid<T>): CellSummary<T> {
  const known = summaries.get(grid) as CellSummary<T> | undefined
  if (known) return known
  let count = 0
  let numericCount = 0
  let sum = 0
  const numberColumns = new Set<EngineColumn<T>>()
  forEachCell(grid, (row, column) => {
    const value = column.getValue(row.item)
    if (isEmptyValue(value)) return
    count++
    if (column.type !== "number") return
    const number = toNumber(value)
    if (number === undefined) return
    numericCount++
    sum += number
    numberColumns.add(column)
  })
  const summary: CellSummary<T> = {
    count,
    numericCount,
    sum: numericCount ? sum : null,
    average: numericCount ? sum / numericCount : null,
    numberColumns: [...numberColumns],
  }
  summaries.set(grid, summary)
  return summary
}

export { cellCount, forEachCell, itemRowsIn, summarizeCells }
export type { CellSummary }
