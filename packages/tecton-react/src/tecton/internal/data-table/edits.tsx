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
 * Before the code is there, a key or a double click that begins an edit
 * begins a chain (`keys`): every key pressed on that cell from then on is
 * kept as it was pressed, its default prevented, and pressed again in
 * order once the code is there, through the same handlers a key pressed
 * then goes through, focus moving as they move it: what the keys do is
 * what they would have done had the code been there. Shortcuts (Ctrl /
 * Cmd + a key) are left to the table as they come. Three things end a
 * chain before the code comes (it is `released`): Tab with no edit open
 * (by the chain's own keys so far), which leaves the table, as the grid's
 * Tab does, and so is not prevented; a press on another cell or off the
 * table; focus leaving the table. A released chain is pressed again all
 * the same, then its edit ends as focus leaving it would end it (saved),
 * and focus goes back where the user took it.
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

/** A key as it was pressed, to press it again. */
type KeyPress = {
  key: string
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  altGraph: boolean
  isComposing: boolean
}

/** Keys before the code (see the module comment). */
type KeyChain = {
  kind: "keys"
  /** The cell they were pressed on. */
  cell: Position
  /** Begun by a double click (not a key). */
  press: boolean
  keys: Array<KeyPress>
  /** Ended before the code came (Tab out, a press elsewhere, focus gone). */
  released: boolean
}

/**
 * What the user did, as the code on demand takes it (`attachEditing`):
 * an edit to begin (`start`, at once or from `useDataTable`), the keys of
 * a chain, a cell written at once, the edit's end.
 */
type EditEvent =
  | { kind: "start"; cell: Position; how: EditStart; text: string }
  | KeyChain
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
  /** Does what waited for the code, in order (keys pressed again). */
  replay: (entries: ReadonlyArray<EditEvent>) => void
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

/** Keys that only modify others. */
const MODIFIERS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "AltGraph",
  "CapsLock",
])

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
    /** The chain the keys go to while the code is still to come. */
    let chain: { entry: KeyChain; editing: boolean } | null = null
    const dispatch = (entry: EditEvent, now: boolean) => {
      const current = handlers.current
      if (current) return current.run(entry, now)
      queue.push(entry)
      load()
    }
    /** Begins a chain on a cell (the code is still to come). */
    const begin = (cell: Position, press: boolean) => {
      const entry: KeyChain = {
        kind: "keys",
        cell,
        press,
        keys: [],
        released: false,
      }
      chain = { entry, editing: true }
      dispatch(entry, false)
      return entry
    }
    /** Ends the chain the keys went to: pressed again all the same, then saved. */
    const release = () => {
      if (chain) chain.entry.released = true
      chain = null
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
    const record = (event: React.KeyboardEvent): KeyPress => ({
      key: event.key,
      code: event.code,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      altGraph: event.nativeEvent.getModifierState("AltGraph"),
      isComposing: event.nativeEvent.isComposing,
    })
    /**
     * Whether an edit is open after a key, by the chain's keys so far (for
     * Tab: in an edit it saves and moves; with none, it leaves the table).
     */
    const editingAfter = (editing: boolean, event: React.KeyboardEvent) => {
      const { key } = event
      if (editing)
        return !(
          ((key === "Enter" || key === "Tab") &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey) ||
          key === "Escape"
        )
      return (
        key === "Enter" ||
        key === "F2" ||
        startOf(event, "options", spaceTypes()) !== null
      )
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
      const mod = isMac() ? event.metaKey : event.ctrlKey
      if (!handlers.current && chain && same(chain.entry.cell, at)) {
        // Shortcuts and modifiers alone are the table's, as they come.
        if ((mod && !event.altKey) || MODIFIERS.has(event.key)) return
        // Tab with no edit open leaves the table: natively, as the grid's.
        if (event.key === "Tab" && !chain.editing) return release()
        chain.entry.keys.push(record(event))
        chain.editing = editingAfter(chain.editing, event)
        return done()
      }
      const column = editableAt(at)
      if (!column) return
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
      // The code still to come: the key begins a chain (Enter and F2 too).
      if (!handlers.current) {
        const edits =
          start !== null ||
          (column.type !== "boolean" &&
            (event.key === "Enter" || event.key === "F2") &&
            !event.altKey &&
            !mod)
        if (!edits) return
        begin(at, false).keys.push(record(event))
        return done()
      }
      if (!start) return
      if (start.how === "compose") {
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
      if (column.type !== "boolean") {
        if (handlers.current)
          handlers.current.run({ kind: "start", cell: at, how, text: "" }, true)
        // Enter and F2 began a chain already (`onKeyDown`).
        else if (how === "double-click") begin(at, true)
      } else if (column.definition.cell) {
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

    // A press in the cell being edited is the code's (an edit is there);
    // before it, a press off a chain's cell ends the chain.
    const onMouseDown = (event: React.MouseEvent<HTMLTableElement>) => {
      load()
      if (handlers.current) return handlers.current.press(event)
      const at = positionOf((event.target as Element).closest("td, th"))
      if (chain && !(at && same(at, chain.entry.cell))) release()
    }

    // Focus leaving the table ends a chain.
    const onBlur = (event: React.FocusEvent<HTMLTableElement>) => {
      const to = event.relatedTarget as Node | null
      if (!handlers.current && chain && !event.currentTarget.contains(to))
        release()
    }

    /** The code is there: its handlers take the keys from now. */
    const settle = () => {
      chain = null
    }

    const requests: EditRequests = {
      start: (cell) =>
        dispatch({ kind: "start", cell, how: "api", text: "" }, false),
      stop: (commit) => {
        // No code yet: no edit to end, but one still waiting.
        if (!handlers.current) {
          const last = queue.at(-1)
          if (last?.kind === "start" || last?.kind === "keys")
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
      onBlur,
      requests,
      settle,
    }
  })

  React.useLayoutEffect(() => {
    if (!on) return
    context.cells.set({ edits: api.requests })
    return () => context.cells.set({ edits: null })
  }, [on, context, api])

  // The code, once it is there: what waited is done again (in a task of
  // its own, after this render's work, so an editor it opens renders at
  // once), and the events from then are its own. Keys pressed meanwhile
  // still wait their turn.
  React.useEffect(() => {
    if (!module) return
    const attached = module.attachEditing({
      context,
      container,
      grid,
      positionOf,
      latest,
    })
    const live = () => {
      handlers.current = attached
      api.settle()
      attached.replay(queue.splice(0))
    }
    // Nothing waited: its own at once.
    if (queue.length === 0) live()
    const timer = queue.length === 0 ? undefined : setTimeout(live)
    return () => {
      clearTimeout(timer)
      handlers.current = null
      attached.stop()
    }
  }, [module, context, container, grid, positionOf, queue, api])

  return api
}

export { useCellEditing }
export type {
  EditEvent,
  EditHandlers,
  EditSide,
  EditStart,
  KeyChain,
  KeyPress,
  SaveMove,
}
