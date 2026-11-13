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
 * edges, a divider at their inner edge and a shadow past it while content
 * is scrolled under them (`pinEdgeClassName` in `cell.tsx`: the scroll
 * fade's keyframes), and reordering, whose drag and drop loads on demand
 * and renders beside the table (`column-reorder.tsx`).
 *
 * The rows: detail rows under the rows that open (`renderDetail`, which
 * makes the table a treegrid: each row of level 1, its detail row of level
 * 2), a drag handle column for row reordering (its drag and drop on demand
 * too, `row-reorder.tsx`), a totals row in the footer (`totals.tsx`), and
 * with `hasMore` loading rows after the last row: `onLoadMore` is called
 * when they come within two views of being seen (the table's scroll area
 * in a virtualized table, the page's otherwise), once per number of items.
 * While more rows load, the table is busy and the loading rows show, not
 * the bar under the header. With `loadMore="button"`, a "Show more" row
 * takes the loading rows' place (`DataTableShowMore`): no observer, it
 * calls `onLoadMore` and spins while the rows load; focus stays on
 * it, or goes to the first new row once there are no more, and the status
 * region says how many rows came. The status region says how many rows
 * match once the search or filters change.
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

import { useTranslations } from "../i18n/translations"
import { createStore } from "../store"
import {
  TableContainerConfig,
  TableGridConfig,
  type TableGridController,
  type TableGridOptions,
} from "../table-grid"
import {
  emptyValueContent,
  groupCellsOf,
  groupLabelWidth,
  type CellPin,
  type GroupLabel,
  type DetailStore,
  type RowShared,
} from "./cell"
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
  useBelowBreakpoints,
  useColumnSizing,
} from "./column-sizing"
import {
  useDataTableContext,
  useDataTableSelector,
  useNumberFormat,
  type DataTableContextValue,
} from "./context"
import {
  createDetailCache,
  getColumnModel,
  isGroupClosed,
  withDetailRows,
  type BodyRow,
  type ColumnLayout,
  type DataTableColumns,
  type DataTableRowModel,
  type EngineColumn,
  type GroupRow,
} from "./engine/index"
import {
  DRAG_AND_DROP,
  LIVE,
  RESIZER,
  useFeature,
  usePrefetchFeatures,
} from "./lazy"
import { DataTableHeader, shownHeaderRows, type HeaderShared } from "./header"
import { createLiveBridge, LiveAnchor, type LiveMessage } from "./live-bridge"
import { describeRow, renderRow } from "./row"
import { createRowOrder, inItemOrder, type RowOrder } from "./row-order"
import { scrollParentOf } from "./scroll-parent"
import { DataTableTotals } from "./totals"
import {
  DataTableEmptyState,
  DataTableErrorState,
  DataTableMoreError,
  DataTableNoResultsState,
  DataTableProgress,
  DataTableShowMore,
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

const NO_ROWS: ReadonlyArray<Row> = []
const NO_IDS: ReadonlySet<string> = new Set()
const NO_OPEN: ReadonlyArray<string> = []
const NO_FEATURES = [] as const
const NO_LABEL_WIDTH = { "--data-table-group-label": "initial" }
const PREFETCH_RESIZER = [RESIZER]
const PREFETCH_LIVE = [LIVE]

/** Rows shown while the first rows load, without pages. */
const LOADING_ROWS = 5
/** Rows shown after the last row while more come (`hasMore`). */
const MORE_ROWS = 3

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
      ? { side: "start", offset: pinOffset(index), edge: index === start - 1 }
      : index >= count - end
        ? { side: "end", offset: pinOffset(index), edge: index === count - end }
        : undefined
  )
}

const FIRST_PIN: CellPin = { side: "start", offset: "0px" }

/**
 * Row reordering (`reorderableRows`): the rows' side of it at once (the
 * handles, `row-order.tsx`), its drag and drop once loaded. The handles
 * show while the rows are in the items' order.
 */
