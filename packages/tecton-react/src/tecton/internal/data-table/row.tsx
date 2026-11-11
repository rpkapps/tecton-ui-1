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
 */
import * as React from "react"

import { TableCell, TableRow } from "@tecton/react/components/table"

import {
  TableRowConfig,
  type RowDescription,
  type TableRowGridProps,
} from "../table-grid"
import { renderCell, rowText, type RowShared } from "./cell"
import type { BodyRow, GroupRow, ItemRow } from "./engine/index"
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
        level: undefined,
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
        aria-rowindex={rowIndex(row.id, props["aria-rowindex"], shared)}
        aria-posinset={shared.levelled ? row.posinset : undefined}
        aria-setsize={shared.levelled ? row.setsize : undefined}
      >
        {shared.selection && (
          <TableCell className="w-px">
            <DataTableSelectionCheckbox />
          </TableCell>
        )}
        {shared.columns.map((column) => renderCell(column, row, shared))}
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

const DataTableItemRow = React.memo(ItemRowComponent) as typeof ItemRowComponent
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
      return null
  }
}

export { describeRow, renderRow }
