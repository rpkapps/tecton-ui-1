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
 * Before the code is there, every key on the cell an edit waits on is the
 * edits' (`waitingKey`): characters and Backspace change the edit's text,
 * Escape drops it, Enter and Tab save it and move, a key that edits then
 * begins an edit of the cell moved to, and the keys that would move focus
 * or the caret are kept. Replayed in order once the code comes, they give
 * what they give once it is there ("5 Enter 6 Enter 7": two cells saved,
 * the third edited with "7"), unless focus has left that cell meanwhile.
 */
import * as React from "react"

import { useTranslations, type Translator } from "../i18n/translations"
import { isMac, isTextEntry, type TableGridController } from "../table-grid"
import { isCellEditable } from "./cell-marks"
import type { DataTableContextValue, EditRequests } from "./context"
import type {
  DataTableCellPosition,
  DataTableColumnType,
  DataTableValue,
  EngineColumn,
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
 * What the user did, as the code on demand takes it (`attachEditing`).
 *
 * - `start`: an edit of `cell` (`null`: the cell the save before it moved
 *   to); `text`, typed in place of the value (`type`), or after it (typed
 *   after Enter, F2 or a double click, before the code came).
 * - `save`: the edit before it saved, and focus moved (Enter, Tab).
 */
type EditEvent =
  | {
      kind: "start"
      cell: Position | null
      how: EditStart
      text: string
      /** Characters of the value Backspace took back, before `text` (after Enter). */
      back?: number
    }
  | { kind: "save"; move: SaveMove }
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
  /** What the user did before the code came, in order. */
  queue: Array<EditEvent>
}

/** What the code on demand does with the table's events. */
type EditHandlers = {
  /**
   * Acts on one event; `now`: in the event's own moment (the editor is
   * there, focused, before it returns).
   */
  run: (entry: EditEvent, now: boolean) => void
  /** A press on the table: one in the cell being edited, off its editor, keeps focus in the editor. */
  press: (event: React.MouseEvent) => void
  stop: () => void
}

/**
 * The character a key types, if it types one, not a shortcut: Ctrl + Alt is
 * AltGr on Windows, Option types characters on a Mac (only there). Space
 * types only where it selects nothing (`spaceTypes`).
 */
function typedOf(event: React.KeyboardEvent, spaceTypes: boolean) {
  const { key } = event
  // One character (an astral one is two code units).
  if ([...key].length !== 1 || event.metaKey) return null
  if (key === " " && !spaceTypes) return null
  const altGr = event.ctrlKey && event.altKey
  if (event.ctrlKey && !altGr) return null
  if (event.altKey && !altGr && !isMac()) return null
  return key
}

/** Where Enter, Shift + Enter, Tab and Shift + Tab save to, else `null`. */
function saveMoveOf(event: React.KeyboardEvent): SaveMove | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null
  if (event.key === "Enter") return event.shiftKey ? "up" : "down"
  if (event.key === "Tab") return event.shiftKey ? "previous" : "next"
  return null
}

