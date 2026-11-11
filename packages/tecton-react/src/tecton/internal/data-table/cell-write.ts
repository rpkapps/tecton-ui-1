/**
 * The cell write pipeline (§5.8, and §5.9's editors after it): every write
 * of cells, whatever made it (a paste, Delete, fill down, an editor), goes
 * through `writeCells`, which
 *
 * 1. keeps the cells that can be written (`isCellEditable`); the others
 *    are skipped;
 * 2. reads a pasted text as the column's value (`cell-parse.ts`, or the
 *    column's `parse`), and checks the value with the column's `validate`:
 *    a cell that fails is not written, and (unless the caller shows the
 *    message itself, an editor: `markInvalid: false`) shows its message;
 * 3. reports the cells whose value changes in one `onCellsChange(changes,
 *    { reason, signal, cancel })` (a cell given its own value is written,
 *    not reported). `cancel()` counts only when called before the handler
 *    returns: a write cancelled then shows nothing; later, it is the
 *    promise's to reject;
 * 4. while a promise it returned is pending, shows those cells as saving
 *    (dimmed, `aria-busy`), and if it rejects (or the handler throws), as
 *    not saved, with the error's message (announced too).
 *
 * A later write that takes over a cell of a write still saving makes that
 * cell the later write's, and aborts the earlier write's `signal` (one
 * cell is enough: a request can be cancelled; its other cells are still
 * its own). When the earlier write's promise rejects, the cells it still
 * has show its message; those taken over show the later write's state,
 * and the result lists them (`superseded`). An application rolls back
 * compare-and-set (only a cell whose value is still the one it wrote), so
 * a cell taken over keeps its later value.
 * A message shows until the cell is written again, its value changes from
 * outside (`shownMark`), or `clearCellMessages`.
 *
 * The result says what became of each cell, and `saved` settles (never
 * rejects) with whether the save succeeded: what an editor needs to close,
 * or to stay open with the error. Loaded on demand, with the code that
 * writes (`lazy.ts`).
 */
import { announce } from "../primitives/live-announcer"
import type { Translator } from "../i18n/translations"
import { isCellEditable } from "./cell-marks"
import { sameValue, WRITER } from "./cell-message"
import { parseCellText, type ParseMessages } from "./cell-parse"
import type { CellMark, DataTableContextValue } from "./context"
import { getColumnModel } from "./engine/columns"
import type {
  DataTableCellChange,
  DataTableCellsChangeReason,
  DataTableValue,
} from "./engine/types"

/** A cell to write: a value, or a text to read as the column's value. */
type CellWrite =
  | {
      row: string
      column: string
      value: DataTableValue
      /** What the user typed for the value (an editor's text), shown with a message; else the value formatted. */
      attempted?: string
    }
  | { row: string; column: string; text: string }

/** What became of a cell given to `writeCells`. */
type CellWriteResult = {
  row: string
  column: string
  /**
   * `changed`: reported to `onCellsChange`; `unchanged`: written with its
   * own value; `skipped`: cannot be written; `invalid`: refused (`message`).
   */
  status: "changed" | "unchanged" | "skipped" | "invalid"
  /** The value written (read from the text); `undefined` for a cell not written. */
  value: DataTableValue
  message: string | null
}

/** A cell, by row id and column id. */
type CellAt = { row: string; column: string }

/**
 * How a save settled. `superseded`: the cells a later write took over
 * before it did (theirs is the later write's state); a failed save shows
 * its `message` on the others.
 */
type SaveResult =
  | { ok: true; superseded: ReadonlyArray<CellAt> }
  | {
      ok: false
      /** `null` for a write cancelled. */
      message: string | null
      superseded: ReadonlyArray<CellAt>
    }

