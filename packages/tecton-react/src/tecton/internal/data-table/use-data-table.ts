"use client"

/**
 * `useDataTable()`: the state and actions of the `DataTable` around a
 * custom part (a bulk action bar, a summary, an export button). It renders
 * again on every change of the table's state; the built-in parts select
 * slices instead.
 */
import * as React from "react"

import { useStore } from "../store"
import {
  DataTableContext,
  type DataTableActions,
  type DataTableContextValue,
  type DataTableExportOptions,
  type DataTableState,
} from "./context"
import {
  resetColumns,
  setColumnHidden,
  setColumnOrder,
  setColumnPinned,
  setColumnWidth,
  setFilter,
  setGrouping,
  setSearch,
  setSorting,
  type DataTableAllMatching,
  type DataTableFilterValue,
  type DataTableLeafColumn,
  type DataTableSort,
  type DataTableView,
} from "./engine/index"
import {
  clearSelection,
  collapseAllGroups,
  expandAllGroups,
  exportCsv,
  resetView,
  selectAll,
  selectAllMatching,
  setPageSize,
  setValue,
} from "./more-actions"
import { viewChangeReason } from "./view-reason"

type UseDataTableResult<T> = {
  /** What the table shows: sorting, search, filters, grouping, columns. */
  view: DataTableView
  setView: (view: DataTableView) => void
  setSorting: (sorting: ReadonlyArray<DataTableSort>) => void
  setSearch: (search: string) => void
  /** Sets a column's filter; `null` removes it. */
  setFilter: (column: string, value: DataTableFilterValue | null) => void
  /** Removes every filter and the search. */
  clearFilters: () => void
  /** The columns to group by, by id: the outermost first (`groupable`). */
  setGrouping: (grouping: ReadonlyArray<string>) => void
  /** Back to `defaultView` (or the defaults). */
  resetView: () => void
  /**
   * The columns' order, by id (every column, shown or not; the rest go to
   * their default place, a group's columns side by side).
   */
  setColumnOrder: (order: ReadonlyArray<string>) => void
  /** Hides or shows a column. */
  setColumnHidden: (column: string, hidden: boolean) => void
  /** A column's width in px; `null` returns it to its own. */
  setColumnWidth: (column: string, width: number | null) => void
  /** Pins a column to the start or the end; `null` unpins it. */
  setColumnPinned: (column: string, side: "start" | "end" | null) => void
  /** The columns' order, hidden columns, widths and pins back to `defaultView`'s. */
  resetColumns: () => void
  /** The selected rows' ids. */
  value: ReadonlyArray<string>
  setValue: (value: ReadonlyArray<string>) => void
  /** Every row the view matches, on every page (the loaded ones in server mode). */
  selectAll: () => void
  /** "Select all N": in server mode every row the view matches, loaded or not. */
  selectAllMatching: () => void
  clearSelection: () => void
  /** Server mode: every row the view matches is selected but `except`; else `null`. */
  allMatching: DataTableAllMatching | null
  /** The open tree rows' and detail rows' ids. */
  expanded: ReadonlyArray<string>
  setExpanded: (expanded: ReadonlyArray<string>) => void
  /** Opens every group (groups are open until closed). */
  expandAllGroups: () => void
  /** Closes every group, nested ones too. */
  collapseAllGroups: () => void
  /** Some group (of those the search and filters keep) is closed: `expandAllGroups` opens it. */
  canExpandAllGroups: boolean
  /** Some group (of those the search and filters keep) is open: `collapseAllGroups` closes it. */
  canCollapseAllGroups: boolean
  /** The page shown, from 1. */
  page: number
  pageCount: number
  pageSize: number
  pageSizes: ReadonlyArray<number>
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  /** The items: every one, the ones the view matches, the page's. */
  rows: {
    readonly all: ReadonlyArray<T>
    readonly filtered: ReadonlyArray<T>
    readonly page: ReadonlyArray<T>
  }
  /** The number of rows the view matches (the server's `rowCount` in server mode). */
  rowCount: number
  /** The columns shown, in order. */
  columns: ReadonlyArray<DataTableLeafColumn<T>>
  loading: boolean
  /**
   * The rows as CSV text (RFC 4180): display values, the columns' headers
   * first. Loads the exporter the first time it is called.
   */
  exportCsv: (options?: DataTableExportOptions) => Promise<string>
}

