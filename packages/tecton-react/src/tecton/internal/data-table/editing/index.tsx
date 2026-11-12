"use client"

/**
 * Editing's code, loaded on demand (`lazy.ts`, the `editing` feature): the
 * editors (`editor.tsx`), and the table's side of an edit once it is
 * there (`attachEditing`: what `edits.tsx` kept until then, then its
 * events). One cell is edited at a time.
 *
 * - An edit begins with the cell's value as text (a number in full, in the
 *   locale), the character typed, or empty for a composition; a cell whose
 *   save failed, or whose text was refused, begins with that text (what
 *   was typed).
 * - Saving writes the draft through `writeCells` (`cell-write.ts`), which
 *   reads a text as the column's type does (`parse` too) and checks it
 *   (`validate`). A draft that is not valid keeps the editor, with its
 *   message (announced); one that is closes it at once, the cell showing
 *   the value saving (dimmed) while `onCellsChange`'s promise is pending,
 *   and its message if it rejects. A save that settles later is announced
 *   once it has (politely; a failure too, `cell-write.ts`).
 * - Enter saves and moves down, Shift + Enter up, Tab to the next cell
 *   that can be written (on to the next row's first at a row's end),
 *   Shift + Tab back; over item rows only, past the cells that cannot be
 *   written. At the end there is nowhere to go: focus stays on the cell.
 *   Escape drops the draft, and a message the cell showed.
 * - Focus leaving the editor (a click elsewhere, another cell) saves; a
 *   draft that is not valid then ends the edit too, its cell showing the
 *   message with the text refused, and opening on it again. A press in
 *   the cell being edited, off its editor, keeps focus in the editor.
 * - A draft still the value's own text is no change: the edit ends,
 *   nothing written (a text need not read back as its value: a date's
 *   time of day, a month's day).
 * - The edit follows its row through new items. A change of the view that
 *   orders or picks the rows (sorting, search, filters, grouping) saves it
 *   and ends it, as a click on a header does; so does its row or column
 *   leaving the rows and columns shown (a page, a group closed, the row
 *   filtered out). A row removed or disabled has nowhere to save to: the
 *   draft is dropped, and that is announced.
 * - What waited for this code (`edits.tsx`) is replayed in order: starts,
 *   saves that move, starts on the cell moved to (`moved`).
 * - When an edit ends with focus in its editor, focus goes back to its
 *   cell; the cell selection follows a move.
 */
import { flushSync } from "react-dom"

import { announce } from "../../primitives/live-announcer"
import { isCellEditable } from "../cell-marks"
import { sameValue, shownMark } from "../cell-message"
import { parseCellText } from "../cell-parse"
import {
  describeWrite,
  markCells,
  parseMessages,
  writeCells,
  type SaveResult,
} from "../cell-write"
import type { CellEditor, EditingCell } from "../context"
import { foldText } from "../engine/format"
import type { EditEvent, EditHandlers, EditSide, EditStart } from "../edits"
import type {
  DataTableCellPosition,
  DataTableValue,
  EngineColumn,
  Formatter,
  ItemRow,
} from "../engine/index"
import { CellEditor as Editor } from "./editor"
import type {
  EditController,
  EditMove,
  FinishOptions,
  Session,
} from "./session"

type Position = DataTableCellPosition

const same = (a: Position, b: Position) =>
  a.row === b.row && a.column === b.column

const EDITOR: CellEditor = { Editor }

/**
 * A number as its editor shows it: every digit it has (the shortest that
 * reads back as it), in the locale, without grouping, with the column's
 * currency, percent sign or unit.
 */
