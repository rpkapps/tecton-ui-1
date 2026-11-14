"use client"

/**
 * The header: one row per level of column groups (a group spans its
 * columns with `colSpan`), the leaf columns in the last row; a column in
 * fewer groups than the deepest spans the rows below its last group
 * (`rowSpan`), from its group's row down (from the top for a column in
 * none), so no empty cell stands above its name. A column that sorts has a sort
 * button: a click cycles ascending, descending, off; Shift + click (or
 * Shift + Enter) adds the column to a multi-sort (§5.2), with `multiSort`.
 * The first sort is the header's `aria-sort`, which the grid announces;
 * with several, each sorted header shows its place in the order, a count
 * at the arrow's corner (`SORT_POSITION`).
 *
 * Each column's header also holds, as the features are on: its
 * description (an info button with a tooltip, and the cell's accessible
 * description), its menu (`column-menu.tsx`) and the resizer on its end
 * edge. A column or group that can be reordered is its own drag handle
 * (`column-order.ts`): a tab stop of the grid's, dragged from anywhere on
 * it. The grid's arrow keys go through each cell's controls in order.
 *
 * The selection column's header spans every header row too: the
 * select-all checkbox, or a cell named "Select" for single selection; so
 * does the drag handle column's (`reorderableRows`) before it, named
 * "Reorder". The
 * grid moves through the header's columns with the cells spanning rows in
 * every row they span.
 */
import * as React from "react"
import { cn } from "cn"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { Button } from "@tecton/react/button"
import { TableHead, TableHeader, TableRow } from "@tecton/react/table"

import {
  columnResizerClassName,
  columnResizerStartClassName,
} from "../column-resizer-style"
import { useTranslations, type Translator } from "../i18n/translations"
import { announce } from "../primitives/live-announcer"
import {
  columnClassName,
  pinEdgeClassName,
  pinnedHeadClassName,
  pinStyle,
  type CellPin,
} from "./cell"
import {
  columnDragProps,
  useColumnDragging,
  type ColumnOrder,
} from "./column-order"
import { DataTableColumnDescription as ColumnDescription } from "./column-description"
import {
  DataTableColumnMenu as ColumnMenu,
  type ColumnMenuOptions,
} from "./column-menu"
import type { ColumnSizer } from "./column-sizing"
import {
  useDataTableSelector,
  type DataTableContextValue,
  type DataTableOptions,
} from "./context"
import {
  clampColumnWidth,
  getColumnModel,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  setColumnWidth,
  toggleSorting,
  type ColumnLayout,
  type DataTableColumns,
  type DataTableSort,
  type EngineColumn,
  type HeaderCell,
  type HeaderRow,
} from "./engine/index"
import { RESIZER, useFeature } from "./lazy"
import { createPressWait } from "./press-wait"
import { DataTableSelectionCheckbox } from "./selection-checkbox"

/** Where a sort button's negative margin goes: to the edge its text sits on. */
const BUTTON_EDGE = {
  start: "-ms-2",
  center: undefined,
  end: "-me-2 flex-row-reverse",
} as const

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const

/**
 * A header's label: its sort button (or text) and its description's info
 * button, as wide as they are, at the column's alignment. The column's
 * menu button is placed from it (`MENU_BUTTON`), whatever the column's
 * width; `column-sizing.ts` reads its `data-align` to measure the room the
 * button takes.
 */
const HEAD_LABEL = "relative flex min-w-0 items-center gap-0.5"

/**
 * A column's menu button: shown while its own header cell is hovered, the cell
 * holds focus or the menu is open or still closing (`data-menu-active`,
 * `column-menu.tsx`: an item chosen with the pointer on the menu, outside
 * the cell, keeps it shown until focus is back on it). Where there is no
 * hover (a touch screen), always shown, with its room kept.
 */
const MENU_SHOWN =
  "pointer-events-none opacity-0 group-focus-within/head:pointer-events-auto group-focus-within/head:opacity-100 data-menu-active:pointer-events-auto data-menu-active:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 group-hover/head:pointer-events-auto group-hover/head:opacity-100"