/** The keys that move the caret in an editor, or focus on a cell. */
const MOVING = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Tab",
  "Delete",
  "Backspace",
  "Escape",
])

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
    /** The cell focus stays on while edits wait for the code: theirs, in order. */
    let chain: Position | null = null
    const dispatch = (entry: EditEvent, now: boolean) => {
      const current = handlers.current
      if (current) return current.run(entry, now)
      queue.push(entry)
      if (entry.kind === "start" && entry.cell) chain = entry.cell
      load()
    }
    /** The column of a cell that can be written, else `null`. */
    const editableAt = (at: Position): EngineColumn<unknown> | null => {
      const { options, model, layout } = context.store.get()
      const item = model.item(at.row)
      const column = layout.columns.find((each) => each.id === at.column)
      return item !== undefined &&
        column &&
        isCellEditable(options.editable, column, item, model.isDisabled(at.row))
        ? column
        : null
    }
    const spaceTypes = () =>
      context.store.get().options.selectionMode === "none"

    /**
     * A key while edits wait for the code, focus still on their cell:
     * every key is theirs, so the outcome is the same whenever the code
     * comes. In an edit, characters and Backspace change its text, Escape
     * drops it, Enter and Tab save it and move, the keys that would move
     * the caret are kept; after a save, a key that edits begins an edit of
     * the cell moved to, and the others are kept.
     */
    const waitingKey = (
      event: React.KeyboardEvent,
      last: EditEvent,
      done: () => void
    ) => {
      if (last.kind === "start") {
        if (event.key === "Escape") {
          queue.pop()
          return done()
        }
        if (event.key === "Backspace") {
          if (last.text) last.text = [...last.text].slice(0, -1).join("")
          else last.back = (last.back ?? 0) + 1
          return done()
        }
        const move = saveMoveOf(event)
        if (move) {
          queue.push({ kind: "save", move })
          return done()
        }
        const text = typedOf(event, true)
        if (text !== null) last.text += text
        if (text !== null || MOVING.has(event.key)) done()
        return
      }
      const start =
        event.key === "Enter" || event.key === "F2"
          ? {
              how: event.key === "F2" ? ("edit" as const) : ("enter" as const),
              text: "",
            }
          : startOf(event, "text", spaceTypes())
      if (start) {
        queue.push({ kind: "start", cell: null, ...start })
        return done()
      }
      if (MOVING.has(event.key)) done()
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
      const last = queue.at(-1)
      if (
        !handlers.current &&
        chain &&
        same(chain, at) &&
        (last?.kind === "start" || last?.kind === "save")
      )
        return waitingKey(event, last, done)
      const column = editableAt(at)
      if (!column) return
      const mod = isMac() ? event.metaKey : event.ctrlKey
      if (event.key === "Backspace" || event.key === "Delete") {
        // With a cell selection, its cells are cleared (`cells.tsx`).
        if (
          mod ||
          event.altKey ||
          context.store.get().options.cellSelectionMode !== "none"
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
      if (start.how === "compose" && handlers.current) {
        // The key's own default goes on in the editor, focused by now.
        event.stopPropagation()
        return dispatch({ kind: "start", cell: at, ...start }, true)
      }
      done()
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
      if (column.type !== "boolean")
        dispatch({ kind: "start", cell: at, how, text: "" }, true)
      else if (column.definition.cell) {
        const item = context.store.get().model.item(at.row)
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

    // A press in the cell being edited is the code's (an edit is there).
    const onMouseDown = (event: React.MouseEvent<HTMLTableElement>) => {
      load()
      handlers.current?.press(event)
    }

    const requests: EditRequests = {
      start: (cell) =>
        dispatch({ kind: "start", cell, how: "api", text: "" }, false),
      stop: (commit) => {
        // No code yet: no edit to end, but one still waiting.
        if (!handlers.current) {
          const last = queue.at(-1)
          if (last?.kind === "start") queue.push({ kind: "stop", commit })
          return
        }
        dispatch({ kind: "stop", commit }, false)
      },
      write: (cell, value, event) =>
        dispatch({ kind: "write", cell, value, reason: "edit", event }, false),
    }

    return { onKeyDown, onCellAction, onFocus, onMouseDown, requests }
  })

  React.useLayoutEffect(() => {
    if (!on) return
    context.cells.set({ edits: api.requests })
    return () => context.cells.set({ edits: null })
  }, [on, context, api])

  // The code, once it is there: it takes what waited, and the events from then.
  React.useEffect(() => {
    if (!module) return
    const attached = module.attachEditing({
      context,
      container,
      grid,
      positionOf,
      latest,
      queue,
    })
    handlers.current = attached
    return () => {
      handlers.current = null
      attached.stop()
    }
  }, [module, context, container, grid, positionOf, queue])

  return api
}

export { useCellEditing }
export type { EditEvent, EditHandlers, EditSide, EditStart, SaveMove }
