"use client"

/**
 * `DataTableContent`: the table itself, a `Table` in grid mode (one tab
 * stop, the keyboard, selection and announcements of `table-grid.tsx`) in a
 * rounded frame. It renders the header from the column layout, the rows
 * the engine gives (the page's, every one for a virtualized body, which
 * mounts only those in view and reads the others through `describeItem`),
 * and the states: empty, no results, error, loading.
 *
 * It reads only the slices of the table's state it draws: a selection
 * change reaches the grid (its `value`) and the rows it changes, not this
 * component, the header or the other rows.
 */
import * as React from "react"
import { cn } from "cn"

import { Table, TableBody } from "@tecton/react/components/table"

import { useTranslations } from "../i18n/translations"
import { TableGridConfig, type TableGridOptions } from "../table-grid"
import type { RowShared } from "./cell"
import {
  useDataTableContext,
  useDataTableSelector,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"
import { clearFilters, type BodyRow } from "./engine/index"
import { viewChangeReason } from "./view-reason"
import { DataTableHeader } from "./header"
import { describeRow, renderRow } from "./row"
import {
  DataTableEmptyState,
  DataTableErrorState,
  DataTableNoResultsState,
  DataTableProgress,
  loadingRows,
} from "./states"

type DataTableContentProps = Omit<React.ComponentProps<"div">, "children"> & {
  /**
   * Renders only the rows in view. The table fills and scrolls in its frame,
   * which needs a bounded height (`className="h-96"`, or a root of bounded
   * height); rows are one height.
   */
  virtualized?: boolean
  /** Shown when there are no rows, in place of the default. */
  empty?: React.ReactNode
  /** Shown when no row matches the search and filters, in place of the default. */
  noResults?: React.ReactNode
}

type Row = BodyRow<unknown>

const NO_ROWS: ReadonlyArray<Row> = []

/** Rows shown while the first rows load, without pages. */
const LOADING_ROWS = 5

/**
 * The grid's options with the selection: the one part that renders on a
 * selection change, re-rendering the `Table` (whose rows read their own
 * selection), not the elements inside it.
 */
function DataTableGrid({
  context,
  options,
  children,
}: {
  context: DataTableContextValue<unknown>
  options: TableGridOptions
  children: React.ReactNode
}) {
  const value = useDataTableSelector(context, (state) => state.value)
  const config = React.useMemo(() => ({ ...options, value }), [options, value])
  return <TableGridConfig value={config}>{children}</TableGridConfig>
}

/** The header's height while `active`, for the bar under it. */
function useHeaderHeight(
  frame: React.RefObject<HTMLDivElement | null>,
  active: boolean
) {
  const [height, setHeight] = React.useState(0)
  React.useLayoutEffect(() => {
    const head = frame.current?.querySelector("thead")
    if (!active || !head) return
    const update = () => setHeight(head.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(head)
    return () => observer.disconnect()
  }, [frame, active])
  return height
}

/**
 * What the table's live region says: "Loading" while it loads, then the
 * rows loaded, or "No results" when nothing matches. Nothing on the first
 * render: a table that is there from the start is not announced.
 */
function useStatus({
  failed,
  loading,
  rows,
  rowCount,
  noResults,
}: {
  /** The error state says it, as an alert. */
  failed: boolean
  loading: boolean
  rows: number
  rowCount: number
  noResults: boolean
}) {
  const t = useTranslations("dataTable")
  const format = useNumberFormat()
  const [loaded, setLoaded] = React.useState(false)
  const wasLoading = React.useRef(loading)
  React.useEffect(() => {
    if (wasLoading.current && !loading) setLoaded(true)
    wasLoading.current = loading
  }, [loading])
  if (failed) return ""
  if (loading) return t("loading")
  if (noResults) return t("noResultsTitle")
  if (!loaded) return ""
  return rows === 0
    ? t("emptyTitle")
    : t("rowsLoaded", { count: rowCount, total: format.format(rowCount) })
}

function DataTableContentImpl({
  virtualized = false,
  empty,
  noResults,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DataTableContentProps) {
  const context = useDataTableContext<unknown>("DataTableContent")
  const { actions, store } = context
  const columns = useDataTableSelector(context, (state) => state.columns)
  const model = useDataTableSelector(context, (state) => state.model)
  const layout = useDataTableSelector(context, (state) => state.layout)
  const formatter = useDataTableSelector(context, (state) => state.formatter)
  const options = useDataTableSelector(context, (state) => state.options)
  const sorting = useDataTableSelector(context, (state) => state.view.sorting)
  const grouped = useDataTableSelector(
    context,
    (state) => state.view.grouping.length > 0
  )
  const searching = useDataTableSelector(
    context,
    (state) =>
      state.view.search.trim() !== "" ||
      Object.keys(state.view.filters).length > 0
  )
  const loading = useDataTableSelector(context, (state) => state.loading)
  const error = useDataTableSelector(context, (state) => state.error)
  const server = options.dataMode === "server"

  const selection = options.selectionMode !== "none"
  const rowHeader = layout.columns.find(
    (column) => column.id === layout.rowHeader
  )
  const shared = React.useMemo<RowShared<unknown>>(
    () => ({
      columns: layout.columns,
      rowHeader,
      formatter,
      selection,
      levelled: options.tree || grouped,
      tree: options.tree,
      disableRows: options.disabledBehavior === "all",
      linked: options.linked,
      wrap: !virtualized,
      columnCount: layout.columns.length + (selection ? 1 : 0),
      rowIndexOf: options.pagination ? model.indexOfRow : null,
      headerRows: layout.headerRows.length,
      actions,
    }),
    [
      layout.columns,
      rowHeader,
      formatter,
      selection,
      options.tree,
      grouped,
      options.disabledBehavior,
      options.linked,
      options.pagination,
      // On pages only: a new model gives the rows new places.
      options.pagination ? model : null,
      layout.headerRows.length,
      virtualized,
      actions,
    ]
  )
  const render = React.useCallback(
    (row: Row) => renderRow(row, shared),
    [shared]
  )
  const describeItem = React.useCallback(
    (row: Row) => describeRow(row, shared),
    [shared]
  )
  const grid = React.useMemo<TableGridOptions>(
    () => ({
      selectionMode: options.selectionMode,
      disallowEmptySelection: options.disallowEmptySelection,
      onValueChange: actions.gridValueChange,
      onActivate: options.activatable ? actions.activate : undefined,
      describeItem,
      tree: shared.levelled,
      // Select all and the header read the engine, never the rows'
      // descriptions: no row is formatted or described for them.
      getAllValues: () => store.get().selectable(),
      // Disabled rows are disabled in the grid with "all"; with "selection"
      // they are only kept from being selected.
      isDisabled:
        options.disabledBehavior === "all"
          ? (id) => store.get().model.isDisabled(id)
          : () => false,
      isSelectable: (id) => !store.get().model.isDisabled(id),
      // In server "all matching", the rows the server matches but the
      // excepted ones.
      getSelectedCount: (selected) => {
        const { allMatching, model: current } = store.get()
        return allMatching
          ? Math.max(0, current.rowCount - allMatching.except.length)
          : selected.size
      },
    }),
    [
      options.selectionMode,
      options.disallowEmptySelection,
      options.activatable,
      options.disabledBehavior,
      actions,
      describeItem,
      shared.levelled,
      store,
    ]
  )

  React.useEffect(() => {
    if (!virtualized) return
    const wrapped = layout.columns.filter((column) => column.definition.wrap)
    if (wrapped.length > 0)
      actions.warn(
        "wrap-virtualized",
        `DataTableContent: \`wrap\` is off for ${wrapped
          .map((column) => `"${column.id}"`)
          .join(", ")} in a virtualized table, whose rows are one height.`
      )
  }, [actions, virtualized, layout.columns])

  const failed = Boolean(error)
  const rows = failed ? NO_ROWS : model.rows
  const firstLoad = loading && !failed && rows.length === 0
  const refreshing = loading && !failed && rows.length > 0
  const frame = React.useRef<HTMLDivElement | null>(null)
  const setFrame = React.useCallback(
    (element: HTMLDivElement | null) => {
      frame.current = element
      actions.setFrame(element)
    },
    [actions]
  )
  const headerHeight = useHeaderHeight(frame, refreshing)
  const status = useStatus({
    failed,
    loading,
    rows: rows.length,
    rowCount: model.rowCount,
    noResults: !failed && !loading && searching && rows.length === 0,
  })
  // Every page's rows, when only some are in the DOM: on pages, or the
  // server's count in a virtualized table.
  const headerRows = layout.headerRows.length
  const rowCount =
    options.pagination && !server
      ? headerRows + model.allRows.length
      : server && (options.pagination || virtualized)
        ? headerRows + model.rowCount
        : undefined

  const state = failed ? (
    <DataTableErrorState
      description={error === true ? undefined : error}
      onRetry={options.retryable ? actions.retry : undefined}
    />
  ) : searching ? (
    (noResults ?? (
      <DataTableNoResultsState
        onClearFilters={() =>
          actions.updateView(clearFilters, viewChangeReason)
        }
      />
    ))
  ) : (
    (empty ?? <DataTableEmptyState />)
  )

  return (
    <div
      ref={setFrame}
      data-slot="data-table-content"
      className={cn(
        "relative min-h-0 overflow-hidden rounded-md border",
        // Its own height (`h-96`), else what a root of bounded height
        // leaves it: `flex-auto` keeps `height`, which `flex-1` would not.
        virtualized && "flex-auto",
        className
      )}
      {...props}
    >
      <DataTableGrid context={context} options={grid}>
        <Table
          size={options.size}
          striped={options.striped}
          virtualized={virtualized}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-busy={loading || undefined}
          // Left out, not undefined: a virtualized body counts its own.
          {...(rowCount === undefined ? {} : { "aria-rowcount": rowCount })}
        >
          <DataTableHeader
            context={context}
            columns={columns}
            layout={layout}
            sorting={sorting}
            sortable={options.sortable}
            selectionMode={options.selectionMode}
            size={options.size}
          />
          {firstLoad ? (
            <TableBody>
              {loadingRows(
                options.pagination ? model.pageSize : LOADING_ROWS,
                layout.columns,
                selection
              )}
            </TableBody>
          ) : (
            <TableBody items={rows} empty={state}>
              {render}
            </TableBody>
          )}
        </Table>
      </DataTableGrid>
      {refreshing && <DataTableProgress top={headerHeight} />}
      {/* One region for the table's life, so each change is read. */}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  )
}

/** The table: header, rows and states, in a rounded frame. */
const DataTableContent = React.memo(DataTableContentImpl)

export { DataTableContent }
export type { DataTableContentProps }
