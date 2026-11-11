"use client"

/**
 * The cell selection's side of `DataTableContent` that is there from the
 * first render (§7): which keys and presses are the cell selection's, kept
 * in order and handed to the code that acts on them (`cell-selection/`,
 * loaded on demand: from the table's first focus, or in idle time), at
 * once when it is there. That code handles the clipboard's events too;
 * before it is there, Ctrl / Cmd + C begins its write in the key's own
 * moment, with the content to come (a `ClipboardItem` of promises), and
 * Ctrl / Cmd + V keeps the paste event's text.
 *
 * - The grid moves focus cell by cell (`TableGridOptions.cellFocus`) and
 *   says where it went (`onCellNavigate`): the selection follows. Tab into
 *   a table with no cell selected selects the cell it enters.
 * - Keys (on a cell, not in a field): Shift + Space selects the range's
 *   rows, Ctrl + Space its columns, Ctrl / Cmd + A every cell (on a data
 *   cell, or always without row selection: from the checkbox column it
 *   selects every row), Escape clears the cell selection (the row
 *   selection on a second press), Delete / Backspace clears the cells and
 *   Ctrl / Cmd + D fills down (`editable`). Off the data cells (a header,
 *   a group or totals row), those that would write or copy say to select
 *   cells first.
 * - Enter, F2 and a double click on a cell that can be written are its
 *   editor's (`EditingFeature`): until there is one, they do nothing
 *   there; on other cells, Enter and a double click activate the row.
 */
import * as React from "react"

import { useTranslations, type Translator } from "../i18n/translations"
import {
  isMac,
  isTextEntry,
  type TableGridController,
  type TableGridOptions,
} from "../table-grid"
import type { CopySink } from "./cell-selection/index"
import type { DataTableContextValue } from "./context"
import type { DataTableCellPosition } from "./engine/index"
import { useFeature } from "./lazy"

/** A command of the keys. */
type CellCommand =
  | "select-all"
  | "select-row"
  | "select-column"
  | "clear-selection"
  | "clear"
  | "fill"
  /** Copy, paste or a write with focus off the data cells. */
  | "notice"

type Position = DataTableCellPosition

/** What the user did, as the code on demand takes it (`createCellController`). */
type CellEvent =
  | {
      kind: "navigate"
      to: Position
      from: Position | null
      extend: boolean
      add: boolean
      event: Event
      /** A press: where it was, and whether it has been let go (a click, no drag). */
      press?: { x: number; y: number; released: boolean }
    }
  | {
      kind: "command"
      command: CellCommand
      focused: Position | null
      event: Event
    }
  | {
      kind: "paste"
      /** What a paste event carried; `null` to read the Clipboard API. */
      pasted: { text: string; values?: string } | null
      focused: Position | null
      event: Event
    }
  | { kind: "copy"; focused: Position | null; sink: CopySink }

/** What the code on demand works with: the table, its cells and the grid. */
type CellEnvironment = {
  context: DataTableContextValue<unknown>
  t: () => Translator<"dataTable">
  table: () => HTMLTableElement | null
  /** The table's scroll container. */
  container: () => HTMLElement | null
  grid: React.RefObject<TableGridController | null>
  /** A cell's place, when it is a data cell of an item row of this table. */
  positionOf: (cell: Element | null) => Position | null
  /** Whether focus is on this table (not in a field, nor a table nested in it). */
  focusIn: () => boolean
  /** A row's place among the body's rows rendered or not (-1 when not on the page). */
  bodyIndex: (id: string) => number
}

/** The command of a key, if the cell selection takes it. */
function commandOf(
  event: React.KeyboardEvent,
  {
    range,
    editable,
    rows,
    onCell,
    selected,
  }: {
    range: boolean
    editable: boolean
    /** Rows select (the checkbox column is there). */
    rows: boolean
    /** Focus is on a data cell. */
    onCell: boolean
    /** Ranges are selected. */
    selected: boolean
  }
): CellCommand | null {
  const mod = isMac() ? event.metaKey : event.ctrlKey
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (key === "Escape") return selected ? "clear-selection" : null
  if (mod && key === "a" && !event.shiftKey)
    return range && (onCell || !rows) ? "select-all" : null
  if (key === " " && range && onCell) {
    if (event.shiftKey && !mod) return "select-row"
    // Control on a Mac too, as in its spreadsheets: ⌘ + Space is the system's.
    if (event.ctrlKey && !event.shiftKey && !event.metaKey)
      return "select-column"
    return null
  }
  if (!editable) return null
  const write =
    ((key === "Delete" || key === "Backspace") && !mod) ||
    (mod && key === "d" && !event.shiftKey)
  if (!write) return null
  if (!onCell) return selected ? "notice" : null
  return key === "d" ? "fill" : "clear"
}