function numberText(
  value: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: string
) {
  const plain = String(value)
  if (!Number.isFinite(value) || /e/i.test(plain)) return plain
  const {
    style,
    currency,
    currencyDisplay,
    currencySign,
    unit,
    unitDisplay,
    signDisplay,
  } = format ?? {}
  // A percent shows its value times 100: two fewer decimals.
  const decimals =
    (plain.split(".")[1]?.length ?? 0) - (style === "percent" ? 2 : 0)
  const digits = Math.min(100, Math.max(0, decimals))
  return new Intl.NumberFormat(locale, {
    style,
    currency,
    currencyDisplay,
    currencySign,
    unit,
    unitDisplay,
    signDisplay,
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** A cell's value as its editor's text. */
function editText(
  column: EngineColumn<unknown>,
  value: DataTableValue,
  formatter: Formatter<unknown>
) {
  if (value === null || value === undefined) return ""
  if (column.type === "text") return String(value)
  if (column.type === "number" && typeof value === "number")
    return numberText(value, column.format, formatter.locale)
  return formatter.format(column, value)
}

/** The table's side of editing, once this code is there (see the module comment). */
function attachEditing(side: EditSide): EditHandlers {
  const { context } = side
  const { store, cells, actions } = context
  const t = () => side.latest.current.t
  let current: Session | null = null

  const doc = () => side.container.current?.ownerDocument ?? document
  const columnOf = (id: string) =>
    store.get().layout.columns.find((each) => each.id === id)

  /** A cell's item and column while it is shown and can be written, else `null`. */
  const writable = (cell: Position) => {
    const { options, model } = store.get()
    const item = model.item(cell.row)
    const column = columnOf(cell.column)
    if (
      item === undefined ||
      !column ||
      model.indexOf(cell.row) < 0 ||
      !isCellEditable(
        options.editable,
        column,
        item,
        model.isDisabled(cell.row)
      )
    )
      return null
    return { item, column }
  }

  const parse = (column: EngineColumn<unknown>, item: unknown, text: string) =>
    parseCellText(column, text, item, {
      locale: store.get().formatter.locale,
      labels: { yes: t()("yes"), no: t()("no") },
      messages: parseMessages(t()),
    })

  /** Focuses a cell (scrolled into view, rendered or not). */
  const focusAt = (cell: Position) => {
    const { layout, options } = store.get()
    const row = side.latest.current.bodyIndex(cell.row)
    const column = layout.columns.findIndex((each) => each.id === cell.column)
    if (row < 0 || column < 0) return
    // The columns of controls come first.
    const offset =
      (options.selectionMode === "none" ? 0 : 1) +
      (options.reorderableRows ? 1 : 0)
    side.grid.current?.focusRow(row, offset + column)
  }

  /** The cell a save moves to, if any (see the module comment). */
  const nextCell = (
    from: Position,
    move: Exclude<EditMove, null>
  ): Position | null => {
    const { model, layout, options, cellBelow } = store.get()
    // The columns laid out at this width.
    const columns = layout.columns.filter((column) => {
      const below = column.definition.hideBelow
      return below === undefined || !cellBelow.has(below)
    })
    const { rows } = model
    const editableAt = (at: number, column: EngineColumn<unknown>) => {
      const row = rows[at]
      return (
        row.kind === "item" &&
        !row.continued &&
        isCellEditable(
          options.editable,
          column,
          row.item,
          model.isDisabled(row.id)
        )
      )
    }
    const at = (r: number, c: number) => ({
      row: (rows[r] as ItemRow<unknown>).id,
      column: columns[c].id,
    })
    let r = model.indexOf(from.row)
    let c = columns.findIndex((column) => column.id === from.column)
    if (r < 0 || c < 0) return null
    if (move === "down" || move === "up") {
      const step = move === "down" ? 1 : -1
      for (let next = r + step; next >= 0 && next < rows.length; next += step)
        if (editableAt(next, columns[c])) return at(next, c)
      return null
    }
    const step = move === "next" ? 1 : -1
    for (;;) {
      c += step
      if (c < 0 || c >= columns.length) {
        r += step
        if (r < 0 || r >= rows.length) return null
        c = step > 0 ? 0 : columns.length - 1
      }
      if (editableAt(r, columns[c])) return at(r, c)
    }
  }

  /** Where the last save moved to (or its cell): a start without a cell is there. */
  let moved: Position | null = null

  const start = (
    at: Position | null,
    how: EditStart,
    text: string,
    now: boolean,
    /** Characters of the value taken back before `text`. */
    back = 0
  ) => {
    const cell = at ?? moved
    if (!cell) return
    if (current && same(current, cell)) return current.focus()
    const found = writable(cell)
    // A cell that cannot be written leaves the edit there as it is; a
    // boolean cell's checkbox is its editor.
    if (!found || found.column.type === "boolean") return
    // One at a time: the edit before ends as a click elsewhere ends it.
    if (current) finish(current, { commit: true, markInvalid: true })
    const { item, column } = found
    const { formatter } = store.get()
    const value = column.getValue(item)
    const mark = shownMark(
      cells.get().marks.get(cell.row)?.get(cell.column),
      value
    )
    const typed = how === "type" ? text : how === "compose" ? text : null
    const refused = mark?.error ? mark.attempted : null
    const own = editText(column, value, formatter)
    // Typed after Enter, F2 or a double click, before this code came:
    // after the value.
    const kept = [...(refused ?? own)]
    const draft = typed ?? kept.slice(0, kept.length - back).join("") + text
    // A custom editor's value: the text it began with, read as the
    // column's (`null` when it does not read), unless it is the value's.
    const unchanged =
      typed === null && refused === null && text === "" && back === 0
    let initial = value
    if (!unchanged) {
      const parsed = parse(column, item, draft)
      initial = "value" in parsed ? parsed.value : null
    }
    const options = column.type === "options" ? column.options : null
    const session: Session = {
      row: cell.row,
      column: cell.column,
      how,
      initialText: draft,
      own: unchanged ? own : null,
      draft,
      value: initial,
      // Until an editor is drawn (keys replayed at once): its text, the
      // option it matches first (as the options editor highlights it), a
      // custom editor's value.
      read: () => {
        if (column.definition.renderEditor) return { value: session.value }
        const query = foldText(session.draft.trim())
        const option =
          options && query && session.draft !== session.own
            ? options.find((each) => foldText(each.label).includes(query))
            : undefined
        return option
          ? { value: option.value, attempted: session.draft }
          : { text: session.draft }
      },
      focused: false,
      focus: () => undefined,
      cell: null,
      mounted: 0,
      closed: false,
      controller,
    }
    current = session
    moved = cell
    // From `useDataTable`: to the cell first (scrolled to); its editor
    // takes focus once it renders.
    if (how === "api") focusAt(cell)
    const editing: EditingCell = { ...cell, session, error: null }
    // In the key's moment, the editor is there and focused before the key's
    // default (a composition) goes on.
    if (now) flushSync(() => cells.set({ editing }))
    else cells.set({ editing })
  }

  /** Says once a save that is a promise has settled (its failure, `cell-write.ts`). */
  const announceSaved = (cell: Position, saved: Promise<SaveResult>) => {
    const mark = cells.get().marks.get(cell.row)?.get(cell.column)
    if (!mark || mark.pending === null) return
    void saved.then((result) => {
      // Taken over by a later write: that write's to say.
      if (result.ok && !result.superseded.some((at) => same(at, cell)))
        announce(t()("cellSaved"))
    })
  }

  const finish = (session: Session, options: FinishOptions): boolean => {
    if (session.closed || current !== session) return true
    const { commit, move = null, markInvalid = false, event } = options
    const cell = { row: session.row, column: session.column }
    if (commit) {
      const draft = options.draft ?? session.read()
      // The value's own text, as it began: no change, nothing written
      // (its text may not read back as it: a date's time of day).
      const found = writable(cell)
      const unchanged =
        draft !== null &&
        session.own !== null &&
        ("text" in draft
          ? draft.text === session.own
          : found !== null &&
            sameValue(draft.value, found.column.getValue(found.item)))
      if (draft && !unchanged) {
        const outcome = writeCells(
          { context, t: t() },
          [{ ...cell, ...draft }],
          "edit",
          event,
          { markInvalid }
        )
        const [result] = outcome.cells
        if (result.status === "invalid" && !markInvalid) {
          const message = result.message ?? ""
          cells.set({ editing: { ...cell, session, error: message } })
          const column = columnOf(cell.column)
          announce(
            t()("cellMessage", {
              columnName: column?.header ?? cell.column,
              message,
            })
          )
          session.focus()
          return false
        }
        if (result.status === "changed") announceSaved(cell, outcome.saved)
      }
    } else {
      // Escape: the message the cell showed goes with the draft.
      const mark = cells.get().marks.get(cell.row)?.get(cell.column)
      if (mark && mark.pending === null)
        markCells(cells, [{ ...cell, mark: null }])
    }
    session.closed = true
    current = null
    // Focus in the editor goes back to its cell, before the editor goes.
    const element = session.cell
    if (element?.isConnected && session.focused) {
      if (!element.hasAttribute("tabindex")) element.tabIndex = -1
      element.focus({ preventScroll: true })
    }
    cells.set({ editing: null })
    const target = move && nextCell(cell, move)
    moved = target ?? cell
    if (target) {
      focusAt(target)
      if (store.get().options.cellSelectionMode !== "none")
        actions.setCellSelection(
          [
            {
              rows: { start: target.row, end: target.row },
              columns: { start: target.column, end: target.column },
            },
          ],
          "keyboard",
          event
        )
    }
    return true
  }

  const controller: EditController = { context, t, finish, parse }

  /** A cell written at once: a checkbox toggled, Delete. */
  const write = (
    cell: Position,
    value: DataTableValue,
    reason: "edit" | "clear",
    event?: Event
  ) => {
    if (current && same(current, cell)) return
    const outcome = writeCells(
      { context, t: t() },
      [{ ...cell, value }],
      reason,
      event
    )
    if (outcome.canceled) return
    if (reason === "clear")
      announce(
        describeWrite(t(), store.get().formatter.locale, "clear", outcome)
      )
    else if (outcome.invalid.length > 0) {
      const [first] = outcome.invalid
      announce(
        t()("cellMessage", { columnName: first.column, message: first.message })
      )
    }
  }

  const run = (entry: EditEvent, now: boolean) => {
    switch (entry.kind) {
      case "start":
        return start(entry.cell, entry.how, entry.text, now, entry.back)
      case "write":
        return write(entry.cell, entry.value, entry.reason, entry.event)
      case "save":
        if (current) finish(current, { commit: true, move: entry.move })
        return
      case "stop":
        if (current) finish(current, { commit: entry.commit })
    }
  }

  // The view and the rows, as they change under an edit.
  const viewKey = () => {
    const { sorting, search, filters, grouping } = store.get().view
    return JSON.stringify([sorting, search, filters, grouping])
  }
  let view = store.get().view
  let key = viewKey()
  const unsubscribe = store.subscribe(() => {
    const state = store.get()
    let reordered = false
    if (state.view !== view) {
      view = state.view
      const next = viewKey()
      reordered = next !== key
      key = next
    }
    const session = current
    if (!session) return
    // Its row gone, or no longer written (disabled): nothing to write to.
    const item = state.model.item(session.row)
    const column = columnOf(session.column)
    if (
      item === undefined ||
      (column &&
        !isCellEditable(
          state.options.editable,
          column,
          item,
          state.model.isDisabled(session.row)
        ))
    ) {
      finish(session, { commit: false })
      announce(t()("editDiscarded"))
    } else if (reordered || !writable(session))
      finish(session, { commit: true, markInvalid: true })
  })

  cells.set({ editor: EDITOR })
  // What waited for this code: an edit begins only if focus is still on
  // its cell (the user did not move on); from `useDataTable`, always.
  const focusedOn = (cell: Position) => {
    const active = doc().activeElement
    const at = side.positionOf(active?.closest("td, th") ?? null)
    return at !== null && same(at, cell)
  }
  // A start on its cell, not focused: it and the keys after it (up to the
  // next start on a cell) are dropped.
  let dropped = false
  for (const entry of side.queue.splice(0)) {
    if (entry.kind === "start" && entry.cell)
      dropped = entry.how !== "api" && !focusedOn(entry.cell)
    if (dropped) continue
    run(
      // A composition before the code: an editor with what followed.
      entry.kind === "start" && entry.how === "compose"
        ? { ...entry, how: "type" }
        : entry,
      false
    )
  }

  return {
    run,
    press: (event) => {
      const session = current
      const target = event.target as Element
      if (
        !session ||
        event.button !== 0 ||
        target.closest('[data-slot="data-table-editor"]')
      )
        return
      const at = side.positionOf(target.closest("td, th"))
      if (at && same(at, session)) event.preventDefault()
    },
    stop: () => {
      unsubscribe()
      if (current) current.closed = true
      current = null
      cells.set({ editing: null, editor: null })
    },
  }
}

export { attachEditing, numberText }
