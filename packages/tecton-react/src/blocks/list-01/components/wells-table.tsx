"use client"

import * as React from "react"
import { cn } from "cn"
import { DatabaseIcon, MoreVerticalIcon, PlusIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"
import { Chip } from "@tecton/react/tecton/chip"
import {
  createDataTableColumns,
  DataTable,
} from "@tecton/react/tecton/data-table"

import { formatDate, statusMeta, typeMeta, type Well } from "../data"

const columns = createDataTableColumns<Well>()

function createWellColumns(onOpen?: (well: Well) => void) {
  return [
    columns.accessor("name", {
      header: "Well",
      cell: ({ getValue }) => (
        <span className="font-mono font-medium tabular-nums">{getValue()}</span>
      ),
    }),
    columns.accessor("field", { header: "Field" }),
    columns.accessor("type", {
      header: "Type",
      cell: ({ getValue }) => typeMeta[getValue()],
    }),
    columns.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => {
        const meta = statusMeta[getValue()]
        return (
          <Chip size="xs" color={meta.color} variant="outlined">
            {meta.label}
          </Chip>
        )
      },
    }),
    columns.accessor("td", {
      header: "TD (m MD)",
      cell: ({ getValue }) => (
        <span className="block text-right font-mono tabular-nums">
          {getValue().toLocaleString()}
        </span>
      ),
    }),
    columns.accessor("spud", {
      header: "Spud",
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">{formatDate(getValue())}</span>
      ),
    }),
    columns.accessor("rig", { header: "Rig" }),
    columns.display({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex justify-end">
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${row.original.name}`}>
              <MoreVerticalIcon />
            </Button>
            <DropdownMenu placement="bottom end">
              <DropdownMenuItem onAction={() => onOpen?.(row.original)}>Open</DropdownMenuItem>
              <DropdownMenuItem>Add to project</DropdownMenuItem>
              <DropdownMenuItem>Export logs</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </span>
      ),
    }),
  ]
}

type WellsTableProps = Omit<
  React.ComponentProps<typeof DataTable<Well>>,
  "columns" | "data"
> & {
  data: Well[]
  onOpen?: (well: Well) => void
}

function WellsTable({ className, data, onOpen, ...props }: WellsTableProps) {
  const wellColumns = React.useMemo(() => createWellColumns(onOpen), [onOpen])
  return (
    <DataTable
      data-slot="wells-table"
      label="Wells"
      className={cn("bg-card", className)}
      columns={wellColumns}
      data={data}
      pageSize={10}
      enableSelection
      smallScreen
      getRowId={(row) => row.id}
      onRowAction={(_, row) => onOpen?.(row)}
      {...props}
    />
  )
}

type WellsEmptyStateProps = React.ComponentProps<typeof Empty> & {
  /** True when a filter is active (offers "clear filters" instead of "add well"). */
  filtered?: boolean
  onClear?: () => void
  onCreate?: () => void
}

function WellsEmptyState({
  className,
  filtered = false,
  onClear,
  onCreate,
  ...props
}: WellsEmptyStateProps) {
  return (
    <Empty
      data-slot="wells-empty-state"
      className={cn("rounded-md border border-dashed border-border bg-card/50", className)}
      {...props}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <DatabaseIcon />
        </EmptyMedia>
        <EmptyTitle>{filtered ? "No wells match" : "No wells yet"}</EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Try a different search term, or clear the field, type and status filters."
            : "Import wells from the corporate database or create the first planned well."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        {filtered ? (
          <Button variant="outline" size="sm" onPress={onClear}>
            Clear filters
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm">
              Import
            </Button>
            <Button size="sm" onPress={onCreate}>
              <PlusIcon /> New well
            </Button>
          </>
        )}
      </EmptyContent>
    </Empty>
  )
}

export { WellsTable, WellsEmptyState, createWellColumns }
export type { WellsTableProps, WellsEmptyStateProps }
