"use client"

/**
 * What `DataTable` gives its parts: a context whose value never changes (a
 * store and the actions), so a part re-renders only when the slice of the
 * store it selects does, never because the root rendered. The root writes
 * the store after each of its renders; a part reads it with
 * `useDataTableSelector`, picking a primitive or a value the state keeps as
 * it is (the row model, the layout, the view).
 */
import * as React from "react"

import { useLocale } from "@tecton/react/tecton/provider"

import type { ChangeEventDetails } from "../primitives/event-details"
import type { SelectionReason } from "../primitives/selection"
import { useStore, type Store } from "../store"
import {
  resolveLocale,
  type CellGrid,
  type ClosedGroups,
  type ColumnLayout,
  type CsvOptions,
  type DataTableAllMatching,
  type DataTableCellChange,
  type DataTableCellPosition,
  type DataTableCellRange,
  type DataTableCellSelectionChangeReason,
  type DataTableCellsChangeReason,
  type DataTableColumns,
  type DataTableRowModel,
  type DataTableValue,
  type DataTableView,
  type DataTableViewChangeReason,
  type EngineColumn,
  type Formatter,
} from "./engine/index"
import type { Warn } from "./warnings"

// Development only: every warning is behind `process.env.NODE_ENV`,
// written out at its call site so that a consumer's bundler (which replaces
// that expression, not `typeof process`) drops it and its message from a
// production build, and in a `try` so that, with no bundler and no
// `process`, there is no warning rather than an error (`warnings.ts`).
declare const process: { env: { NODE_ENV?: string } }

type DataTableSelectionMode = "none" | "single" | "multiple"

/** Whether cells select: one at a time, or in ranges. */
type DataTableCellSelectionMode = "none" | "cell" | "range"

/** Why the selection changed. */
type DataTableSelectionChangeReason =
  | SelectionReason
  /** "Select all N" in server mode: every row the view matches. */
  | "select-all-matching"
  /** Search or filters changed, which ends "all matching". */
  | "view"
  /** Set through `useDataTable`. */
  | "none"

/** Why rows opened or closed. */
type DataTableExpandedChangeReason = "item-press" | "keyboard" | "none"

/** Why the page changed. */
type DataTablePageChangeReason =
  | "first"
  | "previous"
  | "next"
  | "last"
  /** The view's search, filters, sorting or grouping changed: back to page 1. */
  | "reset"
  /** The page size changed: the page that holds the first row shown. */
  | "page-size"
  /** Rows went away: the page asked for is past the last one, which shows. */
  | "clamp"
  /**
   * A group closed with focus in it, its row on an earlier page (repeated
   * at the top of this one): the page that holds it.
   */
  | "group"
  | "none"

type DataTablePageSizeChangeReason = "select" | "none"

/** How rows were reordered: dragged, moved with the keyboard, or by a screen reader's drop targets. */
type DataTableRowOrderChangeReason = "pointer" | "keyboard" | "virtual"

/** The second argument of every `on…Change` of `DataTable`. */
type DataTableChangeDetails<TReason extends string> =
  ChangeEventDetails<TReason>

type DataTableSelectionChangeDetails =
  DataTableChangeDetails<DataTableSelectionChangeReason> & {
    /**
     * Server mode: every row the view matches is selected but `except`
     * (`value` holds the loaded ones); `null` otherwise.
     */
    allMatching: DataTableAllMatching | null
  }

/** What `exportCsv` exports. */
type DataTableExportOptions = CsvOptions & {
  /** The rows the view matches (default), the selected ones, or the page's. */
  rows?: "filtered" | "selected" | "page"
  /** The columns shown, in their order (default), or every column. */
  columns?: "visible" | "all"
}

/** The root's props that the parts read, as plain flags. */
type DataTableOptions = {
  readonly dataMode: "client" | "server"
  readonly size: "default" | "sm"
  readonly striped: boolean
  readonly sortable: boolean
  readonly filterable: boolean
  readonly groupable: boolean
  readonly editable: boolean
  readonly resizableColumns: boolean
  readonly reorderableColumns: boolean
  readonly hideableColumns: boolean
  readonly pinnableColumns: boolean
  readonly reorderableRows: boolean
  readonly pagination: boolean
  readonly selectionMode: DataTableSelectionMode
  readonly cellSelectionMode: DataTableCellSelectionMode
  /** Cells are focused one by one, as in a spreadsheet: `editable` or a cell selection. */
  readonly cellFocus: boolean
  readonly disabledBehavior: "all" | "selection"
  readonly disallowEmptySelection: boolean
  /** `itemToChildren` is set. */
  readonly tree: boolean
  /** `itemToHref` is set: row headers are links. */
  readonly linked: boolean
  /** `onActivate` or `itemToHref` is set: rows activate. */
  readonly activatable: boolean
  /** `onRetry` is set. */
  readonly retryable: boolean
  /** More rows come after the items (`hasMore`, without pages). */
  readonly hasMore: boolean
  /** The ms between the last key and the search reaching the view. */
  readonly searchDelay: number
  readonly pageSizes: ReadonlyArray<number>
}

