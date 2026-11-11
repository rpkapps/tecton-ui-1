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
 *
 * The columns: their widths (`column-sizing.ts`; a resize is drawn without
 * rendering while it is dragged), pinned columns that stick to the frame's
 * edges with the content scrolled under them fading in at their inner
 * edge (the `scroll-fade-x` utility, its mask starting where the pinned
 * columns end, shown only while there is content on that side), and
 * reordering, whose drag and drop loads on demand and renders beside the
 * table (`column-reorder.tsx`).
 */
import * as React from "react"
import { cn } from "cn"

import { Table, TableBody } from "@tecton/react/components/table"
import { useDirection } from "@tecton/react/tecton/provider"

import { useTranslations } from "../i18n/translations"
import {
  TableContainerConfig,
  TableGridConfig,
  type TableGridOptions,
} from "../table-grid"
import { cellBorderClassName, type CellPin, type RowShared } from "./cell"
import {
  createColumnOrder,
  listsOf,
  movableColumns,
  type ColumnOrder,
} from "./column-order"
import {
  colWidths,
  pinOffset,
  tableStyle,
  useColumnSizing,
} from "./column-sizing"
import {
  useDataTableContext,
  useDataTableSelector,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"
import {
  clearFilters,
  type BodyRow,
  type ColumnLayout,
  type DataTableColumns,
  type EngineColumn,
} from "./engine/index"
import { useFeature } from "./lazy"
import { viewChangeReason } from "./view-reason"
import { DataTableHeader, type HeaderShared } from "./header"
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

/**
 * The scrolled content fades in at the inner edge of the pinned columns
 * (`scroll-fade-x` on the table's scroll container, with its mask moved
 * there): the start's fade shows once the table is scrolled from the
 * start, the end's while there is more to scroll to. RTL mirrors it.
 * Without scroll-driven animations the utility would fade for good: the
 * fade is then left out.
 */
const PINNED_FADE = cn(
  "scroll-fade-x",
  "[--scroll-fade-mask:linear-gradient(to_var(--data-table-fade-to),#000_var(--data-table-pinned-start),transparent_var(--data-table-pinned-start),#000_calc(var(--data-table-pinned-start)_+_var(--scroll-fade-s)_*_var(--data-table-fade-start)),#000_calc(100%_-_var(--data-table-pinned-end)_-_var(--scroll-fade-e)_*_var(--data-table-fade-end)),transparent_calc(100%_-_var(--data-table-pinned-end)),#000_calc(100%_-_var(--data-table-pinned-end)))]",
  "not-supports-[animation-timeline:scroll()]:[--scroll-fade-e-size:0px] not-supports-[animation-timeline:scroll()]:[--scroll-fade-s-size:0px]"
)

/** Whether the columns are laid out with fixed widths (see `column-sizing.ts`). */
function hasFixedWidths<T>(layout: ColumnLayout<T>, resizable: boolean) {
  return (
    resizable ||
    layout.pinnedStart + layout.pinnedEnd > 0 ||
    layout.columns.some(
      (column) =>
        layout.width(column.id) !== undefined ||
        column.minWidth !== undefined ||
        column.maxWidth !== undefined
    )
  )
}

/** `next`, or the last array while it holds the same items. */
function useSameItems<TItem>(next: ReadonlyArray<TItem>) {
  const last = React.useRef(next)
  const same =
    last.current.length === next.length &&
    last.current.every((item, index) => item === next[index])
  const kept = same ? last.current : next
  React.useLayoutEffect(() => {
    last.current = kept
  })
  return kept
}

/** Each shown column's pin, by its place: the variable it sticks at. */
function pinsOf(count: number, start: number, end: number) {
  return Array.from({ length: count }, (_, index): CellPin | undefined =>
    index < start
      ? { side: "start", offset: pinOffset(index) }
      : index >= count - end
        ? { side: "end", offset: pinOffset(index) }
        : undefined
  )
}

const SELECTION_PIN: CellPin = { side: "start", offset: "0px" }

/**
 * Column reordering (`reorderableColumns`): the headers' side of it at
 * once, its drag and drop once loaded.
 */
function useColumnOrder(
  context: DataTableContextValue<unknown>,
  frame: React.RefObject<HTMLElement | null>,
  columns: DataTableColumns<unknown>,
  layout: ColumnLayout<unknown>,
  on: boolean
) {
  const feature = useFeature("dragAndDrop", on)
  const snapshot = React.useMemo(
    () => (on ? movableColumns(columns, layout) : null),
    [on, columns, layout]
  )
  const { load } = feature
  const [order] = React.useState<ColumnOrder>(() =>
    createColumnOrder(
      context.actions,
      () => frame.current,
      load,
      snapshot ?? { columns, movable: NO_COLUMNS, labels: new Map() }
    )
  )
  React.useLayoutEffect(() => {
    if (snapshot) order.snapshot.current = snapshot
    const lists = snapshot ? listsOf(columns, snapshot.movable) : []
    const key = (value: ReadonlyArray<string | null>) => JSON.stringify(value)
    // A list's drag stays while the list does.
    if (key(lists) !== key(order.store.get().lists)) order.store.set({ lists })
  }, [order, columns, snapshot])
  return {
    order: snapshot ? order : null,
    movable: snapshot?.movable ?? NO_COLUMNS,
    module: feature.module,
  }
}

const NO_COLUMNS: ReadonlySet<string> = new Set()

/** Written out whole, so Tailwind finds them: a `col` hidden with its cells. */
const HIDE_BELOW_COLUMN = {
  sm: "hidden sm:table-column",
  md: "hidden md:table-column",
  lg: "hidden lg:table-column",
} as const

function hideBelowColumn<T>(column: EngineColumn<T>) {
  const { hideBelow } = column.definition
  return hideBelow ? HIDE_BELOW_COLUMN[hideBelow] : undefined
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
  const widths = useDataTableSelector(
    context,
    (state) => state.view.columns.widths
  )
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
  const rtl = useDirection() === "rtl"
  const failed = Boolean(error)
  const rows = failed ? NO_ROWS : model.rows
  const firstLoad = loading && !failed && rows.length === 0
  const frame = React.useRef<HTMLDivElement | null>(null)
  const pinned = layout.pinnedStart + layout.pinnedEnd > 0
  const container = React.useRef<HTMLDivElement | null>(null)
  const sizer = useColumnSizing({
    frame,
    container,
    layout,
    widths,
    selection,
    fixed: hasFixedWidths(layout, options.resizableColumns),
    ready: !firstLoad,
    rows: rows.length > 0 && !loading,
    rtl,
  })
  const { sizing } = sizer
  const fade = pinned && sizing !== null
  const containerConfig = React.useMemo(
    () => ({ ref: container, className: fade ? PINNED_FADE : undefined }),
    [fade]
  )
  // The rows render with the columns, their pins and the selection's: a
  // new width alone (a resize) leaves them as they are.
  const shownColumns = useSameItems(layout.columns)
  const pins = React.useMemo(
    () => pinsOf(layout.columns.length, layout.pinnedStart, layout.pinnedEnd),
    [layout.columns.length, layout.pinnedStart, layout.pinnedEnd]
  )
  const selectionPin =
    selection && sizing?.selectionPinned ? SELECTION_PIN : undefined
  const fixed = sizing !== null
  const order = useColumnOrder(
    context,
    frame,
    columns,
    layout,
    options.reorderableColumns
  )

  const rowHeader = shownColumns.find(
    (column) => column.id === layout.rowHeader
  )
  const shared = React.useMemo<RowShared<unknown>>(
    () => ({
      columns: shownColumns,
      rowHeader,
      formatter,
      selection,
      levelled: options.tree || grouped,
      tree: options.tree,
      disableRows: options.disabledBehavior === "all",
      linked: options.linked,
      wrap: !virtualized,
      columnCount: shownColumns.length + (selection ? 1 : 0),
      rowIndexOf: options.pagination ? model.indexOfRow : null,
      headerRows: layout.headerRows.length,
      fixed,
      pins,
      selectionPin,
      pinned,
      actions,
    }),
    [
      shownColumns,
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
      fixed,
      pins,
      selectionPin,
      pinned,
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

  const refreshing = loading && !failed && rows.length > 0
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

  const header: HeaderShared<unknown> = {
    context,
    columns,
    layout,
    sorting,
    options,
    sizer,
    pins,
    selectionPin,
    order: order.order,
    movable: order.movable,
  }
  const ReorderColumns = order.module?.DataTableColumnReorder

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
      style={sizer.style ? { ...sizer.style, ...props.style } : props.style}
    >
      <DataTableGrid context={context} options={grid}>
        <TableContainerConfig value={containerConfig}>
          <Table
            size={options.size}
            striped={options.striped}
            virtualized={virtualized}
            className={cn(
              sizer.mode === "fixed" && "table-fixed",
              // Each cell draws its border (`cell.tsx`).
              pinned && "border-separate border-spacing-0"
            )}
            style={
              sizer.mode === "fixed" && sizing ? tableStyle(sizing) : undefined
            }
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-busy={loading || undefined}
            // Left out, not undefined: a virtualized body counts its own.
            {...(rowCount === undefined ? {} : { "aria-rowcount": rowCount })}
          >
            {sizer.mode === "fixed" && sizing && (
              <colgroup data-slot="data-table-columns">
                {selection && <col style={{ width: sizing.selection }} />}
                {colWidths(sizing).map((width, index) => (
                  <col
                    key={shownColumns[index].id}
                    className={hideBelowColumn(shownColumns[index])}
                    style={width === undefined ? undefined : { width }}
                  />
                ))}
              </colgroup>
            )}
            <DataTableHeader shared={header} />
            {firstLoad ? (
              <TableBody>
                {loadingRows(
                  options.pagination ? model.pageSize : LOADING_ROWS,
                  layout.columns,
                  selection,
                  pinned ? cellBorderClassName : undefined
                )}
              </TableBody>
            ) : (
              <TableBody items={rows} empty={state}>
                {render}
              </TableBody>
            )}
          </Table>
        </TableContainerConfig>
      </DataTableGrid>
      {refreshing && <DataTableProgress top={headerHeight} />}
      {ReorderColumns && order.order && <ReorderColumns order={order.order} />}
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
