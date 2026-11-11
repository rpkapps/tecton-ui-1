/**
 * The cell selection (§5.8) over the rows and columns as they are shown:
 * ranges are kept by row id and column id (so they hold across a sort, a
 * scroll, virtualization and a column moving), and each is a rectangle in
 * the order shown now, between its corners.
 *
 * - The rows are the body's rows in display order, on every page
 *   (`DataTableRowModel.allRows`): a range covers the item rows between its
 *   corners. Group rows between them are passed over (not cells of data):
 *   they are not selected, copied, summed or written. Rows not shown (in a
 *   closed group or tree row, filtered out) are not in the range.
 * - The columns are the view's shown columns in display order
 *   (`ColumnLayout.columns`: pinned at the start, the others, pinned at the
 *   end).
 * - A range whose corner row is not shown (filtered out, in a closed group)
 *   or whose corner column is hidden is set aside while it is: not drawn,
 *   copied or summed. It is still in the selection, and comes back with
 *   its row or column.
 * - After a sort or a change of grouping, a range covers the rows now
 *   between its corners.
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
  readonly columns: ReadonlyArray<EngineColumn<T>>
  readonly model: DataTableRowModel<T>
  /** A column's index among those shown; -1 when hidden. */
  columnIndex: (id: string) => number
  /**
   * What a row's cells show of the selection, as text that is the same
   * while they show the same (`""` for none): what a row re-renders on.
   * `decodeMarks` reads it.
   */
  rowMarks: (id: string) => string
}

/** A cell's part in the selection, as flags (`decodeMarks`). */
const SELECTED = 1
const TOP = 2
const BOTTOM = 4
const START = 8
const END = 16

const NO_RECTS: ReadonlyArray<CellRect> = []

function resolveCells<T>(
  ranges: ReadonlyArray<DataTableCellRange>,
  model: DataTableRowModel<T>,
  columns: ReadonlyArray<EngineColumn<T>>
): CellGrid<T> {
  const rows = model.allRows
  let byId: Map<string, number> | undefined
  const columnIndex = (id: string) => {
    byId ??= new Map(columns.map((column, index) => [column.id, index]))
    return byId.get(id) ?? -1
  }
  const rowIndex = (id: string) => {
    const index = model.indexOfRow(id)
    return index >= 0 && rows[index]?.kind === "item" ? index : -1
  }
  const rects: Array<CellRect> = []
  for (const range of ranges) {
    const a = rowIndex(range.start.row)
    const b = rowIndex(range.end.row)
    const c = columnIndex(range.start.column)
    const d = columnIndex(range.end.column)
    if (a < 0 || b < 0 || c < 0 || d < 0) continue
    rects.push({
      top: Math.min(a, b),
      bottom: Math.max(a, b),
      first: Math.min(c, d),
      last: Math.max(c, d),
    })
  }
  const resolved = rects.length ? rects : NO_RECTS
  return {
    ranges,
    rects: resolved,
    rows,
    columns,
    model,
    columnIndex,
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

/** Each column's flags (`SELECTED`, `TOP`…) from a row's marks; `null` for none. */
function decodeMarks(marks: string, columns: number): Uint8Array | null {
  if (!marks) return null
  const flags = new Uint8Array(columns)
  for (const part of marks.split("|")) {
    const match = /^(\d+)-(\d+)(t?)(b?)$/.exec(part)
    if (!match) continue
    const first = Number(match[1])
    const last = Math.min(Number(match[2]), columns - 1)
    for (let column = first; column <= last; column++) {
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
export type { CellGrid, CellRect }