function useRowOrder(
  context: DataTableContextValue<unknown>,
  frame: React.RefObject<HTMLElement | null>,
  grid: { current: TableGridController | null },
  model: DataTableRowModel<unknown>,
  on: boolean
) {
  const feature = useFeature(DRAG_AND_DROP, on)
  const { load } = feature
  const [order] = React.useState<RowOrder>(() =>
    createRowOrder(context.actions, () => frame.current, grid, load)
  )
  const movable = useDataTableSelector(
    context,
    (state) => on && inItemOrder(state.view)
  )
  React.useLayoutEffect(() => {
    if (!on) return
    order.snapshot.current = {
      shown: model.rows.flatMap((row) =>
        row.kind === "item" && !row.continued ? [row.id] : []
      ),
      all: model.matchingIds,
      label: model.textOf,
    }
  }, [order, model, on])
  return { order: movable ? order : null, module: feature.module }
}

/**
 * Load more (`hasMore`): calls `loadMore` once the loading rows after the
 * last row (`target`) come within two views of where the table scrolls
 * (the scroll area of a virtualized table; else the nearest scrolling
 * ancestor, or the page), and not again until something changes that
 * could leave the end in view: the items (new or other ones), the view,
 * or a load ending (`loading` back to false). One call per batch, however
 * the user scrolls.
 */
function useLoadMore(
  target: React.RefObject<HTMLElement | null>,
  root: React.RefObject<HTMLElement | null>,
  {
    on,
    virtualized,
    rearm,
    loadMore,
  }: {
    /** More rows can be asked for now (not while a load is out). */
    on: boolean
    virtualized: boolean
    /** What, when it changes, lets the end ask again. */
    rearm: ReadonlyArray<unknown>
    loadMore: () => void
  }
) {
  const [items, view] = rearm
  React.useEffect(() => {
    const element = target.current
    if (!on || !element || typeof IntersectionObserver === "undefined") return
    let called = false
    const observer = new IntersectionObserver(
      (entries) => {
        if (called || !entries.some((entry) => entry.isIntersecting)) return
        called = true
        loadMore()
      },
      {
        root: virtualized ? root.current : scrollParentOf(element),
        rootMargin: "0px 0px 200% 0px",
      }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [target, root, on, virtualized, items, view, loadMore])
}

/** The place after the last row: the loading rows, "Show more" or the error. */
const MORE_SLOT = '[data-slot="data-table-loading-more"]'
const CONTENT = '[data-slot="data-table-content"]'

/**
 * "Show more" (`loadMore="button"`). A press loads the next rows
 * (`loadMore`); once more items came, `added` says how many, for the
 * status region (under a new `key` each time, so that the same count is
 * read again). A load the press did not ask for (a sort, a refresh)
 * clears it.
 *
 * Focus in the place after the rows (on "Show more", or on "Retry" of the
 * error shown there) stays in it as it changes: when the element focus was
 * on goes, it moves to the button there now, or, with none (no more rows),
 * to the first row the last press brought, else to the table.
 */
function useShowMore({
  on,
  frame,
  rows,
  items,
  loading,
  loadMore,
  focusRow,
  focusTable,
}: {
  /** `loadMore="button"`. */
  on: boolean
  frame: React.RefObject<HTMLElement | null>
  /** The body's rows. */
  rows: number
  /** The items loaded. */
  items: number
  loading: boolean
  loadMore: () => void
  focusRow: (index: number) => void
  focusTable: () => void
}) {
  const asked = React.useRef<number | null>(null)
  const firstNew = React.useRef<number | null>(null)
  const [added, setAdded] = React.useState<{
    count: number
    key: number
  } | null>(null)
  React.useEffect(() => {
    const from = asked.current
    if (loading) {
      if (from === null) setAdded(null)
      return
    }
    if (from === null || items === from) return
    asked.current = null
    setAdded(
      items > from
        ? (last) => ({ count: items - from, key: (last?.key ?? 0) + 1 })
        : null
    )
  }, [loading, items])

  // The element in the place after the rows that focus is on: set as focus
  // enters it, kept when the element goes (no move of the user's).
  const focused = React.useRef<Element | null>(null)
  React.useEffect(() => {
    const element = frame.current
    if (!element) return
    const inSlot = (node: EventTarget | null): node is Element =>
      node instanceof Element &&
      node.closest(MORE_SLOT)?.closest(CONTENT) === element
    const enter = (event: FocusEvent) => {
      if (inSlot(event.target)) focused.current = event.target
      // Not where the grid puts the focus it lost as the element went:
      // that is the layout effect below's to move.
      else if (focused.current?.isConnected) focused.current = null
    }
    const leave = (event: FocusEvent) => {
      if (inSlot(event.relatedTarget)) return
      // Chrome sends `focusout` as it removes a focused element, while the
      // element is still in the document: told apart once the render that
      // removes it is done, after the layout effect below.
      const left = event.target as Node
      queueMicrotask(() => {
        if (left.isConnected && focused.current === left) focused.current = null
      })
    }
    element.addEventListener("focusin", enter)
    element.addEventListener("focusout", leave)
    return () => {
      element.removeEventListener("focusin", enter)
      element.removeEventListener("focusout", leave)
    }
  }, [frame])
  // After the grid's own layout effects, which may have put the focus it
  // lost on the table's first stop.
  React.useLayoutEffect(() => {
    const element = frame.current
    const was = focused.current
    if (!element || !was || was.isConnected) return
    focused.current = null
    if (!on) return
    const doc = element.ownerDocument
    const active = doc.activeElement
    // Elsewhere on the page: the user's, left as it is.
    if (active && active !== doc.body && !element.contains(active)) return
    const slot = [...element.querySelectorAll(MORE_SLOT)].find(
      (candidate) => candidate.closest(CONTENT) === element
    )
    const control = slot?.querySelector<HTMLElement>("button")
    const first = firstNew.current
    if (control) control.focus()
    else if (first !== null && rows > first) focusRow(first)
    else focusTable()
  })

  const press = React.useCallback(() => {
    asked.current = items
    firstNew.current = rows
    loadMore()
  }, [items, rows, loadMore])
  return { added, press }
}

/**
 * A virtualized body's stripe parity per row, when detail rows (which take
 * their row's fill) are open: each row's by the rows before it but them.
 */
function rowParityOf(rows: ReadonlyArray<BodyRow<unknown>>) {
  let details: Uint32Array | null = null
  return (index: number): 0 | 1 | null => {
    if (rows[index]?.kind === "detail") return null
    if (!details) {
      details = new Uint32Array(rows.length + 1)
      for (let at = 0; at < rows.length; at++)
        details[at + 1] = details[at] + (rows[at].kind === "detail" ? 1 : 0)
    }
    return ((index - details[index]) % 2) as 0 | 1
  }
}

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
  const feature = useFeature(DRAG_AND_DROP, on)
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
    const observer = new ResizeObserver(update)
    observer.observe(head)
    return () => observer.disconnect()
  }, [frame, active])
  return height
}

