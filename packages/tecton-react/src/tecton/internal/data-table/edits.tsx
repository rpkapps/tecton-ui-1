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
 * - a character typed edits it with the character in place of its value;
 *   a key an input method or a dead key takes (`Process`, `Dead`) edits it
 *   empty, in the key's own moment, so the composition goes on in the
 *   editor and its first character is neither lost nor doubled;
 * - Alt + Down on a date or options cell edits it with its calendar or
 *   list open;
 * - Delete and Backspace empty it when cells do not select (with a cell
 *   selection, `cells.tsx` clears the cells selected);
 * - a boolean cell is a checkbox, written as it is toggled (`write`): it
 *   has no editor (one that draws its own `cell`, and so no checkbox, is
 *   toggled by Enter, F2 and a double click).
 *
 * Before the code is there, the characters typed after a key that edits
 * go to the same edit (Backspace takes one back), and Escape drops it; once the
 * code comes, an edit begins only if focus is still on its cell (the user
 * did not move on).
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

/**
 * What the user did, as the code on demand takes it (`attachEditing`). A
 * start's `text`: typed, in place of the value (`type`), or after it
 * (typed after Enter, F2 or a double click before the code came).
 */
type EditEvent =
  | { kind: "start"; cell: Position; how: EditStart; text: string }
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

/** The edit a key begins on a cell of this type, if any. */
function startOf(
  event: React.KeyboardEvent,
  type: DataTableColumnType
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
  // One character (an astral one is two code units), not a shortcut:
  // Ctrl + Alt is AltGr on Windows, Option types a character on a Mac.
  // Space is the grid's (selection).
  if (
    [...key].length === 1 &&
    key !== " " &&
    !event.metaKey &&
    (!event.ctrlKey || event.altKey)
  )
    return { how: "type", text: key }
  return null
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
    const dispatch = (entry: EditEvent, now: boolean) => {
      const current = handlers.current
      if (current) return current.run(entry, now)
      queue.push(entry)
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
    /** The edit still waiting for the code on this cell (the last event). */
    const waitingOn = (at: Position) => {
      const last = queue.at(-1)
      return !handlers.current && last?.kind === "start" && same(last.cell, at)
        ? last
        : null
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
      if (event.defaultPrevented) return
      const target = event.target
      if (!(target instanceof HTMLElement) || isTextEntry(target)) return
      if (target.closest("table") !== event.currentTarget) return
      const at = positionOf(target.closest("td, th"))
      const column = at && editableAt(at)
      if (!at || !column) return
      const done = () => {
        event.preventDefault()
        event.stopPropagation()
      }
      // An edit waiting for the code: the keys after it are its own.
      const waiting = waitingOn(at)
      const mod = isMac() ? event.metaKey : event.ctrlKey
      if (waiting && event.key === "Escape") {
        queue.pop()
        return done()
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        if (mod || event.altKey) return
        if (waiting) {
          if (event.key === "Backspace")
            waiting.text = [...waiting.text].slice(0, -1).join("")
          return done()
        }
        // With a cell selection, its cells are cleared (`cells.tsx`).
        if (context.store.get().options.cellSelectionMode !== "none") return
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
      const start = startOf(event, column.type)
      if (!start) return
      if (waiting && start.how === "type") {
        waiting.text += start.text
        return done()
      }
      if (start.how === "compose" && handlers.current) {
        // The key's own default goes on in the editor, focused by now.
        event.stopPropagation()
        return dispatch({ kind: "start", cell: at, ...start }, true)
      }
      done()
      dispatch({ kind: "start", cell: at, ...start }, true)
    }

    // Enter, F2, a double click: a cell that can be written edits.
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
      // A boolean cell that draws its own `cell` (no checkbox): toggled.
      else {
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
          if (last?.kind === "start") queue.pop()
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
export type { EditEvent, EditHandlers, EditSide, EditStart }
