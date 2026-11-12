"use client"

/**
 * Internal to `@tecton/react`: the grid mode of `Table`, which `DataTable`
 * turns on with `TableGridConfig` (and each body row's state with
 * `TableRowConfig`). The table becomes an ARIA
 * grid (a treegrid when its rows have a `level`) that is one tab stop and
 * is moved through with the keyboard, with rows that select:
 *
 * - Up / Down move between rows, or between the cells of a column (the
 *   header's too); Left / Right move between a row and its cells and
 *   between the cells, mirrored right to left, through each control of a
 *   cell. Home / End go to the first / last row, or cell of the row (with
 *   Ctrl / Cmd: of the table); Page Up / Down move a page; typing a row's
 *   first letters goes to it.
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
 * - Space selects the focused row (Shift: the range to it; Ctrl / Cmd: adds
 *   or removes it), Shift with the arrows extends the selection, Ctrl /
 *   Cmd + A selects every row, Escape clears the selection. With the
 *   "toggle" behaviour (checkboxes) a click toggles a row and the arrows
 *   only move; with "replace" a click and the arrows select only the row.
 * - Enter calls `onActivate`, and so does a double click; a single click
 *   does when rows do not select, or (with "toggle") while none is
 *   selected. Enter on a row with `expanded` opens or closes it, and so do
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

import { useDirection } from "@tecton/react/tecton/provider"

import { useTranslations } from "./i18n/translations"
import type { ChangeEventDetails } from "./primitives/event-details"
import { announce } from "./primitives/live-announcer"
import { useTypeahead } from "./primitives/navigation"
import {
  useSelection,
  type SelectionBehavior,
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
  /** The selected rows' `value`s (controlled). */
  value?: ReadonlyArray<string>
  /** The rows selected at first, when not controlled. */
  defaultValue?: ReadonlyArray<string>
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
   * How a click, Space and the arrows select: `"toggle"` (default, as with
   * checkboxes) adds or removes the row, and the arrows only move focus;
   * `"replace"` selects only the row, and the arrows move the selection.
   */
  selectionBehavior?: SelectionBehavior
  /**
   * Called with a row's `value` and the event when it is activated: Enter, a
   * double click, or a click when rows do not select (with "toggle": while
   * none is selected).
   */
  onActivate?: (value: string, event: Event) => void
  /**
   * A body row's state read from its item (`TableBody` `items`): how the
   * rows out of view of a virtualized table are known.
   */
  describeItem?: (item: never, index: number) => RowDescription
  /**
   * Every row "select all" (Ctrl / Cmd + A, the header checkbox) stands for,
   * rows on other pages included: the body's rows by default.
   */
  getAllValues?: () => ReadonlyArray<string>
  /**
   * Whether a row that is not `disabled` can be selected; one that cannot is
   * still focused and activated.
   */
  isSelectable?: (value: string) => boolean
  /**
   * Whether a row is disabled, rows out of view included: given with
   * `getAllValues`, select all and the header read it instead of reading
   * every row's description.
   */
  isDisabled?: (value: string) => boolean
  /** The number of rows selected, for announcements: the selection's size by default. */
  getSelectedCount?: (selected: ReadonlySet<string>) => number
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
}

/** A body row's grid state, given by `TableRowConfig`. */
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

/** Turns a `Table` inside it into a grid. */
const TableGridConfigContext = React.createContext<TableGridOptions | null>(
  null
)

/** The grid state of the body row inside it. */
const TableRowConfigContext = React.createContext<TableRowGridProps | null>(
  null
)

function TableGridConfig({
  value,
  children,
}: {
  value: TableGridOptions
  children: React.ReactNode
}) {
  return (
    <TableGridConfigContext.Provider value={value}>
      {children}
    </TableGridConfigContext.Provider>
  )
}

function useTableGridConfig() {
  return React.useContext(TableGridConfigContext)
}

/** A body row with its grid state; the props go to the `TableRow` it renders. */
function TableRowConfig({
  value,
  children,
}: {
  value: TableRowGridProps
  children: React.ReactNode
}) {
  return (
    <TableRowConfigContext.Provider value={value}>
      {children}
    </TableRowConfigContext.Provider>
  )
}