/** How long after the last change of the search or filters their result is said (client mode). */
const RESULTS_DELAY = 500

/**
 * The number of rows to say match, once the search or filters have changed
 * (`matchKey`); `null` before. In client mode it is said once the user
 * pauses (`RESULTS_DELAY` after the last change), not on every key; in
 * server mode once the server's rows for the change are there (new items
 * or `rowCount`, or a load ending), never the count of the rows before.
 */
function useResults({
  matchKey,
  server,
  rowCount,
  items,
  loading,
}: {
  matchKey: string
  server: boolean
  rowCount: number
  items: ReadonlyArray<unknown>
  loading: boolean
}) {
  const [results, setResults] = React.useState<number | null>(null)
  const lastKey = React.useRef(matchKey)
  const awaiting = React.useRef(false)
  React.useEffect(() => {
    const changed = lastKey.current !== matchKey
    lastKey.current = matchKey
    if (server) {
      if (changed) awaiting.current = true
      return
    }
    // Nothing searched yet: nothing to say.
    if (!changed && results === null) return
    const timer = setTimeout(() => setResults(rowCount), RESULTS_DELAY)
    return () => clearTimeout(timer)
  }, [matchKey, server, rowCount, results])
  React.useEffect(() => {
    if (!server || !awaiting.current || loading) return
    awaiting.current = false
    setResults(rowCount)
  }, [server, items, rowCount, loading])
  return results
}

/**
 * What the table's live region says: "Loading" while it loads, then the
 * rows loaded, or "No results" when nothing matches, how many rows live
 * data added (`liveAdded`), and how many rows match after the search or
 * filters change (`results`). Nothing on the first render: a table that
 * is there from the start is not announced.
 */
