"use client"

import * as React from "react"
import { cn } from "cn"

import {
  TableVirtualProvider,
  useTableVirtualized,
  useTableVirtualizer,
  useVirtualRows,
  type TableBodyRowsProps,
} from "../tecton/internal/table-virtualizer"

function Table({
  className,
  virtualized = false,
  ...props
}: React.ComponentProps<"table"> & {
  /**
   * Renders only the rows in view. The table fills and scrolls in its
   * parent, which needs a bounded height; rows are one height and the
   * header sticks to the top.
   */
  virtualized?: boolean
}) {
  const virtual = useTableVirtualizer(virtualized)
  return (
    <div
      data-slot="table-container"
      ref={virtual.containerRef}
      className={cn(
        "relative w-full overflow-x-auto",
        virtualized && "h-full overflow-auto"
      )}
    >
      <table
        data-slot="table"
        aria-rowcount={virtual.rowCount}
        className={cn(
          "w-full caption-bottom text-sm",
          virtual.tableClassName,
          className
        )}
        {...props}
      >
        {virtual.colgroup}
        <TableVirtualProvider value={virtual.context}>
          {props.children}
        </TableVirtualProvider>
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
        "data-[state=selected]:bg-table-active border-border-subtle border-b transition-colors hover:bg-accent has-aria-expanded:bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "bg-table-header h-12 px-4 text-start align-middle font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pe-0",
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
        "px-4 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0",
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
