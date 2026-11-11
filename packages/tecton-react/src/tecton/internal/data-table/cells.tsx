"use client"

/**
 * The cell selection's side of `DataTableContent` that is there from the
 * first render (§7): which keys and presses are the cell selection's, and
 * the clipboard's events, recorded and handed to the code that acts on
 * them (`cell-selection/`, loaded on demand), at once when it is there.
 *
 * - The grid moves focus cell by cell (`TableGridOptions.cellFocus`) and
 *   says where it went (`onCellNavigate`): the selection follows.
 * - Keys (on a cell, not in a field): Shift + Space selects the rows of the
 *   range, Ctrl + Space its columns, Ctrl / Cmd + A every cell (on a data
 *   cell, or always without row selection: from the checkbox column it
 *   selects every row), Escape clears the cell selection (the row
 *   selection on a second press), Delete / Backspace clears the cells and
 *   Ctrl / Cmd + D fills down (`editable`).
 * - Copy and paste are the browser's own events, handled while focus is
 *   on the table's cells: their data is the clipboard's, in every format,
 *   with no permission asked. Where the browser sends none for a table's
 *   cell (Safari, with no text selected), Ctrl / Cmd + C and V fall back
 *   to the Clipboard API.
 * - Before the code has loaded, what the user does waits and is replayed
 *   once it is there, in order: the selection follows every move and
 *   press (a press still held starts its drag), and a command runs unless
 *   focus has left the table since. Nothing renders differently meanwhile.
 */
import * as React from "react"

import { useTranslations, type Translator } from "../i18n/translations"
import {
  isMac,
  isTextEntry,
  type TableGridController,
  type TableGridOptions,
} from "../table-grid"
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

/** What the user did, as the code on demand takes it (`createCellController`). */
type CellEvent =
  | {
      kind: "navigate"
      to: DataTableCellPosition
      from: DataTableCellPosition | null
      extend: boolean
      add: boolean
      event: Event
      /** A press: where it was, and whether it has been let go (a click, no drag). */
      press?: { x: number; y: number; released: boolean }
    }
  | {
      kind: "command"
      command: CellCommand
      focused: DataTableCellPosition | null
      event: Event
    }
  | {
      kind: "paste"
      /** The pasted text, or `null` to read it from the Clipboard API. */
      text: string | null
      focused: DataTableCellPosition | null
      event: Event
    }
  | {
      kind: "copy"
      focused: DataTableCellPosition | null
      /** A copy event's data, written at once; else the Clipboard API's. */
      data: DataTransfer | null
    }

/** What the code on demand works with: the table, its cells and the grid. */
type CellEnvironment = {
  context: DataTableContextValue<unknown>
  t: () => Translator<"dataTable">
  table: () => HTMLTableElement | null
  /** The table's scroll container. */
  container: () => HTMLElement | null
  grid: React.RefObject<TableGridController | null>
  /** A cell's place, when it is a data cell of an item row of this table. */
  positionOf: (cell: Element | null) => DataTableCellPosition | null
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
  if (!editable || !(onCell || selected)) return null
  if ((key === "Delete" || key === "Backspace") && !mod) return "clear"
  if (mod && key === "d" && !event.shiftKey) return "fill"
  return null
}

