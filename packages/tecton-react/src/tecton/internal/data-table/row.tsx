"use client"

/**
 * The body rows: a component per row (the cells are plain calls, `cell.tsx`),
 * memoized on the engine's row object and the table's shared row state.
 * The engine keeps a row's object while nothing about the row changes, so
 * a sort, a page or another row opening renders only the rows that change;
 * a row's selection is read by its `TableRow` from the grid's store, so
 * selecting a row renders that row's `TableRow` and checkbox alone: not its
 * cells, nor the other rows.
 *
 * Each row passes the props a virtualized body gives it (`aria-rowindex`,
 * `data-index`) on to its `TableRow`, inside the `TableRowConfigContext`
 * that tells the grid its id, text, level and expanded state.
 *
 * With `highlightChanges`, item and group rows render their key and, while
 * highlighted, their highlight's state (`useLiveRowProps`: waiting to be
 * seen, or the fade's start): a row reads only its own, so a highlight
 * renders that row alone.
 *
 * With `reorderableRows`, a column of drag handles comes first
 * (`row-order.tsx`): each item row's handle, drawn while the rows are in
 * the items' order; each row's `tr` is registered for the drag.
 *
 * A row with a detail row (`renderDetail`) is a treegrid row of level 1
 * that opens like a tree row (its chevron, Right / Left, Enter); its detail
 * row is the level 2 row under it, one cell across every column, holding
 * whatever `renderDetail` draws (a table of its own too: the rows' grid
 * state does not reach it). The detail row takes its row's fill, and the
 * stripes of the rows after it stay as they were: an empty hidden row
 * before it keeps their parity (a virtualized body is told each row's,
 * through `rowParity`, and puts none there). It is measured on its own in
 * a virtualized body.
 *
 * A group row (`groupable`) is a treegrid row of the group's level, open
 * by default, opened and closed like a tree row (Right / Left, Enter, a
 * click anywhere on it but its checkbox): a chevron, "Column: value" and
 * its number of items in a row header over the first columns that sum
 * nothing (`groupCellsOf`), each aggregate column's subtotal over the
 * group's items, and a checkbox (Space on the row) that selects them. It
 * reads the row model itself, so its subtotals follow the items while its
 * engine row stays the same.
 */
import * as React from "react"
import { cn } from "cn"
import { ChevronRightIcon } from "lucide-react"

import { Checkbox } from "@tecton/react/checkbox"
import { TableCell, TableHead, TableRow } from "@tecton/react/table"

import { useTranslations } from "../i18n/translations"
import { createStore, useStore } from "../store"
import {
  TableRowConfigContext,
  type RowDescription,
  type TableRowGridProps,
} from "../table-grid"
import {
  ALIGN,
  cellBorderClassName,
  INDENT,
  pinEdgeClassName,
  pinnedCellClassName,
  pinnedRowClassName,
  pinStyle,
  renderCell,
  rowText,
  shownClassName,
  type CellPin,
  type DetailStore,
  type GroupCell,
  type RowShared,
  numericClassName,
} from "./cell"
import { useDataTableContext, useDataTableSelector } from "./context"
import {
  selectionState,
  type BodyRow,
  type DataTableRowModel,
  type DetailRow,
  type EngineColumn,
  type GroupRow,
  type ItemRow,
} from "./engine/index"
import { useLiveRowProps } from "./live-bridge"
import { DataTableRowHandle } from "./row-order"
import { DataTableSelectionCheckbox, hasContent } from "./selection-checkbox"

type RowProps<TRow, T> = Omit<React.ComponentProps<"tr">, "children"> & {
  row: TRow
  shared: RowShared<T>
}

/** What the grid knows of a row out of view of a virtualized table. */
function describeRow<T>(row: BodyRow<T>, shared: RowShared<T>): RowDescription {
  switch (row.kind) {
    case "item":
      return {
        value: row.id,
        // Formatted only when read (type-ahead, an announcement): the
        // grid reads every row's description for a range or a search.
        get textValue() {
          return rowText(row.item, shared)
        },
        disabled: shared.disableRows && row.disabled,
        level: shared.levelled ? row.depth + 1 : undefined,
      }
    case "group":
      return {
        value: undefined,
        textValue: shared.groupLabel(row).text,
        disabled: false,
        level: row.depth + 1,
      }
    case "detail":
      return {
        value: undefined,
        textValue: undefined,
        disabled: false,
        level: row.depth + 2,
      }
  }
}

/**
 * A row's `aria-rowindex`: its place among every page's rows on pages, else
 * the one a virtualized body gives it (none when every row is there).
 */