function useStatus({
  failed,
  loading,
  rows,
  rowCount,
  noResults,
  results,
  added,
  liveAdded,
}: {
  /** The error state says it, as an alert. */
  failed: boolean
  loading: boolean
  rows: number
  rowCount: number
  noResults: boolean
  /** The rows matching the search and filters, to say; `null` for none. */
  results: number | null
  /** The rows "Show more" brought, to say; `null` for none. */
  added: number | null
  /** The rows live data added since it last said so; `null` for none. */
  liveAdded: number | null
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
  if (liveAdded !== null)
    return t("rowsAdded", { count: liveAdded, total: format.format(liveAdded) })
  if (added !== null)
    return t("moreRowsLoaded", { count: added, total: format.format(added) })
  if (results !== null)
    return t("resultsCount", {
      count: results,
      total: format.format(results),
    })
  if (!loaded) return ""
  return rows === 0
    ? t("emptyTitle")
    : t("rowsLoaded", { count: rowCount, total: format.format(rowCount) })
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
  ...props
}: DataTableContentProps<unknown>) {
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
  // What the rows match, as a key: a change makes the status count them.
  const matchKey = useDataTableSelector(
    context,
    (state) =>
      `${state.view.search.trim()}\u0000${JSON.stringify(state.view.filters)}`
  )

  // Detail rows, added here to the engine's rows (not in a tree): they
  // render with the first render, on the server too. The rows read
  // `renderDetail` from a store of their own, so a new one renders only
  // the detail rows.
  const detail = renderDetail !== undefined && !options.tree
  const [detailStore] = React.useState<DetailStore>(() =>
    createStore<{
      render: ((item: never) => React.ReactNode) | null
    }>({ render: (renderDetail ?? null) as never })
  )
  React.useLayoutEffect(() => {
    detailStore.set({ render: renderDetail ?? null })
  })
  const expanded = useDataTableSelector(context, (state) => state.expanded)
  const open = React.useMemo(
    () => (detail ? new Set(expanded) : NO_IDS),
    [detail, expanded]
  )
  const [detailCache] = React.useState(createDetailCache<unknown>)
  const bodyRows = React.useMemo(
    () => (detail ? withDetailRows(model.rows, open, detailCache) : model.rows),
    [detail, model.rows, open, detailCache]
  )
  // On pages: the open detail rows of every page, counted in the rows'
  // places (`aria-rowindex`) and the table's row count.
  const openOnPages = React.useMemo(
    () =>
      detail && options.pagination
        ? [...open].filter((id) => model.indexOfRow(id) >= 0)
        : NO_OPEN,
    [detail, options.pagination, open, model]
  )
  React.useEffect(() => {
    try {
      if (
        process.env.NODE_ENV !== "production" &&
        renderDetail !== undefined &&
        options.tree
      )
        actions.warn(
          "detail-tree",
          "DataTableContent: `renderDetail` is off in a tree (`itemToChildren`): a tree's rows open to show their children."
        )
    } catch {
      // No `process` (no bundler): no warning.
    }
  }, [actions, renderDetail, options.tree])

  const selection = options.selectionMode !== "none"
  const handle = options.reorderableRows
  const rtl = useDirection() === "rtl"
  // With more rows to come, an error over loaded rows shows after them, in
  // place of the loading rows; the error state takes the rows' place only
  // when there are none.
  const inlineError = Boolean(error) && options.hasMore && bodyRows.length > 0
  const failed = Boolean(error) && !inlineError
  const rows = failed ? NO_ROWS : bodyRows
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
    handle,
    fixed: hasFixedWidths(layout, options.resizableColumns),
    ready: !firstLoad,
    rows: rows.length > 0 && !loading,
    rtl,
  })
  const { sizing } = sizer
  // The header's rows but those of groups over hidden columns only.
  const below = useBelowBreakpoints(
    layout.columns.flatMap((column) => column.definition.hideBelow ?? [])
  )
  const headerLayout = React.useMemo(() => {
    const byId = new Map(layout.columns.map((column) => [column.id, column]))
    const headerRows = shownHeaderRows(layout.headerRows, (id) => {
      const hideBelow = byId.get(id)?.definition.hideBelow
      return hideBelow !== undefined && below.has(hideBelow)
    })
    return headerRows === layout.headerRows ? layout : { ...layout, headerRows }
  }, [layout, below])
  const containerConfig = React.useMemo(() => ({ ref: container }), [])
  // The rows render with the columns, their pins and the selection's: a
  // new width alone (a resize) leaves them as they are.
  const shownColumns = useSameItems(layout.columns)
  const pins = React.useMemo(
    () => pinsOf(layout.columns.length, layout.pinnedStart, layout.pinnedEnd),
    [layout.columns.length, layout.pinnedStart, layout.pinnedEnd]
  )
  // The columns of controls stick at the start while a column does: the
  // handles first, then the checkboxes.
  const controlsPinned = sizing?.selectionPinned === true
  const handlePin = handle && controlsPinned ? FIRST_PIN : undefined
  const selectionPin = React.useMemo<CellPin | undefined>(
    () =>
      selection && controlsPinned
        ? handle
          ? { side: "start", offset: `${sizer.controls.handle}px` }
          : FIRST_PIN
        : undefined,
    [selection, controlsPinned, handle, sizer.controls.handle]
  )
  const fixed = sizing !== null
  const order = useColumnOrder(
    context,
    frame,
    columns,
    layout,
    options.reorderableColumns
  )

  // The header's on-demand part, in idle time: the resizers.
  usePrefetchFeatures(options.resizableColumns ? PREFETCH_RESIZER : NO_FEATURES)

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
  const [liveMessage, setLiveMessage] = React.useState<LiveMessage | null>(null)
  const rowOrder = useRowOrder(context, frame, gridController, model, handle)

  const rowHeader = shownColumns.find(
    (column) => column.id === layout.rowHeader
  )
  const columnsById = getColumnModel(columns).byId
  const groupCells = React.useMemo(
    () => groupCellsOf(shownColumns, pins),
    [shownColumns, pins]
  )
  // Set on every grouped table's frame, so a grouped table in a detail row
  // never reads the outer one's.
  const reachWidth = grouped
    ? groupLabelWidth(groupCells, sizing?.widths)
    : undefined
  const labelWidth = grouped ? (reachWidth ?? NO_LABEL_WIDTH) : undefined
  useGroupLabelClip(container, reachWidth !== undefined)
  const multiple = options.selectionMode === "multiple"
  const tTable = useTranslations("dataTable")
  const groupLabel = React.useMemo(() => {
    const known = new WeakMap<GroupRow, GroupLabel>()
    return (row: GroupRow): GroupLabel => {
      let label = known.get(row)
      if (!label) {
        const header = columnsById.get(row.column)?.header ?? row.column
        const value = row.text === "" ? tTable("noValue") : row.text
        // The translation's own order: the value's place in it.
        const [before = "", after = ""] = tTable("groupLabel", {
          columnName: header,
          value: "\u0000",
        }).split("\u0000")
        label = { text: before + value + after, before, value, after }
        known.set(row, label)
      }
      return label
    }
  }, [tTable, columnsById])
  const noValue = tTable("noValue")
  const emptyValue = React.useMemo(() => emptyValueContent(noValue), [noValue])
  const shared = React.useMemo<RowShared<unknown>>(
    () => ({
      columns: shownColumns,
      rowHeader,
      formatter,
      emptyValue,
      selection,
      handle,
      order: rowOrder.order,
      size: options.size,
      detail: detail ? detailStore : null,
      levelled: options.tree || grouped || detail,
      tree: options.tree,
      grouped,
      multiple,
      columnsById,
      groupCells,
      groupLabel,
      disableRows: options.disabledBehavior === "all",
      linked: options.linked,
      disabledReasons: options.disabledReasons,
      wrap: !virtualized,
      virtualized,
      columnCount: shownColumns.length + (selection ? 1 : 0) + (handle ? 1 : 0),
      rowIndexOf: options.pagination
        ? (id: string) => {
            // The engine's place, after the open detail rows before it; a
            // server page's rows after the rows of the pages before it
            // (see `rowCount` below).
            const at = model.indexOfRow(id)
            let before = 0
            for (const other of openOnPages)
              if (model.indexOfRow(other) < at) before++
            return (
              (server ? (model.page - 1) * model.pageSize : 0) + at + before
            )
          }
        : null,
      headerRows: headerLayout.headerRows.length,
      fixed,
      pins,
      selectionPin,
      handlePin,
      pinned,
      live: live ? liveBridge.flashes : null,
      actions,
    }),
    [
      shownColumns,
      rowHeader,
      formatter,
      emptyValue,
      selection,
      handle,
      rowOrder.order,
      options.size,
      detail,
      detailStore,
      openOnPages,
      options.tree,
      grouped,
      multiple,
      columnsById,
      groupCells,
      groupLabel,
      options.disabledBehavior,
      options.linked,
      options.disabledReasons,
      options.pagination,
      server,
      // On pages only: a new model gives the rows new places.
      options.pagination ? model : null,
      headerLayout.headerRows.length,
      virtualized,
      fixed,
      pins,
      selectionPin,
      handlePin,
      pinned,
      live ? liveBridge : null,
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
  // Open detail rows take their row's fill; the other rows keep their
  // stripes. Only then a new function per set of rows: the grid's options
  // otherwise stay as they are.
  const parity = options.striped && detail && virtualized
  const rowParity = React.useMemo(
    () => (parity ? rowParityOf(rows) : undefined),
    [parity, rows]
  )
  // The body's rows as rendered, for the grid to find a closed group: set
  // before the layout effects, where the grid looks for it.
  const shownRows = React.useRef(rows)
  // A group's row to focus once the page that holds it shows
  // (`restoreFocusTo`): tried on the first render after it is asked for,
  // and given up there when the page did not change (a controlled `page`
  // that kept its own), or when focus has left the table since. Focus is
  // in the table when it is asked for; the page change then removes the
  // focused row, which drops focus to the page without the user moving it:
  // what counts is whether focus moved out of the table (`focusout` to
  // elsewhere, the element still there), not where it is now.
  const pendingFocus = React.useRef<{
    key: string
    page: number
    /** The render it was asked in. */
    render: number
  } | null>(null)
  const renders = React.useRef(0)
  React.useEffect(() => {
    const element = frame.current
    if (!element) return
    const leave = (event: FocusEvent) => {
      const to = event.relatedTarget as Node | null
      if (to && element.contains(to)) return
      // An element removed while focused is no move of the user's.
      if ((event.target as Node).isConnected) pendingFocus.current = null
    }
    element.addEventListener("focusout", leave)
    return () => element.removeEventListener("focusout", leave)
  }, [])
  React.useLayoutEffect(() => {
    const pending = pendingFocus.current
    if (!pending || pending.render === renders.current) return
    pendingFocus.current = null
    if (model.page !== pending.page) return
    const doc = frame.current?.ownerDocument
    const active = doc?.activeElement
    // Elsewhere on the page: the user's, left as it is.
    if (active && active !== doc.body && !frame.current?.contains(active))
      return
    const at = rows.findIndex(
      (row) => row.key === pending.key && !("continued" in row && row.continued)
    )
    if (at !== -1) gridController.current?.focusRow(at)
  })
  // What the last render changed, for `restoreFocusTo`: a group closed on
  // the same page, not the page itself (a page change, rows clamped).
  const lastRender = React.useRef({ closedGroups, page: model.page })
  const groupClosed = React.useRef(false)
  React.useInsertionEffect(() => {
    renders.current++
    shownRows.current = rows
    const before = lastRender.current
    groupClosed.current =
      before.closedGroups !== closedGroups && before.page === model.page
    lastRender.current = { closedGroups, page: model.page }
  })
  const grid = React.useMemo<TableGridOptions>(
    () => ({
      selectionMode: options.selectionMode,
      disallowEmptySelection: options.disallowEmptySelection,
      onValueChange: actions.gridValueChange,
      onActivate: options.activatable ? actions.activate : undefined,
      describeItem,
      tree: shared.levelled,
      controller: gridController,
      rowParity,
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
      // A row gone with the group that closed over it (an item, its
      // detail row, a group in it), or a group's row repeated at the top of
      // a page that went as the group closed: focus goes to the group's
      // own row (the outermost closed one), on the page that holds it. A
      // row gone with its page (a page change, rows clamped) is the grid's.
      restoreFocusTo: (id, focused) => {
        const { model: current, closedGroups: closed } = store.get()
        const group =
          current.groupPath(id).find((key) => isGroupClosed(closed, key)) ??
          // A group's own row, gone as it closed.
          (current.item(id) === undefined &&
          current.indexOfRow(id) >= 0 &&
          isGroupClosed(closed, id)
            ? id
            : undefined)
        if (group === undefined) return null
        const at = shownRows.current.findIndex(
          (row) => row.key === group && !("continued" in row && row.continued)
        )
        if (at !== -1) return at
        // On an earlier page, closed just now: that page, then the row
        // (`pendingFocus`).
        const index = current.indexOfRow(group)
        if (
          !focused ||
          !groupClosed.current ||
          index === -1 ||
          server ||
          !options.pagination
        )
          return null
        const page = Math.floor(index / current.pageSize) + 1
        pendingFocus.current = { key: group, page, render: renders.current }
        actions.setPage(page, "group")
        return null
      },
    }),
    [
      options.selectionMode,
      options.disallowEmptySelection,
      options.activatable,
      options.disabledBehavior,
      options.pagination,
      server,
      actions,
      describeItem,
      shared.levelled,
      store,
      rowParity,
    ]
  )

  React.useEffect(() => {
    if (!virtualized) return
    const wrapped = layout.columns.filter((column) => column.definition.wrap)
    try {
      if (process.env.NODE_ENV !== "production" && wrapped.length > 0)
        actions.warn(
          "wrap-virtualized",
          `DataTableContent: \`wrap\` is off for ${wrapped
            .map((column) => `"${column.id}"`)
            .join(", ")} in a virtualized table, whose rows are one height.`
        )
    } catch {
      // No `process` (no bundler): no warning.
    }
  }, [actions, virtualized, layout.columns])

  // More rows to come: loading rows after the last one, and no bar. Not
  // while a client table searches or filters: what matches among rows not
  // loaded is the server's to say (server mode).
  const more =
    options.hasMore && !failed && rows.length > 0 && (server || !searching)
  // "Show more" in their place, without the observer.
  const button = options.loadMore === "button"
  // The row after the rows ("Show more" or the error) continues their
  // stripes: striped when even (its index odd), counting every row but the
  // detail rows, which take their row's fill.
  const after = (more && button) || inlineError
  const nextStriped = React.useMemo(
    () =>
      options.striped &&
      after &&
      rows.reduce((count, row) => count + (row.kind === "detail" ? 0 : 1), 0) %
        2 ===
        1,
    [options.striped, after, rows]
  )
  const refreshing = loading && !failed && rows.length > 0 && !more
  const setFrame = React.useCallback(
    (element: HTMLDivElement | null) => {
      frame.current = element
      actions.setFrame(element)
    },
    [actions]
  )
  const headerHeight = useHeaderHeight(frame, refreshing)
  useFullPageHeight(frame, options.pagination && !virtualized, model)
  const results = useResults({
    matchKey,
    server,
    rowCount: model.rowCount,
    items: model.allItems(),
    loading,
  })
  const itemCount = model.allItems().length
  const focusRow = React.useCallback(
    (index: number) => gridController.current?.focusRow(index),
    []
  )
  const focusTable = React.useCallback(() => actions.focusTable(), [actions])
  const showMore = useShowMore({
    on: button,
    frame,
    rows: rows.length,
    items: itemCount,
    loading,
    loadMore: actions.loadMore,
    focusRow,
    focusTable,
  })
  const status = useStatus({
    failed,
    loading,
    rows: rows.length,
    rowCount: model.rowCount,
    noResults: !failed && !loading && searching && rows.length === 0,
    results: failed ? null : results,
    added: failed ? null : (showMore.added?.count ?? null),
    liveAdded: failed || !live ? null : (liveMessage?.count ?? null),
  })
  // What came last is said: a search, a load or "Show more" after rows
  // were added replaces their message.
  React.useEffect(() => {
    setLiveMessage(null)
  }, [matchKey, loading, showMore.added])
  const moreRows = React.useRef<HTMLTableSectionElement | null>(null)
  const view = useDataTableSelector(context, (state) => state.view)
  useLoadMore(moreRows, container, {
    on: more && !inlineError && !loading && !button,
    virtualized,
    rearm: [model.allItems(), view],
    loadMore: actions.loadMore,
  })
  // Every page's rows, when only some are in the DOM: on pages, or the
  // server's count in a virtualized table; unknown (-1) while more rows
  // come and the server does not say how many. The totals row is the last.
  //
  // In server mode the server's items are counted (`rowCount`), and the
  // rows that are not items, known only for the loaded ones (group rows,
  // a group's row repeated at the top of the page, detail rows), are
  // added to them; a page's rows take the places after the pages before
  // it, (page − 1) × pageSize items (`rowIndexOf`). So no row's index is
  // past the count, whatever is grouped or open.
  const headerRows = headerLayout.headerRows.length
  const extraRows = server
    ? bodyRows.reduce(
        (count, row) =>
          row.kind === "item" && !row.continued ? count : count + 1,
        0
      )
    : 0
  const footerRows = totals && !failed && !firstLoad ? 1 : 0
  const counted =
    more && !(server && model.rowCount > rows.length)
      ? -1
      : options.pagination && !server
        ? headerRows + model.allRows.length + openOnPages.length
        : server && (options.pagination || virtualized)
          ? headerRows + model.rowCount + extraRows
          : virtualized && footerRows
            ? headerRows + rows.length
            : undefined
  const rowCount =
    counted === undefined || counted === -1 ? counted : counted + footerRows

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

  const header: HeaderShared<unknown> = {
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
  }
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
        "relative min-h-0 overflow-hidden rounded-md border",
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
        <TableContainerConfig value={containerConfig}>
          {/* Keeps the row the user is on still as items change (live data). */}
          <LiveAnchor itemsKey={model.ids} bridge={live ? liveBridge : null}>
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
              {sizer.mode === "fixed" && sizing && (
                <colgroup data-slot="data-table-columns">
                  {handle && <col style={{ width: sizer.controls.handle }} />}
                  {selection && (
                    <col style={{ width: sizer.controls.selection }} />
                  )}
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
              {/* The loading rows in a body of their own, not the rows':
                a virtualized body locks its columns' widths and measures
                its rows' height from the first rows it renders, which are
                to be the rows (a badge, a button), not a line of skeleton
                each. */}
              {firstLoad ? (
                <tbody
                  data-slot="data-table-loading-rows"
                  className="[&_tr:last-child]:border-0"
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
              {more &&
                !inlineError &&
                (button ? (
                  <tbody data-slot="data-table-loading-more">
                    <DataTableShowMore
                      columns={shared.columnCount}
                      size={options.size}
                      striped={nextStriped}
                      shown={itemCount}
                      total={options.rowCountKnown ? model.rowCount : undefined}
                      loading={loading}
                      onShowMore={showMore.press}
                    />
                  </tbody>
                ) : (
                  <tbody
                    ref={moreRows}
                    aria-hidden
                    data-slot="data-table-loading-more"
                  >
                    {loadingRows(MORE_ROWS, layout.columns, shared)}
                  </tbody>
                ))}
              {inlineError && (
                <tbody data-slot="data-table-loading-more">
                  <DataTableMoreError
                    columns={shared.columnCount}
                    size={options.size}
                    striped={nextStriped}
                    description={error === true ? undefined : error}
                    onRetry={options.retryable ? actions.retry : undefined}
                  />
                </tbody>
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
        </TableContainerConfig>
      </DataTableGrid>
      {refreshing && <DataTableProgress top={headerHeight} />}
      {ReorderColumns && order.order && <ReorderColumns order={order.order} />}
      {ReorderRows && rowOrder.order && <ReorderRows order={rowOrder.order} />}
      {live && Live && (
        <Live
          live={live}
          bridge={liveBridge}
          onMessage={setLiveMessage}
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
          text for each batch "Show more" brought, read even when it says
          the same. */}
      <span role="status" className="sr-only">
        <React.Fragment
          key={
            live && liveMessage
              ? `live-${liveMessage.key}`
              : (showMore.added?.key ?? 0)
          }
        >
          {status}
        </React.Fragment>
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