/**
 * Where the menu button goes, by the column's alignment: just outside the
 * label (`HEAD_LABEL`), touching it, on the side away from the
 * column's edge (after the label's end, or before its start in a column
 * aligned to the end, whose label ends at the cell's end), in the
 * header's fill and taking no room, so it covers neither the label nor
 * the sort arrow, and stays beside them in a column wider than its
 * content. On a touch screen it is in the label's row, on that side.
 */
const MENU_AFTER = cn(
  "absolute start-full top-1/2 -translate-y-1/2 bg-table-header",
  MENU_SHOWN,
  "pointer-coarse:static pointer-coarse:translate-y-0"
)
const MENU_BUTTON = {
  start: MENU_AFTER,
  center: MENU_AFTER,
  end: cn(
    "absolute end-full top-1/2 -translate-y-1/2 bg-table-header",
    MENU_SHOWN,
    "pointer-coarse:static pointer-coarse:order-first pointer-coarse:translate-y-0"
  ),
} as const

/**
 * The room a label leaves its menu button while the button shows, in a
 * column narrower than both: the button (24 px), right against the label
 * and 2 px in from the cell's edge, less the cell's padding (16 px) it
 * sits in: 10 px (a centred label, on both sides). In a column at least as wide as
 * its label and that room, as a measured one is (`column-sizing.ts`
 * counts the same room), the label does not move as the button shows.
 */
const MENU_ROOM_ONE_SIDE =
  "pointer-fine:group-focus-within/head:max-w-[calc(100%-0.625rem)] pointer-fine:has-data-popup-open:max-w-[calc(100%-0.625rem)] pointer-fine:has-data-menu-active:max-w-[calc(100%-0.625rem)] pointer-fine:group-hover/head:max-w-[calc(100%-0.625rem)]"
const MENU_ROOM = {
  start: MENU_ROOM_ONE_SIDE,
  center:
    "pointer-fine:group-focus-within/head:max-w-[calc(100%-1.25rem)] pointer-fine:has-data-popup-open:max-w-[calc(100%-1.25rem)] pointer-fine:has-data-menu-active:max-w-[calc(100%-1.25rem)] pointer-fine:group-hover/head:max-w-[calc(100%-1.25rem)]",
  end: MENU_ROOM_ONE_SIDE,
} as const

/**
 * The divider at a column group's edges, through every header row below
 * the group's own, and under the group's cell: the table's border token.
 */
const GROUP_EDGE = "border-s border-s-border"
const GROUP_UNDER = "border-b border-b-border"

/**
 * A row of group headers above the columns' own: as tall as its text (the
 * small table's rows are that already), so the columns of no group have
 * no tall empty band above their names.
 */
const GROUP_ROW = "h-8"

/**
 * A group's name keeps to the start of the part of its cell in view, after
 * the pinned columns, as the table scrolls sideways.
 */
const GROUP_LABEL =
  "sticky start-[calc(var(--data-table-pinned-start,0px)+--spacing(4))] w-fit max-w-full"

/**
 * A column's place in a multi-column sort: a count pill at the sort arrow's
 * top corner, filled with the header's text colour and lettered in its
 * fill, so it reads at a glance. It overhangs the button's padding on the
 * arrow's outer side (the start in an end-aligned column, whose arrow
 * comes first) and covers no part of the arrow's head.
 */
const SORT_POSITION =
  "pointer-events-none absolute -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-muted-foreground px-1 text-[0.6875rem] leading-none font-semibold text-table-header tabular-nums"

/** A header cell that is its own drag handle. */
const DRAGGABLE =
  "cursor-grab select-none data-dragging:cursor-grabbing data-dragging:opacity-50"

/**
 * Whether a column has a menu: for a column feature beyond sorting (which
 * the header's own button does), the menu then sorting too.
 */
function hasColumnMenu(options: ColumnMenuOptions) {
  return (
    options.resizable ||
    options.hideable ||
    options.pinnable ||
    options.groupable
  )
}

/**
 * The resizer of a column (`TableColumnResizer`), loaded on demand: until
 * then its grip is drawn the same, absolutely placed (nothing moves when
 * the resizer takes its place), and a drag started on it carries on with
 * the resizer if the pointer is still down when it arrives.
 */