function rowIndex<T>(
  id: string,
  given: number | undefined,
  shared: RowShared<T>
) {
  return shared.rowIndexOf
    ? shared.headerRows + shared.rowIndexOf(id) + 1
    : given
}

function ItemRowComponent<T>({
  row,
  shared,
  ...props
}: RowProps<ItemRow<T>, T>) {
  const { actions } = shared
  const config = React.useMemo<TableRowGridProps>(
    () => ({
      value: row.id,
      disabled: shared.disableRows && row.disabled,
      textValue: rowText(row.item, shared),
      level: shared.levelled ? row.depth + 1 : undefined,
      expanded: row.expandable ? row.expanded : undefined,
      onExpandedChange: row.expandable
        ? (open: boolean, event: Event) =>
            actions.setRowExpanded(row.id, open, "keyboard", event)
        : undefined,
    }),
    [row, shared, actions]
  )
  // Why the row cannot be selected (`itemToDisabledReason`): its checkbox's
  // tooltip and description, and the row's description too, read as focus
  // reaches it (`disabledBehavior="selection"`).
  const reason =
    shared.selection && shared.disabledReasons && row.disabled
      ? actions.disabledReasonOf(row.item)
      : undefined
  const reasonId = React.useId()
  const live = useLiveRowProps(shared.live, row.key)
  return (
    <TableRowConfigContext value={config}>
      <TableRow
        {...props}
        {...live}
        aria-describedby={hasContent(reason) ? reasonId : undefined}
        ref={shared.order?.register(row.id)}
        aria-rowindex={rowIndex(row.id, props["aria-rowindex"], shared)}
        aria-posinset={shared.levelled ? row.posinset : undefined}
        aria-setsize={shared.levelled ? row.setsize : undefined}
        className={cn(
          shared.pinned && pinnedRowClassName,
          // The row being dragged, as a column's header is.
          shared.handle && "has-data-dragging:opacity-50"
        )}
      >
        {shared.handle && (
          <TableCell
            className={cn(
              "w-px pe-0",
              shared.pinned && cellBorderClassName,
              shared.handlePin && pinnedCellClassName
            )}
            style={shared.handlePin && pinStyle(shared.handlePin)}
          >
            {shared.order && !row.continued && (
              <DataTableRowHandle
                order={shared.order}
                id={row.id}
                label={config.textValue ?? row.id}
                size={shared.size}
              />
            )}
          </TableCell>
        )}
        {shared.selection && (
          <TableCell
            className={cn(
              "w-px",
              shared.pinned && cellBorderClassName,
              shared.selectionPin && pinnedCellClassName
            )}
            style={shared.selectionPin && pinStyle(shared.selectionPin)}
          >
            <DataTableSelectionCheckbox reason={reason} reasonId={reasonId} />
          </TableCell>
        )}
        {shared.columns.map((column, index) =>
          renderCell(column, index, row, shared)
        )}
      </TableRow>
    </TableRowConfigContext>
  )
}

/**
 * A group row's checkbox: checked while every item of the group that can
 * be selected is, indeterminate while some are; it selects them all, or
 * clears them. Named "Select" and the group's label, like a row's.
 */
function GroupCheckbox<T>({
  row,
  shared,
  labelId,
}: {
  row: GroupRow
  shared: RowShared<T>
  labelId: string
}) {
  const t = useTranslations("table")
  const context = useDataTableContext<T>("DataTableContent")
  const model = useDataTableSelector(context, (state) => state.model)
  const selected = useDataTableSelector(context, (state) => state.selected)
  // The same array while the groups stay: a group opening or closing
  // works out nothing again.
  const ids = model.groupSelectableIds(row.key)
  const state = React.useMemo(
    () => selectionState(selected, ids),
    [selected, ids]
  )
  // "Select" and the label cell: a hidden "Select", then the cell (its
  // name, as an item row's checkbox reads its row header).
  const selectId = React.useId()
  return (
    <>
      <span id={selectId} hidden>
        {t("select")}
      </span>
      <Checkbox
        data-slot="data-table-group-checkbox"
        aria-labelledby={`${selectId} ${labelId}`}
        checked={state === "all"}
        indeterminate={state === "some"}
        disabled={ids.length === 0}
        onCheckedChange={(_checked, eventDetails) =>
          shared.actions.toggleGroupSelected(
            row.key,
            "item-press",
            eventDetails.event
          )
        }
      />
    </>
  )
}