/**
 * A Clipboard API write begun now, in the user's gesture, with the
 * content to come (`resolve`); `null` where the browser cannot.
 */
function beginWrite(): CopySink {
  const clipboard =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as { clipboard?: Partial<Clipboard> }).clipboard
  if (typeof ClipboardItem !== "function" || !clipboard?.write) return null
  let resolve: (copied: { text: string; html: string } | null) => void = () =>
    undefined
  const copied = new Promise<{ text: string; html: string } | null>((done) => {
    resolve = done
  })
  const blob = (type: string, part: "text" | "html") =>
    copied.then((content) => {
      // Nothing to copy: the write fails, the clipboard stays.
      if (!content) throw new Error("Nothing to copy")
      return new Blob([content[part]], { type })
    })
  clipboard
    .write([
      new ClipboardItem({
        "text/plain": blob("text/plain", "text"),
        "text/html": blob("text/html", "html"),
      }),
    ])
    .catch(() => undefined)
  return { resolve }
}

function useCellSelection({
  context,
  container,
  grid,
  on,
  bodyIndex,
}: {
  context: DataTableContextValue<unknown>
  /** The table's scroll container. */
  container: React.RefObject<HTMLDivElement | null>
  grid: React.RefObject<TableGridController | null>
  on: boolean
  bodyIndex: (id: string) => number
}) {
  const t = useTranslations("dataTable")
  const { module, load } = useFeature("cellSelection", on)
  // Read only for a cell that can be written.
  const editing = useFeature("editing", true).module
  const latest = React.useRef({ t, bodyIndex, editing })
  React.useInsertionEffect(() => {
    latest.current = { t, bodyIndex, editing }
  })
  const [queue] = React.useState<Array<CellEvent>>(() => [])

  const [environment] = React.useState<CellEnvironment>(() => {
    const table = () =>
      container.current?.querySelector<HTMLTableElement>(":scope > table") ??
      null
    return {
      context,
      t: () => latest.current.t,
      table,
      container: () => container.current,
      grid,
      positionOf: (cell) => {
        if (!(cell instanceof HTMLTableCellElement)) return null
        if (cell.closest("table") !== table()) return null
        const column = cell.dataset.column
        const row = grid.current?.rowValue(
          cell.parentElement as HTMLTableRowElement
        )
        return column === undefined || row === undefined
          ? null
          : { row, column }
      },
      focusIn: () => {
        const own = table()
        const active = own?.ownerDocument.activeElement
        return (
          !!own &&
          active instanceof HTMLElement &&
          own.contains(active) &&
          active.closest("table") === own &&
          !isTextEntry(active)
        )
      },
      bodyIndex: (id) => latest.current.bodyIndex(id),
    }
  })
  const controller = React.useMemo(
    () => module?.createCellController(environment),
    [module, environment]
  )
  const latestController = React.useRef(controller)
  React.useInsertionEffect(() => {
    latestController.current = controller
  })
  React.useEffect(() => () => controller?.stop(), [controller])

  const { table, positionOf } = environment
  const hasRanges = () => context.actions.currentCellSelection().length > 0

  const dispatch = React.useCallback(
    (entry: CellEvent) => {
      const current = latestController.current
      if (current) return current.run(entry)
      queue.push(entry)
      // A press let go before the code came was a click: no drag.
      if (entry.kind === "navigate" && entry.press) {
        const press = entry.press
        const view = environment.table()?.ownerDocument.defaultView ?? window
        const release = () => {
          press.released = true
          view.removeEventListener("mouseup", release, true)
        }
        view.addEventListener("mouseup", release, true)
      }
      load()
    },
    [queue, environment, load]
  )

  // Replays what waited, once the code is there: every move, and the
  // commands while focus is still on the table.
  React.useEffect(() => {
    if (!controller) return
    const waiting = queue.splice(0)
    const focused = environment.focusIn()
    for (const entry of waiting)
      if (entry.kind === "navigate" || focused) controller.run(entry)
  }, [controller, queue, environment])

  /** A press in progress: the focus it brings is its own (not Tab's). */
  const pressing = React.useRef(false)

  const onMouseDown = () => {
    pressing.current = true
    setTimeout(() => {
      pressing.current = false
    })
  }

  const onFocus = (event: React.FocusEvent<HTMLTableElement>) => {
    if (!on) return
    // The code, as soon as the table is used.
    load()
    const own = table()
    const from = event.relatedTarget
    if (
      pressing.current ||
      hasRanges() ||
      (from instanceof Node && own?.contains(from))
    )
      return
    // Tab into the table: its cell is the selection.
    const to = positionOf(
      (event.target as Element | null)?.closest("td, th") ?? null
    )
    if (to)
      dispatch({
        kind: "navigate",
        to,
        from: null,
        extend: false,
        add: false,
        event: event.nativeEvent,
      })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
    if (!on || event.defaultPrevented || event.altKey) return
    const target = event.target
    if (!(target instanceof HTMLElement) || isTextEntry(target)) return
    if (target.closest("table") !== table()) return
    const focused = positionOf(target.closest("td, th"))
    const { editable, cellSelectionMode, selectionMode } =
      context.store.get().options
    const selected = hasRanges()
    const mod = isMac() ? event.metaKey : event.ctrlKey
    const key = event.key.toLowerCase()
    const done = () => {
      event.preventDefault()
      event.stopPropagation()
    }
    if (mod && !event.shiftKey && (key === "c" || key === "v")) {
      if ((!focused && !selected) || (key === "v" && !editable)) return
      const native = event.nativeEvent
      const current = latestController.current
      if (current) {
        if (current.key(key === "c" ? "copy" : "paste", focused, native)) done()
        return
      }
      if (!focused) {
        done()
        return dispatch({
          kind: "command",
          command: "notice",
          focused,
          event: native,
        })
      }
      if (key === "c") {
        // The write begins now, in the key's moment (a later write could
        // be refused); without the Clipboard API, once the code is there.
        done()
        return dispatch({ kind: "copy", focused, sink: beginWrite() })
      }
      // The browser's paste event, its text kept for the code; where none
      // comes, the Clipboard API's.
      const doc = target.ownerDocument
      let pasted: CellEvent | null = null
      const keep = (paste: ClipboardEvent) => {
        paste.preventDefault()
        pasted = {
          kind: "paste",
          pasted: { text: paste.clipboardData?.getData("text/plain") ?? "" },
          focused,
          event: paste,
        }
      }
      doc.addEventListener("paste", keep, { once: true })
      setTimeout(() => {
        doc.removeEventListener("paste", keep)
        dispatch(
          pasted ?? { kind: "paste", pasted: null, focused, event: native }
        )
      })
      return
    }
    const command = commandOf(event, {
      range: cellSelectionMode === "range",
      editable,
      rows: selectionMode !== "none",
      onCell: focused !== null,
      selected,
    })
    if (!command) return
    done()
    dispatch({ kind: "command", command, focused, event: event.nativeEvent })
  }

  const onCellNavigate: NonNullable<TableGridOptions["onCellNavigate"]> = (
    cell,
    { from, event, extend }
  ) => {
    const to = on ? positionOf(cell) : null
    if (!to) return
    const press = event.type === "mousedown" ? (event as MouseEvent) : null
    dispatch({
      kind: "navigate",
      to,
      from: positionOf(from),
      extend,
      add: !!press && (isMac() ? press.metaKey : press.ctrlKey),
      event,
      press: press
        ? { x: press.clientX, y: press.clientY, released: false }
        : undefined,
    })
  }

  // Enter, F2, a double click: a cell that can be written is its editor's.
  // It is one not `aria-readonly` in a table whose cells are written.
  const onCellAction: NonNullable<TableGridOptions["onCellAction"]> = (
    cell,
    _event,
    how
  ) => {
    const at = positionOf(cell)
    if (
      !at ||
      !context.store.get().options.editable ||
      cell.getAttribute("aria-readonly") === "true"
    )
      return false
    latest.current.editing?.startEditing?.(at, how)
    return true
  }

  // Stable for the grid's options and the table: they call the latest.
  const handlers = React.useRef({
    onKeyDown,
    onCellNavigate,
    onCellAction,
    onFocus,
    onMouseDown,
  })
  React.useInsertionEffect(() => {
    handlers.current = {
      onKeyDown,
      onCellNavigate,
      onCellAction,
      onFocus,
      onMouseDown,
    }
  })
  return React.useMemo(
    () => ({
      onKeyDown: (event: React.KeyboardEvent<HTMLTableElement>) =>
        handlers.current.onKeyDown(event),
      onFocus: (event: React.FocusEvent<HTMLTableElement>) =>
        handlers.current.onFocus(event),
      onMouseDown: () => handlers.current.onMouseDown(),
      onCellNavigate: (
        cell: HTMLTableCellElement,
        details: Parameters<NonNullable<TableGridOptions["onCellNavigate"]>>[1]
      ) => handlers.current.onCellNavigate(cell, details),
      onCellAction: (
        cell: HTMLTableCellElement,
        event: Event,
        how: "enter" | "edit" | "double-click"
      ) => handlers.current.onCellAction(cell, event, how),
    }),
    []
  )
}

export { commandOf, useCellSelection }
export type { CellCommand, CellEnvironment, CellEvent }