/** What a write did. */
type WriteOutcome = {
  cells: ReadonlyArray<CellWriteResult>
  /** The cells written (changed or not). */
  written: number
  skipped: number
  /** The refused cells' column header, message and the text written. */
  invalid: ReadonlyArray<{ column: string; message: string; attempted: string }>
  /** `onCellsChange` cancelled the write. */
  canceled: boolean
  /** Settles once the cells are saved, or not (at once without a promise); never rejects. */
  saved: Promise<SaveResult>
}

type WriteOptions = {
  /** Whether a refused cell shows its message (default); an editor shows it itself. */
  markInvalid?: boolean
}

type WriteHost = {
  context: DataTableContextValue<unknown>
  t: Translator<"dataTable">
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

/**
 * Sets the marks of cells (`null` removes one), one row's map at a time,
 * and how the rows show them (`CellWriter`).
 */
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
  cells.set({ marks, writer: WRITER })
}

/** A write still saving: its cells' owner until a later write takes one. */
type Batch = { id: number; controller: AbortController }

/** The writes saving, per table (its `cells` store), by cell. */
const saving = new WeakMap<object, Map<string, Batch>>()
let writes = 0

const keyOf = (row: string, column: string) => `${row}\u0000${column}`

/** The message of a save's rejection, or the table's own. */
function messageOf(error: unknown, fallback: string) {
  // A request the application cancelled (on `signal`): not a reason to show.
  if (error instanceof Error && error.name === "AbortError") return fallback
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  return fallback
}

