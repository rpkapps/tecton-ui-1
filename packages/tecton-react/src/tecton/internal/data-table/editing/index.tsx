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
 * - What waited for this code (`edits.tsx`) is done in order, from the
 *   data: the texts the browser's fields saved before it (written as a
 *   blur writes them), cells cleared or toggled; then the editor takes
 *   over a field still open (`take`), with its text, selection and focus,
 *   once an input method has composed. A text refused stops it there
 *   (`replay`): nothing after it is applied, and its editor opens again.
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
import {
  editText,
  isFieldSession,
  numberText,
  type FieldSession,
} from "../edit-field"
import {
  focusCell,
  nextCell,
  selectMoved,
  type EditEvent,
  type EditHandlers,
  type EditSide,
  type EditStart,
} from "../edits"
import type {
  DataTableCellPosition,
  DataTableValue,
  EngineColumn,
} from "../engine/index"
import { CellEditor as Editor } from "./editor"
import type { Draft, EditController, FinishOptions, Session } from "./session"

type Position = DataTableCellPosition

const same = (a: Position, b: Position) =>
  a.row === b.row && a.column === b.column

const EDITOR: CellEditor = { Editor }

/**
 * A text as a save writes it: in an options column, the first option it
 * matches (as the options editor highlights it); else the text, read as
 * the column's value.
 */
function textDraft(column: EngineColumn<unknown>, text: string): Draft {
  const query = foldText(text.trim())
  const option =
    column.type === "options" && query
      ? column.options.find((each) => foldText(each.label).includes(query))
      : undefined
  return option ? { value: option.value, attempted: text } : { text }
}

