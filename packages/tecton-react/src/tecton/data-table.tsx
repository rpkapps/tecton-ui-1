"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

/**
 * Tecton DataTable — dense, sortable, selectable data grid.
 * State lives in `@tanstack/react-table` (v9 feature API); rendering,
 * keyboard navigation, selection and sort affordances come from the shadcn
 * React Aria `Table` primitives. Tecton semantics: emphasised header row,
 * alternating rows, medium/small density, a compact small-screen layout
 * and a pagination footer.
 */
const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

type DataTableFeatures = typeof dataTableFeatures

type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>

/** Typed column helper bound to the DataTable feature set. */
function createDataTableColumns<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

const dataTableVariants = cva("", {
  variants: {
    density: {
      md: "[--dt-row-h:2.75rem] [--dt-px:0.75rem] text-sm",
      sm: "[--dt-row-h:2.25rem] [--dt-px:0.5rem] text-xs",
    },
  },
  defaultVariants: {
    density: "md",
  },
})

type DataTableProps<TData extends RowData> = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof dataTableVariants> & {
    columns: DataTableColumnDef<TData, any>[]
    data: TData[]
    /** Accessible name of the grid. */
    label?: string
    /** Alternate row shading (`--surface-alt`). */
    alternateRows?: boolean
    /** Adds a leading checkbox column and enables multi-row selection. */
    enableSelection?: boolean
    /** Page size; omit to disable pagination. */
    pageSize?: number
    pageSizeOptions?: number[]
    /** Stack cells on narrow viewports. */
    smallScreen?: boolean
    emptyMessage?: React.ReactNode
    /** Extra content in the footer (left side). */
    footer?: React.ReactNode
    getRowId?: (row: TData, index: number) => string
    onRowSelectionChange?: (selection: RowSelectionState) => void
    onSortingChange?: (sorting: SortingState) => void
    /** Row action, fired on double click / Enter (React Aria `onAction`). */
    onRowAction?: (rowId: string, row: TData) => void
  }

