/**
 * Column widths in px, for a table laid out with fixed widths (a table that
 * resizes or pins columns, or whose columns have widths): each shown
 * column's width, the table's (their sum), and where the pinned columns
 * stick.
 *
 * - A column's width is the view's, else its own `width`, else the width
 *   its content was measured at; within its bounds (`clampColumnWidth`).
 * - One column takes the space the others leave (the "filler": the last
 *   one not pinned, else the last; never one with a `maxWidth`), so the
 *   table fills its frame; it gets
 *   no width of its own in the table. Once the user has set its width it
 *   keeps it like the others (`stretches`), and the table may end short of
 *   its frame. Every pinned column keeps its exact width, so the pinned
 *   ones stack without gaps.
 * - A column hidden below a breakpoint (`hideBelow`) takes no width.
 * - Pinned columns stick at the sum of the widths before them (from their
 *   edge); the selection column comes first and sticks at the start while
 *   any column is pinned there.
 */
import {
  clampColumnWidth,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  type EngineColumn,
} from "./columns"
import type { ColumnLayout } from "./layout"

/** A column's width before it is measured (the server, a hidden table). */
const DEFAULT_COLUMN_WIDTH = 150
/** The widest a column's measured content makes it: long text truncates. */
const MAX_MEASURED_WIDTH = 400

type ColumnSizing = {
  /** Each shown column's width, in display order (the filler's least; 0 for one hidden below a breakpoint). */
  readonly widths: ReadonlyArray<number>
  /** The index of the column that takes the space left; -1 for none. */
  readonly filler: number
  /** The selection column's width, when there is one. */
  readonly selection: number | undefined
  /** Whether the selection column sticks at the start. */
  readonly selectionPinned: boolean
  /** The table's width: every column's, the selection column's included. */
  readonly total: number
  /** A pinned column's distance from its edge, by display index. */
  readonly offsets: ReadonlyArray<number | undefined>
  /** How far the pinned columns reach in from the start and from the end. */
  readonly start: number
  readonly end: number
}

type SizingOptions<T> = {
  /** Each column's width (`columnWidth`). */
  widthOf: (column: EngineColumn<T>) => number
  /** The selection column's width, when there is one. */
  selection: number | undefined
  /** Columns hidden below a breakpoint: no width, never the filler. */
  hidden?: (column: EngineColumn<T>) => boolean
  /** Whether the filler column stretches (the user has not set its width). */
  stretches?: (column: EngineColumn<T>) => boolean
}

/**
 * The width a column has: the view's or its own (`layout.width`), else its
 * measured content's, else the default; within its bounds.
 */
function columnWidth<T>(
  column: EngineColumn<T>,
  layout: Pick<ColumnLayout<T>, "width">,
  measured: Readonly<Partial<Record<string, number>>>
) {
  const given = layout.width(column.id)
  // 0: the column was not laid out when it was measured (hidden below a
  // breakpoint).
  const content = measured[column.id]
  const width =
    given ??
    (content ? Math.min(content, MAX_MEASURED_WIDTH) : DEFAULT_COLUMN_WIDTH)
  return clampColumnWidth(column.minWidth, column.maxWidth, width)
}

function sizeColumns<T>(
  layout: Pick<ColumnLayout<T>, "columns" | "pinnedStart" | "pinnedEnd">,
  {
    widthOf,
    selection,
    hidden = () => false,
    stretches = () => true,
  }: SizingOptions<T>
): ColumnSizing {
  const { columns } = layout
  const widths = columns.map((column) => (hidden(column) ? 0 : widthOf(column)))
  const count = widths.length
  const middleEnd = count - layout.pinnedEnd
  const shown = (index: number) => !hidden(columns[index])
  // The last column not pinned and shown, else the last one shown; never
  // one with a `maxWidth`, which it would stretch past.
  const free = (index: number) =>
    shown(index) && columns[index].maxWidth === undefined
  let candidate = -1
  for (let index = middleEnd - 1; index >= layout.pinnedStart; index--)
    if (free(index)) {
      candidate = index
      break
    }
  if (candidate < 0)
    for (let index = count - 1; index >= 0; index--)
      if (free(index)) {
        candidate = index
        break
      }
  const filler =
    candidate >= 0 && stretches(columns[candidate]) ? candidate : -1
  const selectionPinned = selection !== undefined && layout.pinnedStart > 0
  const offsets: Array<number | undefined> = widths.map(() => undefined)
  let start = selectionPinned ? selection : 0
  for (let index = 0; index < layout.pinnedStart; index++) {
    offsets[index] = start
    start += widths[index]
  }
  let end = 0
  for (let index = count - 1; index >= middleEnd; index--) {
    offsets[index] = end
    end += widths[index]
  }
  return {
    widths,
    filler,
    selection,
    selectionPinned,
    total: widths.reduce((sum, width) => sum + width, selection ?? 0),
    offsets,
    start: layout.pinnedStart > 0 ? start : 0,
    end,
  }
}

export {
  columnWidth,
  DEFAULT_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  sizeColumns,
}
export type { ColumnSizing, SizingOptions }
