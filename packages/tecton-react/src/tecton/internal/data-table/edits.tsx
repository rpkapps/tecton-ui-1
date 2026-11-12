"use client"

/**
 * Editing's side of `DataTableContent` that is there from the first render
 * (§7), as `cells.tsx` is the cell selection's: which keys and presses
 * begin or make an edit, each cell by its row and column ids, kept in
 * order until the code on demand (`editing/`, loaded from the table's
 * first focus or press, or in idle time) takes them (`attachEditing`), and
 * handed to it from then on.
 *
 * On a cell that can be written (read from the items, as `aria-readonly`
 * is), not in a field:
 * - Enter, F2 and a double click (the grid's `onCellAction`) edit it, its
 *   value kept;
 * - a character typed edits it with the character in place of its value
 *   (Space too, where rows do not select: there, Space is the rows'); a
 *   key an input method or a dead key takes (`Process`, `Dead`) edits it
 *   empty, in the key's own moment, so the composition goes on in the
 *   editor and its first character is neither lost nor doubled;
 * - Alt + Down on a date or options cell edits it with its calendar or
 *   list open;
 * - Delete and Backspace empty it when cells do not select (with a cell
 *   selection, `cells.tsx` clears the cells selected);
 * - a boolean cell is a checkbox, written as it is toggled (`write`): it
 *   has no editor, and Enter, F2 and a double click are not its (one that
 *   draws its own `cell`, and so no checkbox, is toggled by them).
 *
 * Before the code is there, a key or a press that begins an edit puts the
 * browser's own field in the cell (`edit-field.tsx`), at once, holding
 * the draft as the editor would (the character typed in place of the
 * value; Enter, F2 and a double click keep it, the caret at its end):
 * what is typed there is the browser's, shortcuts included, as in an
 * editor. Enter, Tab (Shift too) and focus leaving it end it saved: its
 * text is kept for the code (`save`, by row and column ids), and focus
 * moves as a save moves it (`nextCell`); Escape drops it. Once the code
 * is there, what waited is written, in order, from the data (`replay`),
 * and the editor takes over the field still open, with its text and
 * selection (once an input method has finished composing).
 */
import * as React from "react"
import { flushSync } from "react-dom"

import { useTranslations, type Translator } from "../i18n/translations"
import { isMac, isTextEntry, type TableGridController } from "../table-grid"
import { isCellEditable } from "./cell-marks"
import type {
  CellEditor,
  DataTableContextValue,
  EditingCell,
  EditRequests,
} from "./context"
import {
  editText,
  FieldEditor,
  isFieldSession,
  type FieldSession,
} from "./edit-field"
import type {
  DataTableCellPosition,
  DataTableColumnType,
  DataTableValue,
  EngineColumn,
  ItemRow,
} from "./engine/index"
import { toBoolean } from "./engine/values"
import { useFeature } from "./lazy"

type Position = DataTableCellPosition

/**
 * How an edit began: Enter, F2, a double click, a character typed (`text`),
 * a composition (`compose`, empty), Alt + Down (its popup open), or
 * `useDataTable` (`api`: the table focuses the cell).
 */
type EditStart =
  "enter" | "edit" | "double-click" | "type" | "compose" | "popup" | "api"

/** Where a save moves: Enter's, Shift + Enter's, Tab's, Shift + Tab's. */
type SaveMove = "down" | "up" | "next" | "previous"

/**
 * What the user did, as the code on demand takes it (`attachEditing`):
 * an edit to begin (`start`, at once or from `useDataTable`), the text a
 * field saved before the code (`save`), a cell written at once, the
 * edit's end.
 */
type EditEvent =
  | { kind: "start"; cell: Position; how: EditStart; text: string }
  | {
      kind: "save"
      cell: Position
      text: string
      /** The field's selection as it closed (its editor opens again with it, refused). */
      selection: [number, number] | null
      event?: Event
    }
  /** A press on the table before the code: what came after it is the user's next move. */
  | { kind: "press" }
  | {
      kind: "write"
      cell: Position
      value: DataTableValue
      /** A checkbox toggled (`edit`), Delete (`clear`). */
      reason: "edit" | "clear"
      event?: Event
    }
  | { kind: "stop"; commit: boolean }

