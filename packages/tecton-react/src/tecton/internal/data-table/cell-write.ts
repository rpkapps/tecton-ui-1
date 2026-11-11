/**
 * The cell write pipeline (§5.8, and §5.9's editors after it): every write
 * of cells, whatever made it (a paste, Delete, fill down, an editor), goes
 * through `writeCells`, which
 *
 * 1. keeps the cells that can be written: the root's `editable` on, the
 *    column not opted out (`editable: false`, or its function `false` for
 *    the item), the row not disabled; the others are skipped;
 * 2. reads a pasted text as the column's value (`cell-parse.ts`, or the
 *    column's `parse`), and checks the value with the column's `validate`:
 *    a cell that fails is not written and shows its message;
 * 3. reports the cells whose value changes in one `onCellsChange(changes,
 *    { reason })` (a cell given its own value is written, not reported);
 * 4. while a promise it returned is pending, shows those cells as saving
 *    (dimmed, `aria-busy`), and if it rejects, as not saved, with the
 *    error's message (announced too).
 *
 * A cell shows a message (not valid, not saved) until it is written again.
 * What a cell shows is the `cells` store's `marks`, which its row reads.
 *
 * Loaded on demand, with the code that writes (`lazy.ts`).
 */
import { announce } from "../primitives/live-announcer"
import type { Translator } from "../i18n/translations"
import { parseCellText, type ParseMessages } from "./cell-parse"
import type { CellMark, CellsState, DataTableContextValue } from "./context"
import { getColumnModel, type EngineColumn } from "./engine/columns"
import type {
  DataTableCellChange,
  DataTableCellsChangeReason,
  DataTableValue,
} from "./engine/types"
import { isEmptyValue } from "./engine/values"

/** A cell to write: a value, or a text to read as the column's value. */
type CellWrite =
  | { row: string; column: string; value: DataTableValue }
  | { row: string; column: string; text: string }

/** What a write did. */
type WriteOutcome = {
  /** The cells written (given their value, changed or not). */
  written: number
  /** The cells that cannot be written. */
  skipped: number
  /** The cells whose value was not valid: their column's header and message, in order. */
  invalid: ReadonlyArray<{ column: string; message: string }>
  /** `onCellsChange` cancelled the write. */
  canceled: boolean
  /** Settles once the cells are saved (at once, without a promise); never rejects. */
  saved: Promise<void>
}

type WriteHost = {
  context: DataTableContextValue<unknown>
  t: Translator<"dataTable">
}

/** Whether a column's cell of a row can be written. */
function isCellEditable<T>(
  context: DataTableContextValue<T>,
  column: EngineColumn<T>,
  id: string,
  item: T
) {
  const { options, model } = context.store.get()
  if (!options.editable || model.isDisabled(id)) return false
  const { editable } = column.definition
  if (editable === false) return false
  return typeof editable === "function" ? editable(item) : true
}

function sameValue(a: DataTableValue, b: DataTableValue) {
  if (isEmptyValue(a) && isEmptyValue(b)) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return Object.is(a, b)
}

function parseMessages(t: Translator<"dataTable">): ParseMessages {
  return {
    invalid: t("invalidValue"),
    number: t("invalidNumber"),
    date: t("invalidDate"),
    boolean: t("invalidBoolean", { yes: t("yes"), no: t("no") }),
    option: t("invalidOption"),
  }
}

/** Sets the marks of cells (`null` removes one), one row's map at a time. */
function markCells(
  cells: DataTableContextValue<unknown>["cells"],
  updates: ReadonlyArray<{ row: string; column: string; mark: CellMark | null }>
) {
  if (updates.length === 0) return
  const before = cells.get().marks
  const marks = new Map(before)
  const rows = new Map<string, Map<string, CellMark>>()
  for (const { row, column, mark } of updates) {
    let own = rows.get(row)
    if (!own) {
      own = new Map(before.get(row))
      rows.set(row, own)
    }
    if (mark) own.set(column, mark)
    else own.delete(column)
  }
  for (const [row, own] of rows) {
    if (own.size) marks.set(row, own)
    else marks.delete(row)
  }
  cells.set({ marks })
}

let writes = 0

/** The message of a save's rejection, or the table's own. */
function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  return fallback
}

