"use client"

/**
 * The totals row (`DataTableContent totals`): a footer row with each
 * aggregate column's aggregate (§4.1: sums of numbers, counts of booleans,
 * or the column's own `aggregate`) over every row the view matches, on
 * every page (a tree's matching leaves; in server mode, the loaded rows),
 * drawn by `renderAggregate` or formatted as the column. "Total" names the
 * row, in the row header column or the first column without an aggregate.
 *
 * It is a row of the grid (reached by Up / Down from a cell), sticks to the
 * bottom of a virtualized table, and its pinned cells stick with the
 * others' on the row's own opaque fill.
 */
import * as React from "react"
import { cn } from "cn"

import {
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@tecton/react/components/table"

import { useTranslations } from "../i18n/translations"
import {
  columnClassName,
  pinnedCellClassName,
  pinEdgeClassName,
  pinStyle,
  type RowShared,
} from "./cell"
import type { DataTableRowModel, EngineColumn } from "./engine/index"

/** Each totals cell draws the row's top border, in either border model. */
const TOTALS_CELL = "border-t border-border-subtle"

function DataTableTotals<T>({
  model,
  shared,
  virtualized,
  rowIndex,
}: {
  model: DataTableRowModel<T>
  shared: RowShared<T>
  virtualized: boolean
  /** The row's `aria-rowindex`, when the table counts its rows. */
  rowIndex: number | undefined
}) {
  const t = useTranslations("dataTable")
  const totals = model.totals()
  const { columns, formatter } = shared
  // Named in the row header column, or the first that sums nothing.
  const label =
    shared.rowHeader && !shared.rowHeader.aggregate
      ? shared.rowHeader
      : columns.find((column) => !column.aggregate)
  const content = (column: EngineColumn<T>) => {
    if (!column.aggregate) return null
    const value = totals.aggregates[column.id]
    const { renderAggregate } = column.definition
    return renderAggregate
      ? renderAggregate(value, { items: totals.items })
      : formatter.formatAggregate(column, value)
  }
  const controlCell = (pin: RowShared<T>["handlePin"]) => (
    <TableCell
      className={cn(TOTALS_CELL, pin && pinnedCellClassName)}
      style={pin && pinStyle(pin)}
    />
  )
  return (
    <TableFooter
      data-slot="data-table-totals"
      className={cn(virtualized && "sticky bottom-0 z-10")}
    >
      <TableRow
        aria-rowindex={rowIndex}
        className="bg-muted font-medium text-foreground"
      >
        {shared.handle && controlCell(shared.handlePin)}
        {shared.selection && controlCell(shared.selectionPin)}
        {columns.map((column, index) => {
          const pin = shared.pins[index]
          const className = cn(
            columnClassName(column),
            column.type === "number" && "tabular-nums",
            TOTALS_CELL,
            pin && pinnedCellClassName,
            pinEdgeClassName(pin)
          )
          const style = pin && pinStyle(pin)
          if (column === label)
            return (
              <TableHead
                key={column.id}
                scope="row"
                className={cn(className, "[&[scope=row]]:font-medium")}
                style={style}
              >
                {t("total")}
              </TableHead>
            )
          return (
            <TableCell key={column.id} className={className} style={style}>
              {index === 0 && !label && (
                <span className="sr-only">{t("total")}</span>
              )}
              {content(column)}
            </TableCell>
          )
        })}
      </TableRow>
    </TableFooter>
  )
}

export { DataTableTotals }
