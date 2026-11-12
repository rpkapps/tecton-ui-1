"use client"

import * as React from "react"
import { cn } from "cn"
import {
  DatabaseIcon,
  DownloadIcon,
  FolderPlusIcon,
  PlusIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@tecton/react/components/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"
import {
  createColumns,
  DataTable,
  DataTableActionBar,
  DataTableContent,
  DataTableFooter,
  DataTablePagination,
  DataTableRowActions,
} from "@tecton/react/tecton/data-table"
import { OverflowItem, OverflowLabel } from "@tecton/react/tecton/overflow"

import { statusMeta, typeMeta } from "../data"
import type { Well, WellStatus } from "../data"

const statusOptions = (Object.keys(statusMeta) as WellStatus[]).map(
  (status) => ({
    value: status,
    label: statusMeta[status].label,
    variant: statusMeta[status].color,
  })
)

/** Numbers and dates in the reader's locale, set in mono like the well names. */
function mono(_: Well, { text }: { text: string }) {
  return <span className="font-mono tabular-nums">{text}</span>
}

function createWellColumns(onOpen?: (well: Well) => void) {
  return createColumns<Well>([
    {
      id: "name",
      header: "Well",
      cell: (well) => (
        <span className="font-mono font-medium tabular-nums">{well.name}</span>
      ),
    },
    { id: "field", header: "Field", hideBelow: "sm" },
    {
      id: "type",
      header: "Type",
      accessor: (well) => typeMeta[well.type],
      hideBelow: "md",
    },
    { id: "status", header: "Status", type: "options", options: statusOptions },
    { id: "td", header: "TD (m MD)", type: "number", cell: mono },
    {
      id: "spud",
      header: "Spud",
      type: "date",
      // The ISO date is a calendar day: read and shown in UTC.
      accessor: (well) => new Date(`${well.spud}T00:00:00Z`),
      format: {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      },
      cell: mono,
      hideBelow: "lg",
    },
    { id: "rig", header: "Rig", hideBelow: "lg" },
    {
      id: "actions",
      header: "Actions",
      renderHeader: () => <span className="sr-only">Actions</span>,
      align: "end",
      sortable: false,
      hideable: false,
      cell: (well) => (
        <DataTableRowActions aria-label={`Actions for ${well.name}`}>
          <DropdownMenuItem onClick={() => onOpen?.(well)}>
            Open
          </DropdownMenuItem>
          <DropdownMenuItem>Add to project</DropdownMenuItem>
          <DropdownMenuItem>Export logs</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
        </DataTableRowActions>
      ),
    },
  ])
}

const pageSizeOptions = [10, 25, 50, 100]

type WellsTableProps = Omit<React.ComponentProps<"div">, "defaultValue"> & {
  data: Well[]
  onOpen?: ((well: Well) => void) | undefined
  /** Rows per page at first; the reader changes it in the footer. */
  pageSize?: number
  /** Called with the ids of the selected wells. */
  onSelectionChange?: (ids: ReadonlyArray<string>) => void
}

/**
 * Paginated, sortable, selectable wells table on `DataTable`. A header
 * sorts its column, a row's checkbox selects it, and Enter, a double
 * click or a click while nothing is selected opens the well; the row's
 * actions menu opens it too. While wells are selected, an action bar
 * offers to add them to a project or export their logs. On narrow
 * viewports the less important columns hide.
 */
function WellsTable({
  className,
  data,
  onOpen,
  pageSize = 10,
  onSelectionChange,
  ...props
}: WellsTableProps) {
  const columns = React.useMemo(() => createWellColumns(onOpen), [onOpen])

  return (
    <DataTable
      items={data}
      columns={columns}
      selectionMode="multiple"
      pagination
      defaultPageSize={pageSize}
      pageSizes={pageSizeOptions}
      striped
      {...(onSelectionChange === undefined
        ? {}
        : { onValueChange: (ids) => onSelectionChange(ids) })}
      {...(onOpen === undefined
        ? {}
        : { onActivate: (_: string, well: Well) => onOpen(well) })}
      className={cn("w-full", className)}
      {...props}
    >
      <DataTableActionBar aria-label="Selected wells">
        <OverflowItem
          value="project"
          label="Add to project"
          icon={<FolderPlusIcon />}
        >
          <Button variant="outline" size="sm">
            <FolderPlusIcon data-icon="inline-start" />
            <OverflowLabel>Add to project</OverflowLabel>
          </Button>
        </OverflowItem>
        <OverflowItem
          value="export"
          label="Export logs"
          icon={<DownloadIcon />}
        >
          <Button variant="outline" size="sm">
            <DownloadIcon data-icon="inline-start" />
            <OverflowLabel>Export logs</OverflowLabel>
          </Button>
        </OverflowItem>
      </DataTableActionBar>
      <DataTableContent aria-label="Wells" />
      <DataTableFooter>
        <DataTablePagination />
      </DataTableFooter>
    </DataTable>
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
      className={cn(
        "rounded-md border border-dashed border-border bg-card/50",
        className
      )}
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
          <Button
            variant="outline"
            size="sm"
            {...(onClear === undefined ? {} : { onClick: onClear })}
          >
            Clear filters
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm">
              Import
            </Button>
            <Button
              size="sm"
              {...(onCreate === undefined ? {} : { onClick: onCreate })}
            >
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
