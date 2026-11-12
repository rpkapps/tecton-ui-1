"use client"

import * as React from "react"
import { cn } from "cn"

import { useDataTableContext } from "./context"

/**
 * The row below the table, for `DataTablePagination` and the caller's own
 * parts, at the end.
 *
 * Right after `DataTableContent` it is the table's last band: inside the
 * table's border, on the totals row's fill, under the rows (and outside
 * their scroll area, so a virtualized table's rows scroll above it), the
 * table's bottom corners its own. Anywhere else (after another footer, for
 * parts that belong under the table rather than in it) it is a plain row.
 * Empty (its pagination off), it takes no room.
 */
function DataTableFooter({ className, ...props }: React.ComponentProps<"div">) {
  useDataTableContext("DataTableFooter")
  return (
    <div
      data-slot="data-table-footer"
      className={cn(
        "flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm empty:hidden",
        // The table's last band: over the root's gap, onto the content,
        // whose bottom border its top border takes the place of.
        "[[data-slot=data-table-content]+&]:-mt-3 [[data-slot=data-table-content]+&]:min-h-12 [[data-slot=data-table-content]+&]:rounded-b-md [[data-slot=data-table-content]+&]:border [[data-slot=data-table-content]+&]:bg-muted [[data-slot=data-table-content]+&]:px-3 [[data-slot=data-table-content]+&]:py-1.5",
        className
      )}
      {...props}
    />
  )
}

export { DataTableFooter }
