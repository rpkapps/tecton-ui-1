/**
 * The columns as a view shows them: which are shown, in what order, which
 * are pinned, how wide, and the header rows over them. Shown columns are
 * the pinned-start ones, the others, then the pinned-end ones, each in the
 * order of `view.columns.order` (pinning moves a column to a side; the
 * order within a side is still the view's order).
 */
import {
  buildHeaderRows,
  getColumnModel,
  type EngineColumn,
  type HeaderRow,
} from "./columns"
import type { DataTableColumns, DataTableView } from "./types"

type ColumnLayout<T> = {
  /** The shown columns, in display order. */
  readonly columns: ReadonlyArray<EngineColumn<T>>
  /** How many of `columns` are pinned to the start, and to the end. */
  readonly pinnedStart: number
  readonly pinnedEnd: number
  readonly hidden: ReadonlyArray<EngineColumn<T>>
  /**
   * The row header column: the model's when shown, else the next column
   * shown in the view's order.
   */
  readonly rowHeader: string | undefined
  readonly headerRows: ReadonlyArray<HeaderRow>
  /** The column's width in px: the view's, else its own `width`. */
  width: (column: string) => number | undefined
}

// By the view's columns, then the columns: tables sharing module-level
// columns each keep their own layout.
const layouts = new WeakMap<object, WeakMap<object, ColumnLayout<never>>>()

/** The layout of `view.columns` (kept while `columns` and `view.columns` stay the same objects). */
function layoutColumns<T>(
  columns: DataTableColumns<T>,
  view: Pick<DataTableView, "columns">
): ColumnLayout<T> {
  let byColumns = layouts.get(view.columns)
  if (!byColumns) layouts.set(view.columns, (byColumns = new WeakMap()))
  const cached = byColumns.get(columns)
  if (cached) return cached as ColumnLayout<T>
  const model = getColumnModel(columns)
  const { order, hidden, widths, pinned } = view.columns
  const hiddenIds = new Set(hidden)
  const start = new Set(pinned.start)
  const end = new Set(pinned.end)
  const ordered = order.flatMap((id) => model.byId.get(id) ?? [])
  const shown = ordered.filter((column) => !hiddenIds.has(column.id))
  const pinnedStart = shown.filter((column) => start.has(column.id))
  const pinnedEnd = shown.filter(
    (column) => end.has(column.id) && !start.has(column.id)
  )
  const middle = shown.filter(
    (column) => !start.has(column.id) && !end.has(column.id)
  )
  const display = [...pinnedStart, ...middle, ...pinnedEnd]
  const layout: ColumnLayout<T> = {
    columns: display,
    pinnedStart: pinnedStart.length,
    pinnedEnd: pinnedEnd.length,
    hidden: ordered.filter((column) => hiddenIds.has(column.id)),
    rowHeader: rowHeaderOf(model.rowHeader, ordered, hiddenIds),
    headerRows: buildHeaderRows(
      model,
      display.map((column) => column.id),
      // Pinned columns never share a group's header with the others.
      display.map((_, index) =>
        index < pinnedStart.length
          ? "start"
          : index >= display.length - pinnedEnd.length
            ? "end"
            : ""
      )
    ),
    width: (id) =>
      Object.hasOwn(widths, id) ? widths[id] : model.byId.get(id)?.width,
  }
  byColumns.set(columns, layout)
  return layout
}

/**
 * The row header column: the model's, or while it is hidden the next one
 * shown in the view's order (the one before it when it is the last).
 */
function rowHeaderOf<T>(
  rowHeader: string | undefined,
  ordered: ReadonlyArray<EngineColumn<T>>,
  hidden: ReadonlySet<string>
) {
  if (rowHeader === undefined || !hidden.has(rowHeader)) return rowHeader
  const at = ordered.findIndex((column) => column.id === rowHeader)
  const shown = (column: EngineColumn<T>) => !hidden.has(column.id)
  return (
    ordered.slice(at + 1).find(shown) ??
    ordered.slice(0, at).reverse().find(shown)
  )?.id
}

export { layoutColumns }
export type { ColumnLayout }
