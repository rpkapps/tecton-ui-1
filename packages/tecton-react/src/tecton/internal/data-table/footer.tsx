"use client"

import * as React from "react"
import { cn } from "cn"

import { useDataTableContext } from "./context"

/**
 * The row below the table, for the selection count and the page parts: the
 * count at the start, the rest at the end.
 */
function DataTableFooter({ className, ...props }: React.ComponentProps<"div">) {
  useDataTableContext("DataTableFooter")
  return (
    <div
      data-slot="data-table-footer"
      className={cn(
        "flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm",
        className
      )}
      {...props}
    />
  )
}

export { DataTableFooter }
