"use client"

/**
 * After the last row of `DataTableContent`: with `hasMore`, loading rows
 * (`onLoadMore` called as they come near, `useLoadMore`) or "Show more"
 * (`loadMore="button"`, `useShowMore`), and an error over loaded rows. Each
 * continues the rows' stripes (`nextStriped`).
 */
import * as React from "react"

import type { RowShared } from "./cell"
import type { DataTableActions, DataTableContextValue } from "./context"
import { useDataTableSelector } from "./context"
import type { BodyRow, DataTableRowModel, EngineColumn } from "./engine/index"
import { focusFree, useFocusAway } from "./focus-continuity"
import { scrollParentOf } from "./scroll-parent"
import { DataTableMoreError, DataTableShowMore, loadingRows } from "./states"

type Row = BodyRow<unknown>

const NO_ROWS: ReadonlyArray<Row> = []

/** Rows shown after the last row while more come (`hasMore`). */
const MORE_ROWS = 3

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

/** Whether `node` is in the place after the rows of this table's own. */
function inMoreSlot(
  node: EventTarget | null,
  frame: HTMLElement
): node is Element {
  return (
    node instanceof Element &&
    node.closest(MORE_SLOT)?.closest(CONTENT) === frame
  )
}

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
    // The load is over (more items, or `loading` back to false): a press
    // that brought none leaves nothing to say.
    if (from === null) return
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
    const enter = (event: FocusEvent) => {
      if (inMoreSlot(event.target, element)) focused.current = event.target
      // Not where the grid puts the focus it lost as the element went:
      // that is the layout effect below's to move.
      else if (focused.current?.isConnected) focused.current = null
    }
    element.addEventListener("focusin", enter)
    return () => element.removeEventListener("focusin", enter)
  }, [frame])
  useFocusAway(frame, inMoreSlot, (left) => {
    if (focused.current === left) focused.current = null
  })
  // After the grid's own layout effects, which may have put the focus it
  // lost on the table's first stop.
  React.useLayoutEffect(() => {
    const element = frame.current
    const was = focused.current
    if (!element || !was || was.isConnected) return
    focused.current = null
    if (!on || !focusFree(element)) return
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
 * What comes after the rows. With more rows to come, an error over loaded
 * rows shows after them, in place of the loading rows; the error state
 * takes the rows' place (`failed`, no rows) only when there are none. More
 * rows to come: loading rows after the last one, and no bar; not while a
 * client table searches or filters: what matches among rows not loaded is
 * the server's to say (server mode). With `loadMore="button"`, "Show more"
 * in their place, without the observer.
 */
function afterRows({
  error,
  hasMore,
  button,
  bodyRows,
  server,
  searching,
}: {
  error: React.ReactNode
  hasMore: boolean
  button: boolean
  bodyRows: ReadonlyArray<Row>
  server: boolean
  searching: boolean
}) {
  const inlineError = Boolean(error) && hasMore && bodyRows.length > 0
  const failed = Boolean(error) && !inlineError
  const rows = failed ? NO_ROWS : bodyRows
  const more = hasMore && !failed && rows.length > 0 && (server || !searching)
  return { inlineError, failed, rows, more, button }
}

type After = ReturnType<typeof afterRows>

/**
 * The hooks of what comes after the rows: the stripes it continues (striped
 * when even, its index odd, counting every row but the detail rows, which
 * take their row's fill), "Show more", and load more on scroll.
 */
function useMoreRows(
  after: After,
  {
    context,
    frame,
    container,
    striped,
    loading,
    virtualized,
    model,
    focusRow,
  }: {
    context: DataTableContextValue<unknown>
    frame: React.RefObject<HTMLElement | null>
    container: React.RefObject<HTMLElement | null>
    striped: boolean
    loading: boolean
    virtualized: boolean
    model: DataTableRowModel<unknown>
    focusRow: (index: number) => void
  }
) {
  const { actions } = context
  const { rows, more, button, inlineError } = after
  const shown = (more && button) || inlineError
  const nextStriped = React.useMemo(
    () =>
      striped &&
      shown &&
      rows.reduce((count, row) => count + (row.kind === "detail" ? 0 : 1), 0) %
        2 ===
        1,
    [striped, shown, rows]
  )
  const items = model.allItems()
  const focusTable = React.useCallback(() => actions.focusTable(), [actions])
  const showMore = useShowMore({
    on: button,
    frame,
    rows: rows.length,
    items: items.length,
    loading,
    loadMore: actions.loadMore,
    focusRow,
    focusTable,
  })
  const target = React.useRef<HTMLTableSectionElement | null>(null)
  const view = useDataTableSelector(context, (state) => state.view)
  useLoadMore(target, container, {
    on: more && !inlineError && !loading && !button,
    virtualized,
    rearm: [items, view],
    loadMore: actions.loadMore,
  })
  return { nextStriped, showMore, target }
}

/** The rows after the last row (see the module comment), in bodies of their own. */
function DataTableMoreRows({
  after,
  more: { nextStriped, showMore, target },
  shared,
  columns,
  size,
  error,
  shown,
  total,
  loading,
  actions,
  retryable,
}: {
  after: After
  more: ReturnType<typeof useMoreRows>
  shared: RowShared<unknown>
  columns: ReadonlyArray<EngineColumn<unknown>>
  size: "default" | "sm"
  error: React.ReactNode
  /** The items loaded. */
  shown: number
  /** The rows the server matches, when known. */
  total: number | undefined
  loading: boolean
  actions: DataTableActions<unknown>
  retryable: boolean
}) {
  const { more, inlineError, button } = after
  if (inlineError)
    return (
      <tbody data-slot="data-table-loading-more">
        <DataTableMoreError
          columns={shared.columnCount}
          size={size}
          striped={nextStriped}
          description={error === true ? undefined : error}
          onRetry={retryable ? actions.retry : undefined}
        />
      </tbody>
    )
  if (!more) return null
  return button ? (
    <tbody data-slot="data-table-loading-more">
      <DataTableShowMore
        columns={shared.columnCount}
        size={size}
        striped={nextStriped}
        shown={shown}
        total={total}
        loading={loading}
        onShowMore={showMore.press}
      />
    </tbody>
  ) : (
    <tbody ref={target} aria-hidden data-slot="data-table-loading-more">
      {loadingRows(MORE_ROWS, columns, shared)}
    </tbody>
  )
}

export { afterRows, DataTableMoreRows, useMoreRows }
