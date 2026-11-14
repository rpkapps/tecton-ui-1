"use client"

/**
 * `DataTable`, the root: it holds the table's state (the view, the
 * selection, expanded rows, the page; each controlled or not), runs the
 * engine over the items, and gives the parts inside it the result through
 * a store (`context.tsx`). Its context value never changes, and the parts
 * are the caller's elements, so a render of the root re-renders only the
 * parts whose slice of the store changed.
 *
 * - Every change goes through one `on…Change(value, eventDetails)`, whose
 *   `eventDetails.cancel()` keeps it from being applied.
 * - The view is reconciled against the columns and the features on, the
 *   controlled one too (`engine/view.ts`).
 * - When the view's search, filters, sorting or grouping change, the page
 *   goes back to 1 (unless the page changed with it), and in server mode
 *   "all matching" ends with a change of search or filters.
 * - Server "all matching" holds while the selection is the one it last
 *   reported: a controlled `value` set to anything else ends it.
 * - Development warnings, once each: items without ids or sharing one, a
 *   view that hides every column, and features that cannot work together
 *   (the later one is off).
 * - The search reaches the view (and `onViewChange`) `searchDelay` ms after
 *   the user stops typing (`search.tsx`); the field shows each key at once.
 * - Groups are open unless closed: which ones are closed is the table's
 *   own, kept for the grouping they were closed in (a new grouping opens
 *   every group). A group's checkbox selects its items that can be.
 * - Rows are reordered in a flat list only, the order being the
 *   application's (`onRowOrderChange`).
 */
import * as React from "react"
import { cn } from "cn"

import { useLocale } from "@tecton/react/provider"

import { useTranslations } from "../i18n/translations"
import { useControlled } from "../primitives/use-controlled"
import { useTectonRouter } from "../router"
import { createStore } from "../store"
import {
  ALL_OPEN,
  allMatchingValue,
  createDataTableEngine,
  createDefaultView,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZES,
  getColumnModel,
  getFormatter,
  layoutColumns,
  reconcileView,
  sameIds,
  sameView,
  selectAllIds,
  type ClosedGroups,
  type DataTableColumns,
  type DataTablePartialView,
  type DataTableView,
  type DataTableViewChangeReason,
  type ViewCapabilities,
} from "./engine/index"
import {
  DataTableContext,
  type DataTableChangeDetails,
  type DataTableContextValue,
  type DataTableExpandedChangeReason,
  type DataTableOptions,
  type DataTablePageChangeReason,
  type DataTablePageSizeChangeReason,
  type DataTableRowOrderChangeReason,
  type DataTableSelectionChangeDetails,
  type DataTableSelectionMode,
  type DataTableState,
} from "./context"
import {
  createActions,
  type Collapsed,
  type Latest,
  type Matching,
} from "./actions"
import { useRootWarnings } from "./dev-warnings"
import { DRAG_AND_DROP, usePrefetchFeatures } from "./lazy"
import {
  resolveHighlightChanges,
  useHeldItems,
  useLiveFeed,
  type DataTableHighlightChanges,
} from "./live"
import { useStable } from "./use-stable"
import { createWarnings } from "./warnings"

// Development only: every warning is behind `process.env.NODE_ENV`,
// written out at its call site so that a consumer's bundler (which replaces
// that expression, not `typeof process`) drops it and its message from a
// production build, and in a `try` so that, with no bundler and no
// `process`, there is no warning rather than an error (`warnings.ts`).
declare const process: { env: { NODE_ENV?: string } }

