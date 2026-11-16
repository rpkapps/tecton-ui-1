"use client"

/**
 * `DataTable`'s actions (`createActions`): every change the parts make
 * goes through them. Each reports its change (`on…Change(value,
 * eventDetails)`, whose `eventDetails.cancel()` keeps it from being
 * applied) and applies it, reading the props and state as of the last
 * render with the changes made since (`now`).
 */
import {
  createChangeEventDetails,
  type ChangeEventDetails,
} from "../primitives/event-details"
import {
  ALL_OPEN,
  clampPage,
  clearFilters,
  isGroupClosed,
  reconcileView,
  sameIds,
  sameView,
  shouldResetPage,
  sortColumn,
  toggleIds,
  viewMatchesChanged,
  type ClosedGroups,
  type ColumnLayout,
  type DataTableAllMatching,
  type DataTableColumns,
  type DataTablePartialView,
  type DataTableRowModel,
  type DataTableView,
  type Formatter,
  type ViewCapabilities,
} from "./engine/index"
import type {
  DataTableActions,
  DataTablePageChangeReason,
  DataTableSelectionChangeDetails,
  DataTableSelectionChangeReason,
  DataTableSelectionMode,
} from "./context"
import type { LiveControl } from "./live"
import type { DataTableProps } from "./root"
import { viewChangeReason } from "./view-reason"
import type { Warn } from "./warnings"

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
  closedGroups: ClosedGroups
  page: number
  pageSize: number
  server: boolean
  pagination: boolean
  loading: boolean
  selectionMode: DataTableSelectionMode
  disallowEmptySelection: boolean
  itemToHref: DataTableProps<T>["itemToHref"]
  itemToDisabledReason: DataTableProps<T>["itemToDisabledReason"]
  navigate: ((href: string) => void) | undefined
  onActivate: DataTableProps<T>["onActivate"]
  onRowOrderChange: DataTableProps<T>["onRowOrderChange"]
  onViewChange: DataTableProps<T>["onViewChange"]
  onValueChange: DataTableProps<T>["onValueChange"]
  onExpandedChange: DataTableProps<T>["onExpandedChange"]
  onPageChange: DataTableProps<T>["onPageChange"]
  onPageSizeChange: DataTableProps<T>["onPageSizeChange"]
  onRetry: DataTableProps<T>["onRetry"]
  onLoadMore: DataTableProps<T>["onLoadMore"]
  /** Live data's held rows (`highlightChanges`); `null` when off. */
  live: LiveControl | null
  /** The values the owner controls. */
  controlled: Partial<Record<PendingKey, boolean>>
  setClears: React.Dispatch<React.SetStateAction<number>>
  setView: (view: DataTablePartialView) => void
  setValue: (value: ReadonlyArray<string>) => void
  setMatching: (matching: Matching | null) => void
  setExpanded: (expanded: ReadonlyArray<string>) => void
  setCollapsed: (collapsed: Collapsed) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

/** The closed groups, and the grouping they were closed in. */
type Collapsed = {
  grouping: ReadonlyArray<string>
  closed: ClosedGroups
}

