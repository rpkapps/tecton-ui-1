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
 * The columns (`content-columns.tsx`): their widths, pinned columns that
 * stick to the frame's edges, a divider at their inner edge and a shadow
 * past it while content is scrolled under them (`pinEdgeClassName` in
 * `cell.tsx`: the scroll fade's keyframes), and reordering.
 *
 * Of bounded height (`h-96`, or a root of bounded height), virtualized or
 * not, the table scrolls in its frame with its header stuck to the top,
 * and the group rows stick under it while their rows scroll past
 * (`sticky-groups.ts`). A grouped table draws no stripes: its group rows
 * have their fill.
 *
 * The rows (`content-rows.ts`): detail rows under the rows that open
 * (`renderDetail`, which makes the table a treegrid: each row of level 1,
 * its detail row of level 2), a drag handle column for row reordering (its
 * drag and drop on demand too, `row-reorder.tsx`), a totals row in the
 * footer (`totals.tsx`), and with `hasMore` (`content-more.tsx`) loading
 * rows after the last row: `onLoadMore` is called
 * when they come within two views of being seen (the table's scroll area
 * in a virtualized table, the page's otherwise), once per number of items.
 * While more rows load, the table is busy and the loading rows show, not
 * the bar under the header. With `loadMore="button"`, a "Show more" row
 * takes the loading rows' place (`DataTableShowMore`): no observer, it
 * calls `onLoadMore` and spins while the rows load; focus stays on
 * it, or goes to the first new row once there are no more, and the status
 * region says how many rows came. The status region says how many rows
 * match once the search or filters change (`content-status.ts`).
 *
 * Live data (`highlightChanges`): its module, loaded as the table mounts,
 * renders after the table (`live-rows.tsx`: highlights, the "new rows"
 * buttons, rows kept back from an earlier page while in use); the rows
 * render their key and highlight from a store the content keeps for it,
 * and `LiveAnchor` around the table keeps the row the user is on still as
 * items change (`live-bridge.ts`). The status region says how many rows came.
 */
import * as React from "react"
import { cn } from "cn"

import { Table, TableBody } from "@tecton/react/table"
import { useDirection } from "@tecton/react/provider"

import {
  TableContainerContext,
  TableGridOptionsContext,
  TableGridValueContext,
  type TableGridController,
  type TableGridOptions,
} from "../table-grid"
import { groupLabelWidth } from "./cell"
import { tableStyle } from "./column-sizing"
import { useContentColumns } from "./content-columns"
import { afterRows, BODY_FILL, moreRows, useMoreRows } from "./content-more"
import {
  ariaRowCount,
  useDetailRows,
  useGridOptions,
  useGroupFocusRestore,
  useRowOrder,
  useRowShared,
} from "./content-rows"
import { useContentStatus } from "./content-status"
import {
  useDataTableContext,
  useDataTableSelector,
  type DataTableContextValue,
} from "./context"
import type { BodyRow } from "./engine/index"
import { LIVE, useFeature, usePrefetchFeatures } from "./lazy"
import { DataTableHeader, type HeaderShared } from "./header"
import { useContentWarnings } from "./dev-warnings"
import { createLiveBridge, LiveAnchor } from "./live-bridge"
import { renderRow } from "./row"
import { GROUPED_TABLE_CLASS, useStickyGroups } from "./sticky-groups"
import { useStable } from "./use-stable"
import { DataTableTotals } from "./totals"
import {
  DataTableEmptyState,
  DataTableErrorState,
  DataTableNoResultsState,
  DataTableProgress,
  loadingRows,
} from "./states"

// Development only: every warning is behind `process.env.NODE_ENV`,
// written out at its call site so that a consumer's bundler (which replaces
// that expression, not `typeof process`) drops it and its message from a
// production build, and in a `try` so that, with no bundler and no
// `process`, there is no warning rather than an error (`warnings.ts`).
declare const process: { env: { NODE_ENV?: string } }

type DataTableContentProps<T = unknown> = Omit<
  React.ComponentProps<"div">,
  "children"
> & {
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
  /**
   * A row's detail row, across every column, shown while the row is open
   * (`expanded`): the row gets a chevron, and opens like a tree row. Not
   * in a tree. Annotate the item (`(well: Well) => …`), or write
   * `DataTableContent<Well>`. A new function renders every detail row
   * again: pass one that stays the same.
   */
  // A method, so that `(well: Well) => …` is taken where `T` is inferred
  // as `unknown` (method parameters are checked bivariantly).
  // eslint-disable-next-line @typescript-eslint/method-signature-style -- see above
  renderDetail?(item: T): React.ReactNode
  /**
   * A totals row in the footer: each aggregate column's aggregate over
   * every row the view matches.
   */
  totals?: boolean
}

type Row = BodyRow<unknown>

const NO_FEATURES = [] as const
const NO_LABEL_WIDTH = { "--data-table-group-label": "initial" }
const PREFETCH_LIVE = [LIVE]

/** Rows shown while the first rows load, without pages. */
const LOADING_ROWS = 5

/**
 * The grid's options, and its selection apart: the one part that renders
 * on a selection change, with the `Table`, which reads the selection; the
 * rows read the options, which stay, and each its own selection from the
 * grid, so only the rows selected or cleared render.
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
  return (
    <TableGridOptionsContext value={options}>
      <TableGridValueContext value={value}>{children}</TableGridValueContext>
    </TableGridOptionsContext>
  )
}

/**
 * A group row's label over the empty columns after its pinned cell
 * (`groupLabelWidth`) while the table is scrolled to its start; once
 * scrolled sideways, within its cell, so the columns scrolling under the
 * pinned ones are not covered. Marked on the scroll container, as the
 * user scrolls: no render of the table's writes to it.
 */
function useGroupLabelClip(
  container: React.RefObject<HTMLDivElement | null>,
  on: boolean
) {
  React.useLayoutEffect(() => {
    const element = container.current
    if (!on || !element) return
    const update = () =>
      element.toggleAttribute(CLIPPED, Math.abs(element.scrollLeft) > 0.5)
    update()
    element.addEventListener("scroll", update, { passive: true })
    return () => {
      element.removeEventListener("scroll", update)
      element.removeAttribute(CLIPPED)
    }
  }, [container, on])
}

/** Read by the group rows' label (`row.tsx`). */
const CLIPPED = "data-group-label-clipped"

/**
 * On pages, the last page, short of rows, keeps the height of the full
 * pages before it (the frame's `min-height`, as last measured on one, for
 * the same page size), so the footer under it, and the pagination there,
 * stay where they are as the pages change. Set on the frame before paint.
 */
function useFullPageHeight(
  frame: React.RefObject<HTMLDivElement | null>,
  on: boolean,
  {
    page,
    pageCount,
    pageSize,
  }: Record<"page" | "pageCount" | "pageSize", number>
) {
  const full = React.useRef<{ pageSize: number; height: number } | null>(null)
  const set = React.useRef(false)
  React.useLayoutEffect(() => {
    const element = frame.current
    if (!element) return
    if (set.current) element.style.minHeight = ""
    set.current = false
    if (!on || pageCount < 2) return
    if (page < pageCount)
      full.current = { pageSize, height: element.offsetHeight }
    else if (full.current?.pageSize === pageSize) {
      element.style.minHeight = `${full.current.height}px`
      set.current = true
    }
  })
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
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(head)
    return () => observer.disconnect()
  }, [frame, active])
  return height
}

