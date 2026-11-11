/**
 * What a cell shows apart from its value, read as the rows render (§7: up
 * front, with the table): whether it can be written (`aria-readonly`, the
 * keys that would edit it), and the flags of its part in the cell
 * selection, which `cell.tsx` draws. The selection itself, and each row's
 * flags (`CellGrid.decode`), come from the code loaded on demand
 * (`engine/cells.ts`); a cell's message from the code that writes
 * (`cell-message.tsx`).
 */
import type { EngineColumn } from "./engine/columns"

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

/** A cell's part in the selection, as flags (`CellGrid.decode`). */
const SELECTED = 1
const TOP = 2
const BOTTOM = 4
const START = 8
const END = 16
/** Not known yet (a selection given, its code still to come): neither selected nor not. */
const UNKNOWN = -1

export { BOTTOM, END, isCellEditable, SELECTED, START, TOP, UNKNOWN }