/** A group's subtotal in a column: `renderAggregate`, or formatted as the column. */
function subtotal<T>(
  column: EngineColumn<T>,
  row: GroupRow,
  model: DataTableRowModel<T>,
  shared: RowShared<T>
): React.ReactNode {
  if (!column.aggregate) return null
  const value = model.groupAggregates(row.key)[column.id]
  const { renderAggregate } = column.definition
  return renderAggregate
    ? renderAggregate(value, { items: model.groupItems(row.key) })
    : shared.formatter.formatAggregate(column, value)
}

/**
 * A group's row (see the module comment): its chevron, label and number of
 * rows in the first columns, its subtotals in the aggregate columns, its
 * checkbox in the selection column. A click on it opens or closes it.
 */
function GroupRowComponent<T>({
  row,
  shared,
  ...props
}: RowProps<GroupRow, T>) {
  const t = useTranslations("dataTable")
  const context = useDataTableContext<T>("DataTableContent")
  // The subtotals are the model's: they change with the items in the group.
  const model = useDataTableSelector(context, (state) => state.model)
  const { actions, columns, pins, groupCells } = shared
  const name = shared.groupLabel(row)
  const label = name.text
  const count = t("groupCount", {
    count: row.count,
    total: row.count.toLocaleString(shared.formatter.locale),
  })
  const labelId = React.useId()
  const live = useLiveRowProps(shared.live, row.key)
  const config = React.useMemo<TableRowGridProps>(
    () => ({
      id: row.key,
      textValue: label,
      level: row.depth + 1,
      expanded: row.open,
      onExpandedChange: (open: boolean) => actions.setGroupOpen(row.key, open),
      onToggleSelected: shared.multiple
        ? (event: Event) =>
            actions.toggleGroupSelected(row.key, "keyboard", event)
        : undefined,
    }),
    [row, label, actions, shared.multiple]
  )
  // A cell over the column at the pinned columns' inner edge draws it,
  // without clipping: the group's label goes on over the columns after it.
  const pinned = (column: number, span = 1) => {
    const pin = pins[column]
    const edge = pins.slice(column, column + span).some((at) => at?.edge)
    return cn(
      shared.pinned && cellBorderClassName,
      pin && pinnedCellClassName,
      pin && edge && pinEdgeClassName({ ...pin, edge }, false)
    )
  }
  const controlCell = (pin: CellPin | undefined, content?: React.ReactNode) => (
    <TableCell
      className={cn(
        "w-px",
        shared.pinned && cellBorderClassName,
        pin && pinnedCellClassName
      )}
      style={pin && pinStyle(pin)}
    >
      {content}
    </TableCell>
  )
  // Read "Field: Gullfaks, 6 rows", whatever the label shows (its parts
  // in spans, the column's name left out when cut), and so does the
  // checkbox, which reads the cell. With a subtotal in the cell, the name,
  // a pause and the subtotal ("Active: No, 11 rows, 29,037"): as text, or
  // as `renderAggregate` draws it, through a hidden name and the subtotal.
  const rowName = t("groupRowLabel", { label, rows: count })
  const pause =
    t("groupRowLabel", { label: "\u0000", rows: "\u0001" })
      .split("\u0000")[1]
      ?.split("\u0001")[0] ?? ""
  const labelCell = (cell: GroupCell & { kind: "label" }, first: boolean) => {
    const pin = pins[cell.column]
    const column = columns[cell.column]
    const sum = `${labelId}-${cell.column}-sum`
    const drawn = cell.subtotal ? subtotal(column, row, model, shared) : null
    const named = typeof drawn !== "string" && drawn !== null
    return (
      <TableHead
        key={`label:${cell.column}:${cell.span}:${cell.subtotal}`}
        // The checkbox's name, as an item row's checkbox names it by its
        // row header: read once in the row's name, not twice.
        id={first ? labelId : undefined}
        scope="row"
        aria-label={
          named
            ? undefined
            : drawn === null
              ? rowName
              : `${rowName}${pause}${drawn}`
        }
        aria-labelledby={named ? `${sum}-name ${sum}` : undefined}
        colSpan={cell.span > 1 ? cell.span : undefined}
        className={cn(
          "[&[scope=row]]:font-medium",
          shownClassName(groupCells.tiers, cell.shown),
          pinned(cell.column, cell.span),
          cell.reach && GROUP_LABEL_REACH_EDGE
        )}
        style={pin && pinStyle(pin)}
      >
        {named && (
          <span id={`${sum}-name`} hidden>
            {`${rowName}${pause.trimEnd()}`}
          </span>
        )}
        <div
          className={cn(
            "flex items-center gap-1",
            // Over the empty columns after its cell, on the row's fill;
            // within its cell until they are measured, and once the table
            // is scrolled sideways.
            cell.reach && GROUP_LABEL_REACH
          )}
          style={{ paddingInlineStart: `${row.depth * INDENT}rem` }}
        >
          <span
            aria-hidden
            data-slot="data-table-group-chevron"
            className="flex size-6 shrink-0 items-center justify-center text-muted-foreground"
          >
            <ChevronRightIcon
              className={cn(
                "size-4 transition-transform rtl:-scale-x-100",
                row.open && "rotate-90 rtl:-rotate-90"
              )}
            />
          </span>
          {/* Short of room, the count gives way first (it shrinks, the label
              does not), then the label is cut: never past the cell, the
              chevron and its gap. Beside a subtotal, both shrink. */}
          <span
            className={cn(
              "truncate",
              cell.subtotal ? "min-w-0" : "max-w-[calc(100%-1.75rem)] shrink-0"
            )}
          >
            {name.before && (
              <span className={cn(cell.reach && GROUP_LABEL_COLUMN)}>
                {name.before}
              </span>
            )}
            {name.value}
            {name.after && (
              <span className={cn(cell.reach && GROUP_LABEL_COLUMN)}>
                {name.after}
              </span>
            )}
          </span>
          <span className="min-w-0 truncate font-normal text-muted-foreground tabular-nums">
            {count}
          </span>
          {cell.subtotal && (
            // Every column shown sums: the first one's subtotal is here.
            <span
              id={sum}
              className={cn(
                "ms-auto shrink-0 ps-4 font-normal",
                numericClassName(column)
              )}
            >
              {drawn}
            </span>
          )}
        </div>
      </TableHead>
    )
  }
  let labelled = false
  const cells = groupCells.cells.map((cell) => {
    if (cell.kind === "label") {
      const first = !labelled
      labelled = true
      return labelCell(cell, first)
    }
    const column = columns[cell.column]
    const pin = pins[cell.column]
    return (
      <TableCell
        key={column.id}
        className={cn(
          ALIGN[column.align],
          shownClassName(groupCells.tiers, cell.shown),
          numericClassName(column),
          pinned(cell.column)
        )}
        style={pin && pinStyle(pin)}
      >
        {subtotal(column, row, model, shared)}
      </TableCell>
    )
  })
  return (
    <TableRowConfigContext value={config}>
      <TableRow
        {...props}
        {...live}
        data-slot="data-table-group-row"
        aria-rowindex={rowIndex(row.id, props["aria-rowindex"], shared)}
        aria-posinset={row.posinset}
        aria-setsize={row.setsize}
        className="bg-table-header font-medium"
        // A quick series of clicks selects no text: each click opens or
        // closes the group.
        onMouseDown={(event) => {
          if (event.detail > 1) event.preventDefault()
        }}
        onClick={(event) => {
          // Its checkbox selects; every other click opens or closes it.
          if (event.button !== 0) return
          const target = event.target as HTMLElement
          if (target.closest("button, input, a, label, [role=checkbox]")) return
          const text = target.ownerDocument.getSelection()
          if (text && !text.isCollapsed) return
          actions.setGroupOpen(row.key, !row.open)
        }}
      >
        {shared.handle && controlCell(shared.handlePin)}
        {shared.selection &&
          controlCell(
            shared.selectionPin,
            shared.multiple ? (
              <GroupCheckbox row={row} shared={shared} labelId={labelId} />
            ) : null
          )}
        {cells}
      </TableRow>
    </TableRowConfigContext>
  )
}

