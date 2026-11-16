"use client"

/**
 * Internal to `@tecton/react`: the grid mode of `Table`, which `DataTable`
 * turns on with `TableGridOptionsContext` (and each body row's state with
 * `TableRowConfigContext`). The table becomes an ARIA
 * grid (a treegrid when its rows have a `level`) that is one tab stop and
 * is moved through with the keyboard, with rows that select:
 *
 * - Up / Down move between rows, or between the cells of a column (the
 *   header's too); Left / Right move between a row and its cells and
 *   between the cells, mirrored right to left, through each control of a
 *   cell. Home / End go to the first / last row, or cell of the row (with
 *   Ctrl / Cmd: of the table); Page Up / Down move a page; typing a row's
 *   first letters goes to it. A header cell spanning rows (`rowSpan`) is
 *   in each row it spans: the arrows go on in the row they reached it in
 *   (the last it spans when focus came another way), and Down leaves it
 *   from its last row.
 * - A cell holding controls (a checkbox, a sort button, a link) is entered
 *   at its first control; a cell without one is focused itself. Cells not
 *   laid out (hidden below a breakpoint) are passed over. Every row,
 *   cell and control is out of the Tab order but the one with focus, so
 *   Tab leaves the table.
 * - A cell holding a control that takes the keys itself (a text field, a
 *   select, a slider: `takesKeys`) is focused itself, and its content is
 *   entered as the ARIA grid's "actionable mode": Enter or F2 on the cell
 *   focuses its first control (a press on a control focuses it), Escape or
 *   F2 in the content returns to the cell, and the grid takes no key from
 *   a control that takes keys. While in the content, Tab and Shift + Tab
 *   move through the row's controls, every cell's, and from the last (or
 *   first) one leave the table, as Tab does from the grid; focus coming
 *   back finds the cell.
 * - Space or a click selects or clears the row, as its checkbox does
 *   (Shift: the range to it), the arrows only move and Shift with them
 *   extends the selection, Ctrl / Cmd + A selects every row, Escape clears
 *   the selection.
 * - Enter calls `onActivate`, and so does a double click; a single click
 *   does when rows do not select, or while none is selected. Enter on a row with `expanded` opens or closes it, and so do
 *   Right / Left on the row.
 * - Space on a row that selects other rows (`onToggleSelected`, a group's)
 *   selects or clears them.
 * - When the focused row or cell goes away (rows removed, a state in their
 *   place), focus goes to the row that closed over it (`restoreFocusTo`, a
 *   group), else the row now at its place, the nearest one, or the body's
 *   own control (an empty state's button); it never drops to the page.
 * - Selection changes and sorting (a header's `aria-sort` changing) are
 *   announced while focus is in the table.
 * - In a virtualized table, a row out of view is scrolled to before it is
 *   focused, and the rows out of view are read from their items
 *   (`describeItem`) when a range or "select all" needs them.
 *
 * Used by the generated `Table`, `TableBody` and `TableRow` (the overlay's
 * table hunk), `DataTable` and its selection checkbox; not part of the
 * public API: a plain `Table` never sees it.
 */
import * as React from "react"

import { useDirection } from "@tecton/react/provider"

import {
  cellsByColumn,
  FOCUSABLE,
  isCell,
  isFocusableControl,
  isMac,
  isResizer,
  isShown,
  isTextEntry,
  putBackTabIndex,
  shownAt,
  shownFrom,
  takesKeys,
} from "./grid-dom"
import { useTranslations } from "./i18n/translations"
import type { ChangeEventDetails } from "./primitives/event-details"
import { announce } from "./primitives/live-announcer"
import { useTypeahead } from "./primitives/navigation"
import {
  useSelection,
  type SelectionMode,
  type SelectionReason,
  type SelectOptions,
} from "./primitives/selection"
import { useSelectionAnnouncement } from "./primitives/selection-announcement"
import { createStore, useStore, type Store } from "./store"

/** `Table`'s grid props. */
type TableGridOptions = {
  /** Whether rows select, one at a time or several. */
  selectionMode?: SelectionMode
  /**
   * Called with the new selection. `eventDetails.reason` is
   * `"item-press"`, `"keyboard"`, `"select-all"` or `"clear"`.
   */
  onValueChange?: (
    value: Array<string>,
    eventDetails: ChangeEventDetails<SelectionReason>
  ) => void
  /** Keeps at least one row selected. */
  disallowEmptySelection?: boolean
  /**
   * Called with a row's `value` and the event when it is activated: Enter, a
   * double click, or a click when rows do not select (or while none is
   * selected).
   */
  onActivate?: (value: string, event: Event) => void
  /**
   * A body row's state read from its item (`TableBody` `items`): how the
   * rows out of view of a virtualized table are known.
   */
  describeItem?: (item: never, index: number) => RowDescription
  /**
   * Every row "select all" (Ctrl / Cmd + A, the header checkbox) stands for,
   * rows on other pages included.
   */
  getAllValues: () => ReadonlyArray<string>
  /**
   * Whether a row that is not `disabled` can be selected; one that cannot is
   * still focused and activated.
   */
  isSelectable?: (value: string) => boolean
  /**
   * Whether a row is disabled, rows out of view included: select all and
   * the header read it, never the rows' descriptions.
   */
  isDisabled: (value: string) => boolean
  /** The number of rows selected, for announcements. */
  getSelectedCount: (selected: ReadonlySet<string>) => number
  /**
   * The rows have levels: a treegrid from the first render, before the rows
   * have registered theirs.
   */
  tree?: boolean
  /** Filled with what the component around the table asks of the grid. */
  controller?: { current: TableGridController | null }
  /**
   * A virtualized body's row's stripe parity (0 or 1) by its index, `null`
   * for a row that takes another's fill; the index's own by default.
   */
  rowParity?: (index: number) => 0 | 1 | null
  /**
   * Where focus goes when the body row it was on (by its `value`, or its
   * `id`) went away: the body index (from 0) of a row that closed over it
   * (a group), `null` for the grid's own choice (the row now in its place,
   * or the nearest). `focused`: focus was on that row (not only the tab
   * stop), so it may be taken elsewhere (`controller.focusRow`).
   */
  restoreFocusTo?: (row: string, focused: boolean) => number | null
}

/** What the component around a grid table asks of it. */
type TableGridController = {
  /** Scrolls the body row with this `value` into view, rendered or not. */
  scrollToRow: (value: string) => void
  /** Focuses the body row at this index (from 0), scrolled to when out of view. */
  focusRow: (index: number) => void
  /**
   * Scrolls the body row at this index (from 0) into view, rendered or not
   * (a virtualized body's), clear of a sticky header and footer.
   */
  scrollToIndex: (index: number) => void
}

/** A body row's grid state, given by `TableRowConfigContext`. */
type TableRowGridProps = {
  /** The row's identity in the table's `value` (and `onActivate`). */
  value?: string
  /** Keeps the row from being focused, selected or activated. */
  disabled?: boolean
  /** The row's plain text, for type-ahead and announcements. */
  textValue?: string
  /** The row's depth in a tree table, from 1: the table is then a treegrid. */
  level?: number
  /** Whether the row's child rows show; leave it out for a row without any. */
  expanded?: boolean
  /** Called when Right / Left or Enter opens or closes the row. */
  onExpandedChange?: (expanded: boolean, event: Event) => void
  /** Names a row without a `value` (a group's), for `restoreFocusTo`. */
  id?: string
  /**
   * Space on a row without a `value` that selects other rows (a group's,
   * by its checkbox), with multiple selection.
   */
  onToggleSelected?: (event: Event) => void
}

type RowInfo = Required<Pick<TableRowGridProps, "disabled">> &
  Omit<TableRowGridProps, "disabled">

/** A body row as written: its props, read from the element. */
type RowDescription = {
  value: string | undefined
  textValue: string | undefined
  disabled: boolean
  level: number | undefined
}

/** What `TableBody` tells the grid about the rows it may not render. */
type TableGridBody = {
  /** The number of body rows (rendered or not). */
  count: () => number
  /** Every body row's props, in order; null when the body renders them all. */
  describe: (() => Array<RowDescription>) | null
  /** One body row's props, read from its element (0-based in the body). */
  describeAt: ((index: number) => RowDescription) | null
  /** Scrolls a virtualized body to a row (0-based in the body). */
  scrollToIndex: ((index: number) => void) | null
}