/** The table's side, as the code on demand is given it. */
type EditSide = {
  context: DataTableContextValue<unknown>
  /** The table's scroll container. */
  container: { readonly current: HTMLDivElement | null }
  grid: { readonly current: TableGridController | null }
  /** A cell's place, when it is a data cell of an item row of this table. */
  positionOf: (cell: Element | null) => Position | null
  latest: {
    readonly current: {
      t: Translator<"dataTable">
      /** A row's place among the body's rows rendered or not (-1 when not on the page). */
      bodyIndex: (id: string) => number
    }
  }
}

/** What the code on demand does with the table's events. */
type EditHandlers = {
  /**
   * Acts on one event; `now`: in the event's own moment (the editor is
   * there, focused, before it returns).
   */
  run: (entry: EditEvent, now: boolean) => void
  /**
   * Does what waited for the code, in order; then takes over the field
   * still open, if any.
   */
  replay: (
    entries: ReadonlyArray<EditEvent>,
    field: FieldSession | null
  ) => void
  /** A press on the table: one in the cell being edited, off its editor, keeps focus in the editor. */
  press: (event: React.MouseEvent) => void
  stop: () => void
}

/**
 * The character a key types, if it types one, not a shortcut: AltGr types
 * characters (`AltGraph`), and Option does on a Mac (only there). Space
 * types only where it selects nothing (`spaceTypes`).
 */
function typedOf(event: React.KeyboardEvent, spaceTypes: boolean) {
  const { key } = event
  // One character (an astral one is two code units).
  if ([...key].length !== 1 || event.metaKey) return null
  if (key === " " && !spaceTypes) return null
  // AltGr as the platform says it (Windows: Ctrl + Alt with AltGraph); a
  // browser that cannot say, Ctrl + Alt. Ctrl + Alt + a letter without it
  // (Linux) is a shortcut.
  const { nativeEvent } = event
  const altGr =
    typeof nativeEvent.getModifierState === "function"
      ? nativeEvent.getModifierState("AltGraph")
      : event.ctrlKey && event.altKey
  if (event.ctrlKey && !altGr) return null
  if (event.altKey && !altGr && !isMac()) return null
  return key
}

/**
 * The edit a key begins on a cell of this type, if any; `spaceTypes`: Space
 * is not the rows' selection.
 */
function startOf(
  event: React.KeyboardEvent,
  type: DataTableColumnType,
  spaceTypes: boolean
): { how: EditStart; text: string } | null {
  if (type === "boolean") return null
  const { key } = event
  if (key === "ArrowDown" && event.altKey && !event.ctrlKey && !event.metaKey)
    return type === "date" || type === "options"
      ? { how: "popup", text: "" }
      : null
  if (
    key === "Process" ||
    key === "Dead" ||
    event.nativeEvent.isComposing ||
    event.keyCode === 229
  )
    return { how: "compose", text: "" }
  const text = typedOf(event, spaceTypes)
  return text === null ? null : { how: "type", text }
}

const same = (a: Position, b: Position) =>
  a.row === b.row && a.column === b.column

/**
 * The cell a save moves to, if any: down or up a row (Enter, Shift +
 * Enter), to the next or previous cell that can be written (Tab, Shift +
 * Tab: at a row's end, on to the next row's first); over item rows only,
 * past the cells that cannot be written; `null` at the end.
 */