function DataTable<TData extends RowData>({
  className,
  density = "md",
  columns,
  data,
  label = "Data table",
  alternateRows = true,
  enableSelection = false,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  smallScreen = false,
  emptyMessage = "No results.",
  footer,
  getRowId,
  onRowSelectionChange,
  onSortingChange,
  onRowAction,
  ...props
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize ?? Math.max(1, data.length),
  })

  React.useEffect(() => {
    onRowSelectionChange?.(rowSelection)
  }, [rowSelection, onRowSelectionChange])

  React.useEffect(() => {
    onSortingChange?.(sorting)
  }, [sorting, onSortingChange])

  const allColumns = React.useMemo(() => {
    if (!enableSelection) return columns
    const helper = createColumnHelper<DataTableFeatures, TData>()
    const selectColumn = helper.display({
      id: "__select",
      header: () => <Checkbox slot="selection" aria-label="Select all rows" />,
      cell: () => <Checkbox slot="selection" aria-label="Select row" />,
      enableSorting: false,
    })
    return [selectColumn, ...columns] as DataTableColumnDef<TData, any>[]
  }, [columns, enableSelection])

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: allColumns,
    getRowId,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
  })

  const rows = table.getRowModel().rows
  const paginated = typeof pageSize === "number"
  const rowById = React.useMemo(
    () => new Map(rows.map((row) => [row.id, row.original])),
    [rows]
  )

  return (
    <div
      data-slot="data-table"
      data-density={density}
      data-small-screen={smallScreen ? "true" : undefined}
      className={cn(
        "group/data-table flex w-full flex-col overflow-hidden rounded-md border",
        dataTableVariants({ density }),
        className
      )}
      {...props}
    >
      <Table
        aria-label={label}
        selectionMode={enableSelection ? "multiple" : "none"}
        selectedKeys={
          enableSelection
            ? table.getSelectedRowModel().rows.map((row) => row.id)
            : undefined
        }
        onSelectionChange={
          enableSelection
            ? (selection) => {
                if (selection === "all") {
                  table.toggleAllRowsSelected(true)
                } else {
                  table.setRowSelection(
                    Object.fromEntries(
                      [...selection].map((key) => [String(key), true])
                    )
                  )
                }
              }
            : undefined
        }
        sortDescriptor={
          sorting.length
            ? {
                column: sorting[0].id,
                direction: sorting[0].desc ? "descending" : "ascending",
              }
            : undefined
        }
        onSortChange={(descriptor) =>
          table.setSorting([
            {
              id: String(descriptor.column),
              desc: descriptor.direction === "descending",
            },
          ])
        }
      >
        <TableHeader
          className={cn(
            "bg-accent [&_tr]:border-border-subtle",
            smallScreen && "max-md:sr-only"
          )}
        >
          {table.getFlatHeaders().map((header, index) => (
            <TableHead
              key={header.id}
              id={header.id}
              isRowHeader={index === (enableSelection ? 1 : 0)}
              allowsSorting={header.column.getCanSort()}
              className={cn(
                "h-(--dt-row-h) px-(--dt-px) text-xs font-medium text-accent-foreground",
                header.column.id === "__select" && "w-10"
              )}
            >
              {header.isPlaceholder ? null : (
                <table.FlexRender header={header} />
              )}
            </TableHead>
          ))}
        </TableHeader>
        <TableBody
          renderEmptyState={() => (
            <div className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </div>
          )}
          className={cn(
            "[&_tr]:border-border-subtle",
            alternateRows && "[&_tr:nth-child(even)]:bg-surface-alt/60",
            smallScreen &&
              "max-md:[&_td]:flex max-md:[&_td]:h-auto max-md:[&_td]:justify-between max-md:[&_td]:py-1.5 max-md:[&_td]:before:text-muted-foreground max-md:[&_td]:before:content-[attr(data-label)] max-md:[&_tr]:flex max-md:[&_tr]:flex-col max-md:[&_tr]:py-2"
          )}
        >
          {rows.map((row) => (
            <TableRow
              key={row.id}
              id={row.id}
              onAction={
                onRowAction
                  ? () => onRowAction(row.id, rowById.get(row.id) as TData)
                  : undefined
              }
              className="hover:bg-accent/60 data-selected:bg-accent"
            >
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  data-label={
                    typeof cell.column.columnDef.header === "string"
                      ? cell.column.columnDef.header
                      : undefined
                  }
                  className={cn(
                    "h-(--dt-row-h) px-(--dt-px)",
                    cell.column.id === "__select" && "w-10"
                  )}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {(paginated || footer || enableSelection) && (
        <div
          data-slot="data-table-footer"
          className="flex items-center justify-between gap-3 border-t bg-muted/60 px-(--dt-px) py-1.5 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            {enableSelection && (
              <span className="tabular-nums">
                {table.getSelectedRowModel().rows.length} of{" "}
                {table.getPrePaginatedRowModel().rows.length} selected
              </span>
            )}
            {footer}
          </div>
          {paginated && (
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Rows per page</span>
                <Select
                  aria-label="Rows per page"
                  selectedKey={String(pagination.pageSize)}
                  onSelectionChange={(key) =>
                    table.setPageSize(Number(key as string))
                  }
                >
                  <SelectTrigger size="sm" className="h-7 w-18 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem
                        key={size}
                        id={String(size)}
                        textValue={String(size)}
                      >
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="tabular-nums">
                Page {pagination.pageIndex + 1} of{" "}
                {Math.max(1, table.getPageCount())}
              </span>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Previous page"
                  onPress={() => table.previousPage()}
                  isDisabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Next page"
                  onPress={() => table.nextPage()}
                  isDisabled={!table.getCanNextPage()}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { DataTable, createDataTableColumns, dataTableFeatures, dataTableVariants }
export type {
  DataTableProps,
  DataTableColumnDef,
  DataTableFeatures,
  SortingState,
  RowSelectionState,
}