type TableGridState = {
  selected: ReadonlySet<string>
  /** Bumped when rows mount or unmount: the header checkbox reads it. */
  rows: number
  /**
   * The rows "select all" stands for (`getAllValues`) as of the table's
   * last render: a new list tells the header checkbox, which renders with
   * the header, not with the rows.
   */
  all?: ReadonlyArray<string>
}

type HeaderSelection = "all" | "some" | "none"

type TableGridContextValue = {
  store: Store<TableGridState>
  selectionMode: SelectionMode
  register: (row: HTMLTableRowElement, info: { current: RowInfo }) => () => void
  setBody: (body: TableGridBody | null) => void
  /** Focuses a row `focus` asked for once it has rendered. */
  flush: () => void
  select: (value: string, options: SelectOptions) => void
  /** Selects every row, or clears the selection when every row is. */
  toggleAll: (event?: Event) => void
  /** What the header checkbox shows. */
  headerSelection: () => HeaderSelection
  isDisabled: (value: string) => boolean
  /** Whether a row can be selected: not disabled, and selectable. */
  isSelectable: (value: string) => boolean
  /** Whether "select all" has a row to select. */
  canSelectAll: () => boolean
}

const TableGridContext = React.createContext<TableGridContextValue | null>(null)

/**
 * Turns a `Table` inside it into a grid: its options, which stay the same
 * as the selection changes (the rows and the body read them too).
 */
const TableGridOptionsContext = React.createContext<TableGridOptions | null>(
  null
)

/** The grid's selection (`TableGridOptions` without it): read by the table only. */
const TableGridValueContext = React.createContext<
  ReadonlyArray<string> | undefined
>(undefined)

/** The grid state of the body row inside it; the props go to its `TableRow`. */
const TableRowConfigContext = React.createContext<TableRowGridProps | null>(
  null
)

/**
 * The scroll container of the `Table` inside it, handed back through this
 * ref (`DataTable`'s). Internal, like grid mode: a plain `Table` never
 * sees it.
 */
const TableContainerContext =
  React.createContext<React.Ref<HTMLDivElement> | null>(null)

/**
 * What a row of a table with any of the contexts above hands the tables
 * nested in its cells (a detail row's): the contexts as it read them, which
 * are its table's, not theirs (`notOuter`); and, in a grid, the row itself, out
 * of whose Tab order a nested grid's stop stays while focus is outside it,
 * so the outer grid stays one Tab stop. Its `config` is also the row a
 * `DataTableSelectionCheckbox` is in.
 */
type TableScope = {
  row: React.RefObject<HTMLTableRowElement | null> | null
  options: TableGridOptions | null
  config: TableRowGridProps | null
  container: React.Ref<HTMLDivElement> | null
}

const TableScopeContext = React.createContext<TableScope | null>(null)

/** A context's value, unless it is the one the row around reads (an outer table's). */
function notOuter<TValue>(
  value: TValue | null,
  outer: TValue | null | undefined
) {
  return value === outer ? null : value
}

/** The grid's options, as the table inside them reads them. */
function useTableGridOptions() {
  const scope = React.useContext(TableScopeContext)
  return notOuter(React.useContext(TableGridOptionsContext), scope?.options)
}

function useTableGridContext() {
  return React.useContext(TableGridContext)
}

/** The body row a `DataTableSelectionCheckbox` is in. */
function useTableGridRow() {
  return React.useContext(TableScopeContext)?.config ?? null
}

const NONE_SELECTED: ReadonlySet<string> = new Set()

/** A plain table's: it selects nothing. */
const NO_OPTIONS: TableGridOptions = {
  getAllValues: () => [],
  isDisabled: () => false,
  getSelectedCount: () => 0,
}

/**
 * A grid's selection: its state (`useSelection`, the rows "select all"
 * stands for being `getAllValues`), the store the rows read theirs from,
 * its announcements, and the header checkbox's state. `isDisabled` says
 * whether a row is disabled, rendered or not; `getOrder` gives the rows a
 * Shift range runs over, `getText` a row's text.
 */
function useGridSelection(
  grid: boolean,
  selectionMode: SelectionMode,
  {
    onValueChange,
    disallowEmptySelection = false,
    getAllValues,
    isSelectable: isSelectableProp,
    getSelectedCount,
  }: TableGridOptions,
  value: ReadonlyArray<string> | undefined,
  isDisabled: (key: string) => boolean,
  getOrder: () => Array<string>,
  getText: (key: string) => string,
  hasFocus: () => boolean
) {
  const isSelectable = (key: string) =>
    !isDisabled(key) && (isSelectableProp?.(key) ?? true)

  const selection = useSelection({
    mode: selectionMode,
    value,
    onValueChange,
    disallowEmptySelection,
    isSelectable,
    getOrder,
    getAllKeys: () => [...getAllValues()],
  })

  const [store] = React.useState(() =>
    createStore<TableGridState>({ selected: NONE_SELECTED, rows: 0 })
  )
  React.useLayoutEffect(() => {
    store.set({ selected: grid ? selection.selected : NONE_SELECTED })
  }, [store, grid, selection.selected])
  React.useLayoutEffect(() => {
    if (selectionMode !== "multiple") return
    const all = getAllValues()
    if (store.get().all !== all) store.set({ all })
  })

  useSelectionAnnouncement({
    selected: selection.selected,
    mode: selectionMode,
    behavior: "toggle",
    hasFocus,
    getText,
    getCount: () => getSelectedCount(selection.selected),
    getAllKeys: getAllValues,
  })

  /**
   * The rows given that can be selected, as a list and a set: read once for
   * each list given.
   */
  const given = React.useRef<{
    all: ReadonlyArray<string>
    keys: Array<string>
    set: ReadonlySet<string>
  } | null>(null)
  const givenKeys = (all: ReadonlyArray<string>) => {
    if (given.current?.all !== all) {
      const keys = all.filter(isSelectable)
      given.current = { all, keys, set: new Set(keys) }
    }
    return given.current
  }
  /** The last header state, kept while the selection and the rows stay. */
  const header = React.useRef<{
    keys: Array<string>
    selected: ReadonlySet<string>
    state: HeaderSelection
  } | null>(null)

  const headerSelection = (): HeaderSelection => {
    const { selected } = store.get()
    if (selected.size === 0) return "none"
    const { keys, set } = givenKeys(getAllValues())
    const last = header.current
    if (last?.keys === keys && last.selected === selected) return last.state
    // Selected rows outside the ones given (filtered out) do not count.
    // The smaller side is walked: a few selected rows of many, or every
    // row given when as many are selected.
    let state: HeaderSelection
    if (selected.size < keys.length) {
      state = "none"
      for (const key of selected)
        if (set.has(key)) {
          state = "some"
          break
        }
    } else {
      let count = 0
      for (const key of keys) if (selected.has(key)) count++
      state = count === 0 ? "none" : count === keys.length ? "all" : "some"
    }
    header.current = { keys, selected, state }
    return state
  }

  const canSelectAll = () =>
    selectionMode === "multiple" && givenKeys(getAllValues()).keys.length > 0

  return { selection, store, isSelectable, headerSelection, canSelectAll }
}

/**
 * For `Table`: the `table`'s props (the caller's, with the grid's role,
 * handlers and ref when `TableGridOptionsContext` is around it) and the context
 * its rows read.
 */
