"use client"

/**
 * `DataTableContent`'s rows: detail rows under the rows that open
 * (`useDetailRows`), what every row renders with (`useRowShared`), what
 * the grid asks of the table (`useGridOptions`), focus on a closed group's
 * row (`useGroupFocusRestore`), row reordering (`useRowOrder`), and the
 * table's row count (`ariaRowCount`).
 */
import * as React from "react"

import { useTranslations } from "../i18n/translations"
import { createStore } from "../store"
import type { TableGridController, TableGridOptions } from "../table-grid"
import {
  bodyCellsOf,
  emptyValueContent,
  groupCellsOf,
  type CellPin,
  type DetailStore,
  type GroupLabel,
  type RowShared,
} from "./cell"
import {
  useDataTableSelector,
  type DataTableContextValue,
  type DataTableOptions,
} from "./context"
import {
  createDetailCache,
  getColumnModel,
  isGroupClosed,
  withDetailRows,
  type BodyRow,
  type DataTableColumns,
  type DataTableRowModel,
  type EngineColumn,
  type Formatter,
  type GroupRow,
} from "./engine/index"
import { focusFree, useFocusAway } from "./focus-continuity"
import { DRAG_AND_DROP, useFeature } from "./lazy"
import type { FlashStore } from "./live-bridge"
import { describeRow } from "./row"
import { createRowOrder, inItemOrder, type RowOrder } from "./row-order"
import { useStable } from "./use-stable"

type Row = BodyRow<unknown>

const NO_IDS: ReadonlySet<string> = new Set()
const NO_OPEN: ReadonlyArray<string> = []

/**
 * Detail rows (`renderDetail`), added to the engine's rows (not in a
 * tree): they render with the first render, on the server too. The rows
 * read `renderDetail` from a store of their own, so a new one renders only
 * the detail rows. On pages, `openOnPages`: the open detail rows of every
 * page, counted in the rows' places (`aria-rowindex`) and the table's row
 * count.
 */
