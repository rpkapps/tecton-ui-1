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
 * - Development warnings, once each: items without ids or sharing one, and
 *   features that cannot work together (the later one is off).
 */
import * as React from "react"
import { cn } from "cn"

import { useLocale } from "@tecton/react/tecton/provider"

import { useTranslations } from "../i18n/translations"
import {
  createChangeEventDetails,
  type ChangeEventDetails,
} from "../primitives/event-details"
import { useControlled } from "../primitives/use-controlled"
import { useTectonRouter } from "../router"
import { createStore } from "../store"
import {
  allMatchingValue,
  clampPage,
  createDataTableEngine,
  createDefaultView,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZES,
  enterAllMatching,
  getColumnModel,
  getFormatter,
  layoutColumns,
  reconcileView,
  resolvePageSize,
  sameView,
  selectAllIds,
  shouldResetPage,
  sortColumn,
  viewMatchesChanged,
  type ColumnLayout,
  type DataTableAllMatching,
  type DataTableColumns,
  type DataTablePartialView,
  type DataTableRowModel,
  type DataTableView,
  type DataTableViewChangeReason,
  type Formatter,
  type ViewCapabilities,
} from "./engine/index"
import {
  DataTableContext,
  type DataTableActions,
  type DataTableChangeDetails,
  type DataTableContextValue,
  type DataTableExpandedChangeReason,
  type DataTableOptions,
  type DataTablePageChangeReason,
  type DataTablePageSizeChangeReason,
  type DataTableSelectionChangeDetails,
  type DataTableSelectionChangeReason,
  type DataTableSelectionMode,
  type DataTableState,
} from "./context"
import { loadFeature, usePrefetchFeatures, type FeatureName } from "./lazy"
import { createWarnings, type Warn } from "./warnings"

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
  // Look
  /** `sm` is compact: shorter header and rows, smaller text. */
  size?: "default" | "sm"
  /** Every even row on an alternate surface. */
  striped?: boolean
  // Features: on at the root, a column can only turn one off.
  /** Header buttons sort (Shift: by several columns); on by default. */
  sortable?: boolean
  filterable?: boolean
  groupable?: boolean
  editable?: boolean
  resizableColumns?: boolean
  reorderableColumns?: boolean
  hideableColumns?: boolean
  pinnableColumns?: boolean
  reorderableRows?: boolean
  /** Pages of `pageSize` rows, with the footer's page parts. */
  pagination?: boolean
  /** Whether rows select, one at a time or several (with a checkbox column). */
  selectionMode?: DataTableSelectionMode
  cellSelectionMode?: "none" | "cell" | "range"
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
}

