"use client"

import * as React from "react"
import { cn } from "cn"

import {
  TableGridProvider,
  useTableContainer,
  useTableGrid,
  useTableRow,
} from "../tecton/internal/table-grid"
import {
  TableVirtualProvider,
  useTableVirtualized,
  useTableVirtualizer,
  useVirtualRows,
  type TableBodyRowsProps,
} from "../tecton/internal/table-virtualizer"

function Table({
  className,
  size = "default",
  striped = false,
  virtualized = false,
  ...props
}: React.ComponentProps<"table"> & {
  /** `sm` is compact: shorter header and rows, smaller text. */
  size?: "default" | "sm"
  /** Every even body row on an alternate surface. */
  striped?: boolean
  /**
   * Renders only the rows in view. The table fills and scrolls in its
   * parent, which needs a bounded height; rows are one height and the
   * header sticks to the top.
   */
  virtualized?: boolean
}) {
  const virtual = useTableVirtualizer(virtualized)
  const grid = useTableGrid(props)
  const container = useTableContainer(virtual.containerRef)
  return (
    <div
      data-slot="table-container"
      ref={container.ref}
      style={container.style}
      className={cn(
        "relative w-full overflow-x-auto",
        virtualized && "h-full overflow-auto",
        container.className
      )}
    >
      <table
        data-slot="table"
        data-size={size}
        data-striped={striped ? "" : undefined}
        aria-rowcount={virtual.rowCount}
        className={cn(
          "w-full caption-bottom text-sm data-[size=sm]:text-xs",
          virtual.tableClassName,
          className
        )}
        {...grid.props}
      >
        {virtual.colgroup}
        <TableGridProvider value={grid.context}>
          <TableVirtualProvider value={virtual.context}>
            {props.children}
          </TableVirtualProvider>
        </TableGridProvider>
      </table>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  const virtualized = useTableVirtualized()
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b-0",
        virtualized && "sticky top-0 z-10",
        className
      )}
      {...props}
    />
  )
}

/**
 * The rows: `TableRow` elements, or `items` and a render function
 * `(item, index) => <TableRow …>`, which a virtualized table calls only for
 * the rows in view.
 */
function TableBody<T>({ className, ...props }: TableBodyRowsProps<T>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...useVirtualRows(props)}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t-0 bg-muted font-normal text-muted-foreground [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "data-[state=selected]:bg-table-active data-selected:bg-table-active border-border-subtle [&:where([data-striped]>tbody>:nth-child(even):not([data-selected=true],[data-state=selected]))]:bg-surface-alt border-b transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring has-aria-expanded:bg-muted/50 data-disabled:text-muted-foreground",
        className
      )}
      {...useTableRow(props)}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "bg-table-header h-12 px-4 text-start align-middle font-medium whitespace-nowrap text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&:has([role=checkbox])]:pe-0 [&[scope=row]]:h-auto [&[scope=row]]:bg-transparent [&[scope=row]]:py-3 [&[scope=row]]:font-normal [&[scope=row]]:text-inherit [:where([data-size=sm]>*>tr)>&]:h-8 [:where([data-size=sm]>*>tr)>&[scope=row]]:py-1",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&:has([role=checkbox])]:pe-0 [:where([data-size=sm]>*>tr)>&]:py-1",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