/**
 * The row of an outer grid a table is nested in (a detail row's): the
 * nested grid's tab stop is out of the Tab order while focus is outside
 * that row, so the outer grid stays one Tab stop.
 */
const TableOuterRowContext =
  React.createContext<React.RefObject<HTMLTableRowElement | null> | null>(null)

/** The row a `DataTableSelectionCheckbox` is in. */
const TableGridRowContext = React.createContext<{
  value: string | undefined
  disabled: boolean
} | null>(null)

function useTableGridContext() {
  return React.useContext(TableGridContext)
}

function useTableGridRow() {
  return React.useContext(TableGridRowContext)
}

/** Elements that take focus, besides the rows and cells the grid focuses. */
const FOCUSABLE =
  'a[href], area[href], button, input, select, textarea, iframe, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]'

const isMac = () =>
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform)

const TEXT_INPUTS = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
])

/** A field that takes the arrow keys and typing itself. */
function isTextEntry(element: HTMLElement) {
  if (element.isContentEditable) return true
  if (element instanceof HTMLTextAreaElement) return true
  if (element instanceof HTMLSelectElement) return true
  if (element instanceof HTMLInputElement) return TEXT_INPUTS.has(element.type)
  const role = element.getAttribute("role")
  return role === "textbox" || role === "combobox" || role === "spinbutton"
}

/**
 * A control that takes keys the grid would take (the arrows, Home / End,
 * Space, typing): a text field, a select, a slider, a radio. The grid
 * leaves its keys to it, and a cell holding one is entered (`contentOf`).
 */
function takesKeys(element: HTMLElement) {
  if (isTextEntry(element)) return true
  if (element instanceof HTMLInputElement)
    return element.type === "range" || element.type === "radio"
  const role = element.getAttribute("role")
  return role === "slider" || role === "radio" || role === "listbox"
}

function isCell(element: Element): element is HTMLTableCellElement {
  return element.tagName === "TD" || element.tagName === "TH"
}

/** Whether a cell is laid out: not hidden below a breakpoint (`hidden md:table-cell`). */
function isShown(cell: Element) {
  if (cell.getClientRects().length > 0) return true
  // No boxes: hidden, unless nothing in the table is laid out (a table not
  // rendered yet, or no layout at all), when every cell counts.
  const table = cell.closest("table")
  return !table || table.getClientRects().length === 0
}

/** The nearest cell laid out from `cell` on, `step` 1 forwards or -1 backwards. */
function shownFrom(cell: Element | null, step: 1 | -1) {
  for (
    let at = cell;
    at;
    at = step === 1 ? at.nextElementSibling : at.previousElementSibling
  )
    if (isCell(at) && isShown(at)) return at
  return null
}

/** A column resizer: never one of the grid's stops, nor its tab stop. */
function isResizer(element: HTMLElement) {
  return element.dataset.slot === "table-column-resizer"
}

/**
 * A control the user can focus (not disabled, hidden or inert). A column
 * resizer is left out: it takes the arrow keys itself, so it is reached
 * through its column's menu ("Resize column") instead.
 */
function isFocusableControl(element: HTMLElement) {
  if (element.tagName === "TR" || isCell(element)) return false
  if (isResizer(element)) return false
  if ((element as HTMLButtonElement).disabled) return false
  if (element instanceof HTMLInputElement && element.type === "hidden")
    return false
  if (element.hidden || element.closest('[aria-hidden="true"], [inert]'))
    return false
  return true
}

const NONE_SELECTED: ReadonlySet<string> = new Set()

/**
 * For `Table`: the `table`'s props (the caller's, with the grid's role,
 * handlers and ref when a `TableGridConfig` is around it) and the context
 * its rows read.
 */