type DataTableProps<T> = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  // Data
  items: ReadonlyArray<T>
  /** Made with `createColumns`. */
  columns: DataTableColumns<T>
  /** A row's id: `String(item.id)` by default. */
  itemToId?: (item: T) => string
  /** A tree's children; `undefined` for none (in server mode: not loaded yet). */
  itemToChildren?: (item: T) => ReadonlyArray<T> | undefined
  /** Makes the row header a link, which activating the row follows (through the provider's router). */
  itemToHref?: (item: T) => string | undefined
  isItemDisabled?: (item: T) => boolean
  /**
   * Why a disabled row (`isItemDisabled`) cannot be selected: shown in a
   * tooltip on its checkbox, and as the checkbox's description. `undefined`
   * for none.
   */
  itemToDisabledReason?: (item: T) => React.ReactNode | undefined
  /**
   * What a disabled row cannot do: `"all"` (default) is neither focused,
   * selected nor activated; `"selection"` is focused and activated, not
   * selected.
   */
  disabledBehavior?: "all" | "selection"
  // Data mode
  /**
   * `"client"` (default): the table searches, filters, sorts and pages
   * `items`. `"server"`: `items` are the server's rows for the view and the
   * page; the table reports changes and pages from `rowCount`.
   */
  dataMode?: "client" | "server"
  /** Server mode: the number of rows the view matches. */
  rowCount?: number
  /** Skeleton rows while there are none yet, else a bar under the header. */
  loading?: boolean
  /** Shows the error state in place of the rows; content is its description. */
  error?: React.ReactNode
  /** Adds "Retry" to the error state. */
  onRetry?: () => void
  /**
   * More rows come after `items`, loaded in batches (`loadMore`): with
   * `"scroll"`, loading rows show at the end, and `onLoadMore` is called as
   * they come near; with `"button"`, "Show more" after the last row calls it.
   */
  hasMore?: boolean
  /**
   * How the next rows are asked for while `hasMore`: `"scroll"` (default)
   * as the end of the rows comes near; `"button"` by "Show more" after the
   * last row, with how many rows show (of `rowCount` in server mode), for a
   * table with content under it that loading on scroll would push away.
   */
  loadMore?: "scroll" | "button"
  /**
   * Load the next rows and add them to `items`. With `loadMore="scroll"`,
   * called once when the end of the rows comes within two views (not again
   * until `items`, `loading` back to false or the view changes); with
   * `"button"`, when "Show more" is pressed. In client mode, not while a
   * search or filter is in effect: use server mode to load what matches.
   */
  onLoadMore?: () => void
  // Look
  /** `sm` is compact: shorter header and rows, smaller text. */
  size?: "default" | "sm"
  /** Every even row on an alternate surface. */
  striped?: boolean
  /**
   * Live data: rows added to `items` after the first render are highlighted
   * where they land, and the highlight fades once the row is seen; those
   * out of view are counted in a "new rows" button at that edge of the
   * table that goes to them; and the row the user is on (its menu open,
   * focused, pointed at, or the first in view) does not move. `true`, or
   * `{ duration }` for the fade's ms (1,500 by default).
   */
  highlightChanges?: DataTableHighlightChanges
  // Features: on at the root, a column can only turn one off.
  /** Header buttons sort; on by default. */
  sortable?: boolean
  /**
   * Sorting by several columns: Shift + click on a header, and "Add to sort"
   * in the column menus. On by default; off, a view keeps its first sort.
   */
  multiSort?: boolean
  /**
   * The view's search and filters apply (`DataTableSearch`,
   * `DataTableFilter`); `filterable: false` opts a column out.
   */
  filterable?: boolean
  /**
   * The view's grouping applies: group rows with subtotals,
   * `DataTableGroupBy`, "Group by column" in the column menus;
   * `groupable: false` opts a column out. Not in a tree.
   */
  groupable?: boolean
  /** A resizer on each column header's end edge (`resizable: false` opts a column out). */
  resizableColumns?: boolean
  /** Column headers are dragged into order, a column among its group's. */
  reorderableColumns?: boolean
  /** Columns are hidden from their header's menu and `DataTableColumnsMenu`. */
  hideableColumns?: boolean
  /** Columns are pinned to the start or the end, from the same menus. */
  pinnableColumns?: boolean
  /**
   * Rows are dragged into order by a handle at their start (flat lists
   * only); the order is the application's: `onRowOrderChange`.
   */
  reorderableRows?: boolean
  /** Pages of `pageSize` rows, with the footer's page parts. */
  pagination?: boolean
  /** Whether rows select, one at a time or several (with a checkbox column). */
  selectionMode?: DataTableSelectionMode
  // View
  /**
   * What the table shows (controlled): any part of the view, the rest taken
   * from `defaultView` or the defaults, reconciled like it.
   */
  view?: DataTablePartialView
  /** Any part of the view; the rest is the defaults. Read once. */
  defaultView?: DataTablePartialView
  onViewChange?: (
    view: DataTableView,
    eventDetails: DataTableChangeDetails<DataTableViewChangeReason>
  ) => void
  /**
   * How long after the last key the search reaches the view, in ms: 300 in
   * server mode (one request once the user pauses), 0 in client mode.
   */
  searchDelay?: number
  // Row selection
  /** The selected rows' ids (controlled). */
  value?: ReadonlyArray<string>
  defaultValue?: ReadonlyArray<string>
  onValueChange?: (
    value: Array<string>,
    eventDetails: DataTableSelectionChangeDetails
  ) => void
  /** Keeps at least one row selected. */
  disallowEmptySelection?: boolean
  // Expanded
  /** The open tree rows' ids (controlled). */
  expanded?: ReadonlyArray<string>
  defaultExpanded?: ReadonlyArray<string>
  onExpandedChange?: (
    expanded: Array<string>,
    eventDetails: DataTableChangeDetails<DataTableExpandedChangeReason>
  ) => void
  // Pages
  /** From 1 (controlled). */
  page?: number
  defaultPage?: number
  onPageChange?: (
    page: number,
    eventDetails: DataTableChangeDetails<DataTablePageChangeReason>
  ) => void
  /** Rows per page (controlled). */
  pageSize?: number
  /** 10 by default. */
  defaultPageSize?: number
  onPageSizeChange?: (
    pageSize: number,
    eventDetails: DataTableChangeDetails<DataTablePageSizeChangeReason>
  ) => void
  /** The page sizes to choose from: 10, 20, 50 and 100 by default. */
  pageSizes?: ReadonlyArray<number>
  // Events
  /** A row activated: Enter, or a click (a double click when rows select). */
  onActivate?: (id: string, item: T) => void
  /**
   * Rows reordered (`reorderableRows`): every item's id, in the new order.
   * Put `items` in that order; the table does not reorder them itself.
   */
  onRowOrderChange?: (
    ids: Array<string>,
    eventDetails: DataTableChangeDetails<DataTableRowOrderChangeReason>
  ) => void
}

