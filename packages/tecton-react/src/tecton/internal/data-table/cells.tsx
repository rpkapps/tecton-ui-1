"use client"

/**
 * The cell selection's side of `DataTableContent` that is there from the
 * first render (§7), kept to what cannot wait for the code on demand
 * (`cell-selection/`, loaded from the table's first focus, press or key,
 * or in idle time): which keys are the cell selection's (their default
 * prevented in the key's own moment), and what the user did, each cell by
 * its row and column ids (so a row out of view by the time the code comes
 * is still known), kept in order until the code takes it (`attachCells`)
 * and hands it to it from then on.
 *
 * - Ctrl / Cmd + C before the code is there begins a Clipboard API write
 *   in the key's moment, with the content to come (a `ClipboardItem` of
 *   promises); Ctrl / Cmd + V keeps the paste event's text. Once the code
 *   is there, it handles the clipboard's events itself.
 * - The grid moves focus cell by cell (`TableGridOptions.cellFocus`) and
 *   says where it went (`onCellNavigate`): the selection follows. Tab into
 *   the table is kept too (the code selects the cell it enters).
 * - Keys (on a cell, not in a field): Shift + Space selects the range's
 *   rows, Ctrl + Space its columns, Ctrl / Cmd + A every cell (on a data
 *   cell, or always without row selection: from the checkbox column it
 *   selects every row), Escape clears the cell selection (the row
 *   selection on a second press), Delete / Backspace clears the cells and
 *   Ctrl / Cmd + D fills down (`editable`). Off the data cells (a header,
 *   a group or totals row), those that would write or copy say to select
 *   cells first.
 * - Enter, F2 and a double click on a cell that can be written (read from
 *   the items, as `aria-readonly` is) are its editor's (`EditingFeature`):
 *   until there is one, they do nothing there; on other cells, Enter and a
 *   double click activate the row. Decided here, not by the code on
 *   demand: a table that is `editable` without a cell selection never
 *   loads it, and a key before it came must not activate the row instead.
 */
import * as React from "react"

import { useTranslations, type Translator } from "../i18n/translations"
import {
  isMac,
  isTextEntry,
  type TableGridController,
  type TableGridOptions,
} from "../table-grid"
import { isCellEditable } from "./cell-marks"
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

/** What the user did, as the code on demand takes it (`attachCells`). */
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
  /** Focus came into the table from outside, not by a press: Tab. */
  | { kind: "focus"; to: Position; event: Event }
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

/** The table's side, as the code on demand is given it (`attachCells`). */
type CellSide = {
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
  queue: Array<CellEvent>
}

/** What the code on demand does with the table's events. */
type CellHandlers = {
  run: (entry: CellEvent) => void
  /** Ctrl / Cmd + C or V; whether the key's default is to be prevented. */
  key: (
    kind: "copy" | "paste",
    focused: Position | null,
    event: Event
  ) => boolean
  stop: () => void
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
 * content to come (`resolve`), and whether it was written; `null` where
 * the browser cannot.
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
  const written = clipboard
    .write([
      new ClipboardItem({
        "text/plain": blob("text/plain", "text"),
        "text/html": blob("text/html", "html"),
      }),
    ])
    .then(
      () => true,
      () => false
    )
  return { resolve, written }
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
  const latest = React.useRef({ t, bodyIndex, editing, on })
  React.useInsertionEffect(() => {
    latest.current = { t, bodyIndex, editing, on }
  })
  const [queue] = React.useState<Array<CellEvent>>(() => [])
  const handlers = React.useRef<CellHandlers | null>(null)

  const [api] = React.useState(() => {
    const positionOf = (cell: Element | null): Position | null => {
      // A row of a table nested in a cell is not one of this grid's.
      const column =
        cell instanceof HTMLTableCellElement ? cell.dataset.column : undefined
      const row =
        column === undefined
          ? undefined
          : grid.current?.rowValue(cell?.parentElement as HTMLTableRowElement)
      return column === undefined || row === undefined ? null : { row, column }
    }
    const hasRanges = () => context.actions.currentCellSelection().length > 0
    const dispatch = (entry: CellEvent) => {
      const current = handlers.current
      if (current) return current.run(entry)
      queue.push(entry)
      // A press let go before the code came was a click: no drag.
      if (entry.kind === "navigate" && entry.press) {
        const press = entry.press
        const release = () => {
          press.released = true
          window.removeEventListener("mouseup", release, true)
        }
        window.addEventListener("mouseup", release, true)
      }
      load()
    }
    /** A press in progress: the focus it brings is its own (not Tab's). */
    let pressing = false

    const onMouseDown = () => {
      pressing = true
      setTimeout(() => {
        pressing = false
      })
      load()
    }

    const onFocus = (event: React.FocusEvent<HTMLTableElement>) => {
      if (!latest.current.on) return
      // The code, as soon as the table is used.
      load()
      const from = event.relatedTarget
      if (
        pressing ||
        (from instanceof Node && event.currentTarget.contains(from))
      )
        return
      const to = positionOf(
        (event.target as Element | null)?.closest("td, th") ?? null
      )
      if (to) dispatch({ kind: "focus", to, event: event.nativeEvent })
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
      if (!latest.current.on || event.defaultPrevented || event.altKey) return
      const target = event.target
      if (!(target instanceof HTMLElement) || isTextEntry(target)) return
      if (target.closest("table") !== event.currentTarget) return
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
        const current = handlers.current
        if (current) {
          if (current.key(key === "c" ? "copy" : "paste", focused, native))
            done()
          return
        }
        load()
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
      const to = latest.current.on ? positionOf(cell) : null
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
    const onCellAction: NonNullable<TableGridOptions["onCellAction"]> = (
      cell,
      _event,
      how
    ) => {
      const at = positionOf(cell)
      if (!at) return false
      const { options, model, layout } = context.store.get()
      const item = model.item(at.row)
      const column = layout.columns.find((each) => each.id === at.column)
      if (
        item === undefined ||
        !column ||
        !isCellEditable(
          options.editable,
          column,
          item,
          model.isDisabled(at.row)
        )
      )
        return false
      latest.current.editing?.startEditing?.(at, how)
      return true
    }

    return {
      positionOf,
      onKeyDown,
      onFocus,
      onMouseDown,
      onCellNavigate,
      onCellAction,
    }
  })

  // The code, once it is there: it takes what waited, and the events from then.
  React.useEffect(() => {
    if (!module) return
    const attached = module.attachCells({
      context,
      container,
      grid,
      positionOf: api.positionOf,
      latest,
      queue,
    })
    handlers.current = attached
    return () => {
      handlers.current = null
      attached.stop()
    }
  }, [module, context, container, grid, api, queue])

  return api
}

export { commandOf, useCellSelection }
export type { CellCommand, CellEvent, CellHandlers, CellSide }
