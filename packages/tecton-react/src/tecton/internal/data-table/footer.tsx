"use client"

import * as React from "react"
import { cn } from "cn"

import { useDataTableContext, useDataTableSelector } from "./context"

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
 *
 * It is as tall as a body row of the table's `size`: a `TableCell`'s
 * padding (`py-3`, compact `py-1`) around a line of the table's text
 * (`text-sm`, compact `text-xs`), written with the same spacing and text
 * tokens (`1lh` is the band's own line, in the same text), and a row's
 * border. Controls taller than that (the compact `Select` is) make it
 * taller.
 */
const BAND = {
  default:
    "text-sm [[data-slot=data-table-content]+&]:min-h-[calc(var(--spacing)*6+1lh+1px)]",
  sm: "text-xs [[data-slot=data-table-content]+&]:min-h-[calc(var(--spacing)*2+1lh+1px)]",
} as const

function DataTableFooter({ className, ...props }: React.ComponentProps<"div">) {
  const context = useDataTableContext("DataTableFooter")
  const size = useDataTableSelector(context, (state) => state.options.size)
  return (
    <div
      data-slot="data-table-footer"
      data-size={size}
      className={cn(
        "flex flex-wrap items-center justify-end gap-x-6 gap-y-2 empty:hidden",
        BAND[size],
        // The table's last band: over the root's gap, onto the content,
        // whose bottom border its top border takes the place of.
        "[[data-slot=data-table-content]+&]:-mt-3 [[data-slot=data-table-content]+&]:rounded-b-md [[data-slot=data-table-content]+&]:border [[data-slot=data-table-content]+&]:bg-muted [[data-slot=data-table-content]+&]:px-3",
        className
      )}
      {...props}
    />
  )
}

export { DataTableFooter }
