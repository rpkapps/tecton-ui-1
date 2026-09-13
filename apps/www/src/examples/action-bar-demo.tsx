"use client"

import * as React from "react"
import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { RowSelectionState } from "@tanstack/react-table"
import {
  ArchiveIcon,
  DownloadIcon,
  TagIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import { Input } from "@tecton/react/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"
import {
  ActionBar,
  ActionBarActions,
  ActionBarSelection,
} from "@tecton/react/tecton/action-bar"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
} from "@tecton/react/tecton/overflow"

type Well = {
  id: string
  name: string
  field: string
  status: "Producing" | "Shut in" | "Drilling"
}

const wells: Well[] = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", status: "Producing" },
  { id: "b3", name: "34/10-B-3", field: "Gullfaks", status: "Shut in" },
  { id: "c7", name: "33/9-C-7", field: "Statfjord", status: "Drilling" },
  { id: "d2", name: "34/7-D-2", field: "Snorre", status: "Producing" },
  { id: "e9", name: "34/7-E-9", field: "Snorre", status: "Shut in" },
]

const statusVariant = {
  Producing: "success",
  "Shut in": "warning",
  Drilling: "info",
} as const

const features = tableFeatures({ rowSelectionFeature })
const columnHelper = createColumnHelper<typeof features, Well>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: () => <Checkbox slot="selection" aria-label="Select all wells" />,
    cell: () => <Checkbox slot="selection" aria-label="Select well" />,
  }),
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
])

export default function ActionBarDemo() {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({
    a12: true,
    c7: true,
  })
  const table = useTable({
    features,
    data: wells,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })
  const selected = table.getSelectedRowModel().rows.length
  const clear = () => table.resetRowSelection(true)

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {/* The table toolbar; the action bar replaces it while rows are selected. */}
      <div className="grid min-h-11 items-center">
        {selected > 0 ? (
          <ActionBar
            placement="toolbar"
            aria-label="Selected wells"
            onDismiss={clear}
          >
            <ActionBarSelection
              count={selected}
              total={wells.length}
              onClear={clear}
            />
            <ActionBarActions aria-label="Selection actions">
              <OverflowItem
                id="assign"
                label="Assign"
                icon={<UserPlusIcon />}
                priority={2}
              >
                <Button variant="outline" size="sm">
                  <UserPlusIcon data-icon="inline-start" />
                  <OverflowLabel>Assign</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem
                id="tag"
                label="Add tag"
                icon={<TagIcon />}
                priority={1}
              >
                <Button variant="outline" size="sm">
                  <TagIcon data-icon="inline-start" />
                  <OverflowLabel>Add tag</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem id="export" label="Export" icon={<DownloadIcon />}>
                <Button variant="outline" size="sm">
                  <DownloadIcon data-icon="inline-start" />
                  <OverflowLabel>Export</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowItem id="archive" label="Archive" icon={<ArchiveIcon />}>
                <Button variant="outline" size="sm">
                  <ArchiveIcon data-icon="inline-start" />
                  <OverflowLabel>Archive</OverflowLabel>
                </Button>
              </OverflowItem>
              <OverflowDivider />
              <OverflowItem
                id="delete"
                label="Delete"
                icon={<Trash2Icon />}
                variant="destructive"
                labelBehavior="keep"
              >
                <Button variant="destructive" size="sm">
                  <Trash2Icon data-icon="inline-start" />
                  Delete
                </Button>
              </OverflowItem>
            </ActionBarActions>
          </ActionBar>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              aria-label="Filter wells"
              placeholder="Filter wells"
              className="max-w-56"
            />
            <Button variant="outline" size="sm" className="ms-auto">
              New well
            </Button>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table
          aria-label="Wells"
          selectionMode="multiple"
          selectedKeys={table.getSelectedRowModel().rows.map((row) => row.id)}
          onSelectionChange={(selection) => {
            if (selection === "all") {
              table.toggleAllRowsSelected(true)
            } else {
              table.setRowSelection(
                Object.fromEntries([...selection].map((key) => [key, true]))
              )
            }
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableHead
                key={header.id}
                id={header.id}
                isRowHeader={header.index === 1}
                className={header.column.id === "select" ? "w-10" : undefined}
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
    </div>
  )
}
