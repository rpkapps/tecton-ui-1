"use client"

/**
 * `DataTableContent`'s columns (`useContentColumns`): their widths
 * (`column-sizing.ts`; a resize is drawn without rendering while it is
 * dragged), the header's rows for the breakpoints passed, pinned columns
 * that stick to the frame's edges (the columns of controls too, while a
 * column is pinned at the start), the `colgroup` of a table with fixed
 * widths, and reordering, whose drag and drop loads on demand and renders
 * beside the table (`column-reorder.tsx`).
 */
import * as React from "react"

import type { CellPin } from "./cell"
import {
  createColumnOrder,
  listsOf,
  movableColumns,
  type ColumnOrder,
} from "./column-order"
import { colWidths, pinOffset, useColumnSizing } from "./column-sizing"
import {
  useDataTableSelector,
  type DataTableContextValue,
  type DataTableOptions,
} from "./context"
import type {
  ColumnLayout,
  DataTableColumns,
  EngineColumn,
} from "./engine/index"
import { shownHeaderRows } from "./header"
import { DRAG_AND_DROP, RESIZER, useFeature, usePrefetchFeatures } from "./lazy"
import { useStable } from "./use-stable"

const NO_FEATURES = [] as const
const PREFETCH_RESIZER = [RESIZER]

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

function useContentColumns({
  context,
  frame,
  container,
  columns,
  layout,
  options,
  ready,
  rows,
  rtl,
}: {
  context: DataTableContextValue<unknown>
  frame: React.RefObject<HTMLElement | null>
  /** The table's scroll container. */
  container: React.RefObject<HTMLElement | null>
  columns: DataTableColumns<unknown>
  layout: ColumnLayout<unknown>
  options: DataTableOptions
  /** The table can be measured (not the first load's skeleton). */
  ready: boolean
  /** Rows are shown and not loading: their content is what is measured. */
  rows: boolean
  rtl: boolean
}) {
  const selection = options.selectionMode !== "none"
  const handle = options.reorderableRows
  const widths = useDataTableSelector(
    context,
    (state) => state.view.columns.widths
  )
  const sizer = useColumnSizing({
    frame,
    container,
    layout,
    widths,
    selection,
    handle,
    fixed: hasFixedWidths(layout, options.resizableColumns),
    ready,
    rows,
    rtl,
  })
  const { sizing, below } = sizer
  // The header's rows but those of groups over hidden columns only.
  const headerLayout = React.useMemo(() => {
    const byId = new Map(layout.columns.map((column) => [column.id, column]))
    const headerRows = shownHeaderRows(layout.headerRows, (id) => {
      const hideBelow = byId.get(id)?.definition.hideBelow
      return hideBelow !== undefined && below.has(hideBelow)
    })
    return headerRows === layout.headerRows ? layout : { ...layout, headerRows }
  }, [layout, below])
  // The rows render with the columns, their pins and the selection's: a
  // new width alone (a resize) leaves them as they are.
  const shownColumns = useStable(layout.columns)
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
  const order = useColumnOrder(
    context,
    frame,
    columns,
    layout,
    options.reorderableColumns
  )
  // The header's on-demand part, in idle time: the resizers.
  usePrefetchFeatures(options.resizableColumns ? PREFETCH_RESIZER : NO_FEATURES)
  const colgroup = sizer.mode === "fixed" && sizing && (
    <colgroup data-slot="data-table-columns">
      {handle && <col style={{ width: sizer.controls.handle }} />}
      {selection && <col style={{ width: sizer.controls.selection }} />}
      {colWidths(sizing).map((width, index) => (
        <col
          key={shownColumns[index].id}
          className={hideBelowColumn(shownColumns[index])}
          style={width === undefined ? undefined : { width }}
        />
      ))}
    </colgroup>
  )
  return {
    sizer,
    headerLayout,
    shownColumns,
    pins,
    handlePin,
    selectionPin,
    order,
    colgroup,
  }
}

export { useContentColumns }