/** Writes cells (see the module comment). */
function writeCells(
  host: WriteHost,
  cells: ReadonlyArray<CellWrite>,
  reason: DataTableCellsChangeReason,
  event?: Event
): WriteOutcome {
  const { context, t } = host
  const state = context.store.get()
  const { model, formatter } = state
  const { byId } = getColumnModel(state.columns)
  const labels = { yes: t("yes"), no: t("no") }
  const messages = parseMessages(t)
  const changes: Array<DataTableCellChange<unknown>> = []
  const invalid: Array<{ column: string; message: string }> = []
  const marks: Array<{ row: string; column: string; mark: CellMark | null }> =
    []
  const marked = context.cells.get().marks
  const hasMark = (row: string, column: string) =>
    marked.get(row)?.has(column) === true
  let skipped = 0
  let written = 0
  for (const cell of cells) {
    const item = model.item(cell.row)
    const column = byId.get(cell.column)
    if (
      item === undefined ||
      !column ||
      !isCellEditable(context, column, cell.row, item)
    ) {
      skipped++
      continue
    }
    let value: DataTableValue
    if ("text" in cell) {
      const parsed = parseCellText(column, cell.text, item, {
        locale: formatter.locale,
        labels,
        messages,
      })
      if ("error" in parsed) {
        invalid.push({ column: column.header, message: parsed.error })
        marks.push({ ...cell, mark: { pending: null, error: parsed.error } })
        continue
      }
      value = parsed.value
    } else value = cell.value
    const message = column.definition.validate?.(value, item) ?? null
    if (message) {
      invalid.push({ column: column.header, message })
      marks.push({ ...cell, mark: { pending: null, error: message } })
      continue
    }
    written++
    const previousValue = column.getValue(item)
    if (sameValue(previousValue, value)) {
      if (hasMark(cell.row, cell.column)) marks.push({ ...cell, mark: null })
      continue
    }
    changes.push({
      id: cell.row,
      column: column.id,
      item,
      value,
      previousValue,
    })
  }
  const outcome = (canceled: boolean, saved: Promise<void>): WriteOutcome => ({
    written,
    skipped,
    invalid,
    canceled,
    saved,
  })
  if (changes.length === 0) {
    markCells(context.cells, marks)
    return outcome(false, Promise.resolve())
  }
  const { canceled, result } = context.actions.changeCells(
    changes,
    reason,
    event
  )
  if (canceled) return outcome(true, Promise.resolve())
  const thenable =
    typeof (result as PromiseLike<void> | undefined)?.then === "function"
      ? (result as PromiseLike<void>)
      : null
  const batch = ++writes
  for (const change of changes)
    marks.push({
      row: change.id,
      column: change.column,
      mark: thenable ? { pending: batch, error: null } : null,
    })
  markCells(context.cells, marks)
  if (!thenable) return outcome(false, Promise.resolve())
  // Each cell back from this write, unless a later one has it since.
  const settle = (error: string | null) => {
    const now = context.cells.get().marks
    markCells(
      context.cells,
      changes.flatMap((change) =>
        now.get(change.id)?.get(change.column)?.pending === batch
          ? [
              {
                row: change.id,
                column: change.column,
                mark: error ? { pending: null, error } : null,
              },
            ]
          : []
      )
    )
  }
  const saved = Promise.resolve(thenable).then(
    () => settle(null),
    (error: unknown) => {
      const message = messageOf(error, t("saveFailed"))
      settle(message)
      announce(
        t("cellsNotSaved", {
          count: changes.length,
          total: changes.length.toLocaleString(formatter.locale),
          message,
        }),
        { politeness: "assertive" }
      )
    }
  )
  return outcome(false, saved)
}

/** What a write did, in words: "Pasted 6 cells, 2 not editable, 1 not valid, Depth: …". */
function describeWrite(
  t: Translator<"dataTable">,
  locale: string,
  reason: DataTableCellsChangeReason,
  outcome: WriteOutcome
) {
  const number = (count: number) => count.toLocaleString(locale)
  const done =
    reason === "paste"
      ? "cellsPasted"
      : reason === "clear"
        ? "cellsCleared"
        : "cellsFilled"
  const parts = [
    t(done, { count: outcome.written, total: number(outcome.written) }),
  ]
  if (outcome.skipped)
    parts.push(
      t("cellsSkipped", {
        count: outcome.skipped,
        total: number(outcome.skipped),
      })
    )
  if (outcome.invalid.length) {
    parts.push(
      t("cellsInvalid", {
        count: outcome.invalid.length,
        total: number(outcome.invalid.length),
      })
    )
    const [first] = outcome.invalid
    parts.push(
      t("cellMessage", { columnName: first.column, message: first.message })
    )
  }
  return new Intl.ListFormat(locale, { type: "unit" }).format(parts)
}

export { describeWrite, isCellEditable, markCells, writeCells }
export type { CellWrite, WriteHost, WriteOutcome }