/** The groups the search and filters keep, and how many of them are closed. */
type GroupCounts = { readonly total: number; readonly closed: number }

type DataTableState<T> = {
  readonly columns: DataTableColumns<T>
  readonly model: DataTableRowModel<T>
  readonly layout: ColumnLayout<T>
  readonly formatter: Formatter<T>
  readonly view: DataTableView
  /** The view "reset" returns to. */
  readonly defaults: DataTableView
  readonly options: DataTableOptions
  /** The selected ids (in all-matching: the loaded rows but the excepted). */
  readonly value: ReadonlyArray<string>
  readonly selected: ReadonlySet<string>
  /**
   * Every row "select all" selects, and the header checkbox counts: read
   * when asked for, then kept for the row model.
   */
  readonly selectable: () => ReadonlyArray<string>
  readonly allMatching: DataTableAllMatching | null
  readonly expanded: ReadonlyArray<string>
  /** The closed groups (groups are open unless closed). */
  readonly closedGroups: ClosedGroups
  /** The groups there are and how many are closed: worked out when read. */
  readonly groupCounts: () => GroupCounts
  readonly loading: boolean
  /** `error` as given: `true` or content shows the error state. */
  readonly error: React.ReactNode
  /**
   * Bumped by "Clear all", "Clear filters" and a reset, even when the view
   * stays as it was: a search or filter field drops what it was waiting to
   * send.
   */
  readonly clears: number
  /** The cell selection as given (ranges set aside included). */
  readonly cellSelection: ReadonlyArray<DataTableCellRange>
  /**
   * The cell selection over the rows and columns shown: resolved by the
   * code loaded on demand (`cellSelection`), so `null` until it is there,
   * and without a cell selection mode.
   */
  readonly cellGrid: CellGrid<T> | null
  /** The breakpoints the window is below (columns' `hideBelow`), with a cell selection mode or `editable`. */
  readonly cellBelow: ReadonlySet<string>
}

/** A cell being saved (`pending`), or whose value was refused or not saved (`error`). */
type CellMark = {
  /** The write saving it, while it saves. */
  readonly pending: number | null
  /** Why the value written was refused, or not saved. */
  readonly error: string | null
  /** What was written, as text, with `error`. */
  readonly attempted: string | null
  /**
   * The values `error` holds for: the cell's value then, and the value
   * written. Once the cell's value is another (changed from outside), the
   * message is gone.
   */
  readonly values: ReadonlyArray<DataTableValue>
}

/**
 * How cells show their marks: the code that writes puts it in the cells'
 * store with its first mark (`cell-message.tsx`), so none of it loads up
 * front.
 */
type CellWriter = {
  /** A cell's mark as it shows with its value now (a message is gone once the value changes). */
  shownMark: (
    mark: CellMark | undefined,
    value: DataTableValue
  ) => CellMark | undefined
  /** A cell's message: its description and tooltip. */
  Message: React.ComponentType<{ message: string; attempted: string | null }>
  /** Drops every message; the cells saving stay so. */
  clearMessages: (cells: Store<CellsState>) => void
}

/**
 * The cell being edited (`editable`): its row and column, the editor's
 * session (the code on demand's, opaque here) and the message of a draft
 * that is not valid. A new object only when the edit begins, ends or its
 * message changes: typing renders the editor alone, not its row.
 */
type EditingCell = {
  readonly row: string
  readonly column: string
  /** The edit's own number: its editor is new for each edit. */
  readonly id: number
  readonly session: object
  readonly error: string | null
}

/** What the row of the cell being edited gives its editor. */
type CellEditorProps = {
  editing: EditingCell
  column: EngineColumn<unknown>
  item: unknown
  /** The cell's content as it shows, kept under the editor so the cell keeps its size. */
  display: React.ReactNode
  /** Multi-line: a `wrap` column, in a table whose rows may grow. */
  wrap: boolean
}

/**
 * The editors (`editing/`): put in the cells' store by the code on demand
 * as it attaches, so the rows draw an editor only once it is there.
 */
type CellEditor = {
  Editor: React.ComponentType<CellEditorProps>
}

/**
 * The table's editing, as `useDataTable` and a boolean cell's checkbox
 * reach it (`cells.tsx`): kept until its code is there, then handed to it.
 */