function useResizer(on: boolean) {
  const feature = useFeature(RESIZER, on)
  const [wait] = React.useState(() =>
    createPressWait<null>((_, element, { pointer }) => {
      if (!pointer || typeof PointerEvent === "undefined") return
      element.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          pointerId: pointer.pointerId,
          pointerType: pointer.pointerType,
          isPrimary: true,
          button: 0,
          buttons: 1,
          clientX: pointer.clientX,
          clientY: pointer.clientY,
        })
      )
    })
  )
  const { load } = feature
  const placeholder = (className: string | undefined) => (
    <div
      aria-hidden
      data-slot="data-table-resizer-placeholder"
      className={cn(columnResizerClassName, className)}
      onPointerEnter={load}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        wait.wait("resize", event.currentTarget, { pointer: event })
        load()
      }}
    />
  )
  return {
    Resizer: feature.module?.TableColumnResizer,
    placeholder,
    load,
    /** The resizer is mounted: it takes a drag started before it came. */
    start: (element: HTMLElement | null) =>
      element ? wait.start(null, element) : wait.cancel(),
  }
}

/**
 * What a sort button press says that the grid does not: the grid
 * announces the first sort's direction as the header's `aria-sort`
 * changes; a column added to or cycled in a multi-sort, and a sort
 * cleared, are said here.
 */
function announceSort(
  t: Translator<"dataTable">,
  column: { id: string; header: string },
  before: ReadonlyArray<DataTableSort>,
  after: ReadonlyArray<DataTableSort>
) {
  const columnName = column.header
  const index = after.findIndex((sort) => sort.column === column.id)
  if (index === -1) {
    if (before.some((sort) => sort.column === column.id))
      announce(t("sortCleared", { columnName }))
    return
  }
  if (index === 0) return
  const values = { position: index + 1, total: after.length }
  announce(
    after[index].direction === "ascending"
      ? t("sortAddedAscending", { columnName, ...values })
      : t("sortAddedDescending", { columnName, ...values })
  )
}

/** What every header cell renders with. */
type HeaderShared<T> = {
  context: DataTableContextValue<T>
  columns: DataTableColumns<T>
  layout: ColumnLayout<T>
  sorting: ReadonlyArray<DataTableSort>
  options: DataTableOptions
  sizer: ColumnSizer
  /** Each shown column's pin, by display index. */
  pins: ReadonlyArray<CellPin | undefined>
  selectionPin: CellPin | undefined
  handlePin: CellPin | undefined
  /** With `reorderableColumns`: the columns and groups that move. */
  order: ColumnOrder | null
  movable: ReadonlySet<string>
}

/**
 * The ids of the hidden texts that describe a header cell: its
 * description, and how to drag it.
 */
function useDescriptions(description: string | undefined, draggable: boolean) {
  const id = React.useId()
  const ids = [
    description ? `${id}-description` : null,
    draggable ? `${id}-drag` : null,
  ].filter((value) => value !== null)
  return {
    describedBy: ids.length ? ids.join(" ") : undefined,
    descriptionId: `${id}-description`,
    dragId: `${id}-drag`,
  }
}

function HiddenDescriptions({
  description,
  draggable,
  name,
  ids,
}: {
  description: string | undefined
  draggable: boolean
  name: string
  ids: ReturnType<typeof useDescriptions>
}) {
  const t = useTranslations("dragAndDrop")
  return (
    <>
      {description && (
        <span id={ids.descriptionId} hidden>
          {description}
        </span>
      )}
      {draggable && (
        <span id={ids.dragId} hidden>
          {t("dragItem", { itemText: name })}
        </span>
      )}
    </>
  )
}

/**
 * The width a column shows while its resizer is dragged; the filler shows
 * its real width, which the space it takes makes wider than its own.
 */
function useResizerValue(
  element: HTMLElement | null,
  filler: boolean,
  width: number
) {
  const [rendered, setRendered] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    if (!filler || !element || typeof ResizeObserver === "undefined") {
      setRendered(null)
      return
    }
    const update = () =>
      setRendered(Math.round(element.getBoundingClientRect().width) || null)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, filler])
  return Math.max(width, rendered ?? 0)
}