function useTableGrid(own: React.ComponentProps<"table">) {
  const scope = React.useContext(TableScopeContext)
  const config = notOuter(
    React.useContext(TableGridOptionsContext),
    scope?.options
  )
  const grid = config !== null
  const selected = React.useContext(TableGridValueContext)
  const value = grid ? selected : undefined
  const outerRow = scope?.row ?? null
  const {
    selectionMode: selectionModeProp = "none",
    disallowEmptySelection = false,
    onActivate,
    isDisabled: isDisabledProp,
    tree: treeProp = false,
    controller,
    restoreFocusTo,
  } = config ?? NO_OPTIONS
  const t = useTranslations("table")
  const rtl = useDirection() === "rtl"
  const selectionMode: SelectionMode = grid ? selectionModeProp : "none"

  const table = React.useRef<HTMLTableElement | null>(null)
  const infos = React.useRef(new WeakMap<Element, { current: RowInfo }>())
  const byValue = React.useRef(new Map<string, HTMLTableRowElement>())
  const body = React.useRef<TableGridBody | null>(null)
  /** Elements whose `tabindex` the grid set, with the value they had. */
  const managed = React.useRef(new Map<HTMLElement, string | null>())
  const tabStop = React.useRef<HTMLElement | null>(null)
  /**
   * Where focus last was: a row index (header rows first), a column,
   * whether the row was a body row, and its level.
   */
  const position = React.useRef<{
    row: number
    column: number | null
    body: boolean
    level: number | undefined
    /** A body row's `value`, or its `id`. */
    id: string | undefined
  } | null>(null)
  /** The element in the table that last had focus, to put focus back when it goes. */
  const lastFocused = React.useRef<HTMLElement | null>(null)
  /** The row whose cells' content focus is in (actionable mode): Tab moves through its controls. */
  const actionable = React.useRef<HTMLTableRowElement | null>(null)
  /** The row a single click activated: its double click does not again. */
  const clickActivated = React.useRef(false)
  const pending = React.useRef<{
    row: number
    then: (row: HTMLTableRowElement) => void
  } | null>(null)
  const described = React.useRef<{
    source: TableGridBody["describe"]
    rows: Array<RowDescription>
    byKey: Map<string, RowDescription>
    keys: Array<string>
    indexByKey: Map<string, number>
  } | null>(null)
  const [tree, setTree] = React.useState(false)
  const treegrid = tree || treeProp
  const levels = React.useRef(0)

  // ---- rows ---------------------------------------------------------------

  const infoOf = (row: Element | null | undefined) =>
    row ? infos.current.get(row)?.current : undefined

  const headRows = () => [...(table.current?.tHead?.rows ?? [])]
  const footRows = () => [...(table.current?.tFoot?.rows ?? [])]
  /** The body rows in the DOM that are rows of the table's own. */
  const bodyRows = () =>
    [...(table.current?.tBodies ?? [])].flatMap((section) =>
      [...section.rows].filter((row) => infos.current.has(row))
    )
  const bodyCount = () => body.current?.count() ?? bodyRows().length
  /**
   * Whether a row is one the grid moves through: a header or footer row, or
   * a body row of its own. A body's other rows (`TableBody empty`, loading
   * placeholders) are left alone, their controls in the Tab order.
   */
  const isGridRow = (row: HTMLTableRowElement) =>
    row.parentElement?.tagName !== "TBODY" || infos.current.has(row)

  /** A virtualized body's rows, read once per set of rows and looked up by value. */
  const describedRows = (describe: NonNullable<TableGridBody["describe"]>) => {
    if (described.current?.source !== describe) {
      const rows = describe()
      const byKey = new Map<string, RowDescription>()
      const indexByKey = new Map<string, number>()
      const keys: Array<string> = []
      rows.forEach((row, index) => {
        if (row.value === undefined) return
        byKey.set(row.value, row)
        indexByKey.set(row.value, index)
        keys.push(row.value)
      })
      described.current = { source: describe, rows, byKey, keys, indexByKey }
    }
    return described.current
  }

  const allKeys = () => {
    const describe = body.current?.describe
    if (describe) return describedRows(describe).keys
    return bodyRows().flatMap((row) => {
      const key = infoOf(row)?.value
      return key === undefined ? [] : [key]
    })
  }

  const describedRow = (key: string) => {
    const describe = body.current?.describe
    return describe ? describedRows(describe).byKey.get(key) : undefined
  }

  const isDisabled = (key: string) => {
    const row = byValue.current.get(key)
    return row ? !!infoOf(row)?.disabled : isDisabledProp(key)
  }

  /** The row's text: `textValue`, else its row header's, else its first text. */
  const rowText = (row: HTMLTableRowElement) => {
    const info = infoOf(row)
    if (info?.textValue) return info.textValue
    const cells = [...row.cells]
    const header = cells.find((cell) => cell.tagName === "TH")
    const cell =
      header ?? cells.find((candidate) => candidate.textContent.trim())
    return cell?.textContent.trim() ?? ""
  }

  const textOf = (key: string) => {
    const row = byValue.current.get(key)
    if (row) return rowText(row)
    const text = describedRow(key)?.textValue
    if (text !== undefined) return text
    // Rows read from their items without a label: render this one only.
    const { describe, describeAt } = body.current ?? {}
    const index = describe
      ? describedRows(describe).indexByKey.get(key)
      : undefined
    if (index === undefined || !describeAt) return key
    return describeAt(index).textValue ?? key
  }

  const hasFocus = () => {
    const el = table.current
    return !!el && el.contains(el.ownerDocument.activeElement)
  }
  const { selection, store, isSelectable, headerSelection, canSelectAll } =
    useGridSelection(
      grid,
      selectionMode,
      config ?? NO_OPTIONS,
      value,
      isDisabled,
      allKeys,
      textOf,
      hasFocus
    )

  // ---- tab stop -----------------------------------------------------------

  const setTabIndex = (element: HTMLElement, tabIndex: "0" | "-1") => {
    if (!managed.current.has(element))
      managed.current.set(element, element.getAttribute("tabindex"))
    if (element.getAttribute("tabindex") !== tabIndex)
      element.setAttribute("tabindex", tabIndex)
  }

  /** Puts back the tab index an element had before the grid managed it. */
  const restoreTabIndex = (element: HTMLElement) => {
    if (!managed.current.has(element)) return
    putBackTabIndex(element, managed.current.get(element))
    managed.current.delete(element)
  }

  /**
   * The controls of a plain table nested in a row of this grid (a detail
   * row's): Tab stops only while focus is in that row, out of the Tab
   * order otherwise, as a nested grid's stop, so the grid stays one stop.
   * A nested grid keeps its own (`outerRow`).
   */
  const syncNestedTables = () => {
    const el = table.current
    if (!el || !grid) return
    const active = el.ownerDocument.activeElement
    for (const nested of el.querySelectorAll("table")) {
      // Its own grid's, or a grid's inside it.
      if (nested.closest('table[role="grid"], table[role="treegrid"]') !== el)
        continue
      let row = nested.parentElement?.closest("tr") ?? null
      while (row && row.closest("table") !== el)
        row = row.parentElement?.closest("tr") ?? null
      if (!row || !isGridRow(row)) continue
      const awake = row.contains(active)
      for (const control of nested.querySelectorAll<HTMLElement>(FOCUSABLE)) {
        if (control.closest("table") !== nested) continue
        if (awake) restoreTabIndex(control)
        else setTabIndex(control, "-1")
      }
    }
  }

  /** A cell's own controls (not those of a table nested in it), in order. */
  const controlsOf = (cell: HTMLTableCellElement): Array<HTMLElement> =>
    [...cell.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) =>
        isFocusableControl(element) && element.closest("td, th") === cell
    )

  /**
   * A cell's content that is entered rather than moved through (actionable
   * mode): its controls, when one of them takes keys (`takesKeys`); none
   * otherwise.
   */
  const contentOf = (cell: HTMLTableCellElement): Array<HTMLElement> => {
    const controls = controlsOf(cell)
    return controls.some(takesKeys) ? controls : []
  }

  /**
   * A cell's focus stops: the cell itself when it has no controls (or is
   * one), then its controls; the cell alone when its content is entered.
   */
  const stopsOf = (cell: HTMLTableCellElement): Array<HTMLElement> => {
    const controls = controlsOf(cell)
    if (controls.some(takesKeys)) return [cell]
    const original = managed.current.has(cell)
      ? managed.current.get(cell)
      : cell.getAttribute("tabindex")
    const interactive = original !== null && original !== undefined
    return interactive || controls.length === 0 ? [cell, ...controls] : controls
  }

  /** The controls of a row's cells shown, in order: what Tab moves through in actionable mode. */
  const rowControls = (row: HTMLTableRowElement) =>
    [...row.cells].filter(isShown).flatMap(controlsOf)

  const columnOf = (cell: HTMLTableCellElement) => {
    const columns = cellsByColumn(cell.parentElement as HTMLTableRowElement)
    const at = columns?.indexOf(cell) ?? -1
    if (at !== -1) return at
    let column = 0
    for (const other of (cell.parentElement as HTMLTableRowElement).cells) {
      if (other === cell) return column
      column += other.colSpan
    }
    return column
  }

  /**
   * The header cell spanning rows the arrows last moved to, and the row
   * they moved in: the row they go on in.
   */
  const spanRow = React.useRef<{
    cell: HTMLTableCellElement
    row: HTMLTableRowElement
  } | null>(null)
  /** Remembers the row a cell spanning rows was reached in. */
  const reached = (
    cell: HTMLTableCellElement | null,
    row: HTMLTableRowElement
  ) => {
    if (cell && cell.rowSpan > 1) spanRow.current = { cell, row }
    return cell
  }
  /**
   * The row the arrows go on in from a cell: its own, or for a header cell
   * spanning rows, the one it was reached in (by default the last it
   * spans, the columns' row).
   */
  const lineOf = (cell: HTMLTableCellElement) => {
    const own = cell.parentElement as HTMLTableRowElement
    if (cell.rowSpan <= 1) return own
    if (spanRow.current?.cell === cell && spanRow.current.row.isConnected)
      return spanRow.current.row
    const rows = (own.parentElement as HTMLTableSectionElement).rows
    const at = [...rows].indexOf(own) + cell.rowSpan - 1
    return rows.item(Math.min(at, rows.length - 1)) ?? own
  }

  /** The cell in `column`, or the nearest one laid out when it is not. */
  const cellAt = (row: HTMLTableRowElement, column: number) => {
    const columns = cellsByColumn(row)
    if (columns) {
      const at = Math.min(column, columns.length - 1)
      return reached(shownAt(columns, at, 1) ?? shownAt(columns, at, -1), row)
    }
    let start = 0
    let found: HTMLTableCellElement | null = null
    for (const cell of row.cells) {
      if (column < start + cell.colSpan) {
        found = cell
        break
      }
      start += cell.colSpan
    }
    found ??= row.cells.item(row.cells.length - 1)
    return found && (shownFrom(found, 1) ?? shownFrom(found, -1))
  }

  const lastColumn = (row: HTMLTableRowElement) => {
    const columns = cellsByColumn(row)
    const last = columns
      ? shownAt(columns, columns.length - 1, -1)
      : shownFrom(row.lastElementChild, -1)
    return last ? columnOf(last) : 0
  }

  /**
   * The cell laid out next to `cell` in its row (`lineOf`), `step` 1
   * forwards or -1 backwards: in a header, a cell of a row above spanning
   * down into it.
   */
  const besideOf = (cell: HTMLTableCellElement, step: 1 | -1) => {
    const line = lineOf(cell)
    const columns = cellsByColumn(line)
    if (!columns)
      return shownFrom(
        step === 1 ? cell.nextElementSibling : cell.previousElementSibling,
        step
      )
    const start = columns.indexOf(cell)
    return reached(
      shownAt(columns, step === 1 ? start + cell.colSpan : start - 1, step),
      line
    )
  }

  /** The row index of a row: header rows first, then the body's, then the footer's. */
  const indexOf = (row: HTMLTableRowElement) => {
    const section = row.parentElement as HTMLTableSectionElement
    const head = headRows().length
    if (section.tagName === "THEAD") return [...section.rows].indexOf(row)
    if (section.tagName === "TFOOT")
      return head + bodyCount() + [...section.rows].indexOf(row)
    const index = row.dataset.index
    if (index !== undefined) return head + Number(index)
    return head + bodyRows().indexOf(row)
  }

  /** The row at a row index, when it is rendered. */
  const rowAt = (index: number): HTMLTableRowElement | null => {
    const head = headRows()
    if (index < head.length) return head[index] ?? null
    const at = index - head.length
    const count = bodyCount()
    if (at >= count) return footRows()[at - count] ?? null
    if (body.current?.scrollToIndex)
      return (
        table.current?.querySelector<HTMLTableRowElement>(
          `tbody > tr[data-index="${at}"]`
        ) ?? null
      )
    return bodyRows()[at] ?? null
  }

  const isBody = (index: number) => {
    const head = headRows().length
    return index >= head && index < head + bodyCount()
  }

  const total = () => headRows().length + bodyCount() + footRows().length

  /** Whether the row at an index is disabled (rows out of view are not). */
  const disabledAt = (index: number) => {
    if (!isBody(index)) return false
    return !!infoOf(rowAt(index))?.disabled
  }

  /**
   * The row index of the row that closed over the row focus was on
   * (`restoreFocusTo`), while that row is gone; `null` for none.
   */
  const closedOver = (focused: boolean) => {
    const at = position.current
    if (!at?.body || at.id === undefined || !restoreFocusTo) return null
    const index = restoreFocusTo(at.id, focused)
    return index === null || index >= bodyCount()
      ? null
      : headRows().length + index
  }

  const defaultStop = (focused = false): HTMLElement | null => {
    const closed = closedOver(focused)
    const closer = closed === null ? null : rowAt(closed)
    if (closer && !infoOf(closer)?.disabled) return closer
    const at = position.current
    if (at) {
      // A body row's place stays in the body as rows go: the last row now.
      const [start, end] = bodyRange()
      let index = at.body ? Math.max(start, Math.min(at.row, end - 1)) : at.row
      let column = at.column
      // A child row gone with its siblings (its parent closed: a tree row,
      // a detail row) leaves focus on its parent, the nearest row above of
      // a lower level; one gone alone, on the sibling now in its place.
      if (at.body && at.level !== undefined && at.level > 1 && end > start) {
        const level = infoOf(rowAt(index))?.level
        const parent =
          level === undefined || level < at.level
            ? parentIndex(Math.min(at.row, end), at.level)
            : null
        if (parent !== null) {
          index = parent
          column = null
        }
      }
      const row = at.body && end <= start ? null : rowAt(index)
      if (row && !(isBody(index) && infoOf(row)?.disabled)) {
        if (column === null) return row
        const cell = cellAt(row, column)
        if (cell) return stopsOf(cell)[0]
      }
    }
    const first = bodyRows().find((row) => !infoOf(row)?.disabled)
    if (first) return first
    const head = table.current?.tHead?.rows.item(0)?.cells.item(0)
    return head ? stopsOf(head)[0] : null
  }

  /** The first control of the body's rows that are not the grid's (an empty state's button). */
  const bodyControl = () => {
    for (const section of table.current?.tBodies ?? [])
      for (const row of section.rows) {
        if (isGridRow(row)) continue
        const control = [...row.querySelectorAll<HTMLElement>(FOCUSABLE)].find(
          isFocusableControl
        )
        if (control) return control
      }
    return null
  }

  /**
   * The stop's tabindex: nested in a row of another grid, a Tab stop only
   * while focus is in that row (entered from it), out of the Tab order
   * otherwise.
   */
  const stopTabIndex = () => {
    const outer = outerRow?.current
    const doc = table.current?.ownerDocument
    return outer && !outer.contains(doc?.activeElement ?? null) ? "-1" : "0"
  }

  /**
   * Whether `stop` can stay the tab stop: in the table, not a disabled row,
   * and (`layout`, which reads layout) in a cell still laid out.
   */
  const isStop = (stop: HTMLElement | null, layout: boolean) =>
    !!stop &&
    stop.isConnected &&
    stop.closest("table") === table.current &&
    !(stop.tagName === "TR" && infoOf(stop)?.disabled) &&
    // In a cell no longer laid out (a breakpoint passed).
    (!layout ||
      isShown(stop.tagName === "TR" ? stop : (stop.closest("td, th") ?? stop)))

  /**
   * Keeps exactly one tab stop in the table: the focused (or last focused)
   * element. `layout`: whether the stop may have stopped being laid out (a
   * render of the table, a breakpoint passed), which reads layout; rows
   * mounted as the table scrolls do not.
   */
  const sync = ({ layout = true }: { layout?: boolean } = {}) => {
    const el = table.current
    if (!el || !grid) return
    const doc = el.ownerDocument
    // Focus was in the table and its element went (removed rows, a state
    // in their place): the browser has dropped it to the page.
    const lost =
      lastFocused.current !== null &&
      !lastFocused.current.isConnected &&
      (doc.activeElement === null || doc.activeElement === doc.body)
    let stop = tabStop.current
    if (!isStop(stop, layout)) {
      stop = defaultStop(lost)
      tabStop.current = stop
    }
    for (const control of el.querySelectorAll<HTMLElement>(FOCUSABLE)) {
      if (control === stop || control.closest("table") !== el) continue
      if (control.tagName === "TR" && !infos.current.has(control)) continue
      const row = control.closest("tr")
      if (row && !isGridRow(row)) continue
      setTabIndex(control, "-1")
    }
    for (const row of bodyRows()) if (row !== stop) setTabIndex(row, "-1")
    if (stop) setTabIndex(stop, stopTabIndex())
    syncNestedTables()
    for (const element of managed.current.keys())
      if (!element.isConnected) managed.current.delete(element)
    if (lost) {
      lastFocused.current = null
      // The row now at its place (or the nearest), else the body's own
      // control, else the table's first stop.
      const control = bodyRows().length === 0 ? bodyControl() : null
      const target = control ?? defaultStop(true)
      // The row that closed over it, scrolled to when it is out of view.
      const closed = control ? null : closedOver(true)
      if (closed !== null && rowAt(closed) === null)
        whenRendered(closed, focusElement)
      else if (target === control) control?.focus({ preventScroll: true })
      else if (target) focusElement(target)
    }
  }

  /** Out of the Tab order, unless it is the tab stop: what `sync` does to an element. */
  const leaveTabOrder = (control: HTMLElement, el: HTMLTableElement) => {
    if (control === tabStop.current) return
    if (control.tagName === "TR") {
      if (infos.current.has(control)) setTabIndex(control, "-1")
      return
    }
    if (!control.matches(FOCUSABLE) || control.closest("table") !== el) return
    const row = control.closest("tr")
    if (row && !isGridRow(row)) return
    setTabIndex(control, "-1")
  }

  /**
   * `sync` for what changed in the table (`MutationObserver` records): rows
   * mounted as the table scrolls leave the Tab order, without reading
   * layout. Everything else is the whole `sync`: the tab stop or the
   * element focus was on gone, a nested table, the stop's own state.
   */
  const syncChanged = (records: ReadonlyArray<MutationRecord>) => {
    const el = table.current
    if (!el || !grid) return
    const stop = tabStop.current
    const whole = () => sync({ layout: false })
    if (!stop?.isConnected) return whole()
    if (lastFocused.current && !lastFocused.current.isConnected) return whole()
    const added: Array<HTMLElement> = []
    for (const record of records) {
      if (record.type === "attributes") {
        const target = record.target as HTMLElement
        // The stop's own tabindex reset, or its row disabled.
        if (record.attributeName === "tabindex") {
          // Not this grid's own write (a new stop made one).
          if (target === stop) {
            if (target.getAttribute("tabindex") !== stopTabIndex())
              return whole()
          } else added.push(target)
        } else if (target.contains(stop)) return whole()
        continue
      }
      for (const node of record.addedNodes)
        if (node instanceof HTMLElement) added.push(node)
    }
    for (const node of added) {
      if (!node.isConnected) continue
      // A table nested in a row (a detail row's) has its own rules.
      if (node.closest("table") !== el || node.querySelector("table"))
        return whole()
      leaveTabOrder(node, el)
      for (const control of node.querySelectorAll<HTMLElement>(
        `${FOCUSABLE}, tr`
      ))
        leaveTabOrder(control, el)
    }
    for (const element of managed.current.keys())
      if (!element.isConnected) managed.current.delete(element)
  }

  const scrollIntoView = (element: HTMLElement) => {
    element.scrollIntoView({ block: "nearest", inline: "nearest" })
    // A sticky header covers the rows scrolled under it, and so does a
    // sticky footer (a totals row) at the bottom.
    const el = table.current
    const container = el?.parentElement
    if (!el || !container) return
    /** How far a sticky section covers the element (its top's, or its bottom's). */
    const covered = (section: HTMLElement | null, top: boolean) => {
      if (
        !section ||
        section.contains(element) ||
        getComputedStyle(section).position !== "sticky"
      )
        return 0
      const box = element.getBoundingClientRect()
      const over = section.getBoundingClientRect()
      return top ? over.bottom - box.top : box.bottom - over.top
    }
    const under = covered(el.tHead, true)
    const by = under > 0 ? -under : Math.max(0, covered(el.tFoot, false))
    if (by) container.scrollTop += by
  }

  /** Makes `element` the tab stop, the last one out of the Tab order. */
  const moveStop = (element: HTMLElement) => {
    const previous = tabStop.current
    if (previous && previous !== element) setTabIndex(previous, "-1")
    tabStop.current = element
    setTabIndex(element, "0")
  }

  const focusElement = (element: HTMLElement) => {
    moveStop(element)
    element.focus({ preventScroll: true })
    scrollIntoView(element)
  }

  /** Calls `then` with the row at `index`, once it is rendered. */
  const whenRendered = (
    index: number,
    then: (row: HTMLTableRowElement) => void
  ) => {
    const row = rowAt(index)
    if (row) {
      pending.current = null
      then(row)
      return
    }
    const scroll = body.current?.scrollToIndex
    if (!scroll || !isBody(index)) return
    pending.current = { row: index, then }
    scroll(index - headRows().length)
  }

  /**
   * A row `whenRendered` waits for, once a render of the body may have
   * brought it. Nothing else: the rows a scroll mounts are `syncChanged`'s.
   */
  const flushNow = () => {
    const next = pending.current
    if (!next) return
    const row = rowAt(next.row)
    if (!row) return
    pending.current = null
    next.then(row)
    // The stop is the one just moved to, laid out.
    sync({ layout: false })
  }

  // ---- moving -------------------------------------------------------------

  /** The index `steps` enabled rows from `from` within `[start, end)`, or the furthest. */
  const walk = (from: number, steps: number, start: number, end: number) => {
    const direction = Math.sign(steps) || 1
    let remaining = Math.abs(steps) || 1
    let found: number | null = null
    for (let at = from + direction; at >= start && at < end; at += direction) {
      if (disabledAt(at)) continue
      found = at
      if (--remaining === 0) break
    }
    return found
  }

  const edge = (first: boolean, start: number, end: number) =>
    walk(first ? start - 1 : end, first ? 1 : -1, start, end)

  const bodyRange = () => {
    const head = headRows().length
    return [head, head + bodyCount()] as const
  }

  /**
   * Focuses the row at `index` (or its cell in `column`); from the
   * keyboard, Shift extends the selection to it.
   */
  const moveTo = (
    index: number | null,
    column: number | null,
    event?: React.KeyboardEvent,
    { extend = false }: { extend?: boolean } = {}
  ) => {
    if (index === null) return
    whenRendered(index, (row) => {
      const cell = column === null ? null : cellAt(row, column)
      focusElement(cell ? stopsOf(cell)[0] : row)
      if (!extend || !event || !isBody(index)) return
      const info = infoOf(row)
      // A move that selects nothing leaves the anchor where the last
      // selection put it.
      if (info?.value !== undefined && selectionMode === "multiple")
        selection.select(info.value, { range: true, event, reason: "keyboard" })
    })
  }

  const pageSize = () => {
    const container = table.current?.parentElement
    const row = bodyRows()[0] as HTMLTableRowElement | undefined
    const height = row?.getBoundingClientRect().height || 40
    const view = container?.clientHeight || window.innerHeight || 0
    return Math.max(1, Math.floor(view / height) || 10)
  }

  const typeahead = useTypeahead({
    getKeys: allKeys,
    getText: textOf,
    isDisabled,
    getFocused: () => {
      const doc = table.current?.ownerDocument
      const row = (doc?.activeElement as HTMLElement | null)?.closest("tr")
      return infoOf(row)?.value ?? null
    },
    onMatch: (key, event) => {
      const doc = table.current?.ownerDocument
      const active = doc?.activeElement as HTMLElement | null
      const cell = active?.closest("td, th")
      const column = cell && isCell(cell) ? columnOf(cell) : null
      const row = byValue.current.get(key)
      if (row) return moveTo(indexOf(row), column, event)
      const at = allKeys().indexOf(key)
      if (at >= 0) moveTo(headRows().length + at, column, event)
    },
  })

  const owns = (target: EventTarget | null): target is HTMLElement =>
    target instanceof HTMLElement &&
    !!table.current?.contains(target) &&
    target.closest("table") === table.current

  /**
   * Actionable mode's keys, on a control in a cell: Escape or F2 back to
   * the cell, Tab through the row's controls. `true` when the key is
   * actionable mode's (the grid takes it no further).
   */
  const onContentKey = (
    event: React.KeyboardEvent<HTMLTableElement>,
    target: HTMLElement
  ) => {
    if (event.ctrlKey || event.metaKey) return false
    const cell = ownCellOf(target)
    const row = cell?.parentElement as HTMLTableRowElement | undefined
    if (!cell || !row || target === cell || !isGridRow(row)) return false
    const inContent = !stopsOf(cell).includes(target)
    if (!inContent && actionable.current !== row) return false
    switch (event.key) {
      case "Escape":
      case "F2": {
        if (event.shiftKey) return false
        event.preventDefault()
        event.stopPropagation()
        actionable.current = null
        const stop = stopsOf(cell)[0]
        if (stop !== target) focusElement(stop)
        return true
      }
      case "Tab": {
        const controls = rowControls(row)
        const at = controls.indexOf(target)
        const next =
          at < 0 ? undefined : controls[at + (event.shiftKey ? -1 : 1)]
        // From the row's last (or first) control, the browser's Tab leaves
        // the table, as it does from the grid.
        if (!next) return true
        event.preventDefault()
        event.stopPropagation()
        actionable.current = row
        next.focus({ preventScroll: true })
        scrollIntoView(next)
        return true
      }
    }
    return false
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
    own.onKeyDown?.(event)
    if (!grid || event.defaultPrevented || event.altKey) return
    const target = event.target
    if (!owns(target) || onContentKey(event, target) || takesKeys(target))
      return
    const row = target.closest("tr")
    if (!row || !isGridRow(row)) return
    const found = target.closest("td, th")
    const cell =
      found && isCell(found) && found.parentElement === row ? found : null
    const onControl = target !== row && target !== cell
    const index = indexOf(row)
    const inBody = isBody(index)
    const info = inBody ? infoOf(row) : undefined
    const column = cell ? columnOf(cell) : null
    const mod = isMac() ? event.metaKey : event.ctrlKey
    const forward = rtl ? "ArrowLeft" : "ArrowRight"
    const backward = rtl ? "ArrowRight" : "ArrowLeft"
    const [bodyStart, bodyEnd] = bodyRange()
    const handled = () => {
      event.preventDefault()
      event.stopPropagation()
    }
    // Down from a header cell spanning rows: from the last row it spans.
    const spanned = (step: number) =>
      step > 0 && cell ? index + Math.max(1, cell.rowSpan) - 1 : index
    // The grid's own moves end actionable mode.
    if (/^(Arrow|Page|Home$|End$)/.test(event.key)) actionable.current = null

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "PageDown":
      case "PageUp": {
        handled()
        const step =
          (event.key.endsWith("Down") ? 1 : -1) *
          (event.key.startsWith("Page") ? pageSize() : 1)
        const next =
          column === null
            ? walk(index, step, bodyStart, bodyEnd)
            : walk(spanned(step), step, 0, total())
        moveTo(next, column, event, { extend: event.shiftKey })
        return
      }
      case "Home":
      case "End": {
        handled()
        const first = event.key === "Home"
        if (column === null) {
          moveTo(edge(first, bodyStart, bodyEnd), null, event, {
            extend: event.shiftKey && mod,
          })
        } else if (mod) {
          const to = edge(first, 0, total())
          if (to === null) return
          whenRendered(to, (target) =>
            moveTo(to, first ? 0 : lastColumn(target), event, {
              extend: event.shiftKey,
            })
          )
        } else {
          const line = cell ? lineOf(cell) : row
          const to = first ? 0 : lastColumn(line)
          const target = cellAt(line, to)
          if (target) focusElement(stopsOf(target)[0])
        }
        return
      }
      case forward: {
        if (!cell) {
          if (info?.expanded === false && info.onExpandedChange) {
            handled()
            info.onExpandedChange(true, event.nativeEvent)
            return
          }
          const first = shownFrom(row.firstElementChild, 1)
          if (first) {
            handled()
            focusElement(stopsOf(first)[0])
          }
          return
        }
        handled()
        const stops = stopsOf(cell)
        const at = stops.indexOf(target)
        if (at >= 0 && at < stops.length - 1) return focusElement(stops[at + 1])
        const next = besideOf(cell, 1)
        if (next) focusElement(stopsOf(next)[0])
        return
      }
      case backward: {
        if (!cell) {
          if (!inBody || !info) return
          if (info.expanded === true && info.onExpandedChange) {
            handled()
            info.onExpandedChange(false, event.nativeEvent)
            return
          }
          if (info.level !== undefined && info.level > 1) {
            handled()
            const parent = parentIndex(index, info.level)
            if (parent !== null) moveTo(parent, null, event)
            return
          }
          if (!treegrid) {
            const last = shownFrom(row.lastElementChild, -1)
            if (last) {
              handled()
              const stops = stopsOf(last)
              focusElement(stops[stops.length - 1])
            }
          }
          return
        }
        handled()
        const stops = stopsOf(cell)
        const at = stops.indexOf(target)
        if (at > 0) return focusElement(stops[at - 1])
        const previous = besideOf(cell, -1)
        if (previous) {
          const before = stopsOf(previous)
          return focusElement(before[before.length - 1])
        }
        if (inBody && info && !info.disabled) focusElement(row)
        return
      }
      case "F2":
      case "Enter": {
        // A cell whose content is entered (actionable mode): into it.
        const content = cell && !onControl ? contentOf(cell) : []
        if (content.length > 0) {
          handled()
          actionable.current = row
          content[0].focus({ preventScroll: true })
          return
        }
        if (event.key === "F2" || onControl || !info || info.disabled) return
        if (onActivate && info.value !== undefined) {
          handled()
          onActivate(info.value, event.nativeEvent)
          return
        }
        if (info.expanded !== undefined && info.onExpandedChange) {
          handled()
          info.onExpandedChange(!info.expanded, event.nativeEvent)
        }
        return
      }
      case " ": {
        if (onControl) return
        if (typeahead(event)) return
        if (info?.onToggleSelected && selectionMode === "multiple") {
          handled()
          if (!info.disabled) info.onToggleSelected(event.nativeEvent)
          return
        }
        if (!info || info.value === undefined || selectionMode === "none")
          return
        handled()
        selection.select(info.value, {
          toggle: true,
          range: event.shiftKey,
          event,
          reason: "keyboard",
        })
        return
      }
      case "Escape": {
        if (
          selectionMode !== "none" &&
          selection.selected.size > 0 &&
          !disallowEmptySelection
        ) {
          handled()
          selection.clear(event)
        }
        return
      }
      default: {
        if (mod && event.key.toLowerCase() === "a") {
          if (selectionMode === "multiple") {
            handled()
            selection.selectAll(event)
          }
          return
        }
        if (!onControl && !mod) typeahead(event)
      }
    }
  }

  /** The nearest row above `index` with a lower level: the row's parent. */
  const parentIndex = (index: number, level: number): number | null => {
    const [start] = bodyRange()
    for (let at = index - 1; at >= start; at--) {
      const row = rowAt(at)
      const rowLevel = row
        ? infoOf(row)?.level
        : body.current?.describeAt?.(at - start).level
      if (rowLevel !== undefined && rowLevel < level) return at
    }
    return null
  }

  /** Whether a press started on a control inside the row, not on the row. */
  const fromControl = (target: HTMLElement, row: HTMLTableRowElement) => {
    for (
      let element: HTMLElement | null = target;
      element && element !== row;
      element = element.parentElement
    ) {
      if (isCell(element)) continue
      if (element.tagName === "LABEL" || element.matches(FOCUSABLE)) return true
    }
    return false
  }

  const pressedRow = (event: React.MouseEvent) => {
    const target = event.target
    if (!grid || !owns(target)) return null
    const row = target.closest("tr")
    if (!row || !isBody(indexOf(row))) return null
    const info = infoOf(row)
    if (!info || info.disabled || info.value === undefined) return null
    if (fromControl(target, row)) return null
    return { row, info, value: info.value }
  }

  const onMouseDown = (event: React.MouseEvent<HTMLTableElement>) => {
    own.onMouseDown?.(event)
    // Shift + click selects a range: keep the browser from selecting text.
    if (event.shiftKey && selectionMode === "multiple" && pressedRow(event))
      event.preventDefault()
  }

  const onClick = (event: React.MouseEvent<HTMLTableElement>) => {
    own.onClick?.(event)
    if (event.defaultPrevented || event.button !== 0) return
    const pressed = pressedRow(event)
    if (!pressed) return
    const doc = pressed.row.ownerDocument
    const text = doc.getSelection()
    if (text && !text.isCollapsed && pressed.row.contains(text.anchorNode))
      return
    if (!pressed.row.contains(doc.activeElement)) focusElement(pressed.row)
    // The second click of a double click that the first one activated.
    if (event.detail > 1 && clickActivated.current) return
    const mod = isMac() ? event.metaKey : event.ctrlKey
    const activates =
      !!onActivate &&
      (selectionMode === "none" ||
        (selection.selected.size === 0 && !mod && !event.shiftKey))
    clickActivated.current = activates
    if (activates) {
      onActivate(pressed.value, event.nativeEvent)
      return
    }
    if (selectionMode === "none") return
    selection.select(pressed.value, {
      range: event.shiftKey,
      toggle: mod,
      event,
    })
  }

  const onDoubleClick = (event: React.MouseEvent<HTMLTableElement>) => {
    own.onDoubleClick?.(event)
    if (event.defaultPrevented || clickActivated.current) return
    const pressed = pressedRow(event)
    if (pressed) onActivate?.(pressed.value, event.nativeEvent)
  }

  /** The cell of this table's own that holds `target`, through any tables nested in cells. */
  const ownCellOf = (target: Element): HTMLTableCellElement | null => {
    for (let at: Element | null = target; at;) {
      const cell: Element | null = at.closest("td, th")
      if (!cell || !isCell(cell)) return null
      if (cell.closest("table") === table.current) return cell
      at = cell.parentElement
    }
    return null
  }

  /** Where focus is: a row index, a column, whether a body row, its level. */
  const record = (
    row: HTMLTableRowElement,
    cell: HTMLTableCellElement | null
  ) => {
    const index = indexOf(row)
    const inBody = isBody(index)
    const info = inBody ? infoOf(row) : undefined
    position.current = {
      row: index,
      column: cell ? columnOf(cell) : null,
      body: inBody,
      level: info?.level,
      id: info?.value ?? info?.id,
    }
  }

  const onFocus = (event: React.FocusEvent<HTMLTableElement>) => {
    own.onFocus?.(event)
    if (!grid) return
    queueMicrotask(syncNestedTables)
    const target: EventTarget = event.target
    if (
      !owns(target) &&
      target instanceof HTMLElement &&
      table.current?.contains(target)
    ) {
      // In a table nested in a cell (a detail row's): remembered, so focus
      // comes back to the row if that table goes, but never this grid's
      // tab stop.
      const cell = ownCellOf(target)
      const row = cell?.parentElement as HTMLTableRowElement | undefined
      if (!cell || !row || !isGridRow(row)) return
      lastFocused.current = target
      record(row, cell)
      return
    }
    if (!owns(target)) return
    // Focus goes to a resizer only while it resizes (its column's menu
    // sends it there, and takes it back): the table's tab stop stays.
    if (isResizer(target)) return
    lastFocused.current = target
    const row = target.closest("tr")
    if (!row || !isGridRow(row)) return
    const found = target.closest("td, th")
    const cell =
      found && isCell(found) && found.parentElement === row ? found : null
    // A press on a control kept out of the keyboard's way (a tree's
    // chevron, hidden from screen readers) does not make it the tab stop.
    const stop: HTMLElement = target
    if (stop !== row && stop !== cell && !isFocusableControl(stop)) return
    // In a cell's content (entered, pressed or tabbed to): actionable mode,
    // until focus is on a row or a cell, or in another row.
    if (cell && stop !== cell && !stopsOf(cell).includes(stop))
      actionable.current = row
    else if (actionable.current !== row || stop === row || stop === cell)
      actionable.current = null
    if (tabStop.current !== target) moveStop(target)
    record(row, cell)
  }

  const onBlur = (event: React.FocusEvent<HTMLTableElement>) => {
    own.onBlur?.(event)
    // Focus left the element while it was there (to the page, or anywhere):
    // nothing to put back. Only an element removed while focused leaves
    // `lastFocused` set, and a removal that blurs shows as disconnected.
    const left = event.target as HTMLElement
    if (grid) queueMicrotask(syncNestedTables)
    // Leaving the table from a cell's content: the cell is the tab stop,
    // so focus coming back finds the cell, not the field.
    const next = event.relatedTarget
    const leaving = !(next instanceof Node && table.current?.contains(next))
    if (grid && leaving && actionable.current) {
      actionable.current = null
      const cell = owns(left) ? ownCellOf(left) : null
      if (cell && tabStop.current === left && !stopsOf(cell).includes(left))
        moveStop(cell)
    }
    queueMicrotask(() => {
      if (lastFocused.current === left && left.isConnected)
        lastFocused.current = null
    })
  }

  // The handlers read the latest render's state: effects and the context
  // keep stable functions.
  const latest = React.useRef({
    selection,
    headerSelection,
    isDisabled,
    isSelectable,
    canSelectAll,
    sync,
    syncChanged,
    flushNow,
  })
  React.useInsertionEffect(() => {
    latest.current = {
      selection,
      headerSelection,
      isDisabled,
      isSelectable,
      canSelectAll,
      sync,
      syncChanged,
      flushNow,
    }
  })
  const flush = React.useCallback(() => latest.current.flushNow(), [])

  React.useLayoutEffect(() => {
    if (!controller || !grid) return
    controller.current = {
      scrollToRow: (value) => {
        const row = byValue.current.get(value)
        if (row) return scrollIntoView(row)
        const describe = body.current?.describe
        const index = describe
          ? describedRows(describe).indexByKey.get(value)
          : undefined
        if (index !== undefined) body.current?.scrollToIndex?.(index)
      },
      focusRow: (index) => {
        const at = headRows().length + index
        if (isBody(at)) whenRendered(at, focusElement)
      },
      scrollToIndex: (index) => {
        const at = headRows().length + index
        if (isBody(at)) whenRendered(at, scrollIntoView)
      },
    }
    return () => {
      controller.current = null
    }
  })

  // ---- effects ------------------------------------------------------------

  // Controls mounted later (rows scrolled in, a cell's content changing)
  // leave the Tab order too: only what changed is looked at, so a scroll
  // reads no layout.
  React.useLayoutEffect(() => {
    const el = table.current
    if (!grid || !el) return
    latest.current.sync()
    const observer = new MutationObserver((records) =>
      latest.current.syncChanged(records)
    )
    // A control resetting its own tabindex is caught too, and the stop's
    // row turning disabled; `sync` writes only what is wrong, so its own
    // writes settle at once.
    observer.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["tabindex", "aria-disabled"],
    })
    const restore = managed.current
    return () => {
      observer.disconnect()
      // Off again: every element gets its own tabindex back.
      for (const [element, original] of restore)
        putBackTabIndex(element, original)
      restore.clear()
      tabStop.current = null
    }
  }, [grid])

  // A render of the table (a selection, new rows): the rows and controls it
  // mounted are the observer's to take out of the Tab order. What the
  // observer does not see is checked here: the stop gone, disabled or no
  // longer laid out (a breakpoint passed), and the element focus was on.
  React.useLayoutEffect(() => {
    if (!grid) return
    const lost = lastFocused.current && !lastFocused.current.isConnected
    if (lost || !isStop(tabStop.current, true)) sync()
  })

  // The outer row gaining or losing focus wakes or puts to sleep the stop.
  // The row is set after this grid's first layout (a parent's ref comes
  // after its children's effects): the first sync with it is here.
  React.useEffect(() => {
    const outer = outerRow?.current
    if (!grid || !outer) return
    const update = () => queueMicrotask(() => latest.current.sync())
    latest.current.sync()
    outer.addEventListener("focusin", update)
    outer.addEventListener("focusout", update)
    return () => {
      outer.removeEventListener("focusin", update)
      outer.removeEventListener("focusout", update)
    }
  }, [grid, outerRow])

  // Sorting is announced: a header's `aria-sort` turning ascending or
  // descending while focus is in the table.
  React.useEffect(() => {
    const el = table.current
    if (!grid || !el) return
    const observer = new MutationObserver((records) => {
      if (!hasFocus()) return
      for (const record of records) {
        const header = record.target as HTMLElement
        const sort = header.getAttribute("aria-sort")
        if (sort !== "ascending" && sort !== "descending") continue
        const columnName =
          header.getAttribute("aria-label") ?? header.textContent.trim()
        announce(
          t(sort === "ascending" ? "ascendingSort" : "descendingSort", {
            columnName,
          })
        )
        return
      }
    })
    observer.observe(el, {
      attributes: true,
      attributeFilter: ["aria-sort"],
      subtree: true,
    })
    return () => observer.disconnect()
  }, [grid, t])

  // ---- context ------------------------------------------------------------

  // Rows mount and unmount many at a time: one update for them all.
  const rowsQueued = React.useRef(false)
  const register = React.useCallback(
    (row: HTMLTableRowElement, info: { current: RowInfo }) => {
      infos.current.set(row, info)
      const key = info.current.value
      if (key !== undefined) byValue.current.set(key, row)
      const level = info.current.level !== undefined
      if (level) levels.current++
      const changed = () => {
        if (rowsQueued.current) return
        rowsQueued.current = true
        queueMicrotask(() => {
          rowsQueued.current = false
          setTree(levels.current > 0)
          store.set({ rows: store.get().rows + 1 })
        })
      }
      changed()
      return () => {
        infos.current.delete(row)
        if (key !== undefined && byValue.current.get(key) === row)
          byValue.current.delete(key)
        if (level) levels.current--
        changed()
      }
    },
    [store]
  )

  const context = React.useMemo<TableGridContextValue | null>(
    () =>
      grid
        ? {
            store,
            selectionMode,
            register,
            setBody: (next) => {
              body.current = next
            },
            flush,
            select: (key, options) =>
              latest.current.selection.select(key, options),
            toggleAll: (event) => {
              const current = latest.current
              if (current.headerSelection() === "all")
                current.selection.clear(event)
              else current.selection.selectAll(event)
            },
            headerSelection: () => latest.current.headerSelection(),
            isDisabled: (key) => latest.current.isDisabled(key),
            isSelectable: (key) => latest.current.isSelectable(key),
            canSelectAll: () => latest.current.canSelectAll(),
          }
        : null,
    [grid, store, selectionMode, register, flush]
  )

  const ownRef = own.ref
  const ref = React.useCallback(
    (element: HTMLTableElement | null) => {
      table.current = element
      if (typeof ownRef === "function") return ownRef(element)
      if (ownRef) ownRef.current = element
    },
    [ownRef]
  )

  const tableProps: React.ComponentProps<"table"> = grid
    ? {
        ...own,
        ref,
        role: treegrid ? "treegrid" : "grid",
        "aria-multiselectable": selectionMode === "multiple" ? true : undefined,
        onKeyDown,
        onMouseDown,
        onClick,
        onDoubleClick,
        onFocus,
        onBlur,
      }
    : { ...own, ref }

  return { props: tableProps, context }
}