function createResult<T>(
  state: DataTableState<T>,
  actions: DataTableActions<T>
): UseDataTableResult<T> {
  const { model, view } = state
  // Each builds on the view as it is now: two setters called one after the
  // other both apply.
  const update = (
    change: (view: DataTableView) => DataTableView,
    reason: Parameters<DataTableActions<T>["updateView"]>[1]
  ) => actions.updateView(change, reason)
  return {
    view,
    setView: (next) => update(() => next, viewChangeReason),
    setSorting: (sorting) =>
      update((current) => setSorting(current, sorting), "sort"),
    setSearch: (search) =>
      update((current) => setSearch(current, search), "search"),
    setFilter: (column, value) =>
      update((current) => setFilter(current, column, value), "filter"),
    clearFilters: () => {
      actions.clearFilters()
    },
    setGrouping: (grouping) =>
      update((current) => setGrouping(current, grouping), "group"),
    resetView: () => {
      resetView(actions)
    },
    setColumnOrder: (order) =>
      update((current) => setColumnOrder(current, order), "reorder"),
    setColumnHidden: (column, hidden) =>
      update((current) => setColumnHidden(current, column, hidden), "hide"),
    setColumnWidth: (column, width) =>
      update((current) => setColumnWidth(current, column, width), "resize"),
    setColumnPinned: (column, side) =>
      update((current) => setColumnPinned(current, column, side), "pin"),
    resetColumns: () =>
      update((current) => resetColumns(current, state.defaults), "reset"),
    value: state.value,
    setValue: (value) => setValue(actions, value, "none"),
    selectAll: () => selectAll(actions),
    selectAllMatching: () => selectAllMatching(actions),
    clearSelection: () => clearSelection(actions),
    allMatching: state.allMatching,
    expanded: state.expanded,
    setExpanded: (expanded) => actions.setExpanded(expanded, "none"),
    expandAllGroups: () => expandAllGroups(actions),
    collapseAllGroups: () => collapseAllGroups(actions),
    // Counted when read: a part that does not read them costs nothing.
    get canExpandAllGroups() {
      return state.groupCounts().closed > 0
    },
    get canCollapseAllGroups() {
      const counts = state.groupCounts()
      return counts.closed < counts.total
    },
    page: model.page,
    pageCount: model.pageCount,
    pageSize: model.pageSize,
    pageSizes: state.options.pageSizes,
    setPage: (page) => actions.setPage(page, "none"),
    setPageSize: (pageSize) => setPageSize(actions, pageSize, "none"),
    // Read when asked for: the model computes each list on first use.
    rows: {
      get all() {
        return model.allItems()
      },
      get filtered() {
        return model.filteredItems()
      },
      get page() {
        return model.pageItems()
      },
    },
    rowCount: model.rowCount,
    columns: state.layout.columns.map((column) => column.definition),
    loading: state.loading,
    exportCsv: (options) => exportCsv(actions, options),
  }
}

/**
 * The state and actions of the `DataTable` around the caller.
 *
 * @throws When called outside a `DataTable`.
 */
function useDataTable<T = unknown>(): UseDataTableResult<T> {
  const context = React.useContext(
    DataTableContext
  ) as DataTableContextValue<T> | null
  if (!context)
    throw new Error(
      "useDataTable must be called in a component inside a DataTable."
    )
  const state = useStore(context.store, (current) => current)
  return React.useMemo(
    () => createResult(state, context.actions),
    [state, context.actions]
  )
}

export { useDataTable }
export type { UseDataTableResult }