function DataTableColumnHeader<T>({
  column,
  index,
  edge,
  ruled,
  rowSpan,
  shared,
}: {
  column: EngineColumn<T>
  /** The column's place among the shown columns. */
  index: number
  /** A column group starts or ends at the column's start edge. */
  edge: boolean
  /** Every column of the header is ruled off: a column group is shown. */
  ruled: boolean
  /** The header rows it spans: the rows below its last group. */
  rowSpan: number
  shared: HeaderShared<T>
}) {
  const t = useTranslations("dataTable")
  const { context, sorting, options, layout, sizer, order } = shared
  const sizing = sizer.sizing
  const at = sorting.findIndex((sort) => sort.column === column.id)
  const direction = at === -1 ? null : sorting[at].direction
  const canSort = options.sortable && column.sortable
  const multi = sorting.length > 1 && at !== -1
  const pin = shared.pins[index]
  const side =
    index < layout.pinnedStart
      ? "start"
      : index >= layout.columns.length - layout.pinnedEnd
        ? "end"
        : null
  const canResize = options.resizableColumns && column.resizable && !!sizing
  const menu = {
    sortable: canSort,
    multiSort: options.multiSort,
    resizable: canResize,
    hideable:
      options.hideableColumns && column.hideable && layout.columns.length > 1,
    pinnable: options.pinnableColumns && column.pinnable,
    groupable: options.groupable && column.groupable,
  }
  const grouped = useDataTableSelector(context, (state) =>
    state.view.grouping.includes(column.id)
  )
  const draggable = order !== null && shared.movable.has(column.id)
  const dragging = useColumnDragging(order, column.id)
  const ids = useDescriptions(column.description, draggable)
  const [element, setElement] = React.useState<HTMLElement | null>(null)
  const dragRef = draggable ? order.register(column.id) : null
  const ref = React.useCallback(
    (node: HTMLTableCellElement | null) => {
      dragRef?.(node)
      setElement(node)
    },
    [dragRef]
  )
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const resizeHintId = `${React.useId()}-resize`
  const resizerRef = React.useRef<HTMLDivElement | null>(null)
  const resizer = useResizer(canResize)
  const Resizer = resizer.Resizer
  const startResizer = resizer.start
  React.useEffect(() => {
    if (Resizer) startResizer(resizerRef.current)
  }, [Resizer, startResizer])
  // A column pinned to the end grows toward its start: its grip is on its
  // start edge, the inner one, rather than on the table's frame.
  const gripEdge = pin?.side === "end" ? "start" : "end"
  // The last column's grip stays inside the table: half of it past the
  // edge would be cut by the frame, and scroll the table.
  const lastGrip =
    gripEdge === "end" && index === layout.columns.length - 1
      ? "me-0"
      : undefined
  // On a pinned edge, and in a ruled header, the divider is the grip's line
  // at rest.
  const grip = cn(
    gripEdge === "start" && columnResizerStartClassName,
    lastGrip,
    (pin?.edge || ruled) && "after:bg-transparent"
  )

  // The resizer's width while it changes: drawn through `preview`, so only
  // this cell renders until the drag ends (or the keyboard is done).
  const [live, setLive] = React.useState<number | null>(null)
  const width = sizing?.widths[index] ?? 0
  const filler = sizing?.filler === index
  // What the column shows: the filler is as wide as the space it takes.
  const shownWidth = useResizerValue(element, filler, width)
  // After each commit, the widths drawn are the table's again: the new
  // one, or the old one when the view did not take it (cancelled, or a
  // controlled view left as it was).
  const [commits, setCommits] = React.useState(0)
  const { restore } = sizer
  React.useLayoutEffect(() => {
    if (commits > 0) restore()
  }, [commits, restore])
  // The width the column had as a drag or resize mode began: what a commit
  // compares with (the filler's own width follows the preview).
  const start = React.useRef<number | null>(null)
  const setWidth = (next: number | null, event: Event | undefined) =>
    context.actions.updateView(
      (view) => setColumnWidth(view, column.id, next),
      "resize",
      event
    )
  const commit = (next: number, event: Event | undefined) => {
    const from = start.current ?? shownWidth
    start.current = null
    setLive(null)
    setCommits((count) => count + 1)
    // A width the column had already, which the view does not hold, is no
    // change: a cancelled drag, a key at a bound.
    const set = Object.hasOwn(
      context.store.get().view.columns.widths,
      column.id
    )
    if (!set && next === from) return
    setWidth(next, event)
  }
  const fit = (event: Event | undefined) => {
    const fitted = sizer.fit(column.id)
    if (fitted !== null)
      commit(clampColumnWidth(column.minWidth, column.maxWidth, fitted), event)
  }
  // Resize mode, from the menu's "Resize column": the resizer has focus,
  // the keys change the width drawn, Enter, Tab or leaving keeps it and
  // Escape puts it back; both give focus back to the menu button.
  const [resizing, setResizing] = React.useState(false)
  const keyboard = React.useRef(false)
  const enter = () => {
    keyboard.current = true
    setResizing(true)
  }
  const leave = (keep: boolean, event?: Event) => {
    if (!keyboard.current) return
    keyboard.current = false
    setResizing(false)
    if (keep && live !== null) commit(live, event)
    else if (live !== null) {
      start.current = null
      setLive(null)
      restore()
    }
  }
  // The user has set its width: "Reset width" returns it to its own.
  const hasWidth = useDataTableSelector(context, (state) =>
    Object.hasOwn(state.view.columns.widths, column.id)
  )

  const label =
    column.definition.renderHeader?.({
      column: column.id,
      header: column.header,
      sorted: direction,
    }) ?? column.header
  const press = (event: React.MouseEvent) => {
    const before = context.store.get().view.sorting
    // Shift + click (or Shift + Enter, whose click has Shift too) adds the
    // column to the sort.
    const add = event.shiftKey && options.multiSort
    // Said only for a sort that applied (`onViewChange` may cancel it).
    if (!context.actions.sort(column.id, add, event.nativeEvent)) return
    announceSort(
      t,
      column,
      before,
      toggleSorting(before, column.id, { multi: add })
    )
  }
  const columnMenu = hasColumnMenu(menu) && (
    <ColumnMenu
      loadResizer={resizer.load}
      column={column}
      context={context}
      options={menu}
      sorting={sorting}
      pinned={side}
      grouped={grouped}
      announceSort={announceSort}
      triggerRef={triggerRef}
      resizerRef={resizerRef}
      onFit={(event) => fit(event)}
      onResetWidth={hasWidth ? (event) => setWidth(null, event) : undefined}
      className={MENU_BUTTON[column.align]}
    />
  )
  const drag = draggable ? columnDragProps(order, column.id) : null
  return (
    <TableHead
      {...drag}
      ref={ref}
      rowSpan={rowSpan > 1 ? rowSpan : undefined}
      scope="col"
      // The column's name in announcements, whatever the header draws.
      aria-label={column.header}
      aria-describedby={ids.describedBy}
      aria-sort={
        canSort ? ((at === 0 ? direction : null) ?? "none") : undefined
      }
      data-dragging={dragging ? "" : undefined}
      data-pinned={side ?? undefined}
      className={cn(
        "group/head relative",
        columnClassName(column),
        draggable && DRAGGABLE,
        pin && pinnedHeadClassName,
        pinEdgeClassName(pin),
        edge && GROUP_EDGE,
        // While its resizer is dragged, the guide and the width it draws
        // below the header are not clipped by a pinned edge's cell.
        canResize && "has-[>[role=separator][data-dragging]]:overflow-visible"
      )}
      style={pin && pinStyle(pin)}
    >
      <div className={cn("flex min-w-0 items-center", JUSTIFY[column.align])}>
        <div
          data-slot="data-table-header-label"
          data-align={column.align}
          className={cn(
            HEAD_LABEL,
            hasColumnMenu(menu) && MENU_ROOM[column.align]
          )}
        >
          {canSort ? (
            <Button
              variant="ghost"
              // The sizes whose text is the header's own (`text-sm`, and
              // `text-xs` in a small table), so every label matches.
              size={options.size === "sm" ? "xs" : "default"}
              data-slot="data-table-sort-button"
              className={cn("min-w-0 shrink", BUTTON_EDGE[column.align])}
              onClick={press}
            >
              <span className="truncate">{label}</span>
              {/* The place in a multi-sort sits on the arrow's outer corner,
                over the button's padding, so the button keeps its width as
                columns join the sort. */}
              <span className="relative flex">
                {direction === "ascending" ? (
                  <ArrowUpIcon aria-hidden />
                ) : direction === "descending" ? (
                  <ArrowDownIcon aria-hidden />
                ) : (
                  <ArrowUpDownIcon aria-hidden className="opacity-50" />
                )}
                {multi && (
                  <span
                    aria-hidden
                    data-slot="data-table-sort-position"
                    className={cn(
                      SORT_POSITION,
                      column.align === "end" ? "-start-3" : "-end-3"
                    )}
                  >
                    {at + 1}
                  </span>
                )}
              </span>
              {/* A word apart from the label in the button's name (the flex
                container draws no space). */}
              {multi && " "}
              {multi && (
                <span className="sr-only">
                  {direction === "ascending"
                    ? t("sortPositionAscending", {
                        position: at + 1,
                        total: sorting.length,
                      })
                    : t("sortPositionDescending", {
                        position: at + 1,
                        total: sorting.length,
                      })}
                </span>
              )}
            </Button>
          ) : (
            <span className="min-w-0 truncate">{label}</span>
          )}
          {column.description && (
            <ColumnDescription
              name={column.header}
              description={column.description}
            />
          )}
          {columnMenu}
        </div>
      </div>
      {canResize && !Resizer && resizer.placeholder(grip)}
      {canResize && Resizer && (
        <Resizer
          ref={resizerRef}
          // Not one of the grid's stops, and a press does not focus it: the
          // menu's "Resize column" reaches it (resize mode).
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          aria-describedby={resizing ? resizeHintId : undefined}
          className={grip}
          edge={gripEdge}
          label={column.header}
          // A column hidden below a breakpoint has no width: its own then.
          value={Math.max(
            column.minWidth ?? MIN_COLUMN_WIDTH,
            live ?? shownWidth
          )}
          min={column.minWidth ?? MIN_COLUMN_WIDTH}
          // The default ceiling bounds the widths the user sets, never the
          // width the column has (a stretched one may be wider).
          max={
            column.maxWidth ??
            Math.max(
              MAX_COLUMN_WIDTH,
              live === null ? shownWidth : (start.current ?? shownWidth)
            )
          }
          // Only the menu's "Resize column" focuses it (a press does not).
          onFocus={enter}
          onBlur={(event) => leave(true, event.nativeEvent)}
          onKeyDown={(event) => {
            const keep = event.key === "Enter" || event.key === "Tab"
            if (!keep && event.key !== "Escape") return
            event.preventDefault()
            event.stopPropagation()
            leave(keep, event.nativeEvent)
            triggerRef.current?.focus()
          }}
          onValueChange={(next) => {
            start.current ??= live ?? shownWidth
            setLive(next)
            sizer.preview(column.id, next)
          }}
          // A drag ends with its width; keys wait for Enter (resize mode).
          onValueCommitted={(next, details) => {
            if (details.reason === "drag") commit(next, details.event)
          }}
          // A double click fits the column to its content.
          onDoubleClick={(event) => {
            event.preventDefault()
            fit(event.nativeEvent)
          }}
        />
      )}
      {canResize && (
        <span id={resizeHintId} hidden>
          {t("resizeHint")}
        </span>
      )}
      <HiddenDescriptions
        description={column.description}
        draggable={draggable}
        name={column.header}
        ids={ids}
      />
    </TableHead>
  )
}

