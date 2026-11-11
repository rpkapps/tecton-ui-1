/**
 * What a cell can be and shows apart from its value, read as the rows
 * render: whether it can be written (`aria-readonly`, the keys that would
 * edit it), and whether its message (not valid, not saved) still holds.
 * The writes themselves are `cell-write.ts`'s, loaded on demand.
 */
import type { CellMark } from "./context"
import type { EngineColumn } from "./engine/columns"
import type { DataTableValue } from "./engine/types"
import { isEmptyValue } from "./engine/values"

/**
 * Whether a column's cell of an item can be written: the root's
 * `editable` on, the column not opted out (`editable: false`, or its
 * function `false` for the item), the row not disabled.
 */
function isCellEditable<T>(
  editable: boolean,
  column: EngineColumn<T>,
  item: T,
  disabled: boolean
) {
  if (!editable || disabled) return false
  const own = column.definition.editable
  if (own === false) return false
  return typeof own === "function" ? own(item) : true
}

/** Whether two values are the same cell value (empty ones all alike, dates by time). */
function sameValue(a: DataTableValue, b: DataTableValue) {
  if (isEmptyValue(a) && isEmptyValue(b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return Object.is(a, b)
}

/**
 * A cell's mark as it shows with the cell's value now: a message holds
 * while the value is one it was given for, and is gone once the value
 * changes from outside.
 */
function shownMark(mark: CellMark | undefined, value: DataTableValue) {
  if (!mark?.error) return mark
  if (mark.values.some((held) => sameValue(held, value))) return mark
  return mark.pending === null ? undefined : { ...mark, error: null }
}

export { isCellEditable, sameValue, shownMark }