/** Writes cells (see the module comment). */
function writeCells(
  host: WriteHost,
  cells: ReadonlyArray<CellWrite>,
  reason: DataTableCellsChangeReason,
  event?: Event,
  { markInvalid = true }: WriteOptions = {}
): WriteOutcome {
  const { context, t } = host
  const state = context.store.get()
  const { model, formatter, options } = state
  const { byId } = getColumnModel(state.columns)
  const labels = { yes: t("yes"), no: t("no") }
  const messages = parseMessages(t)
  const changes: Array<DataTableCellChange<unknown>> = []
  const results: Array<CellWriteResult> = []
  const invalid: Array<{ column: string; message: string; attempted: string }> =
    []
  const marks: Array<{ row: string; column: string; mark: CellMark | null }> =
    []
  const marked = context.cells.get().marks
  // A message that a write of the cell's own value ends (not a save in
  // progress: that is still the earlier write's).
  const hasMessage = (row: string, column: string) => {
    const mark = marked.get(row)?.get(column)
    return mark !== undefined && mark.pending === null
  }
  const attemptedOf = new Map<DataTableCellChange<unknown>, string>()
  for (const cell of cells) {
    const item = model.item(cell.row)
    const column = byId.get(cell.column)
    const result: CellWriteResult = {
      row: cell.row,
      column: cell.column,
      status: "skipped",
      value: undefined,
      message: null,
    }
    results.push(result)
    if (
      item === undefined ||
      !column ||
      !isCellEditable(
        options.editable,
        column,
        item,
        model.isDisabled(cell.row)
      )
    )
      continue
    const attempted =
      "text" in cell
        ? cell.text
        : (cell.attempted ?? formatter.format(column, cell.value))
    const previousValue = column.getValue(item)
    const refuse = (message: string) => {
      result.status = "invalid"
      result.message = message
      invalid.push({ column: column.header, message, attempted })
      if (markInvalid)
        marks.push({
          row: cell.row,
          column: cell.column,
          mark: {
            pending: null,
            error: message,
            attempted,
            values: [previousValue],
          },
        })
    }
    let value: DataTableValue
    if ("text" in cell) {
      const parsed = parseCellText(column, cell.text, item, {
        locale: formatter.locale,
        labels,
        messages,
      })
      if ("error" in parsed) {
        refuse(parsed.error)
        continue
      }
      value = parsed.value
    } else value = cell.value
    const message = column.definition.validate?.(value, item) ?? null
    if (message) {
      refuse(message)
      continue
    }
    result.value = value
    if (sameValue(previousValue, value)) {
      result.status = "unchanged"
      if (hasMessage(cell.row, cell.column))
        marks.push({ row: cell.row, column: cell.column, mark: null })
      continue
    }
    result.status = "changed"
    const change = {
      row: cell.row,
      column: column.id,
      item,
      value,
      previousValue,
    }
    changes.push(change)
    // A save that fails shows the value as the cell shows it (a pasted
    // text read as the value), or what an editor says was typed.
    attemptedOf.set(
      change,
      "text" in cell ? formatter.format(column, value) : attempted
    )
  }
  const outcome = (canceled: boolean, saved: Promise<SaveResult>) => ({
    cells: results,
    written: results.filter(
      (result) => result.status === "changed" || result.status === "unchanged"
    ).length,
    skipped: results.filter((result) => result.status === "skipped").length,
    invalid,
    canceled,
    saved,
  })
  if (changes.length === 0) {
    markCells(context.cells, marks)
    return outcome(false, Promise.resolve({ ok: true, superseded: [] }))
  }
  const batch: Batch = { id: ++writes, controller: new AbortController() }
  let canceled = false
  let result: unknown
  try {
    ;({ canceled, result } = context.actions.changeCells(
      changes,
      reason,
      event,
      batch.controller.signal
    ))
  } catch (error) {
    // A handler that throws: a save that failed.
    result = Promise.reject(error)
  }
  if (canceled) {
    batch.controller.abort()
    return outcome(
      true,
      Promise.resolve({ ok: false, message: null, superseded: [] })
    )
  }
  // The writes saving these cells are stale now.
  let owners = saving.get(context.cells)
  if (!owners) saving.set(context.cells, (owners = new Map()))
  for (const change of changes) {
    const key = keyOf(change.row, change.column)
    const owner = owners.get(key)
    if (owner) {
      owner.controller.abort()
      owners.delete(key)
    }
  }
  const thenable =
    typeof (result as PromiseLike<void> | undefined)?.then === "function"
      ? (result as PromiseLike<void>)
      : null
  for (const change of changes) {
    marks.push({
      row: change.row,
      column: change.column,
      mark: thenable
        ? { pending: batch.id, error: null, attempted: null, values: [] }
        : null,
    })
    if (thenable) owners.set(keyOf(change.row, change.column), batch)
  }
  markCells(context.cells, marks)
  if (!thenable)
    return outcome(false, Promise.resolve({ ok: true, superseded: [] }))
  const table = owners
  // The cells this write still has come back from saving, or show its
  // message; those a later write took over are that write's.
  const settle = (error: string | null) => {
    const now = context.cells.get().marks
    const own: Array<DataTableCellChange<unknown>> = []
    const superseded: Array<CellAt> = []
    for (const change of changes)
      if (now.get(change.row)?.get(change.column)?.pending === batch.id)
        own.push(change)
      else superseded.push({ row: change.row, column: change.column })
    for (const change of own) {
      const key = keyOf(change.row, change.column)
      if (table.get(key) === batch) table.delete(key)
    }
    markCells(
      context.cells,
      own.map((change) => ({
        row: change.row,
        column: change.column,
        mark: error
          ? {
              pending: null,
              error,
              attempted: attemptedOf.get(change) ?? null,
              values: [change.previousValue, change.value],
            }
          : null,
      }))
    )
    return { own: own.length, superseded }
  }
  const saved = Promise.resolve(thenable).then(
    (): SaveResult => ({ ok: true, superseded: settle(null).superseded }),
    (error: unknown): SaveResult => {
      const message = messageOf(error, t("saveFailed"))
      const { own, superseded } = settle(message)
      if (own)
        announce(
          t("cellsNotSaved", {
            count: own,
            total: own.toLocaleString(formatter.locale),
            message,
          }),
          { politeness: "assertive" }
        )
      return { ok: false, message, superseded }
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

export { describeWrite, markCells, writeCells }
export type {
  CellAt,
  CellWrite,
  CellWriteResult,
  SaveResult,
  WriteHost,
  WriteOptions,
  WriteOutcome,
}