/** A group's header (a placeholder, should the layout give one: named after its columns). */
function DataTableGroupHeader<T>({
  cell,
  pin,
  edge,
  shared,
}: {
  cell: HeaderCell
  pin: CellPin | undefined
  /** A column group starts or ends at the cell's start edge. */
  edge: boolean
  shared: HeaderShared<T>
}) {
  const { byId, groups } = getColumnModel(shared.columns)
  const group =
    cell.kind === "group" && cell.id !== null ? groups.get(cell.id) : undefined
  const { order } = shared
  const draggable = !!group && order !== null && shared.movable.has(group.id)
  const dragging = useColumnDragging(order, group?.id ?? "")
  const ids = useDescriptions(group?.description, draggable)
  const drag = draggable ? columnDragProps(order, group.id) : null
  return (
    <TableHead
      {...drag}
      colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
      scope={group ? "colgroup" : undefined}
      // The group's name, whatever else the cell holds.
      aria-label={group?.header}
      aria-describedby={ids.describedBy}
      data-dragging={dragging ? "" : undefined}
      className={cn(
        GROUP_ROW,
        draggable && DRAGGABLE,
        pin && pinnedHeadClassName,
        pinEdgeClassName(pin),
        edge && GROUP_EDGE,
        group && GROUP_UNDER
      )}
      style={pin && pinStyle(pin)}
    >
      {group ? (
        <>
          <div className={cn("flex min-w-0 items-center gap-0.5", GROUP_LABEL)}>
            <span className="min-w-0 truncate">{group.header}</span>
            {group.description && (
              <ColumnDescription
                name={group.header}
                description={group.description}
              />
            )}
          </div>
          <HiddenDescriptions
            description={group.description}
            draggable={draggable}
            name={group.header}
            ids={ids}
          />
        </>
      ) : (
        // Above columns in fewer groups: named after them.
        <span className="sr-only">
          {cell.columns.map((id) => byId.get(id)?.header ?? id).join(", ")}
        </span>
      )}
    </TableHead>
  )
}