const NO_IDS: ReadonlyArray<string> = []
const NO_FEATURES = [] as const
const PREFETCH_DRAG_AND_DROP = [DRAG_AND_DROP]
const NO_GROUPS: Collapsed = { grouping: NO_IDS, closed: ALL_OPEN }

function sameMembers(a: ReadonlyArray<string>, b: ReadonlyArray<string>) {
  if (a === b) return true
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
}

/**
 * The root's state, each piece controlled or not: the view (reconciled
 * against the columns and the features on), the selection and server "all
 * matching", the filters cleared (a count), the open tree rows, the closed
 * groups (the table's own, for the grouping they were closed in) and the
 * page and its size.
 */
function useDataTableState<T>(
  columns: DataTableColumns<T>,
  capabilities: ViewCapabilities,
  viewProp: DataTablePartialView | undefined,
  defaultView: DataTablePartialView | undefined,
  valueProp: ReadonlyArray<string> | undefined,
  defaultValue: ReadonlyArray<string> | undefined,
  expandedProp: ReadonlyArray<string> | undefined,
  defaultExpanded: ReadonlyArray<string> | undefined,
  pageProp: number | undefined,
  defaultPage: number | undefined,
  pageSizeProp: number | undefined,
  defaultPageSize: number | undefined
) {
  // Read once, as a default value is.
  const [initialView] = React.useState(defaultView)
  const defaults = React.useMemo(
    () => createDefaultView(columns, initialView, capabilities),
    [columns, initialView, capabilities]
  )
  const [rawView, setView] = useControlled<DataTablePartialView>(
    viewProp,
    defaults
  )
  const reconciled = React.useMemo(
    () => reconcileView(columns, rawView, defaults, capabilities),
    [columns, rawView, defaults, capabilities]
  )
  // A partial view written inline is a new object on every render, and so
  // is its reconciled view: kept while it is the same, so nothing that
  // reads it renders or reacts again.
  const steadyView = React.useRef(reconciled)
  if (!sameView(steadyView.current, reconciled)) steadyView.current = reconciled
  const view = steadyView.current
  const [ownValue, setValue] = useControlled<ReadonlyArray<string>>(
    valueProp,
    defaultValue ?? NO_IDS
  )
  const [matching, setMatching] = React.useState<Matching | null>(null)
  const [clears, setClears] = React.useState(0)
  const [expanded, setExpanded] = useControlled<ReadonlyArray<string>>(
    expandedProp,
    defaultExpanded ?? NO_IDS
  )
  // A new grouping opens every group: those closed in another are
  // forgotten.
  const [collapsed, setCollapsed] = React.useState<Collapsed>(NO_GROUPS)
  const ofGrouping = sameIds(collapsed.grouping, view.grouping)
  if (!ofGrouping && collapsed !== NO_GROUPS) setCollapsed(NO_GROUPS)
  const closedGroups = ofGrouping ? collapsed.closed : ALL_OPEN
  const [page, setPage] = useControlled(pageProp, defaultPage ?? 1)
  const [pageSize, setPageSize] = useControlled(
    pageSizeProp,
    defaultPageSize ?? DEFAULT_PAGE_SIZE
  )

  return {
    defaults,
    rawView,
    view,
    setView,
    ownValue,
    setValue,
    matching,
    setMatching,
    clears,
    setClears,
    expanded,
    setExpanded,
    closedGroups,
    setCollapsed,
    page,
    setPage,
    pageSize,
    setPageSize,
  }
}

