"use client"

/**
 * The header: one row per level of column groups (a group spans its
 * columns with `colSpan`; placeholders fill in above a column in fewer
 * groups), the leaf columns in the last row. A column that sorts has a sort
 * button: a click cycles ascending, descending, off; Shift + click adds the
 * column to a multi-sort (§5.2). The first sort is the header's `aria-sort`,
 * which the grid announces; with several, each sorted header shows its
 * place in the order.
 *
 * Each column's header also holds, as the features are on: its
 * description (an info button with a tooltip, and the cell's accessible
 * description), its menu (`column-menu.tsx`) and the resizer on its end
 * edge. A column or group that can be reordered is its own drag handle
 * (`column-order.ts`): a tab stop of the grid's, dragged from anywhere on
 * it. The grid's arrow keys go through each cell's controls in order.
 *
 * The selection column's header holds the select-all checkbox in the last
 * row (a cell named "Select" above it, and in its place for single
 * selection), so every header row has the same columns for the grid to
 * move through; the drag handle column's cells, before it, are named
 * "Reorder". Placeholders are named after the columns below them.
 */
import * as React from "react"
import { cn } from "cn"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EllipsisVerticalIcon,
  InfoIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

import { columnResizerClassName } from "../column-resizer-style"
import { useTranslations, type Translator } from "../i18n/translations"
import { announce } from "../primitives/live-announcer"
import {
  columnClassName,
  pinnedHeadClassName,
  pinStyle,
  type CellPin,
} from "./cell"
import {
  columnDragProps,
  useColumnDragging,
  type ColumnOrder,
} from "./column-order"
import type { ColumnMenuOptions, DataTableColumnMenu } from "./column-menu"
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
} from "./engine/index"
import { useFeature } from "./lazy"
import { useLazyPopup } from "./lazy-popup"
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
 * A column's menu button: at the cell's end edge, over the end of its label
 * (in the header's fill), taking no room; shown while the header row is
 * hovered, the cell holds focus or the menu is open. Where there is no
 * hover (a touch screen), always shown, with its room kept.
 */
const MENU_SHOWN =
  "pointer-events-none opacity-0 group-focus-within/head:pointer-events-auto group-focus-within/head:opacity-100 data-popup-open:pointer-events-auto data-popup-open:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 [tr:hover_&]:pointer-events-auto [tr:hover_&]:opacity-100"

const MENU_BUTTON = cn(
  "absolute end-2 top-1/2 -translate-y-1/2 bg-table-header",
  MENU_SHOWN,
  "pointer-coarse:static pointer-coarse:ms-auto pointer-coarse:translate-y-0"
)

/**
 * In a column aligned to the end (numbers), whose label ends at the cell's
 * end, the button sits at the start edge instead, mostly in the cell's
 * padding, and the content makes the rest of the room while it shows
 * (`MENU_ROOM`): it covers neither the label nor the sort arrow.
 */
const MENU_BUTTON_START = cn(
  "absolute start-1 top-1/2 -translate-y-1/2 bg-table-header",
  MENU_SHOWN,
  "pointer-coarse:static pointer-coarse:ms-auto pointer-coarse:translate-y-0"
)

/** The start room an end-aligned header's content keeps while its menu button shows. */
const MENU_ROOM =
  "pointer-fine:group-focus-within/head:ps-3 pointer-fine:has-data-popup-open:ps-3 pointer-fine:[tr:hover_&]:ps-3"

/**
 * In a header with a description, whose info button ends the label, the
 * menu button keeps its room beside it rather than cover it.
 */
const MENU_BUTTON_BESIDE = cn("ms-auto", MENU_SHOWN)

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

/** The props of a column's menu, as `column-menu.tsx` takes them. */
type ColumnMenuProps<T> = Omit<
  React.ComponentProps<typeof DataTableColumnMenu<T>>,
  "popup"
>

/**
 * A column's menu button: a plain button for its whole life, which opens
 * the menu once the menu's code is there (`lazy-popup.ts`,
 * `header-popups.tsx`).
 */
function ColumnMenu<T>({
  loadResizer,
  className,
  ...props
}: ColumnMenuProps<T> & { loadResizer: () => void; className?: string }) {
  const t = useTranslations("dataTable")
  const lazy = useLazyPopup("headerPopups", {
    popup: "menu",
    // "Resize column" focuses the resizer: asked for with the menu.
    also: loadResizer,
    anchor: props.triggerRef,
  })
  const Menu = lazy.module?.DataTableColumnMenu as
    typeof DataTableColumnMenu<T> | undefined
  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        data-slot="data-table-column-menu"
        aria-label={t("columnMenu", { columnName: props.column.header })}
        className={cn("text-muted-foreground hover:text-foreground", className)}
        {...lazy.buttonProps}
        // The cell's own press drags the column; this one opens the menu.
        onPointerDown={(event) => event.stopPropagation()}
      >
        <EllipsisVerticalIcon />
      </Button>
      {lazy.mounted && Menu && <Menu {...props} popup={lazy.popupProps} />}
    </>
  )
}

/**
 * The resizer of a column (`TableColumnResizer`), loaded on demand: until
 * then its grip is drawn the same, absolutely placed (nothing moves when
 * the resizer takes its place), and a drag started on it carries on with
 * the resizer if the pointer is still down when it arrives.
 */