/** A header row's cells as drawn, each at its column (`at`). */
type SpannedRow = {
  row: HeaderRow
  cells: Array<{ cell: HeaderCell; at: number; rowSpan: number }>
}

/**
 * The header rows as drawn: a column in fewer groups than the deepest is
 * drawn in the first row where the layout has a placeholder over it,
 * spanning the rows down to the last, in place of the placeholders and its
 * own cell in the last row.
 */
function spannedRows(rows: ReadonlyArray<HeaderRow>): Array<SpannedRow> {
  const last = rows.length - 1
  const leaves = new Map<string, HeaderCell>()
  for (const cell of rows[last]?.cells ?? [])
    if (cell.id !== null) leaves.set(cell.id, cell)
  const placed = new Set<string>()
  return rows.map((row) => {
    const cells: SpannedRow["cells"] = []
    let at = 0
    for (const cell of row.cells) {
      if (cell.kind === "placeholder")
        cell.columns.forEach((id, offset) => {
          const leaf = leaves.get(id)
          if (placed.has(id) || !leaf) return
          placed.add(id)
          cells.push({
            cell: leaf,
            at: at + offset,
            rowSpan: last - row.level + 1,
          })
        })
      else if (cell.kind !== "column" || !placed.has(cell.id ?? ""))
        cells.push({ cell, at, rowSpan: 1 })
      at += cell.colSpan
    }
    return { row, cells }
  })
}