function DataTable<T>({
  items,
  columns,
  itemToId,
  itemToChildren,
  itemToHref,
  isItemDisabled,
  itemToDisabledReason,
  disabledBehavior = "all",
  dataMode = "client",
  rowCount,
  loading = false,
  error,
  onRetry,
  hasMore = false,
  loadMore = "scroll",
  onLoadMore,
  size = "default",
  striped = false,
  highlightChanges,
  sortable = true,
  multiSort = true,
  filterable = false,
  groupable = false,
  resizableColumns = false,
  reorderableColumns = false,
  hideableColumns = false,
  pinnableColumns = false,
  reorderableRows = false,
  pagination = false,
  selectionMode = "none",
  view: viewProp,
  defaultView,
  onViewChange,
  searchDelay,
  value: valueProp,
  defaultValue,
  onValueChange,
  disallowEmptySelection = false,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  page: pageProp,
  defaultPage,
  onPageChange,
  pageSize: pageSizeProp,
  defaultPageSize,
  onPageSizeChange,
  pageSizes = DEFAULT_PAGE_SIZES,
  onActivate,
  onRowOrderChange,
  className,
  children,
  ...props
}: DataTableProps<T>) {
  const t = useTranslations("dataTable")
  const { locale } = useLocale()
  const { navigate } = useTectonRouter()
  const [warn] = React.useState(createWarnings)
  const tree = itemToChildren !== undefined
  const server = dataMode === "server"

  // A tree's rows nest by their items, not by grouping or a flat order
  // (§4.3).
  const grouping = groupable && !tree
  const rowOrder = reorderableRows && !tree
  const capabilities = React.useMemo<ViewCapabilities>(
    () => ({ sortable, multiSort, filterable, groupable: grouping }),
    [sortable, multiSort, filterable, grouping]
  )

  // ---- state --------------------------------------------------------------

  const {
    defaults,
    rawView,
    view,
    setView,
    ownValue,
    setValue,
    matching,
    setMatching,
    clears,
    setClears,
    expanded,
    setExpanded,
    closedGroups,
    setCollapsed,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useDataTableState(
    columns,
    capabilities,
    viewProp,
    defaultView,
    valueProp,
    defaultValue,
    expandedProp,
    defaultExpanded,
    pageProp,
    defaultPage,
    pageSizeProp,
    defaultPageSize
  )

  // ---- rows ---------------------------------------------------------------

  const labels = React.useMemo(() => ({ yes: t("yes"), no: t("no") }), [t])
  const [engine] = React.useState(() => createDataTableEngine<T>())
  // Live data: the engine gets the items but the rows kept back from an
  // earlier page while the table is in use (`live.ts`).
  const liveOptions = resolveHighlightChanges(highlightChanges)
  const shown = useHeldItems({
    on: liveOptions !== null,
    items,
    itemToId,
    itemToChildren,
  })
  const model = engine.run({
    items: shown.items,
    columns,
    view,
    locale,
    labels,
    itemToId,
    itemToChildren: shown.itemToChildren,
    isItemDisabled,
    dataMode,
    sortable,
    filterable,
    expanded,
    collapsedGroups: closedGroups,
    pagination: pagination ? { page, pageSize } : null,
    rowCount,
  })
  const layout = layoutColumns(columns, view)
  const formatter = getFormatter(getColumnModel(columns), locale, labels)
  const { live, control: liveControl } = useLiveFeed({
    options: liveOptions,
    model,
    server,
    // In server mode, the rows of a new view are not additions.
    viewKey:
      server && liveOptions
        ? JSON.stringify([
            view.search,
            view.filters,
            view.sorting,
            view.grouping,
            pagination ? [page, pageSize] : null,
          ])
        : "",
    loading,
    held: shown.held,
    setHeld: shown.setHeld,
  })

  const allMatching =
    matching &&
    server &&
    selectionMode === "multiple" &&
    (valueProp === undefined || sameMembers(valueProp, matching.value))
      ? matching.allMatching
      : null
  const value = React.useMemo(
    () => (allMatching ? allMatchingValue(model, allMatching) : ownValue),
    [allMatching, model, ownValue]
  )
  const selected = React.useMemo(() => new Set(value), [value])
  const selectable = React.useMemo(() => {
    let ids: ReadonlyArray<string> | undefined
    return () => (ids ??= selectAllIds(model))
  }, [model])

  const linked = itemToHref !== undefined
  const disabledReasons = itemToDisabledReason !== undefined
  const activatable = onActivate !== undefined || linked
  const retryable = onRetry !== undefined
  // Load more is for a list without pages: pages load their own rows.
  const more = hasMore && !pagination
  const rowCountKnown = server && rowCount !== undefined
  const delay = Math.max(0, searchDelay ?? (server ? 300 : 0))
  // Compared by value: an inline array is a new one on every render.
  const pageSizesKey = pageSizes.join(",")
  const sizes = React.useMemo(
    () => pageSizesKey.split(",").map(Number),
    [pageSizesKey]
  )
  const options = useStable<DataTableOptions>({
    dataMode,
    size,
    striped,
    sortable,
    multiSort,
    filterable,
    groupable: grouping,
    resizableColumns,
    reorderableColumns,
    hideableColumns,
    pinnableColumns,
    reorderableRows: rowOrder,
    pagination,
    selectionMode,
    disabledBehavior,
    disallowEmptySelection,
    tree,
    linked,
    disabledReasons,
    activatable,
    retryable,
    hasMore: more,
    loadMore,
    rowCountKnown,
    searchDelay: delay,
    pageSizes: sizes,
  })

  const state = useStable<DataTableState<T>>({
    columns,
    model,
    layout,
    formatter,
    view,
    defaults,
    options,
    value,
    selected,
    selectable,
    allMatching,
    expanded,
    closedGroups,
    loading,
    error: error ?? null,
    clears,
    live,
  })

  // ---- context ------------------------------------------------------------

  const latestValues: Latest<T> = {
    columns,
    capabilities,
    defaults,
    view,
    model,
    layout,
    formatter,
    value,
    allMatching,
    selectable,
    expanded,
    closedGroups,
    page,
    pageSize,
    server,
    pagination,
    loading,
    selectionMode,
    disallowEmptySelection,
    itemToHref,
    itemToDisabledReason,
    navigate,
    onActivate,
    onRowOrderChange,
    onViewChange,
    onValueChange,
    onExpandedChange,
    onPageChange,
    onPageSizeChange,
    onRetry,
    onLoadMore,
    live: live ? liveControl : null,
    controlled: {
      view: viewProp !== undefined,
      value: valueProp !== undefined,
      expanded: expandedProp !== undefined,
      page: pageProp !== undefined,
      pageSize: pageSizeProp !== undefined,
    },
    setClears,
    setView,
    setValue,
    setMatching,
    setExpanded,
    setCollapsed,
    setPage,
    setPageSize,
  }
  const latest = React.useRef(latestValues)
  const [{ actions, viewChanged, pageShown, committed }] = React.useState(() =>
    createActions(latest, warn)
  )
  React.useInsertionEffect(() => {
    latest.current = latestValues
    committed()
  })
  const [store] = React.useState(() => createStore(state))
  const [context] = React.useState(() => ({ store, actions }))
  React.useLayoutEffect(() => {
    store.set(state)
  }, [store, state])

  const previous = React.useRef({ view, page })
  React.useLayoutEffect(() => {
    const before = previous.current
    previous.current = { view, page }
    if (before.view !== view) viewChanged(before.view, before.page)
  }, [viewChanged, view, page])
  React.useEffect(() => {
    pageShown()
  }, [pageShown, model.page, page, loading])

  // ---- on demand, warnings ------------------------------------------------

  usePrefetchFeatures(
    reorderableColumns || rowOrder ? PREFETCH_DRAG_AND_DROP : NO_FEATURES
  )

  try {
    // The same on every render (the build's): the hooks keep their order.
    if (process.env.NODE_ENV !== "production")
      useRootWarnings(warn, {
        columns,
        idIssues: model.idIssues,
        hidden: rawView.columns?.hidden,
        groupable,
        reorderableRows,
        tree,
        hasMore,
        pagination,
        server,
        rowCount,
      })
  } catch {
    // No `process` (no bundler): no warnings.
  }

  return (
    <DataTableContext value={context as DataTableContextValue<unknown>}>
      <div
        data-slot="data-table"
        className={cn("flex min-w-0 flex-col gap-3", className)}
        {...props}
      >
        {children}
      </div>
    </DataTableContext>
  )
}

export { DataTable }
// More actions (`more-actions.ts`) build on these.
export { emit } from "./actions"
export type { ActionInternals } from "./actions"
export type { DataTableProps }