/** The props and state the actions read, as of the last render. */
type Latest<T> = {
  columns: DataTableColumns<T>
  capabilities: ViewCapabilities
  defaults: DataTableView
  view: DataTableView
  model: DataTableRowModel<T>
  layout: ColumnLayout<T>
  formatter: Formatter<T>
  value: ReadonlyArray<string>
  allMatching: DataTableAllMatching | null
  selectable: () => ReadonlyArray<string>
  expanded: ReadonlyArray<string>
  page: number
  pageSize: number
  server: boolean
  pagination: boolean
  loading: boolean
  selectionMode: DataTableSelectionMode
  disallowEmptySelection: boolean
  itemToHref: DataTableProps<T>["itemToHref"]
  navigate: ((href: string) => void) | undefined
  onActivate: DataTableProps<T>["onActivate"]
  onViewChange: DataTableProps<T>["onViewChange"]
  onValueChange: DataTableProps<T>["onValueChange"]
  onExpandedChange: DataTableProps<T>["onExpandedChange"]
  onPageChange: DataTableProps<T>["onPageChange"]
  onPageSizeChange: DataTableProps<T>["onPageSizeChange"]
  onRetry: DataTableProps<T>["onRetry"]
  setView: (view: DataTablePartialView) => void
  setValue: (value: ReadonlyArray<string>) => void
  setMatching: (matching: Matching | null) => void
  setExpanded: (expanded: ReadonlyArray<string>) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

/** Server "all matching", with the selection it reported. */
type Matching = {
  allMatching: DataTableAllMatching
  value: ReadonlyArray<string>
}

const NO_IDS: ReadonlyArray<string> = []

function sameMembers(a: ReadonlyArray<string>, b: ReadonlyArray<string>) {
  if (a === b) return true
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
}

/** Calls `handler` and, unless it cancels, applies `value`. */
function emit<TValue, TReason extends string>(
  handler:
    ((value: TValue, details: ChangeEventDetails<TReason>) => void) | undefined,
  apply: (value: TValue) => void,
  value: TValue,
  reason: TReason,
  event?: Event
) {
  const details = createChangeEventDetails(reason, event)
  handler?.(value, details)
  if (details.isCanceled) return false
  apply(value)
  return true
}

/** The rows of `ids`: the matching ones in display order, then the rest. */
function itemsOf<T>(model: DataTableRowModel<T>, ids: ReadonlyArray<string>) {
  const wanted = new Set(ids)
  const items: Array<T> = []
  for (const id of model.matchingIds())
    if (wanted.delete(id)) items.push(model.item(id) as T)
  for (const id of wanted) {
    const item = model.item(id)
    if (item !== undefined) items.push(item)
  }
  return items
}

/** The pieces of state a change has set and the root has not rendered yet. */
type Pending<T> = Partial<
  Pick<
    Latest<T>,
    "view" | "value" | "allMatching" | "expanded" | "page" | "pageSize"
  >
>

/** The modifier keys of the event that activated a row, for its link. */
function modifiers(event: Event | undefined) {
  const keys = event as Partial<MouseEvent> | undefined
  return {
    ctrlKey: keys?.ctrlKey === true,
    metaKey: keys?.metaKey === true,
    shiftKey: keys?.shiftKey === true,
    altKey: keys?.altKey === true,
  }
}

function createActions<T>(latest: { current: Latest<T> }, warn: Warn) {
  // Changes made one after the other before the root renders (two setters
  // in one handler) build on each other, not on the last render.
  let pending: Pending<T> = {}
  const now = (): Latest<T> => ({ ...latest.current, ...pending })
  // Kept until the root next commits: then the props and state hold the
  // changes, or the owner's own controlled values in their place.
  const set = (patch: Pending<T>) => {
    pending = { ...pending, ...patch }
  }
  /** Views this table reported: their page reset is done already. */
  const reported = new WeakSet<DataTableView>()
  let frame: HTMLElement | null = null

  const commitSelection = (
    next: Array<string>,
    reason: DataTableSelectionChangeReason,
    event: Event | undefined,
    allMatching: DataTableAllMatching | null
  ) => {
    const current = now()
    if (current.selectionMode === "none") return false
    if (current.disallowEmptySelection && next.length === 0) return false
    const details: DataTableSelectionChangeDetails = Object.assign(
      createChangeEventDetails(reason, event),
      { allMatching }
    )
    current.onValueChange?.(next, details)
    if (details.isCanceled) return false
    current.setValue(next)
    current.setMatching(allMatching ? { allMatching, value: next } : null)
    set({ value: next, allMatching })
    return true
  }

  const changePage = (
    page: number,
    reason: DataTablePageChangeReason,
    event?: Event
  ) => {
    const current = now()
    if (emit(current.onPageChange, current.setPage, page, reason, event))
      set({ page })
  }

  const actions: DataTableActions<T> = {
    setView(next, reason, event) {
      const current = now()
      if (next === current.view) return false
      const view = reconcileView(
        current.columns,
        next,
        current.defaults,
        current.capabilities
      )
      if (sameView(view, current.view)) return false
      if (!emit(current.onViewChange, current.setView, view, reason, event))
        return false
      set({ view })
      reported.add(view)
      // In the same handler, so a server table loads once for both.
      if (current.allMatching && viewMatchesChanged(current.view, view))
        commitSelection([...current.value], "view", event, null)
      if (
        current.pagination &&
        current.page !== 1 &&
        shouldResetPage(current.view, view)
      )
        changePage(1, "reset", event)
      return true
    },
    updateView(change, reason, event) {
      const { view } = now()
      const next = change(view)
      return actions.setView(
        next,
        typeof reason === "function" ? reason(view, next) : reason,
        event
      )
    },
    sort(column, multi, event) {
      return actions.updateView(
        (view) => sortColumn(view, column, { multi }),
        "sort",
        event
      )
    },
    setValue(value, reason, event) {
      commitSelection([...value], reason, event, null)
    },
    gridValueChange(next, details) {
      const { allMatching, value } = now()
      let matching: DataTableAllMatching | null = null
      // In all-matching, the rows deselected are the exceptions.
      if (allMatching && details.reason !== "clear") {
        const after = new Set(next)
        const except = new Set(allMatching.except)
        for (const id of value) if (!after.has(id)) except.add(id)
        for (const id of next) except.delete(id)
        matching = { except: [...except] }
      }
      if (!commitSelection(next, details.reason, details.event, matching))
        details.cancel()
    },
    selectAll(event) {
      if (now().selectionMode !== "multiple") return
      commitSelection([...now().selectable()], "select-all", event, null)
    },
    selectAllMatching(event) {
      const current = now()
      if (current.selectionMode !== "multiple") return
      if (!current.server) return actions.selectAll(event)
      const { value, allMatching } = enterAllMatching(current.model)
      commitSelection(value, "select-all-matching", event, allMatching)
    },
    clearSelection(event) {
      commitSelection([], "clear", event, null)
    },
    setExpanded(expanded, reason, event) {
      const current = now()
      const next = [...expanded]
      if (
        emit(current.onExpandedChange, current.setExpanded, next, reason, event)
      )
        set({ expanded: next })
    },
    setRowExpanded(id, open, reason, event) {
      const { expanded } = now()
      if (expanded.includes(id) === open) return
      actions.setExpanded(
        open ? [...expanded, id] : expanded.filter((other) => other !== id),
        reason,
        event
      )
    },
    setPage(page, reason, event) {
      const current = now()
      const next = clampPage(page, current.model.pageCount)
      // Against the page asked for, which a clamped one may not show yet.
      if (next === current.page) return
      changePage(next, reason, event)
    },
    setPageSize(pageSize, reason, event) {
      const current = now()
      const next = resolvePageSize(pageSize)
      if (next === current.pageSize) return
      if (
        !emit(
          current.onPageSizeChange,
          current.setPageSize,
          next,
          reason,
          event
        )
      )
        return
      set({ pageSize: next })
      // The page that holds the first row shown, so the reader stays put.
      const { model } = current
      const page = Math.floor(((model.page - 1) * model.pageSize) / next) + 1
      if (page !== current.page) changePage(page, "page-size", event)
    },
    activate(id, event) {
      const current = now()
      const item = current.model.item(id)
      if (item === undefined) return
      current.onActivate?.(id, item)
      const href = current.itemToHref?.(item)
      if (href === undefined) return
      // The row's own link takes the click, with the keys held: the router
      // for a plain one to this site, the browser for a new tab, a download
      // or another site.
      const row = (event?.target as Element | null | undefined)?.closest("tr")
      const link = row?.querySelector<HTMLAnchorElement>(
        '[data-slot="data-table-row-link"]'
      )
      if (link) {
        link.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            button: 0,
            ...modifiers(event),
          })
        )
        return
      }
      if (current.navigate) current.navigate(href)
      else window.location.assign(href)
    },
    focusTable() {
      frame?.querySelector<HTMLElement>('table [tabindex="0"]')?.focus()
    },
    setFrame(element) {
      frame = element
    },
    hrefOf(item) {
      return now().itemToHref?.(item)
    },
    retry() {
      now().onRetry?.()
    },
    async exportCsv(options = {}) {
      const { toCsv } = await loadFeature("csv")
      // Read once loaded: the state the export was asked for, or later.
      const { model, layout, formatter, value, view, columns } = now()
      const rows = options.rows ?? "filtered"
      const items =
        rows === "page"
          ? model.pageItems()
          : rows === "selected"
            ? itemsOf(model, value)
            : model.filteredItems()
      const { byId } = getColumnModel(columns)
      const shown =
        options.columns === "all"
          ? view.columns.order.flatMap((id) => byId.get(id) ?? [])
          : layout.columns
      return toCsv(items, shown, formatter, options)
    },
    warn,
  }

  /**
   * After a view the owner set (a controlled `view` changed by the app):
   * all-matching ends, the page goes back to 1. The table's own changes do
   * both as they are made.
   */
  const viewChanged = (before: DataTableView, pageBefore: number) => {
    const current = now()
    if (reported.has(current.view)) return
    if (current.allMatching && viewMatchesChanged(before, current.view))
      commitSelection([...current.value], "view", undefined, null)
    // A page set along with the view (restored from a URL) is kept.
    if (
      current.pagination &&
      current.page !== 1 &&
      current.page === pageBefore &&
      shouldResetPage(before, current.view)
    )
      changePage(1, "reset")
  }

  /** In client mode, a page past the last one is reported as the last. */
  const pageShown = () => {
    const current = now()
    // Not before rows arrive: a page restored for them would be lost.
    if (current.server || !current.pagination || current.loading) return
    if (current.model.displayRowCount === 0) return
    if (current.model.page !== current.page)
      changePage(current.model.page, "clamp")
  }

  /** The render has committed: what it shows is the state now. */
  const committed = () => {
    pending = {}
  }

  return { actions, viewChanged, pageShown, committed }
}