/** The table's side of editing, once this code is there (see the module comment). */
function attachEditing(side: EditSide): EditHandlers {
  const { context } = side
  const { store, cells } = context
  const t = () => side.latest.current.t
  let current: Session | null = null
  /** Edits begun: each edit's editor is its own (a key of its own). */
  let edits = 0

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

  const focusAt = (cell: Position) =>
    focusCell(context, side.grid.current, side.latest.current.bodyIndex, cell)

  /**
   * Begins an edit; `taken`: of a field before this code (its text as the
   * draft, the value's own text it began with, its selection).
   */
  const start = (
    cell: Position,
    how: EditStart,
    text: string,
    now: boolean,
    taken?: Pick<Session, "own" | "selection">
  ) => {
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
    const typed = how === "type" ? text : how === "compose" ? "" : null
    const refused = mark?.error ? mark.attempted : null
    const own = taken ? taken.own : editText(column, value, formatter)
    const draft = taken ? text : (typed ?? refused ?? own ?? "")
    // A custom editor's value: the text it began with, read as the
    // column's (`null` when it does not read), unless it is the value's.
    const unchanged = taken
      ? own !== null && text === own
      : typed === null && refused === null
    let initial = value
    if (!unchanged) {
      const parsed = parse(column, item, draft)
      initial = "value" in parsed ? parsed.value : null
    }
    const session: Session = {
      row: cell.row,
      column: cell.column,
      how,
      initialText: draft,
      own: taken ? own : unchanged ? own : null,
      draft,
      value: initial,
      selection: taken?.selection ?? null,
      // Until an editor is drawn (keys replayed at once): its text, the
      // option it matches first (as the options editor highlights it), a
      // custom editor's value.
      read: () => {
        if (column.definition.renderEditor) return { value: session.value }
        return session.draft === session.own
          ? { text: session.draft }
          : textDraft(column, session.draft)
      },
      focused: false,
      focus: () => undefined,
      cell: null,
      mounted: 0,
      closed: false,
      controller,
    }
    current = session
    // From `useDataTable`: to the cell first (scrolled to); its editor
    // takes focus once it renders.
    if (how === "api") focusAt(cell)
    const editing: EditingCell = { ...cell, id: ++edits, session, error: null }
    // In the key's moment, the editor is there and focused before the key's
    // default (a composition) goes on.
    if (now) flushSync(() => cells.set({ editing, editor: EDITOR }))
    else cells.set({ editing, editor: EDITOR })
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
          const shown = cells.get().editing
          if (shown) cells.set({ editing: { ...shown, error: message } })
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
    const target = move && nextCell(context, cell, move)
    if (target) {
      focusAt(target)
      selectMoved(context, target, event)
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
        return start(entry.cell, entry.how, entry.text, now)
      case "save":
        return void save(entry.cell, entry.text, entry.event, true)
      case "write":
        return write(entry.cell, entry.value, entry.reason, entry.event)
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

  // A field before this code still open is drawn by the field's editor
  // until it is taken over (`take`).
  const open = cells.get().editing?.session
  if (!open || !isFieldSession(open)) cells.set({ editor: EDITOR })

  /**
   * A field's text saved before this code (`edits.tsx`): written as focus
   * leaving an editor writes it, from the data (its row need not be
   * rendered); refused, its message (its cell marked with it if `mark`).
   */
  const save = (
    cell: Position,
    text: string,
    event: Event | undefined,
    mark: boolean
  ): string | null => {
    if (current && same(current, cell)) return null
    const column = columnOf(cell.column)
    if (!column) return null
    const outcome = writeCells(
      { context, t: t() },
      [{ ...cell, ...textDraft(column, text) }],
      "edit",
      event,
      { markInvalid: mark }
    )
    const [result] = outcome.cells
    if (result.status === "invalid") return result.message ?? ""
    if (result.status === "changed") announceSaved(cell, outcome.saved)
    return null
  }

  /**
   * What waited for this code, in order. A text refused stops it there:
   * what came after it was typed as if it had been saved (focus moved on),
   * so none of it is applied (a field still open is closed, unwritten).
   * With focus still in the table, the refused cell's editor opens again
   * with its text and message, as the table would have left it; with
   * focus gone, the cell is marked. Either way, it is said.
   */
  const replay = (
    entries: ReadonlyArray<EditEvent>,
    field: FieldSession | null
  ) => {
    for (const [index, entry] of entries.entries()) {
      if (entry.kind !== "save") {
        run(entry, false)
        continue
      }
      const container = side.container.current
      const inTable =
        container?.contains(container.ownerDocument.activeElement) ?? false
      const message = save(entry.cell, entry.text, entry.event, !inTable)
      if (message === null) continue
      const later =
        index < entries.length - 1 || (field !== null && !field.closed)
      if (field && !field.closed) field.close(false)
      if (inTable) {
        focusAt(entry.cell)
        selectMoved(context, entry.cell)
        start(entry.cell, "enter", entry.text, false, {
          own: null,
          selection: null,
        })
        const shown = cells.get().editing
        if (shown && same(shown, entry.cell))
          cells.set({ editing: { ...shown, error: message } })
      }
      announce(
        t()(later ? "editNotSavedLater" : "editNotSaved", {
          value: entry.text,
          message,
        })
      )
      return
    }
    if (field) take(field)
  }

  /**
   * The editor takes over a field still open before this code: its text,
   * selection and focus; a composition going on is let finish first.
   */
  const take = (field: FieldSession) => {
    if (field.closed) return
    const element = field.element
    if (field.composing && element) {
      element.addEventListener(
        "compositionend",
        () => setTimeout(() => take(field)),
        {
          once: true,
        }
      )
      return
    }
    const text = element?.value ?? field.draft
    const focused =
      element !== null && element.ownerDocument.activeElement === element
    field.closed = true
    start(field, field.how, text, false, {
      own: field.own,
      selection:
        element && focused
          ? {
              start: element.selectionStart ?? text.length,
              end: element.selectionEnd ?? text.length,
              direction: element.selectionDirection ?? "none",
            }
          : null,
    })
  }

  return {
    run,
    replay,
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