/** Server "all matching", with the selection it reported. */
type Matching = {
  allMatching: DataTableAllMatching
  value: ReadonlyArray<string>
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

/** The pieces of state a change has set and the root has not rendered yet. */
type Pending<T> = Partial<Pick<Latest<T>, PendingKey>>

type PendingKey =
  | "view"
  | "value"
  | "allMatching"
  | "expanded"
  | "closedGroups"
  | "page"
  | "pageSize"

/**
 * What the actions only some parts call (`more-actions.ts`, kept out of a
 * table's bundle unless a part that calls them is in it) build on: the
 * steps of the actions here.
 */
type ActionInternals<T> = {
  /** The props and state as of now: the last render's, with the changes made since. */
  now: () => Latest<T>
  /** Records changes made, until the root next commits. */
  set: (patch: Pending<T>) => void
  /** Reports and applies a new selection; whether it was. */
  commitSelection: (
    next: Array<string>,
    reason: DataTableSelectionChangeReason,
    event: Event | undefined,
    allMatching: DataTableAllMatching | null
  ) => boolean
  changePage: (
    page: number,
    reason: DataTablePageChangeReason,
    event?: Event
  ) => void
  /** The closed groups of the grouping as it is now. */
  closedNow: () => ClosedGroups
  /** Closes groups, in the grouping as it is now. */
  setClosed: (closed: ClosedGroups) => void
}

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
  // changes. A controlled value is the owner's, who may not take it and
  // not render at all: kept only until the handler that made it is done.
  const set = (patch: Pending<T>) => {
    pending = { ...pending, ...patch }
    const { controlled } = latest.current
    const owned = (Object.keys(patch) as Array<PendingKey>).filter(
      (key) => controlled[key === "allMatching" ? "value" : key]
    )
    if (owned.length > 0)
      queueMicrotask(() => {
        const next = { ...pending }
        for (const key of owned) if (next[key] === patch[key]) delete next[key]
        pending = next
      })
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

  /**
   * A new selection from the rows (the grid, a group's checkbox): in
   * all-matching, the rows deselected are the exceptions.
   */
  const changeSelection = (
    next: Array<string>,
    reason: DataTableSelectionChangeReason,
    event: Event | undefined
  ) => {
    const { allMatching, value } = now()
    let matching: DataTableAllMatching | null = null
    if (allMatching && reason !== "clear") {
      const after = new Set(next)
      const except = new Set(allMatching.except)
      for (const id of value) if (!after.has(id)) except.add(id)
      for (const id of next) except.delete(id)
      matching = { except: [...except] }
    }
    return commitSelection(next, reason, event, matching)
  }

  /**
   * The closed groups of the grouping as it is now: those of the last
   * render, unless the grouping changed since (every group open then).
   */
  const closedNow = () => {
    const current = now()
    if (pending.closedGroups) return pending.closedGroups
    return sameIds(latest.current.view.grouping, current.view.grouping)
      ? current.closedGroups
      : ALL_OPEN
  }
  /** Closes groups, in the grouping as it is now (one set in the same handler too). */
  const setClosed = (closed: ClosedGroups) => {
    const current = now()
    current.setCollapsed({ grouping: current.view.grouping, closed })
    set({ closedGroups: closed })
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
    currentView: () => now().view,
    clearFilters(event) {
      now().setClears((count) => count + 1)
      return actions.updateView(clearFilters, viewChangeReason, event)
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
        (view) =>
          sortColumn(view, column, {
            multi: multi && now().capabilities.multiSort !== false,
          }),
        "sort",
        event
      )
    },
    gridValueChange(next, details) {
      if (!changeSelection(next, details.reason, details.event))
        details.cancel()
    },
    toggleGroupSelected(key, reason, event) {
      const current = now()
      if (current.selectionMode !== "multiple") return
      const ids = current.model.groupSelectableIds(key)
      if (ids.length === 0) return
      changeSelection(toggleIds(current.value, ids), reason, event)
    },
    setGroupOpen(key, open) {
      const closed = closedNow()
      if (isGroupClosed(closed, key) !== open) return
      const keys = new Set(closed.keys)
      if (!keys.delete(key)) keys.add(key)
      setClosed({ all: closed.all, keys })
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
    focusTable(later = false) {
      // The table's own stop, not one of a table nested in its rows.
      const focus = () => {
        const table = frame?.querySelector("table")
        const stops = table?.querySelectorAll<HTMLElement>('[tabindex="0"]')
        ;[...(stops ?? [])]
          .find((stop) => stop.closest("table") === table)
          ?.focus()
      }
      // After the render, and the grid's own tab stop update after it.
      if (later) setTimeout(focus)
      else focus()
    },
    setFrame(element) {
      frame = element
    },
    hrefOf(item) {
      return now().itemToHref?.(item)
    },
    disabledReasonOf(item) {
      return now().itemToDisabledReason?.(item)
    },
    retry() {
      now().onRetry?.()
    },
    loadMore() {
      const current = now()
      current.live?.loadMoreAsked()
      current.onLoadMore?.()
    },
    holdRows(ids) {
      now().live?.hold(ids)
    },
    releaseRows() {
      now().live?.release()
    },
    reorderRows(ids, reason, event) {
      const details = createChangeEventDetails(reason, event)
      now().onRowOrderChange?.([...ids], details)
      return !details.isCanceled
    },
    warn,
    internals: {
      now,
      set,
      commitSelection,
      changePage,
      closedNow,
      setClosed,
    },
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

export { createActions, emit }
export type { ActionInternals, Collapsed, Latest, Matching }