function DataTable<T>({
  items,
  columns,
  itemToId,
  itemToChildren,
  itemToHref,
  isItemDisabled,
  disabledBehavior = "all",
  dataMode = "client",
  rowCount,
  loading = false,
  error,
  onRetry,
  size = "default",
  striped = false,
  sortable = true,
  filterable = false,
  groupable = false,
  editable = false,
  resizableColumns = false,
  reorderableColumns = false,
  hideableColumns = false,
  pinnableColumns = false,
  reorderableRows = false,
  pagination = false,
  selectionMode = "none",
  cellSelectionMode = "none",
  view: viewProp,
  defaultView,
  onViewChange,
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

  // A tree's rows nest by their items, not by grouping (§4.3).
  const grouping = groupable && !tree
  const capabilities = React.useMemo<ViewCapabilities>(
    () => ({ sortable, filterable, groupable: grouping }),
    [sortable, filterable, grouping]
  )

  // ---- state --------------------------------------------------------------

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
  const [expanded, setExpanded] = useControlled<ReadonlyArray<string>>(
    expandedProp,
    defaultExpanded ?? NO_IDS
  )
  const [page, setPage] = useControlled(pageProp, defaultPage ?? 1)
  const [pageSize, setPageSize] = useControlled(
    pageSizeProp,
    defaultPageSize ?? DEFAULT_PAGE_SIZE
  )

  // ---- rows ---------------------------------------------------------------

  const labels = React.useMemo(() => ({ yes: t("yes"), no: t("no") }), [t])
  const [engine] = React.useState(() => createDataTableEngine<T>())
  const model = engine.run({
    items,
    columns,
    view,
    locale,
    labels,
    itemToId,
    itemToChildren,
    isItemDisabled,
    dataMode,
    sortable,
    filterable,
    expanded,
    pagination: pagination ? { page, pageSize } : null,
    rowCount,
  })
  const layout = layoutColumns(columns, view)
  const formatter = getFormatter(getColumnModel(columns), locale, labels)

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
  const activatable = onActivate !== undefined || linked
  const retryable = onRetry !== undefined
  // Compared by value: an inline array is a new one on every render.
  const pageSizesKey = pageSizes.join(",")
  const sizes = React.useMemo(
    () => pageSizesKey.split(",").map(Number),
    [pageSizesKey]
  )
  const options = React.useMemo<DataTableOptions>(
    () => ({
      dataMode,
      size,
      striped,
      sortable,
      filterable,
      groupable: grouping,
      editable,
      resizableColumns,
      reorderableColumns,
      hideableColumns,
      pinnableColumns,
      reorderableRows,
      pagination,
      selectionMode,
      cellSelectionMode,
      disabledBehavior,
      disallowEmptySelection,
      tree,
      linked,
      activatable,
      retryable,
      pageSizes: sizes,
    }),
    [
      dataMode,
      size,
      striped,
      sortable,
      filterable,
      grouping,
      editable,
      resizableColumns,
      reorderableColumns,
      hideableColumns,
      pinnableColumns,
      reorderableRows,
      pagination,
      selectionMode,
      cellSelectionMode,
      disabledBehavior,
      disallowEmptySelection,
      tree,
      linked,
      activatable,
      retryable,
      sizes,
    ]
  )

  const state = React.useMemo<DataTableState<T>>(
    () => ({
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
      loading,
      error: error ?? null,
    }),
    [
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
      loading,
      error,
    ]
  )

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
    page,
    pageSize,
    server,
    pagination,
    loading,
    selectionMode,
    disallowEmptySelection,
    itemToHref,
    navigate,
    onActivate,
    onViewChange,
    onValueChange,
    onExpandedChange,
    onPageChange,
    onPageSizeChange,
    onRetry,
    setView,
    setValue,
    setMatching,
    setExpanded,
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

  const hasDates = React.useMemo(
    () =>
      getColumnModel(columns).leaves.some((column) => column.type === "date"),
    [columns]
  )
  const features: Array<FeatureName> = []
  if (editable) features.push("editing")
  if (cellSelectionMode !== "none") features.push("cellSelection")
  if (reorderableColumns || reorderableRows) features.push("dragAndDrop")
  if ((filterable || editable) && hasDates) features.push("dateInput")
  usePrefetchFeatures(features)

  // New columns re-render every row: said when they are new but the same.
  const previousColumns = React.useRef(columns)
  React.useEffect(() => {
    const previous = previousColumns.current
    previousColumns.current = columns
    if (previous === columns) return
    const ids = (handle: DataTableColumns<T>) => {
      const { leaves, groups } = getColumnModel(handle)
      return [...leaves.map((leaf) => leaf.id), ...groups.keys()].join(" ")
    }
    if (ids(previous) === ids(columns))
      warn(
        "inline-columns",
        "DataTable: `columns` is a new object on every render, with the same columns, so every row renders again on every change (a selection, a page). Make the columns once with `createColumns` at module level, or in a `React.useMemo`."
      )
  }, [warn, columns])

  const { idIssues } = model
  React.useEffect(() => {
    const { missingIds, duplicateIds } = idIssues
    if (missingIds > 0)
      warn(
        "missing-ids",
        `DataTable: ${missingIds} ${missingIds === 1 ? "item has" : "items have"} no id. Rows are selected, opened and kept across sorting by id: give each item an \`id\`, or pass \`itemToId\`.`
      )
    if (duplicateIds.length > 0)
      warn(
        "duplicate-ids",
        `DataTable: more than one item has the id ${duplicateIds
          .slice(0, 5)
          .map((id) => `"${id}"`)
          .join(
            ", "
          )}${duplicateIds.length > 5 ? ` and ${duplicateIds.length - 5} more` : ""}. Rows are selected, opened and kept across sorting by id: make each item's id unique.`
      )
  }, [warn, idIssues])
  React.useEffect(() => {
    if (groupable && tree)
      warn(
        "groupable-tree",
        "DataTable: `groupable` is off in a tree (`itemToChildren`): a tree's rows nest by their items, so they are not grouped."
      )
  }, [warn, groupable, tree])
  React.useEffect(() => {
    if (server && pagination && rowCount === undefined)
      warn(
        "server-row-count",
        "DataTable: in server mode, pages are counted from `rowCount`: pass the number of rows the view matches, or the table has a single page."
      )
  }, [warn, server, pagination, rowCount])

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
export type { DataTableProps }
