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
 * The selection column's header holds the select-all checkbox in the last
 * row (a cell named "Select" above it, and in its place for single
 * selection), so every header row has the same columns for the grid to
 * move through. Placeholders are named after the columns below them.
 */
import * as React from "react"
import { cn } from "cn"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

import { useTranslations, type Translator } from "../i18n/translations"
import { announce } from "../primitives/live-announcer"
import { columnClassName } from "./cell"
import type { DataTableContextValue, DataTableSelectionMode } from "./context"
import {
  getColumnModel,
  toggleSorting,
  type ColumnLayout,
  type DataTableColumns,
  type DataTableSort,
  type EngineColumn,
} from "./engine/index"
import { DataTableSelectionCheckbox } from "./selection-checkbox"

/** Where a sort button's negative margin goes: to the edge its text sits on. */
const BUTTON_EDGE = {
  start: "-ms-2",
  center: undefined,
  end: "-me-2 flex-row-reverse",
} as const

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

function DataTableColumnHeader<T>({
  column,
  sorting,
  sortable,
  size,
  context,
}: {
  column: EngineColumn<T>
  sorting: ReadonlyArray<DataTableSort>
  sortable: boolean
  size: "default" | "sm"
  context: DataTableContextValue<T>
}) {
  const t = useTranslations("dataTable")
  const index = sorting.findIndex((sort) => sort.column === column.id)
  const direction = index === -1 ? null : sorting[index].direction
  const canSort = sortable && column.sortable
  const multi = sorting.length > 1 && index !== -1
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
  return (
    <TableHead
      scope="col"
      // The column's name in announcements, whatever the header draws.
      aria-label={column.header}
      aria-sort={
        canSort ? ((index === 0 ? direction : null) ?? "none") : undefined
      }
      className={columnClassName(column)}
    >
      {canSort ? (
        <Button
          variant="ghost"
          // The sizes whose text is the header's own (`text-sm`, and
          // `text-xs` in a small table), so every label matches.
          size={size === "sm" ? "xs" : "default"}
          data-slot="data-table-sort-button"
          className={BUTTON_EDGE[column.align]}
          onClick={press}
        >
          {label}
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
                {index + 1}
              </span>
            )}
          </span>
          {multi && (
            <span className="sr-only">
              {direction === "ascending"
                ? t("sortPositionAscending", {
                    position: index + 1,
                    total: sorting.length,
                  })
                : t("sortPositionDescending", {
                    position: index + 1,
                    total: sorting.length,
                  })}
            </span>
          )}
        </Button>
      ) : (
        label
      )}
    </TableHead>
  )
}

function DataTableHeader<T>({
  context,
  columns,
  layout,
  sorting,
  sortable,
  selectionMode,
  size,
}: {
  context: DataTableContextValue<T>
  columns: DataTableColumns<T>
  layout: ColumnLayout<T>
  sorting: ReadonlyArray<DataTableSort>
  sortable: boolean
  selectionMode: DataTableSelectionMode
  size: "default" | "sm"
}) {
  const t = useTranslations("table")
  const { byId, groups } = getColumnModel(columns)
  const last = layout.headerRows.length - 1
  // Cells with nothing to show are still named for the grid's keyboard,
  // which stops on every header cell.
  const selectColumn = <span className="sr-only">{t("select")}</span>
  return (
    <TableHeader>
      {layout.headerRows.map((row) => (
        <TableRow key={row.key}>
          {selectionMode !== "none" && (
            <TableHead className={cn(row.level === last && "w-px")}>
              {row.level === last && selectionMode === "multiple" ? (
                <DataTableSelectionCheckbox />
              ) : (
                selectColumn
              )}
            </TableHead>
          )}
          {row.cells.map((cell) => {
            const column = cell.id === null ? undefined : byId.get(cell.id)
            if (cell.kind === "column" && column)
              return (
                <DataTableColumnHeader
                  key={cell.key}
                  column={column}
                  sorting={sorting}
                  sortable={sortable}
                  size={size}
                  context={context}
                />
              )
            return (
              <TableHead
                key={cell.key}
                colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                scope={cell.kind === "group" ? "colgroup" : undefined}
              >
                {cell.kind === "group" && cell.id !== null ? (
                  groups.get(cell.id)?.header
                ) : (
                  // Above columns in fewer groups: named after them.
                  <span className="sr-only">
                    {cell.columns
                      .map((id) => byId.get(id)?.header ?? id)
                      .join(", ")}
                  </span>
                )}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
}

export { DataTableHeader }
