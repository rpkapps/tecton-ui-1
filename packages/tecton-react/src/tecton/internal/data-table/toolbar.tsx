"use client"

import * as React from "react"
import { cn } from "cn"

import { useDataTableContext } from "./context"

/** The row above the table, for its search, filters and actions. */
function DataTableToolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  useDataTableContext("DataTableToolbar")
  return (
    <div
      data-slot="data-table-toolbar"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export { DataTableToolbar }
