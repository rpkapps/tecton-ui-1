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
  type ClosedGroups,
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

// Development only: every warning is behind `process.env.NODE_ENV`,
// written out at its call site so that a consumer's bundler (which replaces
// that expression, not `typeof process`) drops it and its message from a
// production build, and in a `try` so that, with no bundler and no
// `process`, there is no warning rather than an error (`warnings.ts`).
declare const process: { env: { NODE_ENV?: string } }

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
  | "previous"
  | "next"
  /**
   * A page's own button, or the page picker ("Go to page", opened from an
   * ellipsis or from "Page 3 of 5").
   */
  | "page"
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
  readonly resizableColumns: boolean
  readonly reorderableColumns: boolean
  readonly hideableColumns: boolean
  readonly pinnableColumns: boolean
  /** Rows are dragged into order (`reorderableRows`, not in a tree). */
  readonly reorderableRows: boolean
  readonly pagination: boolean
  readonly selectionMode: DataTableSelectionMode
  readonly disabledBehavior: "all" | "selection"
  readonly disallowEmptySelection: boolean
  /** `itemToChildren` is set. */
  readonly tree: boolean
  /** `itemToHref` is set: row headers are links. */
  readonly linked: boolean
  /** `itemToDisabledReason` is set: a disabled row's checkbox may say why. */
  readonly disabledReasons: boolean
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
  /** Why a disabled row cannot be selected, from `itemToDisabledReason`. */
  disabledReasonOf: (item: T) => React.ReactNode | undefined
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
  DataTableActions,
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