function useTableGrid(own: React.ComponentProps<"table">) {
  const config = React.useContext(TableGridConfigContext)
  const grid = config !== null
  const {
    selectionMode: selectionModeProp = "none",
    value,
    defaultValue,
    onValueChange,
    disallowEmptySelection = false,
    selectionBehavior = "toggle",
    onActivate,
    getAllValues,
    isSelectable: isSelectableProp,
    isDisabled: isDisabledProp,
    getSelectedCount,
    tree: treeProp = false,
    controller,
    restoreFocusTo,
  } = config ?? {}
  const t = useTranslations("table")
  const rtl = useDirection() === "rtl"
  const outerRow = React.useContext(TableOuterRowContext)
  const selectionMode: SelectionMode = grid ? selectionModeProp : "none"
  const behavior: SelectionBehavior = selectionBehavior

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
    if (row) return !!infoOf(row)?.disabled
    if (isDisabledProp) return isDisabledProp(key)
    return !!describedRow(key)?.disabled
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

  // ---- selection ----------------------------------------------------------

  const isSelectable = (key: string) =>
    !isDisabled(key) && (isSelectableProp?.(key) ?? true)

  /** The rows "select all" stands for: every one given, or the body's. */
  const everyKey = (): Array<string> =>
    getAllValues ? [...getAllValues()] : allKeys()

  const selection = useSelection({
    mode: selectionMode,
    behavior,
    value,
    defaultValue,
    onValueChange,
    disallowEmptySelection,
    isSelectable,
    getOrder: allKeys,
    getAllKeys: everyKey,
  })

  const [store] = React.useState(() =>
    createStore<TableGridState>({ selected: NONE_SELECTED, rows: 0 })
  )
  React.useLayoutEffect(() => {
    store.set({ selected: grid ? selection.selected : NONE_SELECTED })
  }, [store, grid, selection.selected])

  const hasFocus = () => {
    const el = table.current
    return !!el && el.contains(el.ownerDocument.activeElement)
  }

  useSelectionAnnouncement({
    selected: selection.selected,
    mode: selectionMode,
    behavior,
    hasFocus,
    getText: textOf,
    getCount: getSelectedCount && (() => getSelectedCount(selection.selected)),
    // "All items selected" once there are as many selected as rows: a
    // virtualized table's rows are not read for it, as they are not rendered.
    getAllKeys: () =>
      getAllValues
        ? getAllValues()
        : selection.selected.size < bodyCount()
          ? [""]
          : body.current?.describe
            ? [...selection.selected]
            : allKeys().filter((key) => !isDisabled(key)),
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
    if (getAllValues) {
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
    const keys = body.current?.describe
      ? null
      : bodyRows()
          .map(infoOf)
          .filter((info) => info?.value !== undefined && !info.disabled)
          .map((info) => info!.value!)
    if (keys === null) return selected.size >= bodyCount() ? "all" : "some"
    return keys.length > 0 && keys.every((key) => selected.has(key))
      ? "all"
      : "some"
  }

  // Known only from the rows given: the body's rows register after they
  // render, and a checkbox enabled then would flicker.
  const canSelectAll = () =>
    selectionMode === "multiple" &&
    (!getAllValues || givenKeys(getAllValues()).keys.length > 0)

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
    const original = managed.current.get(element)
    managed.current.delete(element)
    if (original === null || original === undefined)
      element.removeAttribute("tabindex")
    else element.setAttribute("tabindex", original)
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
    let column = 0
    for (const other of (cell.parentElement as HTMLTableRowElement).cells) {
      if (other === cell) return column
      column += other.colSpan
    }
    return column
  }

  /** The cell in `column`, or the nearest one laid out when it is not. */
  const cellAt = (row: HTMLTableRowElement, column: number) => {
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
    const last = shownFrom(row.lastElementChild, -1)
    return last ? columnOf(last) : 0
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

  /** Keeps exactly one tab stop in the table: the focused (or last focused) element. */
  const sync = () => {
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
    if (
      !stop ||
      !stop.isConnected ||
      stop.closest("table") !== el ||
      (stop.tagName === "TR" && infoOf(stop)?.disabled) ||
      // In a cell no longer laid out (a breakpoint passed).
      !isShown(stop.tagName === "TR" ? stop : (stop.closest("td, th") ?? stop))
    ) {
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
    // Nested in a row of another grid: a Tab stop only while focus is in
    // that row (entered from it), out of the Tab order otherwise.
    const outer = outerRow?.current
    const dormant = !!outer && !outer.contains(doc.activeElement)
    if (stop) setTabIndex(stop, dormant ? "-1" : "0")
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

  const scrollIntoView = (element: HTMLElement) => {
    element.scrollIntoView({ block: "nearest", inline: "nearest" })
    // A sticky header covers the rows scrolled under it, and so does a
    // sticky footer (a totals row) at the bottom.
    const container = table.current?.parentElement
    if (!container) return
    const head = table.current?.tHead
    if (
      head &&
      !head.contains(element) &&
      getComputedStyle(head).position === "sticky"
    ) {
      const covered =
        head.getBoundingClientRect().bottom -
        element.getBoundingClientRect().top
      if (covered > 0) return void (container.scrollTop -= covered)
    }
    const foot = table.current?.tFoot
    if (
      foot &&
      !foot.contains(element) &&
      getComputedStyle(foot).position === "sticky"
    ) {
      const covered =
        element.getBoundingClientRect().bottom -
        foot.getBoundingClientRect().top
      if (covered > 0) container.scrollTop += covered
    }
  }

  const focusElement = (element: HTMLElement) => {
    const previous = tabStop.current
    if (previous && previous !== element) setTabIndex(previous, "-1")
    tabStop.current = element
    setTabIndex(element, "0")
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

  const flushNow = () => {
    const next = pending.current
    if (next) {
      const row = rowAt(next.row)
      if (row) {
        pending.current = null
        next.then(row)
      }
    }
    sync()
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
   * keyboard, the selection follows with the "replace" behaviour, and
   * Shift extends it.
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
      if (!event || !isBody(index)) return
      const info = infoOf(row)
      if (!info || info.value === undefined || selectionMode === "none") return
      const mod = isMac() ? event.metaKey : event.ctrlKey
      if (extend && selectionMode === "multiple")
        selection.select(info.value, { range: true, event, reason: "keyboard" })
      // The arrows move the selection only with "replace"; with "toggle"
      // (checkboxes) they only move focus, and Shift extends. A move that
      // selects nothing leaves the anchor where the last selection put it.
      else if (behavior === "replace" && !mod)
        selection.select(info.value, { event, reason: "keyboard" })
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
    getKeys: () =>
      body.current?.describe
        ? allKeys()
        : bodyRows().flatMap((row) => {
            const key = infoOf(row)?.value
            return key === undefined ? [] : [key]
          }),
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
    // The grid's own moves end actionable mode.
    if (/^(Arrow|Page|Home$|End$)/.test(event.key)) actionable.current = null

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        handled()
        const step = event.key === "ArrowDown" ? 1 : -1
        const next =
          column === null
            ? walk(index, step, bodyStart, bodyEnd)
            : walk(index, step, 0, total())
        moveTo(next, column, event, { extend: event.shiftKey })
        return
      }
      case "PageDown":
      case "PageUp": {
        handled()
        const step = (event.key === "PageDown" ? 1 : -1) * pageSize()
        const next =
          column === null
            ? walk(index, step, bodyStart, bodyEnd)
            : walk(index, step, 0, total())
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
          const to = first ? 0 : lastColumn(row)
          const target = cellAt(row, to)
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
        const next = shownFrom(cell.nextElementSibling, 1)
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
        const previous = shownFrom(cell.previousElementSibling, -1)
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
          toggle: mod || behavior === "toggle",
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
        (behavior === "toggle" &&
          selection.selected.size === 0 &&
          !mod &&
          !event.shiftKey))
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
    if (tabStop.current !== target) {
      if (tabStop.current) setTabIndex(tabStop.current, "-1")
      tabStop.current = target
      setTabIndex(target, "0")
    }
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
      if (cell && tabStop.current === left && !stopsOf(cell).includes(left)) {
        setTabIndex(left, "-1")
        tabStop.current = cell
        setTabIndex(cell, "0")
      }
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
    }
    return () => {
      controller.current = null
    }
  })

  // ---- effects ------------------------------------------------------------

  // Controls mounted later (rows scrolled in, a cell's content changing)
  // leave the Tab order too.
  React.useLayoutEffect(() => {
    const el = table.current
    if (!grid || !el) return
    latest.current.sync()
    let queued = false
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      queueMicrotask(() => {
        queued = false
        latest.current.sync()
      })
    })
    // A control resetting its own tabindex is caught too; `sync` writes only
    // what is wrong, so its own writes settle at once.
    observer.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["tabindex"],
    })
    const restore = managed.current
    return () => {
      observer.disconnect()
      // Off again: every element gets its own tabindex back.
      for (const [element, original] of restore) {
        if (original === null) element.removeAttribute("tabindex")
        else element.setAttribute("tabindex", original)
      }
      restore.clear()
      tabStop.current = null
    }
  }, [grid])

  React.useLayoutEffect(() => {
    if (grid) sync()
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
 * selected, disabled and tree state from its `TableRowConfig` (`aria-*`
 * and `data-selected` / `data-disabled`).
 */
function useTableRow({
  ref,
  children,
  ...rest
}: React.ComponentProps<"tr">): React.ComponentProps<"tr"> {
  const config = React.useContext(TableRowConfigContext)
  const gridConfig = React.useContext(TableGridConfigContext)
  const containerConfig = React.useContext(TableContainerConfigContext)
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
  const row = React.useMemo(() => ({ value, disabled }), [value, disabled])
  // A table nested in a cell is a table of its own: neither the grid's
  // options, nor this row's state, nor the container's config reach it;
  // a grid row tells it the row it is in.
  const isolated =
    gridConfig === null && config === null && containerConfig === null ? (
      children
    ) : (
      <TableGridConfigContext.Provider value={null}>
        <TableRowConfigContext.Provider value={null}>
          <TableContainerConfigContext.Provider value={null}>
            {grid ? (
              <TableOuterRowContext.Provider value={element}>
                {children}
              </TableOuterRowContext.Provider>
            ) : (
              children
            )}
          </TableContainerConfigContext.Provider>
        </TableRowConfigContext.Provider>
      </TableGridConfigContext.Provider>
    )
  if (!grid) return { ...rest, ref, children: isolated }
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
    children: (
      <TableGridRowContext.Provider value={row}>
        {isolated}
      </TableGridRowContext.Provider>
    ),
  }
}

/**
 * What a `Table`'s scroll container takes from the component around the
 * table (`DataTable`): classes and a style of its own (the fade at pinned
 * columns' edges), and its element, handed back through `ref`. Internal,
 * like grid mode: a plain `Table` never sees it.
 */
type TableContainerOptions = {
  className?: string
  style?: React.CSSProperties
  ref?: React.Ref<HTMLDivElement>
}

const TableContainerConfigContext =
  React.createContext<TableContainerOptions | null>(null)

/** Gives the scroll container of the `Table` inside it `value`. */
function TableContainerConfig({
  value,
  children,
}: {
  value: TableContainerOptions
  children: React.ReactNode
}) {
  return (
    <TableContainerConfigContext.Provider value={value}>
      {children}
    </TableContainerConfigContext.Provider>
  )
}

/**
 * For `Table`: its container's extra classes and style, and one ref for
 * the table's own (`own`, the virtualizer's) and the config's.
 */
function useTableContainer(own: React.Ref<HTMLDivElement> | undefined) {
  const config = React.useContext(TableContainerConfigContext)
  const theirs = config?.ref
  const ref = React.useCallback(
    (element: HTMLDivElement | null) => {
      for (const target of [own, theirs]) {
        if (typeof target === "function") target(element)
        else if (target) target.current = element
      }
    },
    [own, theirs]
  )
  return { ref, className: config?.className, style: config?.style }
}

export {
  TableContainerConfig,
  TableGridConfig,
  TableGridProvider,
  TableRowConfig,
  useTableContainer,
  useTableGrid,
  useTableGridConfig,
  useTableGridContext,
  useTableGridRow,
  useTableRow,
}
export type {
  HeaderSelection,
  RowDescription,
  TableGridBody,
  TableContainerOptions,
  TableGridController,
  TableGridOptions,
  TableRowGridProps,
}
