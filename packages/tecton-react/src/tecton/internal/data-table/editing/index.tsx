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
 * - What waited for this code (`edits.tsx`) is done again in order: the
 *   keys pressed before it, pressed again (`pressAgain`).
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
import type {
  EditEvent,
  EditHandlers,
  EditSide,
  EditStart,
  KeyChain,
} from "../edits"
import { keyDefault } from "./keys"
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
 * reads back as it), in the locale, without grouping or an exponent, with
 * the column's currency, percent sign or unit.
 */
function numberText(
  value: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: string
) {
  if (!Number.isFinite(value)) return String(value)
  const {
    style,
    currency,
    currencyDisplay,
    currencySign,
    unit,
    unitDisplay,
    signDisplay,
  } = format ?? {}
  // The decimals of its shortest digits, the exponent of a very small or
  // large number counted; a percent shows its value times 100: two fewer.
  const [mantissa, exponent] = value.toExponential().split("e")
  const decimals =
    (mantissa.split(".")[1]?.length ?? 0) -
    Number(exponent) -
    (style === "percent" ? 2 : 0)
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
  /** Edits begun: each edit's editor is its own (a key of its own). */
  let edits = 0

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

  const start = (
    cell: Position,
    how: EditStart,
    text: string,
    now: boolean
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
    const own = editText(column, value, formatter)
    const draft = typed ?? refused ?? own
    // A custom editor's value: the text it began with, read as the
    // column's (`null` when it does not read), unless it is the value's.
    const unchanged = typed === null && refused === null
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
    // From `useDataTable`: to the cell first (scrolled to); its editor
    // takes focus once it renders.
    if (how === "api") focusAt(cell)
    const editing: EditingCell = { ...cell, id: ++edits, session, error: null }
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
    const target = move && nextCell(cell, move)
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
        return start(entry.cell, entry.how, entry.text, now)
      case "keys":
        return pressAgain(entry)
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

  cells.set({ editor: EDITOR })

  const focusedOn = (cell: Position) => {
    const active = doc().activeElement
    const at = side.positionOf(active?.closest("td, th") ?? null)
    return at !== null && same(at, cell)
  }

  /**
   * Keys pressed before this code, pressed again (see `edits.tsx`): from
   * their cell, in order, each through the handlers a key goes through
   * now, at the element focus is on by then; what the browser itself does
   * with a key the handlers leave alone (`keyDefault`) is done too. A
   * chain released before this code came then ends its edit as focus
   * leaving it does (saved), and focus goes back where the user took it.
   */
  const pressAgain = (chain: KeyChain) => {
    const document = doc()
    const away = document.activeElement
    if (!focusedOn(chain.cell)) focusAt(chain.cell)
    // Its cell not there to focus (scrolled away and gone): nothing to do.
    if (!focusedOn(chain.cell)) return
    if (chain.press) start(chain.cell, "double-click", "", true)
    for (const key of chain.keys) {
      const target = (document.activeElement ?? document.body) as HTMLElement
      const init: KeyboardEventInit = {
        key: key.key,
        code: key.code,
        shiftKey: key.shiftKey,
        ctrlKey: key.ctrlKey,
        altKey: key.altKey,
        metaKey: key.metaKey,
        modifierAltGraph: key.altGraph,
        isComposing: key.isComposing,
        bubbles: true,
        cancelable: true,
        composed: true,
      }
      const view = document.defaultView ?? window
      if (target.dispatchEvent(new view.KeyboardEvent("keydown", init)))
        keyDefault(target, key)
      if (target.isConnected)
        target.dispatchEvent(new view.KeyboardEvent("keyup", init))
      // What the key changed is rendered before the next, as between two
      // keys pressed (a key's render would wait for a microtask).
      flushSync(() => undefined)
    }
    if (!chain.released) return
    if (current) finish(current, { commit: true, markInvalid: true })
    if (
      away instanceof HTMLElement &&
      away.isConnected &&
      away !== document.body
    ) {
      away.focus({ preventScroll: true })
      // The cell the user pressed is the selection, as the press made it.
      const at = side.positionOf(away.closest("td, th"))
      if (at && store.get().options.cellSelectionMode !== "none")
        actions.setCellSelection(
          [
            {
              rows: { start: at.row, end: at.row },
              columns: { start: at.column, end: at.column },
            },
          ],
          "item-press"
        )
    } else if (!(away instanceof HTMLElement) || away === document.body) {
      // The press was on the page itself: focus goes back to it.
      const active = document.activeElement
      if (active instanceof HTMLElement && active !== document.body)
        active.blur()
    }
  }

  return {
    run,
    replay: (entries) => {
      for (const entry of entries) run(entry, true)
    },
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