type EditRequests = {
  /** Edits a cell (focused first), its value kept. */
  start: (cell: DataTableCellPosition) => void
  /** Ends the edit: saves the draft (`commit`), or drops it. */
  stop: (commit: boolean) => void
  /** Writes a cell's value at once (a boolean cell's checkbox). */
  write: (
    cell: DataTableCellPosition,
    value: DataTableValue,
    event?: Event
  ) => void
}

/** What the rows' cells show of the cell selection and of writes, apart from the table's state. */
type CellsState = {
  /** The cell selection over the rows and columns shown. */
  readonly grid: CellGrid<unknown> | null
  /**
   * A selection is given but not resolved yet (its code is still to
   * come): whether a cell is selected is not known, so it is not said.
   */
  readonly waiting: boolean
  /** The cells being saved or not saved, by row id, then column id. */
  readonly marks: ReadonlyMap<string, ReadonlyMap<string, CellMark>>
  /** How they show, there with the first mark. */
  readonly writer: CellWriter | null
  /** The last change of the cell selection the table made, and why. */
  readonly change: {
    readonly ranges: ReadonlyArray<DataTableCellRange>
    readonly reason: DataTableCellSelectionChangeReason
  } | null
  /** The cell being edited, one at a time. */
  readonly editing: EditingCell | null
  /** The editors, there once their code is. */
  readonly editor: CellEditor | null
  /** The table's editing, while `DataTableContent` is there with `editable`. */
  readonly edits: EditRequests | null
}

/** The second argument of `onCellsChange`. */
type DataTableCellsChangeDetails =
  DataTableChangeDetails<DataTableCellsChangeReason> & {
    /**
     * Aborted when a later write takes over any of these cells (one is
     * enough), or this one is cancelled: a request still running can be
     * cancelled. The cells no later write took over are still this
     * write's: if its promise rejects, they show its message. Roll back
     * compare-and-set (only a cell whose value is still the one written),
     * so a cell a later write took over keeps its later value.
     */
    signal: AbortSignal
  }

/** What the parts do; each reads the latest props and state. */
type DataTableActions<T> = {
  /** Whether the view changed: `false` when it is the same, or cancelled. */
  setView: (
    view: DataTableView,
    reason: DataTableViewChangeReason,
    event?: Event
  ) => boolean
  /** The view as it is now, changes not rendered yet included. */
  currentView: () => DataTableView
  /** Removes the search and every filter ("Clear all"); whether the view changed. */
  clearFilters: (event?: Event) => boolean
  /** Back to the default view; whether it changed. */
  resetView: (event?: Event) => boolean
  /** Changes the view as it is now, changes not rendered yet included. */
  updateView: (
    change: (view: DataTableView) => DataTableView,
    /** The reason, or how to tell it from the view before and after. */
    reason:
      | DataTableViewChangeReason
      | ((
          previous: DataTableView,
          next: DataTableView
        ) => DataTableViewChangeReason),
    event?: Event
  ) => boolean
  /** A sort button pressed: Shift (`multi`) adds the column to the sort. */
  sort: (column: string, multi: boolean, event?: Event) => boolean
  setValue: (
    value: ReadonlyArray<string>,
    reason: DataTableSelectionChangeReason,
    event?: Event
  ) => void
  /** The grid's own selection changes: rows, Space, Ctrl + A, Escape. */
  gridValueChange: (
    value: Array<string>,
    eventDetails: ChangeEventDetails<SelectionReason>
  ) => void
  /**
   * A group's checkbox (or Space on its row): selects every item of the
   * group that can be, or clears them when all are selected.
   */
  toggleGroupSelected: (
    key: string,
    reason: DataTableSelectionChangeReason,
    event?: Event
  ) => void
  /** Opens or closes a group, by its key. */
  setGroupOpen: (key: string, open: boolean) => void
  expandAllGroups: () => void
  collapseAllGroups: () => void
  selectAll: (event?: Event) => void
  /** "Select all N": all-matching in server mode, every matching row in client mode. */
  selectAllMatching: (event?: Event) => void
  clearSelection: (event?: Event) => void
  setExpanded: (
    expanded: ReadonlyArray<string>,
    reason: DataTableExpandedChangeReason,
    event?: Event
  ) => void
  setRowExpanded: (
    id: string,
    expanded: boolean,
    reason: DataTableExpandedChangeReason,
    event?: Event
  ) => void
  setPage: (
    page: number,
    reason: DataTablePageChangeReason,
    event?: Event
  ) => void
  setPageSize: (
    pageSize: number,
    reason: DataTablePageSizeChangeReason,
    event?: Event
  ) => void
  /** A row activated (Enter, a click when rows do not select): `onActivate`, then its link. */
  activate: (id: string, event?: Event) => void
  /**
   * Focuses the table's tab stop, for a control that goes away while
   * focused; `later`: once the change that removes it has rendered.
   */
  focusTable: (later?: boolean) => void
  /** The content's frame, where the table is. */
  setFrame: (element: HTMLElement | null) => void
  /** The row's link, from `itemToHref`. */
  hrefOf: (item: T) => string | undefined
  retry: () => void
  /** The end of the rows came near: `onLoadMore`. */
  loadMore: () => void
  /** Reports a new order of every item's id; `false` when cancelled. */
  reorderRows: (
    ids: ReadonlyArray<string>,
    reason: DataTableRowOrderChangeReason,
    event?: Event
  ) => boolean
  exportCsv: (options?: DataTableExportOptions) => Promise<string>
  /** Whether the cell selection changed: `false` when it is the same, or cancelled. */
  setCellSelection: (
    cellSelection: ReadonlyArray<DataTableCellRange>,
    reason: DataTableCellSelectionChangeReason,
    event?: Event
  ) => boolean
  /** The cell selection as it is now, changes not rendered yet included. */
  currentCellSelection: () => ReadonlyArray<DataTableCellRange>
  /**
   * Reports written cells (`onCellsChange`): whether it was cancelled, and
   * what it returned (a promise while they save).
   */
  changeCells: (
    changes: Array<DataTableCellChange<T>>,
    reason: DataTableCellsChangeReason,
    event: Event | undefined,
    signal: AbortSignal
  ) => { canceled: boolean; result: unknown }
  /** Drops every cell's message (not valid, not saved); the cells saving stay so. */
  clearCellMessages: () => void
  /** Runs a cell command of `useDataTable` (copy, paste, clear, fill down), its code loaded first. */
  runCellCommand: (
    command: "copy" | "paste" | "clear" | "fill",
    options?: { text?: string; escapeFormulas?: boolean }
  ) => Promise<string>
  /** Warns once in development. */
  warn: Warn
}