/**
 * Where a group's or placeholder's cell sticks: where its first column does
 * (its last, at the end), when every column under it is pinned.
 */
function cellPin<T>(
  cell: HeaderCell,
  start: number,
  shared: HeaderShared<T>
): CellPin | undefined {
  const first = shared.pins[start]
  const last = shared.pins[start + cell.colSpan - 1]
  if (!first || !last || first.side !== last.side) return undefined
  // At the inner edge when the column there is.
  return first.side === "start"
    ? { ...first, edge: last.edge }
    : { ...last, edge: first.edge }
}

function DataTableHeaderImpl<T>({ shared }: { shared: HeaderShared<T> }) {
  const t = useTranslations("table")
  const tDataTable = useTranslations("dataTable")
  const { layout, options } = shared
  const { byId } = getColumnModel(shared.columns)
  const last = layout.headerRows.length - 1
  const selection = options.selectionMode !== "none"
  const index = new Map(layout.columns.map((column, at) => [column.id, at]))
  // Where a column group starts or ends: a divider at that edge, in every
  // row (not at the table's edges, which the frame draws; at its first
  // column, after the selection column).
  const edges = new Set<number>()
  let grouped = false
  for (const row of layout.headerRows) {
    let at = 0
    for (const cell of row.cells) {
      if (cell.kind === "group" && cell.id !== null) {
        grouped = true
        edges.add(at)
        edges.add(at + cell.colSpan)
      }
      at += cell.colSpan
    }
  }
  // With a group, every column is ruled off in the header, so the columns
  // under a group and beside it read as one grid.
  if (grouped) for (let at = 1; at < layout.columns.length; at++) edges.add(at)
  edges.delete(layout.columns.length)
  if (!selection && !options.reorderableRows) edges.delete(0)
  // Nor beside the start's pinned columns, which draw their divider there.
  if (layout.pinnedStart > 0) edges.delete(layout.pinnedStart)
  // A cell with nothing to show is still named for the grid's keyboard,
  // which stops on every header cell.
  const selectColumn = <span className="sr-only">{t("select")}</span>
  const rows = spannedRows(layout.headerRows)
  return (
    <TableHeader>
      {rows.map(({ row, cells }) => {
        // A group in one cell is keyed by its id, so it keeps its cell as
        // it moves (and its focus after a keyboard drag).
        const counts = new Map<string | null, number>()
        for (const { cell } of cells)
          counts.set(cell.id, (counts.get(cell.id) ?? 0) + 1)
        return (
          <TableRow key={row.key}>
            {options.reorderableRows && row.level === 0 && (
              <TableHead
                rowSpan={last > 0 ? last + 1 : undefined}
                className={cn("w-px", shared.handlePin && pinnedHeadClassName)}
                style={shared.handlePin && pinStyle(shared.handlePin)}
              >
                <span className="sr-only">
                  {tDataTable("reorderRowsColumn")}
                </span>
              </TableHead>
            )}
            {selection && row.level === 0 && (
              <TableHead
                rowSpan={last > 0 ? last + 1 : undefined}
                className={cn(
                  "w-px",
                  shared.selectionPin && pinnedHeadClassName
                )}
                style={shared.selectionPin && pinStyle(shared.selectionPin)}
              >
                {options.selectionMode === "multiple" ? (
                  <DataTableSelectionCheckbox />
                ) : (
                  selectColumn
                )}
              </TableHead>
            )}
            {cells.map(({ cell, at, rowSpan }) => {
              const column = cell.id === null ? undefined : byId.get(cell.id)
              if (cell.kind === "column" && column)
                return (
                  <DataTableColumnHeader
                    // By id: a reordered column's cell moves, and keeps
                    // its focus and its menu.
                    key={column.id}
                    column={column}
                    index={index.get(column.id) ?? at}
                    edge={edges.has(at)}
                    ruled={grouped}
                    rowSpan={rowSpan}
                    shared={shared}
                  />
                )
              return (
                <DataTableGroupHeader
                  key={
                    cell.kind === "group" && counts.get(cell.id) === 1
                      ? `group:${cell.id}`
                      : cell.key
                  }
                  cell={cell}
                  pin={cellPin(cell, at, shared)}
                  edge={edges.has(at)}
                  shared={shared}
                />
              )
            })}
          </TableRow>
        )
      })}
    </TableHeader>
  )
}

/** The header: it renders again only when what it draws changes (`shared`). */
const DataTableHeader = React.memo(
  DataTableHeaderImpl
) as typeof DataTableHeaderImpl

/**
 * The header rows to draw: the columns' (the last), and each row of groups
 * with a group over a column that is laid out (`hidden`: a column hidden
 * below its `hideBelow`), from level 0 down again. A row of groups over
 * hidden columns only would stand empty, and the columns' headers would
 * span it: a header two rows tall with one row of names. The rows kept
 * are the same objects when none is left out.
 */
function shownHeaderRows(
  rows: ReadonlyArray<HeaderRow>,
  hidden: (column: string) => boolean
): ReadonlyArray<HeaderRow> {
  const last = rows.length - 1
  const kept = rows.filter(
    (row) =>
      row.level === last ||
      row.cells.some(
        (cell) =>
          cell.kind === "group" && cell.columns.some((id) => !hidden(id))
      )
  )
  if (kept.length === rows.length) return rows
  return kept.map((row, level) => ({ ...row, level }))
}

export { DataTableHeader, shownHeaderRows }
export type { HeaderShared }