function useResizer(on: boolean) {
  const feature = useFeature("resizer", on)
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

/** The look of a description's info button, before and after its popover loads. */
const DESCRIPTION_BUTTON =
  "inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:text-foreground"

/**
 * A column's or group's description: an info button that shows it in a
 * popover when pressed (a pointer, a finger or the keyboard). Screen
 * readers hear it with the header itself (its accessible description). The
 * button is a plain one for its whole life; the popover loads on demand
 * (`header-popups.tsx`, `lazy-popup.ts`).
 */
function ColumnDescription({
  name,
  description,
}: {
  name: string
  description: string
}) {
  const t = useTranslations("dataTable")
  const lazy = useLazyPopup("headerPopups", { popup: "dialog" })
  const Description = lazy.module?.DataTableColumnDescription
  return (
    <>
      <button
        type="button"
        data-slot="data-table-column-description"
        aria-label={t("columnDescription", { columnName: name })}
        className={DESCRIPTION_BUTTON}
        {...lazy.buttonProps}
        // The cell's own press drags the column; this one shows the text.
        onPointerDown={(event) => event.stopPropagation()}
      >
        <InfoIcon aria-hidden className="size-3.5" />
      </button>
      {lazy.mounted && Description && (
        <Description description={description} popup={lazy.popupProps} />
      )}
    </>
  )
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
  shared,
}: {
  column: EngineColumn<T>
  /** The column's place among the shown columns. */
  index: number
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
  // The last column's grip stays inside the table: half of it past the
  // edge would be cut by the frame, and scroll the table.
  const lastGrip = index === layout.columns.length - 1 ? "me-0" : undefined

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
    // Said only for a sort that applied (`onViewChange` may cancel it).
    if (!context.actions.sort(column.id, event.shiftKey, event.nativeEvent))
      return
    announceSort(
      t,
      column,
      before,
      toggleSorting(before, column.id, { multi: event.shiftKey })
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
      className={
        column.description
          ? MENU_BUTTON_BESIDE
          : column.align === "end"
            ? MENU_BUTTON_START
            : MENU_BUTTON
      }
    />
  )
  const drag = draggable ? columnDragProps(order, column.id) : null
  return (
    <TableHead
      {...drag}
      ref={ref}
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
        pin && pinnedHeadClassName
      )}
      style={pin && pinStyle(pin)}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-0.5",
          JUSTIFY[column.align],
          column.align === "end" &&
            !column.description &&
            hasColumnMenu(menu) &&
            MENU_ROOM
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
            {/* The place in a multi-sort sits on the arrow, so the button
                keeps its width as columns join the sort. */}
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
                  className="absolute -end-1.5 -top-1.5 text-[0.625rem] leading-none text-muted-foreground tabular-nums"
                >
                  {at + 1}
                </span>
              )}
            </span>
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
          <span
            className={cn(
              "min-w-0 truncate",
              column.align === "center" && "mx-auto"
            )}
          >
            {label}
          </span>
        )}
        {column.description && (
          <ColumnDescription
            name={column.header}
            description={column.description}
          />
        )}
        {columnMenu}
      </div>
      {canResize && !Resizer && resizer.placeholder(lastGrip)}
      {canResize && Resizer && (
        <Resizer
          ref={resizerRef}
          // Not one of the grid's stops, and a press does not focus it: the
          // menu's "Resize column" reaches it (resize mode).
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          aria-describedby={resizing ? resizeHintId : undefined}
          className={lastGrip}
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

/** A group's header, or a placeholder above columns in fewer groups. */
function DataTableGroupHeader<T>({
  cell,
  pin,
  shared,
}: {
  cell: HeaderCell
  pin: CellPin | undefined
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
      className={cn(draggable && DRAGGABLE, pin && pinnedHeadClassName)}
      style={pin && pinStyle(pin)}
    >
      {group ? (
        <>
          <div className="flex min-w-0 items-center gap-0.5">
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
  return first.side === "start" ? first : last
}

function DataTableHeader<T>({ shared }: { shared: HeaderShared<T> }) {
  const t = useTranslations("table")
  const tDataTable = useTranslations("dataTable")
  const { layout, options } = shared
  const { byId } = getColumnModel(shared.columns)
  const last = layout.headerRows.length - 1
  const selection = options.selectionMode !== "none"
  const index = new Map(layout.columns.map((column, at) => [column.id, at]))
  // Cells with nothing to show are still named for the grid's keyboard,
  // which stops on every header cell.
  const selectColumn = <span className="sr-only">{t("select")}</span>
  const handleColumn = (
    <span className="sr-only">{tDataTable("reorderRowsColumn")}</span>
  )
  return (
    <TableHeader>
      {layout.headerRows.map((row) => {
        let start = 0
        // A group in one cell is keyed by its id, so it keeps its cell as
        // it moves (and its focus after a keyboard drag).
        const counts = new Map<string | null, number>()
        for (const cell of row.cells)
          counts.set(cell.id, (counts.get(cell.id) ?? 0) + 1)
        return (
          <TableRow key={row.key}>
            {options.reorderableRows && (
              <TableHead
                className={cn(
                  row.level === last && "w-px",
                  shared.handlePin && pinnedHeadClassName
                )}
                style={shared.handlePin && pinStyle(shared.handlePin)}
              >
                {handleColumn}
              </TableHead>
            )}
            {selection && (
              <TableHead
                className={cn(
                  row.level === last && "w-px",
                  shared.selectionPin && pinnedHeadClassName
                )}
                style={shared.selectionPin && pinStyle(shared.selectionPin)}
              >
                {row.level === last && options.selectionMode === "multiple" ? (
                  <DataTableSelectionCheckbox />
                ) : (
                  selectColumn
                )}
              </TableHead>
            )}
            {row.cells.map((cell) => {
              const at = start
              start += cell.colSpan
              const column = cell.id === null ? undefined : byId.get(cell.id)
              if (cell.kind === "column" && column)
                return (
                  <DataTableColumnHeader
                    // By id: a reordered column's cell moves, and keeps
                    // its focus and its menu.
                    key={column.id}
                    column={column}
                    index={index.get(column.id) ?? at}
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

export { DataTableHeader }
export type { HeaderShared }