function useCellSelection({
  context,
  container,
  grid,
  on,
}: {
  context: DataTableContextValue<unknown>
  /** The table's scroll container. */
  container: React.RefObject<HTMLDivElement | null>
  grid: React.RefObject<TableGridController | null>
  on: boolean
}) {
  const t = useTranslations("dataTable")
  const { module, load } = useFeature("cellSelection", on)
  const translate = React.useRef(t)
  React.useInsertionEffect(() => {
    translate.current = t
  })
  const [queue] = React.useState<Array<CellEvent>>(() => [])

  const [environment] = React.useState<CellEnvironment>(() => {
    const table = () =>
      container.current?.querySelector<HTMLTableElement>(":scope > table") ??
      null
    return {
      context,
      t: () => translate.current,
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
    }
  })
  const controller = React.useMemo(
    () => module?.createCellController(environment),
    [module, environment]
  )
  React.useEffect(() => () => controller?.stop(), [controller])
  const latest = React.useRef(controller)
  React.useInsertionEffect(() => {
    latest.current = controller
  })

  const { table, positionOf } = environment
  /** Whether focus is on this table (not in a field, nor a table nested in it). */
  const focusIn = () => {
    const own = table()
    const active = own?.ownerDocument.activeElement
    return (
      !!own &&
      active instanceof HTMLElement &&
      own.contains(active) &&
      active.closest("table") === own &&
      !isTextEntry(active)
    )
  }
  const focusedAt = () =>
    positionOf(table()?.ownerDocument.activeElement?.closest("td, th") ?? null)
  const hasRanges = () => context.actions.currentCellSelection().length > 0

  const dispatch = (entry: CellEvent) => {
    if (latest.current) return latest.current.run(entry)
    queue.push(entry)
    // A press let go before the code came was a click: no drag.
    if (entry.kind === "navigate" && entry.press) {
      const press = entry.press
      const view = table()?.ownerDocument.defaultView ?? window
      const release = () => {
        press.released = true
        view.removeEventListener("mouseup", release, true)
      }
      view.addEventListener("mouseup", release, true)
    }
    load()
  }

  // Replays what waited, once the code is there.
  React.useEffect(() => {
    if (!controller) return
    const waiting = queue.splice(0)
    const focused = focusIn()
    for (const entry of waiting)
      if (entry.kind === "navigate" || focused) controller.run(entry)
  })

  /** A Ctrl / Cmd + C or V whose clipboard event has not come (yet). */
  const awaited = React.useRef<{ handled: boolean } | null>(null)

  React.useEffect(() => {
    const doc = container.current?.ownerDocument
    if (!on || !doc) return
    const handle = (event: ClipboardEvent, paste: boolean) => {
      if (!focusIn()) return
      if (paste && !context.store.get().options.editable) return
      if (awaited.current) awaited.current.handled = true
      const focused = focusedAt()
      if (!focused && !hasRanges()) return
      event.preventDefault()
      // A copy's data is written now, or (the code still to come) through
      // the Clipboard API once it is; a paste's text is read now.
      dispatch(
        paste
          ? {
              kind: "paste",
              text: event.clipboardData?.getData("text/plain") ?? "",
              focused,
              event,
            }
          : {
              kind: "copy",
              focused,
              data: latest.current ? event.clipboardData : null,
            }
      )
    }
    const onCopy = (event: ClipboardEvent) => handle(event, false)
    const onPaste = (event: ClipboardEvent) => handle(event, true)
    doc.addEventListener("copy", onCopy)
    doc.addEventListener("paste", onPaste)
    return () => {
      doc.removeEventListener("copy", onCopy)
      doc.removeEventListener("paste", onPaste)
    }
  })

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
    if (mod && !event.shiftKey && (key === "c" || key === "v")) {
      if ((!focused && !selected) || (key === "v" && !editable)) return
      // Not prevented: the browser's copy or paste event follows; where
      // none comes, the Clipboard API.
      const waiting = { handled: false }
      awaited.current = waiting
      const native = event.nativeEvent
      setTimeout(() => {
        if (awaited.current === waiting) awaited.current = null
        if (waiting.handled) return
        dispatch(
          key === "c"
            ? { kind: "copy", focused, data: null }
            : { kind: "paste", text: null, focused, event: native }
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
    event.preventDefault()
    event.stopPropagation()
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

  // Stable for the grid's options and the table: they call the latest.
  const handlers = React.useRef({ onKeyDown, onCellNavigate })
  React.useInsertionEffect(() => {
    handlers.current = { onKeyDown, onCellNavigate }
  })
  return React.useMemo(
    () => ({
      onKeyDown: (event: React.KeyboardEvent<HTMLTableElement>) =>
        handlers.current.onKeyDown(event),
      onCellNavigate: (
        cell: HTMLTableCellElement,
        details: Parameters<NonNullable<TableGridOptions["onCellNavigate"]>>[1]
      ) => handlers.current.onCellNavigate(cell, details),
    }),
    []
  )
}

export { commandOf, useCellSelection }
export type { CellCommand, CellEnvironment, CellEvent }