function DataTableContentImpl({
  virtualized = false,
  empty,
  noResults,
  renderDetail,
  totals = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}: DataTableContentProps<unknown>) {
  const context = useDataTableContext<unknown>("DataTableContent")
  const { actions } = context
  const columns = useDataTableSelector(context, (state) => state.columns)
  const model = useDataTableSelector(context, (state) => state.model)
  const layout = useDataTableSelector(context, (state) => state.layout)
  const formatter = useDataTableSelector(context, (state) => state.formatter)
  const options = useDataTableSelector(context, (state) => state.options)
  const sorting = useDataTableSelector(context, (state) => state.view.sorting)
  // The levels of groups (grouping columns).
  const levels = useDataTableSelector(
    context,
    (state) => state.view.grouping.length
  )
  const grouped = levels > 0
  const searching = useDataTableSelector(
    context,
    (state) =>
      state.view.search.trim() !== "" ||
      Object.keys(state.view.filters).length > 0
  )
  const loading = useDataTableSelector(context, (state) => state.loading)
  const error = useDataTableSelector(context, (state) => state.error)
  const server = options.dataMode === "server"
  // What the rows match, as a key: a change makes the status count them.
  const matchKey = useDataTableSelector(
    context,
    (state) =>
      `${state.view.search.trim()}\u0000${JSON.stringify(state.view.filters)}`
  )

  const { detail, detailStore, bodyRows, openOnPages } = useDetailRows(
    context,
    renderDetail,
    model,
    options
  )
  try {
    // The same on every render (the build's): the hooks keep their order.
    if (process.env.NODE_ENV !== "production")
      useContentWarnings(actions.warn, {
        detail: renderDetail !== undefined,
        tree: options.tree,
        virtualized,
        columns: layout.columns,
      })
  } catch {
    // No `process` (no bundler): no warnings.
  }

  const after = afterRows(
    error,
    options.hasMore,
    options.loadMore === "button",
    bodyRows,
    server,
    searching
  )
  const { failed, rows } = after
  const firstLoad = loading && !failed && rows.length === 0
  const frame = React.useRef<HTMLDivElement | null>(null)
  // Cells stick: pinned columns' sideways, group rows' down. Each then
  // draws its row's border, in separate borders (`cell.tsx`).
  const pinned = layout.pinnedStart + layout.pinnedEnd > 0 || grouped
  const container = React.useRef<HTMLDivElement | null>(null)
  const stickyGroups = useStickyGroups(container, grouped, levels)
  const {
    sizer,
    headerLayout,
    shownColumns,
    pins,
    handlePin,
    selectionPin,
    order,
    colgroup,
  } = useContentColumns(
    context,
    frame,
    container,
    columns,
    layout,
    options,
    !firstLoad,
    rows.length > 0 && !loading,
    useDirection() === "rtl"
  )
  const { sizing } = sizer

  const gridController = React.useRef<TableGridController | null>(null)
  const closedGroups = useDataTableSelector(
    context,
    (state) => state.closedGroups
  )
  // Live data (`highlightChanges`): added rows highlighted until seen,
  // counted while out of view, the row in use kept still. Its module loads as
  // the table mounts (`live-rows.tsx`); the rows and the anchor read the
  // bridge, which it writes.
  const live = useDataTableSelector(context, (state) => state.live)
  const liveFeature = useFeature(LIVE, live !== null)
  usePrefetchFeatures(live ? PREFETCH_LIVE : NO_FEATURES)
  const [liveBridge] = React.useState(createLiveBridge)
  const rowOrder = useRowOrder(
    context,
    frame,
    gridController,
    model,
    options.reorderableRows
  )

  const shared = useRowShared(
    context,
    options,
    model,
    columns,
    layout.rowHeader,
    detail ? detailStore : null,
    openOnPages,
    {
      columns: shownColumns,
      formatter,
      grouped,
      order: rowOrder.order,
      headerRows: headerLayout.headerRows.length,
      fixed: sizing !== null,
      pins,
      pinned,
      selectionPin,
      handlePin,
      virtualized,
      live: live ? liveBridge.flashes : null,
      stickyGroups,
    }
  )
  // Set on every grouped table's frame, so a grouped table in a detail row
  // never reads the outer one's.
  const reachWidth = grouped
    ? groupLabelWidth(shared.groupCells, sizing?.widths)
    : undefined
  const labelWidth = grouped ? (reachWidth ?? NO_LABEL_WIDTH) : undefined
  useGroupLabelClip(container, reachWidth !== undefined)
  const render = React.useCallback(
    (row: Row) => renderRow(row, shared),
    [shared]
  )
  const grid = useGridOptions(
    context,
    options,
    shared,
    rows,
    gridController,
    useGroupFocusRestore(context, frame, gridController, rows, model)
  )

  const refreshing = loading && !failed && rows.length > 0 && !after.more
  // The frame, for the table's own use and the caller's `ref`.
  const setFrame = React.useCallback(
    (element: HTMLDivElement | null) => {
      frame.current = element
      actions.setFrame(element)
      const cleanup =
        typeof ref === "function"
          ? ref(element)
          : ref && (ref.current = element)
      return () => {
        frame.current = null
        actions.setFrame(null)
        if (typeof cleanup === "function") cleanup()
        else if (typeof ref === "function") ref(null)
        else if (ref) ref.current = null
      }
    },
    [actions, ref]
  )
  const headerHeight = useHeaderHeight(frame, refreshing)
  useFullPageHeight(frame, options.pagination && !virtualized, model)
  const focusRow = React.useCallback(
    (index: number) => gridController.current?.focusRow(index),
    []
  )
  const more = useMoreRows(
    context,
    after,
    frame,
    container,
    options,
    loading,
    virtualized,
    model,
    focusRow
  )
  const status = useContentStatus(
    matchKey,
    server,
    model,
    loading,
    failed,
    searching,
    rows.length,
    more.showMore.added,
    live !== null
  )
  const footerRows = totals && !failed && !firstLoad ? 1 : 0
  const rowCount = ariaRowCount({
    failed,
    more: after.more,
    server,
    pagination: options.pagination,
    virtualized,
    headerRows: headerLayout.headerRows.length,
    footerRows,
    model,
    openOnPages: openOnPages.length,
    bodyRows,
    shown: rows.length,
  })

  const state = failed ? (
    <DataTableErrorState
      description={error === true ? undefined : error}
      onRetry={options.retryable ? actions.retry : undefined}
    />
  ) : searching ? (
    (noResults ?? (
      <DataTableNoResultsState onClearFilters={() => actions.clearFilters()} />
    ))
  ) : (
    (empty ?? <DataTableEmptyState />)
  )

  // One object while the header draws the same: a live tick or new items
  // render no header cell.
  const header = useStable<HeaderShared<unknown>>({
    context,
    columns,
    layout: headerLayout,
    sorting,
    options,
    sizer,
    pins,
    selectionPin,
    handlePin,
    order: order.order,
    movable: order.movable,
  })
  // The highlight's length, read by its animation (`live-rows.tsx`).
  const Live = live ? liveFeature.module?.DataTableLive : undefined
  const liveDuration = live
    ? ({
        "--tecton-live-duration": `${live.duration}ms`,
      } as React.CSSProperties)
    : undefined
  const ReorderColumns = order.module?.DataTableColumnReorder
  const ReorderRows = rowOrder.module?.DataTableRowReorder

  return (
    <div
      ref={setFrame}
      data-slot="data-table-content"
      className={cn(
        // A column: of bounded height (`h-96`, or a root of bounded
        // height), the table scrolls in it, its header stuck to the top
        // (the table's container, a scroll container, shrinks to fit).
        "relative flex min-h-0 flex-col overflow-hidden rounded-md border",
        // A footer right after it is its last band (`footer.tsx`), and
        // has the bottom border and corners.
        "[&:has(+[data-slot=data-table-footer]:not(:empty))]:rounded-b-none [&:has(+[data-slot=data-table-footer]:not(:empty))]:border-b-0",
        // Its own height (`h-96`), else what a root of bounded height
        // leaves it: `flex-auto` keeps `height`, which `flex-1` would not.
        virtualized && "flex-auto",
        className
      )}
      {...props}
      style={
        sizer.style || labelWidth || liveDuration
          ? { ...sizer.style, ...labelWidth, ...liveDuration, ...props.style }
          : props.style
      }
    >
      <DataTableGrid context={context} options={grid}>
        <TableContainerContext value={container}>
          {/* Keeps the row the user is on still as items change (live data). */}
          <LiveAnchor itemsKey={model.ids} bridge={live ? liveBridge : null}>
            <Table
              size={options.size}
              // Not while rows are grouped: the group rows have the
              // stripes' fill.
              striped={options.striped && !grouped}
              virtualized={virtualized}
              className={cn(
                sizer.mode === "fixed" && "table-fixed",
                // Each cell draws its border (`cell.tsx`).
                pinned && "border-separate border-spacing-0",
                // Rows scrolled to rest under the stuck group rows.
                grouped && GROUPED_TABLE_CLASS
              )}
              style={
                sizer.mode === "fixed" && sizing
                  ? tableStyle(sizing)
                  : undefined
              }
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={ariaDescribedBy}
              aria-busy={loading || undefined}
              // Left out, not undefined: a virtualized body counts its own.
              {...(rowCount === undefined ? {} : { "aria-rowcount": rowCount })}
            >
              {colgroup}
              <DataTableHeader shared={header} />
              {/* The loading rows in a body of their own, not the rows':
                a virtualized body locks its columns' widths and measures
                its rows' height from the first rows it renders, which are
                to be the rows (a badge, a button), not a line of skeleton
                each. */}
              {firstLoad ? (
                <tbody
                  data-slot="data-table-loading-rows"
                  className={cn("[&_tr:last-child]:border-0", BODY_FILL)}
                >
                  {loadingRows(
                    options.pagination ? model.pageSize : LOADING_ROWS,
                    layout.columns,
                    shared
                  )}
                </tbody>
              ) : (
                <TableBody items={rows} empty={state}>
                  {render}
                </TableBody>
              )}
              {moreRows(
                after,
                more,
                shared,
                layout.columns,
                options,
                model,
                error,
                loading,
                actions
              )}
              {footerRows > 0 && (
                <DataTableTotals
                  model={model}
                  shared={shared}
                  virtualized={virtualized}
                  rowIndex={
                    rowCount === undefined || rowCount < 0
                      ? undefined
                      : rowCount
                  }
                />
              )}
            </Table>
          </LiveAnchor>
        </TableContainerContext>
      </DataTableGrid>
      {refreshing && <DataTableProgress top={headerHeight} />}
      {ReorderColumns && order.order && <ReorderColumns order={order.order} />}
      {ReorderRows && rowOrder.order && <ReorderRows order={rowOrder.order} />}
      {live && Live && (
        <Live
          live={live}
          bridge={liveBridge}
          onMessage={status.setLiveMessage}
          frame={frame}
          virtualized={virtualized}
          model={model}
          rows={rows}
          pagination={options.pagination && !server}
          closedGroups={closedGroups}
          grid={gridController}
          actions={actions}
        />
      )}
      {/* One region for the table's life, so each change is read; a new
          text for each batch "Show more" or live data brought, read even
          when it says the same. */}
      <span role="status" className="sr-only">
        <React.Fragment key={status.key}>{status.text}</React.Fragment>
      </span>
    </div>
  )
}

/** The table: header, rows and states, in a rounded frame. */
const DataTableContent = React.memo(DataTableContentImpl) as <T>(
  props: DataTableContentProps<T>
) => React.ReactNode

export { DataTableContent }
export type { DataTableContentProps }