function useDetailRows(
  context: DataTableContextValue<unknown>,
  renderDetail: ((item: never) => React.ReactNode) | undefined,
  model: DataTableRowModel<unknown>,
  options: DataTableOptions
) {
  const detail = renderDetail !== undefined && !options.tree
  const [detailStore] = React.useState<DetailStore>(() =>
    createStore<{
      render: ((item: never) => React.ReactNode) | null
    }>({ render: renderDetail ?? null })
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
  const openOnPages = React.useMemo(
    () =>
      detail && options.pagination
        ? [...open].filter((id) => model.indexOfRow(id) >= 0)
        : NO_OPEN,
    [detail, options.pagination, open, model]
  )
  return { detail, detailStore, bodyRows, openOnPages }
}

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

/** What `useRowShared` takes as it is (`RowShared`'s own fields). */
type RowSharedBase = Pick<
  RowShared<unknown>,
  | "columns"
  | "formatter"
  | "grouped"
  | "order"
  | "headerRows"
  | "fixed"
  | "pins"
  | "pinned"
  | "selectionPin"
  | "handlePin"
  | "virtualized"
  | "live"
>

/**
 * What every row renders with (`RowShared`): one object while none of it
 * changes. `base` holds the fields taken as they are; `rowHeader` is the
 * row header column's id, `columns` every column.
 */
function useRowShared(
  context: DataTableContextValue<unknown>,
  options: DataTableOptions,
  model: DataTableRowModel<unknown>,
  columns: DataTableColumns<unknown>,
  rowHeader: string | undefined,
  detail: DetailStore | null,
  openOnPages: ReadonlyArray<string>,
  base: RowSharedBase
): RowShared<unknown> {
  const { columns: shownColumns, pins, fixed, pinned, virtualized } = base
  const { actions } = context
  const selection = options.selectionMode !== "none"
  const handle = options.reorderableRows
  const server = options.dataMode === "server"
  const columnsById = getColumnModel(columns).byId
  const groupCells = React.useMemo(
    () => groupCellsOf(shownColumns, pins),
    [shownColumns, pins]
  )
  const t = useTranslations("dataTable")
  const groupLabel = React.useMemo(() => {
    const known = new WeakMap<GroupRow, GroupLabel>()
    return (row: GroupRow): GroupLabel => {
      let label = known.get(row)
      if (!label) {
        const header = columnsById.get(row.column)?.header ?? row.column
        const value = row.text === "" ? t("noValue") : row.text
        // The translation's own order: the value's place in it.
        const [before = "", after = ""] = t("groupLabel", {
          columnName: header,
          value: "\u0000",
        }).split("\u0000")
        label = { text: before + value + after, before, value, after }
        known.set(row, label)
      }
      return label
    }
  }, [t, columnsById])
  const cells = React.useMemo(
    () =>
      bodyCellsOf(shownColumns, pins, { fixed, pinned, wrap: !virtualized }),
    [shownColumns, pins, fixed, pinned, virtualized]
  )
  const noValue = t("noValue")
  const emptyValue = React.useMemo(() => emptyValueContent(noValue), [noValue])
  // On pages: a row's place among every page's rows, the engine's after
  // the open detail rows before it; a server page's rows after the rows of
  // the pages before it (see `ariaRowCount`). A new model on pages gives
  // the rows new places.
  const rowIndexOf = React.useMemo(
    () =>
      options.pagination
        ? (id: string) => {
            const at = model.indexOfRow(id)
            let before = 0
            for (const other of openOnPages)
              if (model.indexOfRow(other) < at) before++
            return (
              (server ? (model.page - 1) * model.pageSize : 0) + at + before
            )
          }
        : null,
    [options.pagination, server, options.pagination ? model : null, openOnPages]
  )
  return useStable<RowShared<unknown>>({
    ...base,
    rowHeader: shownColumns.find((column) => column.id === rowHeader),
    emptyValue,
    selection,
    handle,
    size: options.size,
    detail,
    levelled: options.tree || base.grouped || detail !== null,
    tree: options.tree,
    multiple: options.selectionMode === "multiple",
    columnsById,
    groupCells,
    groupLabel,
    disableRows: options.disabledBehavior === "all",
    linked: options.linked,
    disabledReasons: options.disabledReasons,
    wrap: !virtualized,
    columnCount: shownColumns.length + (selection ? 1 : 0) + (handle ? 1 : 0),
    rowIndexOf,
    cells,
    actions,
  })
}

/**
 * Focus on a group's row as the group closes over the row focus was on:
 * `restoreFocusTo` for the grid. A row gone with the group that closed
 * over it (an item, its detail row, a group in it), or a group's row
 * repeated at the top of a page that went as the group closed: focus goes
 * to the group's own row (the outermost closed one), on the page that
 * holds it. A row gone with its page (a page change, rows clamped) is the
 * grid's.
 *
 * On an earlier page, closed just now: that page, then the row once the
 * page shows, tried on the first render after it is asked for, and given
 * up there when the page did not change (a controlled `page` that kept
 * its own), or when focus has left the table since. Focus is in the table
 * when it is asked for; the page change then removes the focused row,
 * which drops focus to the page without the user moving it: what counts
 * is whether focus moved out of the table, not where it is now.
 */
function useGroupFocusRestore(
  context: DataTableContextValue<unknown>,
  frame: React.RefObject<HTMLElement | null>,
  controller: { current: TableGridController | null },
  /** The body's rows as rendered. */
  rows: ReadonlyArray<Row>,
  model: DataTableRowModel<unknown>
) {
  const { actions, store } = context
  const closedGroups = useDataTableSelector(
    context,
    (state) => state.closedGroups
  )
  // The body's rows as rendered, for the grid to find a closed group: set
  // before the layout effects, where the grid looks for it.
  const shownRows = React.useRef(rows)
  const pending = React.useRef<{
    key: string
    page: number
    /** The render it was asked in. */
    render: number
  } | null>(null)
  const renders = React.useRef(0)
  useFocusAway(frame, inFrame, () => {
    pending.current = null
  })
  React.useLayoutEffect(() => {
    const asked = pending.current
    if (!asked || asked.render === renders.current) return
    pending.current = null
    const element = frame.current
    if (model.page !== asked.page || !element || !focusFree(element)) return
    const at = rows.findIndex(
      (row) => row.key === asked.key && !("continued" in row && row.continued)
    )
    if (at !== -1) controller.current?.focusRow(at)
  })
  // What the last render changed: a group closed on the same page, not
  // the page itself (a page change, rows clamped).
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
  const [restoreFocusTo] = React.useState(
    () =>
      (id: string, focused: boolean): number | null => {
        const {
          model: current,
          closedGroups: closed,
          options: now,
        } = store.get()
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
        const index = current.indexOfRow(group)
        if (
          !focused ||
          !groupClosed.current ||
          index === -1 ||
          now.dataMode === "server" ||
          !now.pagination
        )
          return null
        const page = Math.floor(index / current.pageSize) + 1
        pending.current = { key: group, page, render: renders.current }
        actions.setPage(page, "group")
        return null
      }
  )
  return restoreFocusTo
}

/** Whether `node` is in the frame. */
function inFrame(node: EventTarget | null, frame: HTMLElement) {
  return node instanceof Node && frame.contains(node)
}

/**
 * The grid's options (`table-grid.tsx`): one object but for what they
 * hold. Its functions read the store when the grid asks: the same for the
 * table's life.
 */
function useGridOptions(
  context: DataTableContextValue<unknown>,
  options: DataTableOptions,
  shared: RowShared<unknown>,
  /** The body's rows. */
  rows: ReadonlyArray<Row>,
  controller: { current: TableGridController | null },
  restoreFocusTo: NonNullable<TableGridOptions["restoreFocusTo"]>
) {
  const { actions, store } = context
  const describeItem = React.useCallback(
    (row: Row) => describeRow(row, shared),
    [shared]
  )
  // Open detail rows take their row's fill; the other rows keep their
  // stripes. Only then a new function per set of rows: the grid's options
  // otherwise stay as they are.
  const parity = options.striped && !!shared.detail && shared.virtualized
  const rowParity = React.useMemo(
    () => (parity ? rowParityOf(rows) : undefined),
    [parity, rows]
  )
  const [asked] = React.useState(
    (): Pick<
      TableGridOptions,
      | "onValueChange"
      | "controller"
      | "getAllValues"
      | "isDisabled"
      | "isSelectable"
      | "getSelectedCount"
      | "restoreFocusTo"
    > => ({
      onValueChange: actions.gridValueChange,
      controller,
      // Select all and the header read the engine, never the rows'
      // descriptions: no row is formatted or described for them.
      getAllValues: () => store.get().selectable(),
      // Disabled rows are disabled in the grid with "all"; with "selection"
      // they are only kept from being selected.
      isDisabled: (id) => {
        const { options: now, model } = store.get()
        return now.disabledBehavior === "all" && model.isDisabled(id)
      },
      isSelectable: (id) => !store.get().model.isDisabled(id),
      // In server "all matching", the rows the server matches but the
      // excepted ones.
      getSelectedCount: (selected) => {
        const { allMatching, model } = store.get()
        return allMatching
          ? Math.max(0, model.rowCount - allMatching.except.length)
          : selected.size
      },
      restoreFocusTo,
    })
  )
  return useStable<TableGridOptions>({
    selectionMode: options.selectionMode,
    disallowEmptySelection: options.disallowEmptySelection,
    onActivate: options.activatable ? actions.activate : undefined,
    describeItem,
    tree: shared.levelled,
    rowParity,
    ...asked,
  })
}

/**
 * The table's `aria-rowcount`: every page's rows, when only some are in
 * the DOM (on pages, or the server's count in a virtualized table), the
 * totals row the last; -1 (unknown) while more rows come and the server
 * does not say how many; none in the error state, which shows no rows, nor
 * when every row is there (a virtualized body counts its own).
 *
 * In server mode the server's items are counted (`matched`), and the rows
 * that are not items, known only for the loaded ones (group rows, a
 * group's row repeated at the top of the page, detail rows), are added to
 * them; a page's rows take the places after the pages before it, (page −
 * 1) × pageSize items (`rowIndexOf`). So no row's index is past the count,
 * whatever is grouped or open.
 */
function ariaRowCount({
  failed,
  more,
  server,
  pagination,
  virtualized,
  headerRows,
  footerRows,
  model: { rowCount: matched, allRows },
  openOnPages,
  bodyRows,
  shown,
}: {
  failed: boolean
  /** More rows come after the last one (`hasMore`). */
  more: boolean
  server: boolean
  pagination: boolean
  virtualized: boolean
  headerRows: number
  /** The totals row. */
  footerRows: number
  /** The rows the view matches (`rowCount`), every page's rows in client mode. */
  model: Pick<DataTableRowModel<unknown>, "rowCount" | "allRows">
  /** The open detail rows of every page. */
  openOnPages: number
  /** The body's rows, detail rows included. */
  bodyRows: ReadonlyArray<Row>
  /** The body's rows shown. */
  shown: number
}): number | undefined {
  if (failed) return undefined
  if (more && !(server && matched > shown)) return -1
  let counted: number | undefined
  if (pagination && !server) counted = headerRows + allRows.length + openOnPages
  else if (server && (pagination || virtualized)) {
    let extra = 0
    for (const row of bodyRows)
      if (row.kind !== "item" || row.continued) extra++
    counted = headerRows + matched + extra
  } else if (virtualized && footerRows) counted = headerRows + shown
  return counted === undefined ? undefined : counted + footerRows
}

export {
  ariaRowCount,
  useDetailRows,
  useGridOptions,
  useGroupFocusRestore,
  useRowOrder,
  useRowShared,
}