type DataTableContextValue<T> = {
  store: Store<DataTableState<T>>
  actions: DataTableActions<T>
  /** What the cells show of the cell selection and of writes (`CellsState`). */
  cells: Store<CellsState>
}

const DataTableContext =
  React.createContext<DataTableContextValue<unknown> | null>(null)

/**
 * The table a part is in.
 *
 * @throws When the part is not inside a `DataTable`.
 */
function useDataTableContext<T>(part: string): DataTableContextValue<T> {
  const context = React.useContext(DataTableContext)
  if (!context) throw new Error(`${part} must be used inside a DataTable.`)
  return context as DataTableContextValue<T>
}

/** A slice of the table's state; the part re-renders when it changes. */
function useDataTableSelector<T, TSlice>(
  context: DataTableContextValue<T>,
  selector: (state: DataTableState<T>) => TSlice
): TSlice {
  return useStore(context.store, selector)
}

/**
 * For a part that is UI for a feature: warns once, in development, when the
 * feature is off (the part then renders nothing).
 */
function useFeatureWarning(
  context: DataTableContextValue<unknown>,
  off: boolean,
  part: string,
  feature: string
) {
  const { warn } = context.actions
  React.useEffect(() => {
    try {
      if (process.env.NODE_ENV !== "production" && off)
        warn(
          `off:${part}`,
          `${part} renders nothing: ${feature} is off on its DataTable.`
        )
    } catch {
      // No `process` (no bundler): no warning.
    }
  }, [warn, off, part, feature])
}

/** Numbers in the locale in scope, as the counts and pages show them. */
function useNumberFormat() {
  const { locale } = useLocale()
  return React.useMemo(
    () => new Intl.NumberFormat(resolveLocale(locale)),
    [locale]
  )
}

export {
  DataTableContext,
  useDataTableContext,
  useDataTableSelector,
  useFeatureWarning,
  useNumberFormat,
}
export type {
  CellEditor,
  CellEditorProps,
  CellMark,
  CellsState,
  CellWriter,
  EditingCell,
  EditRequests,
  DataTableActions,
  DataTableCellSelectionMode,
  DataTableCellsChangeDetails,
  DataTableChangeDetails,
  DataTableContextValue,
  DataTableExpandedChangeReason,
  DataTableExportOptions,
  DataTableOptions,
  DataTablePageChangeReason,
  DataTablePageSizeChangeReason,
  DataTableRowOrderChangeReason,
  DataTableSelectionChangeDetails,
  DataTableSelectionChangeReason,
  DataTableSelectionMode,
  DataTableState,
  GroupCounts,
}
