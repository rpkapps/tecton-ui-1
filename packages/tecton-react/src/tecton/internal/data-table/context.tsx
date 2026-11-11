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
  type ColumnLayout,
  type CsvOptions,
  type DataTableAllMatching,
  type DataTableColumns,
  type DataTableRowModel,
  type DataTableView,
  type DataTableViewChangeReason,
  type Formatter,
} from "./engine/index"
import type { Warn } from "./warnings"

type DataTableSelectionMode = "none" | "single" | "multiple"

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
  | "none"

type DataTablePageSizeChangeReason = "select" | "none"

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
  readonly cellSelectionMode: "none" | "cell" | "range"
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
  readonly pageSizes: ReadonlyArray<number>
}

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
  readonly loading: boolean
  /** `error` as given: `true` or content shows the error state. */
  readonly error: React.ReactNode
}

/** What the parts do; each reads the latest props and state. */
type DataTableActions<T> = {
  /** Whether the view changed: `false` when it is the same, or cancelled. */
  setView: (
    view: DataTableView,
    reason: DataTableViewChangeReason,
    event?: Event
  ) => boolean
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
  /** Focuses the table's tab stop, for a control that goes away while focused. */
  focusTable: () => void
  /** The content's frame, where the table is. */
  setFrame: (element: HTMLElement | null) => void
  /** The row's link, from `itemToHref`. */
  hrefOf: (item: T) => string | undefined
  retry: () => void
  exportCsv: (options?: DataTableExportOptions) => Promise<string>
  /** Warns once in development. */
  warn: Warn
}

type DataTableContextValue<T> = {
  store: Store<DataTableState<T>>
  actions: DataTableActions<T>
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
    if (off)
      warn(
        `off:${part}`,
        `${part} renders nothing: ${feature} is off on its DataTable.`
      )
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
  DataTableActions,
  DataTableChangeDetails,
  DataTableContextValue,
  DataTableExpandedChangeReason,
  DataTableExportOptions,
  DataTableOptions,
  DataTablePageChangeReason,
  DataTablePageSizeChangeReason,
  DataTableSelectionChangeDetails,
  DataTableSelectionChangeReason,
  DataTableSelectionMode,
  DataTableState,
}