/**
 * A group label that may go on over the empty columns after its pinned
 * cell (`GroupCells.reach`): as wide as they are, on the row's fill. Kept
 * to its cell until they are measured, and while the table is scrolled
 * sideways (`data-group-label-clipped` on this table's scroll container,
 * `content.tsx`), where the column's name goes first, then the count, so
 * the value stays in view (the cell's hidden name names it whole).
 *
 * The variants read the generated `Table`'s structure, the scroll
 * container > table > tbody > tr > th, then this label's div and spans,
 * child by child (so a table nested in a cell is not reached): a wrapper
 * added there breaks them, which a test checks (`data-table-grouping`).
 */
const GROUP_LABEL_REACH = cn(
  "relative w-max max-w-[calc(var(--data-table-group-label,calc(100%+2rem))-2rem)] bg-inherit pe-2",
  "[[data-group-label-clipped]>table>tbody>tr>th>&]:max-w-full"
)
const GROUP_LABEL_COLUMN =
  "[[data-group-label-clipped]>table>tbody>tr>th>div>span>&]:hidden"
/**
 * The pinned columns' divider (`pinEdgeClassName`) on a label cell that
 * may reach past it: bridged by the group's band while the label goes on
 * over the columns after it, drawn once it keeps to its cell.
 */
const GROUP_LABEL_REACH_EDGE =
  "border-e-transparent [[data-group-label-clipped]>table>tbody>tr>&]:border-e-border"