function TableGridProvider({
  value,
  children,
}: {
  value: TableGridContextValue | null
  children: React.ReactNode
}) {
  return (
    <TableGridContext.Provider value={value}>
      {children}
    </TableGridContext.Provider>
  )
}

const IDLE_STORE = createStore<TableGridState>({
  selected: NONE_SELECTED,
  rows: 0,
})

/**
 * For `TableRow`: the `tr`'s props. In a grid table, a body row's
 * selected, disabled and tree state from its `TableRowConfigContext`
 * (`aria-*` and `data-selected` / `data-disabled`). A selection change
 * renders only the rows it selects or clears: a row reads the options and
 * the grid, which stay, and its own selection from the grid's store.
 */
function useTableRow({
  ref,
  children,
  ...rest
}: React.ComponentProps<"tr">): React.ComponentProps<"tr"> {
  const outer = React.useContext(TableScopeContext)
  const config = notOuter(
    React.useContext(TableRowConfigContext),
    outer?.config
  )
  const options = notOuter(
    React.useContext(TableGridOptionsContext),
    outer?.options
  )
  const container = notOuter(
    React.useContext(TableContainerContext),
    outer?.container
  )
  const {
    value,
    disabled = false,
    textValue,
    level,
    expanded,
    onExpandedChange,
    id,
    onToggleSelected,
  } = config ?? {}
  const grid = React.useContext(TableGridContext)
  const selected = useStore(
    grid?.store ?? IDLE_STORE,
    (state) => value !== undefined && state.selected.has(value)
  )
  const info = React.useRef<RowInfo>({
    value,
    disabled,
    textValue,
    level,
    expanded,
    onExpandedChange,
    id,
    onToggleSelected,
  })
  React.useInsertionEffect(() => {
    info.current = {
      value,
      disabled,
      textValue,
      level,
      expanded,
      onExpandedChange,
      id,
      onToggleSelected,
    }
  })
  const register = grid?.register
  const levelled = level !== undefined
  const element = React.useRef<HTMLTableRowElement | null>(null)
  const rowRef = React.useCallback(
    (row: HTMLTableRowElement | null) => {
      element.current = row
      const unregister = row && register ? register(row, info) : undefined
      const cleanup =
        typeof ref === "function"
          ? ref(row)
          : ref
            ? void (ref.current = row)
            : undefined
      return () => {
        unregister?.()
        if (typeof cleanup === "function") cleanup()
        else if (typeof ref === "function") ref(null)
        else if (ref) ref.current = null
      }
    },
    // The row registers again when it starts or stops being a tree row.
    [register, ref, value, levelled]
  )
  // A table nested in a cell is a table of its own: neither the grid's
  // options, nor this row's state, nor the container's ref reach it; a
  // grid row tells it the row it is in.
  const scope = React.useMemo<TableScope | null>(
    () =>
      options === null && config === null && container === null
        ? null
        : { row: grid ? element : null, options, config, container },
    [grid, options, config, container]
  )
  const scoped = scope ? (
    <TableScopeContext value={scope}>{children}</TableScopeContext>
  ) : (
    children
  )
  if (grid === null) return { ...rest, ref, children: scoped }
  return {
    ...rest,
    ref: rowRef,
    "aria-selected":
      grid.selectionMode !== "none" && value !== undefined
        ? selected
        : undefined,
    "aria-disabled": disabled || undefined,
    "aria-level": level,
    "aria-expanded": expanded,
    ...{
      "data-selected": selected ? "true" : undefined,
      "data-disabled": disabled ? "" : undefined,
    },
    children: scoped,
  }
}

/**
 * For `Table`: one ref for its container, the table's own (`own`, the
 * virtualizer's) and the one given (`TableContainerContext`). No classes
 * or style of the component around's (`className` and `style` stay for
 * `Table`, which reads them).
 */
function useTableContainer(own: React.Ref<HTMLDivElement> | undefined) {
  const scope = React.useContext(TableScopeContext)
  const theirs = notOuter(
    React.useContext(TableContainerContext),
    scope?.container
  )
  const ref = React.useCallback(
    (element: HTMLDivElement | null) => {
      for (const target of [own, theirs]) {
        if (typeof target === "function") target(element)
        else if (target) target.current = element
      }
    },
    [own, theirs]
  )
  return { ref, className: undefined, style: undefined }
}

export {
  TableContainerContext,
  TableGridOptionsContext,
  TableGridProvider,
  TableGridValueContext,
  TableRowConfigContext,
  useTableContainer,
  useTableGrid,
  useTableGridContext,
  useTableGridOptions,
  useTableGridRow,
  useTableRow,
}
export type {
  HeaderSelection,
  RowDescription,
  TableGridBody,
  TableGridController,
  TableGridOptions,
  TableRowGridProps,
}
