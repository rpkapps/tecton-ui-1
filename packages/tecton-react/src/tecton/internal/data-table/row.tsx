"use client"

/**
 * The body rows: a component per row (the cells are plain calls, `cell.tsx`),
 * memoized on the engine's row object and the table's shared row state.
 * The engine keeps a row's object while nothing about the row changes, so
 * a sort, a page or another row opening renders only the rows that change;
 * a row's selection is read by its `TableRow` from the grid, so selecting a
 * row renders that row's `tr` and checkbox, not its cells.
 *
 * Each row passes the props a virtualized body gives it (`aria-rowindex`,
 * `data-index`) on to its `TableRow`, inside the `TableRowConfig` that tells
 * the grid its id, text, level and expanded state.
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
 */
import * as React from "react"
import { cn } from "cn"

import { TableCell, TableRow } from "@tecton/react/components/table"

import { createStore, useStore } from "../store"
import {
  TableRowConfig,
  type RowDescription,
  type TableRowGridProps,
} from "../table-grid"
import {
  cellBorderClassName,
  pinnedCellClassName,
  pinnedRowClassName,
  pinStyle,
  renderCell,
  rowText,
  type DetailStore,
  type RowShared,
} from "./cell"
import type { BodyRow, DetailRow, GroupRow, ItemRow } from "./engine/index"
import { DataTableRowHandle } from "./row-order"
import { DataTableSelectionCheckbox } from "./selection-checkbox"

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
        textValue: row.text,
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
  return (
    <TableRowConfig value={config}>
      <TableRow
        {...props}
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
            <DataTableSelectionCheckbox />
          </TableCell>
        )}
        {shared.columns.map((column, index) =>
          renderCell(column, index, row, shared)
        )}
      </TableRow>
    </TableRowConfig>
  )
}

/** A group's row, across every column: its value and the number of its rows. */
function GroupRowComponent<T>({
  row,
  shared,
  ...props
}: RowProps<GroupRow, T>) {
  const config = React.useMemo<TableRowGridProps>(
    () => ({ textValue: row.text, level: row.depth + 1 }),
    [row]
  )
  return (
    <TableRowConfig value={config}>
      <TableRow
        {...props}
        aria-rowindex={rowIndex(row.id, props["aria-rowindex"], shared)}
        aria-posinset={row.posinset}
        aria-setsize={row.setsize}
      >
        <TableCell
          colSpan={shared.columnCount}
          className="bg-table-header font-medium"
        >
          <span style={{ paddingInlineStart: `${row.depth * 1.25}rem` }}>
            {row.text}{" "}
            <span className="text-muted-foreground tabular-nums">
              ({row.count.toLocaleString(shared.formatter.locale)})
            </span>
          </span>
        </TableCell>
      </TableRow>
    </TableRowConfig>
  )
}

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

/** A row's detail row, across every column (see the module comment). */
function DetailRowComponent<T>({
  row,
  shared,
  ...props
}: RowProps<DetailRow<T>, T>) {
  const render = useStore(shared.detail ?? NO_DETAIL, (state) => state.render)
  const config = React.useMemo<TableRowGridProps>(
    () => ({ level: row.depth + 2 }),
    [row.depth]
  )
  const index = shared.rowIndexOf
    ? shared.headerRows + shared.rowIndexOf(row.id) + 2
    : props["aria-rowindex"]
  return (
    <TableRowConfig value={config}>
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
          {render?.(row.item as never)}
        </TableCell>
      </TableRow>
    </TableRowConfig>
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