const NO_DETAIL: DetailStore = createStore<{
  render: ((item: never) => React.ReactNode) | null
}>({ render: null })

/**
 * Its fill is its row's: striped with it, not by its own place. The row is
 * just before it in a virtualized body, before the hidden row otherwise.
 */
const DETAIL_STRIPE = {
  virtualized:
    "[[data-striped]>tbody>tr:nth-child(even)+&]:bg-surface-alt [[data-striped]>tbody>tr:nth-child(odd)+&]:bg-transparent",
  all: "[[data-striped]>tbody>tr:nth-child(even)+tr+&]:bg-surface-alt [[data-striped]>tbody>tr:nth-child(odd)+tr+&]:bg-transparent",
} as const

/**
 * The pinned columns' divider (`pinEdgeClassName`) through a detail row,
 * which has no pinned cells: a line stuck where theirs is, as tall as the
 * cell (its padding and bottom border too), under the detail's content.
 */
const DETAIL_DIVIDER_LINE =
  "pointer-events-none sticky col-start-1 row-start-1 w-px bg-border -mt-3 -mb-[calc(--spacing(3)+1px)] in-data-[size=sm]:-mt-1 in-data-[size=sm]:-mb-[calc(--spacing(1)+1px)]"
const DETAIL_DIVIDER = {
  start: cn(
    DETAIL_DIVIDER_LINE,
    "start-[calc(var(--data-table-pinned-start)-1px)] justify-self-start"
  ),
  end: cn(
    DETAIL_DIVIDER_LINE,
    "end-[calc(var(--data-table-pinned-end)-1px)] justify-self-end"
  ),
} as const

/** A row's detail row, across every column (see the module comment). */
function DetailRowComponent<T>({
  row,
  shared,
  ...props
}: RowProps<DetailRow<T>, T>) {
  const render = useStore(shared.detail ?? NO_DETAIL, (state) => state.render)
  // Named after its item: a detail row (or a table in it) that a closing
  // group takes away sends focus where its row's would go.
  const config = React.useMemo<TableRowGridProps>(
    () => ({ level: row.depth + 2, id: row.id }),
    [row.depth, row.id]
  )
  const index = shared.rowIndexOf
    ? shared.headerRows + shared.rowIndexOf(row.id) + 2
    : props["aria-rowindex"]
  return (
    <TableRowConfigContext value={config}>
      <TableRow
        {...props}
        aria-rowindex={index}
        aria-posinset={1}
        aria-setsize={1}
        data-variable-height=""
        className={cn(
          shared.virtualized ? DETAIL_STRIPE.virtualized : DETAIL_STRIPE.all,
          shared.pinned && pinnedRowClassName
        )}
      >
        <TableCell
          colSpan={shared.columnCount}
          className={cn(
            "whitespace-normal",
            shared.pinned && cellBorderClassName
          )}
        >
          <div className="grid">
            {shared.pins[0]?.side === "start" && (
              <span aria-hidden className={DETAIL_DIVIDER.start} />
            )}
            {shared.pins.at(-1)?.side === "end" && (
              <span aria-hidden className={DETAIL_DIVIDER.end} />
            )}
            <div className="relative col-start-1 row-start-1 min-w-0">
              {render?.(row.item as never)}
            </div>
          </div>
        </TableCell>
      </TableRow>
    </TableRowConfigContext>
  )
}

const DataTableItemRow = React.memo(ItemRowComponent) as typeof ItemRowComponent
const DataTableDetailRow = React.memo(
  DetailRowComponent
) as typeof DetailRowComponent
const DataTableGroupRow = React.memo(
  GroupRowComponent
) as typeof GroupRowComponent

/** The element of a body row, for `TableBody`'s render function. */
function renderRow<T>(row: BodyRow<T>, shared: RowShared<T>) {
  switch (row.kind) {
    case "item":
      return <DataTableItemRow key={row.key} row={row} shared={shared} />
    case "group":
      return <DataTableGroupRow key={row.key} row={row} shared={shared} />
    case "detail":
      // Rendered all at once, the rows after it keep their stripes' parity
      // through an empty hidden row; a virtualized body is told the parity.
      return shared.virtualized ? (
        <DataTableDetailRow key={row.key} row={row} shared={shared} />
      ) : (
        <React.Fragment key={row.key}>
          <tr hidden aria-hidden data-slot="data-table-parity" />
          <DataTableDetailRow row={row} shared={shared} />
        </React.Fragment>
      )
  }
}

export { describeRow, renderRow }