function nextCell(
  context: DataTableContextValue<unknown>,
  from: Position,
  move: SaveMove
): Position | null {
  const { model, layout, options, cellBelow } = context.store.get()
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

/** Focuses a cell (scrolled into view, rendered or not). */
function focusCell(
  context: DataTableContextValue<unknown>,
  grid: TableGridController | null,
  bodyIndex: (id: string) => number,
  cell: Position
) {
  const { layout, options } = context.store.get()
  const row = bodyIndex(cell.row)
  const column = layout.columns.findIndex((each) => each.id === cell.column)
  if (row < 0 || column < 0) return
  // The columns of controls come first.
  const offset =
    (options.selectionMode === "none" ? 0 : 1) +
    (options.reorderableRows ? 1 : 0)
  grid?.focusRow(row, offset + column)
}

/** Focus in an edit's field goes back to its cell, before the field goes. */
function focusBack(field: HTMLElement | null) {
  const cell = field?.closest<HTMLElement>("td, th")
  if (!field || !cell || field.ownerDocument.activeElement !== field) return
  if (!cell.hasAttribute("tabindex")) cell.tabIndex = -1
  cell.focus({ preventScroll: true })
}

/** The cell selection follows a save's move. */
function selectMoved(
  context: DataTableContextValue<unknown>,
  cell: Position,
  event?: Event
) {
  if (context.store.get().options.cellSelectionMode === "none") return
  context.actions.setCellSelection(
    [
      {
        rows: { start: cell.row, end: cell.row },
        columns: { start: cell.column, end: cell.column },
      },
    ],
    "keyboard",
    event
  )
}

/** The fields before the editing code (`edit-field.tsx`). */
const FIELD: CellEditor = { Editor: FieldEditor }

function useCellEditing({
  context,
  container,
  grid,
  on,
  bodyIndex,
  positionOf,
}: {
  context: DataTableContextValue<unknown>
  /** The table's scroll container. */
  container: React.RefObject<HTMLDivElement | null>
  grid: React.RefObject<TableGridController | null>
  /** `editable`. */
  on: boolean
  bodyIndex: (id: string) => number
  positionOf: (cell: Element | null) => Position | null
}) {
  const t = useTranslations("dataTable")
  const { module, load } = useFeature("editing", on)
  const latest = React.useRef({ t, bodyIndex })
  React.useInsertionEffect(() => {
    latest.current = { t, bodyIndex }
  })
  const [queue] = React.useState<Array<EditEvent>>(() => [])
  const handlers = React.useRef<EditHandlers | null>(null)

  const [api] = React.useState(() => {
    const { cells, store } = context
    let fields = 0
    const dispatch = (entry: EditEvent, now: boolean) => {
      const current = handlers.current
      if (current) return current.run(entry, now)
      queue.push(entry)
      load()
    }
    /** The column of a cell that can be written, else `null`. */
    const editableAt = (at: Position): EngineColumn<unknown> | null => {
      const { options, model, layout } = store.get()
      const item = model.item(at.row)
      const column = layout.columns.find((each) => each.id === at.column)
      return item !== undefined &&
        column &&
        isCellEditable(options.editable, column, item, model.isDisabled(at.row))
        ? column
        : null
    }
    const spaceTypes = () => store.get().options.selectionMode === "none"
    /** The field open before the code, if any. */
    const openField = () => {
      const session = cells.get().editing?.session
      return session && isFieldSession(session) && !session.closed
        ? session
        : null
    }

    /** Ends a field (see the module comment). */
    const close = (
      session: FieldSession,
      commit: boolean,
      move: SaveMove | null,
      event?: Event
    ) => {
      if (session.closed) return
      session.closed = true
      const cell = { row: session.row, column: session.column }
      const field = session.element
      const text = field?.value ?? session.draft
      // Still the value's own text: no change.
      if (commit && text !== session.own)
        dispatch(
          {
            kind: "save",
            cell,
            text,
            selection: field && [
              field.selectionStart ?? 0,
              field.selectionEnd ?? 0,
            ],
            event,
          },
          false
        )
      focusBack(field)
      if (cells.get().editing?.session === session) cells.set({ editing: null })
      const target = move && nextCell(context, cell, move)
      if (!target) return
      focusCell(context, grid.current, latest.current.bodyIndex, target)
      selectMoved(context, target, event)
    }

    /**
     * The browser's own field in the cell, at once (before the code): the
     * text typed in place of the value, or the value's text (a refused
     * save's text, when the cell shows one).
     */
    const open = (
      at: Position,
      column: EngineColumn<unknown>,
      how: EditStart,
      typed: string | null
    ) => {
      const { model, formatter } = store.get()
      const value = column.getValue(model.item(at.row))
      const { marks, writer } = cells.get()
      const mark = writer?.shownMark(marks.get(at.row)?.get(at.column), value)
      const refused = mark?.error ? mark.attempted : null
      const own = editText(column, value, formatter)
      const initialText = typed ?? refused ?? own
      const session: FieldSession = {
        kind: "field",
        ...at,
        how,
        initialText,
        draft: initialText,
        own: typed === null && refused === null ? own : null,
        label: latest.current.t("editorLabel", {
          columnName: column.header,
          rowName: model.textOf(at.row),
        }),
        element: null,
        composing: false,
        closed: false,
        mounted: 0,
        close: (commit, move, event) =>
          close(session, commit, move ?? null, event),
      }
      const editing: EditingCell = {
        ...at,
        id: -++fields,
        session,
        error: null,
      }
      // In the key's moment: the field is there, focused, before the key's
      // default (a composition) goes on.
      flushSync(() =>
        cells.set({ editing, editor: cells.get().editor ?? FIELD })
      )
      load()
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
      if (event.defaultPrevented) return
      const target = event.target
      if (!(target instanceof HTMLElement) || isTextEntry(target)) return
      if (target.closest("table") !== event.currentTarget) return
      const at = positionOf(target.closest("td, th"))
      if (!at) return
      const done = () => {
        event.preventDefault()
        event.stopPropagation()
      }
      const column = editableAt(at)
      if (!column) return
      const mod = isMac() ? event.metaKey : event.ctrlKey
      if (event.key === "Backspace" || event.key === "Delete") {
        // With a cell selection, its cells are cleared (`cells.tsx`).
        if (
          mod ||
          event.altKey ||
          store.get().options.cellSelectionMode !== "none"
        )
          return
        done()
        return dispatch(
          {
            kind: "write",
            cell: at,
            value: null,
            reason: "clear",
            event: event.nativeEvent,
          },
          true
        )
      }
      const start = startOf(event, column.type, spaceTypes())
      if (!start) return
      if (start.how === "compose") {
        // The key's own default goes on in the field, focused by now.
        event.stopPropagation()
        if (!handlers.current) return open(at, column, "compose", "")
        return dispatch({ kind: "start", cell: at, ...start }, true)
      }
      done()
      if (!handlers.current)
        return open(
          at,
          column,
          start.how,
          start.how === "type" ? start.text : null
        )
      dispatch({ kind: "start", cell: at, ...start }, true)
    }

    // Enter, F2, a double click: a cell that can be written edits; a
    // boolean one that draws its own `cell` (no checkbox) is toggled. A
    // boolean cell's checkbox is its own control: these are not its.
    const onCellAction = (
      cell: HTMLTableCellElement,
      event: Event,
      how: "enter" | "edit" | "double-click"
    ) => {
      const at = positionOf(cell)
      const column = at && editableAt(at)
      if (!at || !column) return false
      if (column.type !== "boolean") {
        if (handlers.current)
          handlers.current.run({ kind: "start", cell: at, how, text: "" }, true)
        else open(at, column, how, null)
      } else if (column.definition.cell) {
        const item = store.get().model.item(at.row)
        const value = toBoolean(column.getValue(item))
        dispatch(
          { kind: "write", cell: at, value: !value, reason: "edit", event },
          true
        )
      }
      return true
    }

    // The code, as soon as the table is used.
    const onFocus = () => load()

    // A press in the cell being edited, off its field, keeps focus there.
    // Before the code, a press elsewhere is the user's next move: a field
    // open ends there (saved), and the press is kept, in order (`replay`).
    const onMouseDown = (event: React.MouseEvent<HTMLTableElement>) => {
      load()
      if (handlers.current) return handlers.current.press(event)
      const field = openField()
      const target = event.target as Element
      if (target.closest('[data-slot="data-table-editor"]')) return
      const at = positionOf(target.closest("td, th"))
      if (field && at && same(at, field)) return event.preventDefault()
      field?.close(true)
      queue.push({ kind: "press" })
    }

    const requests: EditRequests = {
      start: (cell) =>
        dispatch({ kind: "start", cell, how: "api", text: "" }, false),
      stop: (commit) => {
        const field = openField()
        if (field) return close(field, commit, null)
        // No code yet: no edit to end, but one still waiting.
        if (!handlers.current) {
          if (queue.at(-1)?.kind === "start")
            queue.push({ kind: "stop", commit })
          return
        }
        dispatch({ kind: "stop", commit }, false)
      },
      write: (cell, value, event) =>
        dispatch({ kind: "write", cell, value, reason: "edit", event }, false),
    }

    return {
      onKeyDown,
      onCellAction,
      onFocus,
      onMouseDown,
      requests,
      openField,
    }
  })

  React.useLayoutEffect(() => {
    if (!on) return
    context.cells.set({ edits: api.requests })
    return () => context.cells.set({ edits: null })
  }, [on, context, api])

  // The code, once it is there: what waited is done, in order, and the
  // events from then are its own.
  React.useEffect(() => {
    if (!module) return
    const attached = module.attachEditing({
      context,
      container,
      grid,
      positionOf,
      latest,
    })
    handlers.current = attached
    attached.replay(queue.splice(0), api.openField())
    return () => {
      handlers.current = null
      attached.stop()
    }
  }, [module, context, container, grid, positionOf, queue, api])

  return api
}

export { focusBack, focusCell, nextCell, selectMoved, useCellEditing }
export type { EditEvent, EditHandlers, EditSide, EditStart, SaveMove }
