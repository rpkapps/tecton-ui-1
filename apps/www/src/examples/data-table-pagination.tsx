"use client"

import * as React from "react"
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { PaginationState } from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon } from "@tecton/react/icons"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
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

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
  depth: number
  operator: string
}

const fields = ["Gullfaks", "Statfjord", "Snorre", "Visund"]
const statuses = ["Producing", "Producing", "Shut in", "Drilling"] as const
const wells: Well[] = Array.from({ length: 23 }, (_, i) => ({
  id: `w${i + 1}`,
  name: `34/10-${String.fromCharCode(65 + (i % 6))}-${i + 1}`,
  field: fields[i % fields.length],
  status: statuses[(i * 7) % statuses.length],
  depth: 1800 + ((i * 137) % 2200),
  operator: i % 5 === 4 ? "Petoro" : "Equinor",
}))

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Well" }),
  columnHelper.accessor("field", { header: "Field" }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={statusVariant[getValue()]} appearance="outline">
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("depth", {
    header: () => <div className="text-right">TD (m)</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-mono tabular-nums">
        {getValue().toLocaleString("en-US")}
      </div>
    ),
  }),
  columnHelper.accessor("operator", { header: "Operator" }),
])

const pageSizes = [5, 10, 25]

export default function DataTablePagination() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
  })

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Wells">
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 0}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableHeader>
          <TableBody renderEmptyState={() => "No wells."}>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-muted-foreground">
        <span className="mr-auto tabular-nums">{wells.length} wells</span>
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            aria-label="Rows per page"
            selectedKey={String(pagination.pageSize)}
            onSelectionChange={(key) => table.setPageSize(Number(key))}
          >
            <SelectTrigger size="sm" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
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
          Page {pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            onPress={() => table.previousPage()}
            isDisabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            onPress={() => table.nextPage()}
            isDisabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
