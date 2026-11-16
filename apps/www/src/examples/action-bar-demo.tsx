"use client"

import {
  ArchiveIcon,
  DownloadIcon,
  TagIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"

import { Button } from "@tecton/react/button"
import {
  ActionBar,
  ActionBarActions,
  ActionBarSelection,
} from "@tecton/react/action-bar"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableSearch,
  DataTableToolbar,
  useDataTable,
} from "@tecton/react/data-table"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
  OverflowSpacer,
} from "@tecton/react/overflow"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "drilling"
}

const wells: Well[] = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", status: "producing" },
  { id: "b3", name: "34/10-B-3", field: "Gullfaks", status: "shut-in" },
  { id: "c7", name: "33/9-C-7", field: "Statfjord", status: "drilling" },
  { id: "d2", name: "34/7-D-2", field: "Snorre", status: "producing" },
  { id: "e9", name: "34/7-E-9", field: "Snorre", status: "shut-in" },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
      { value: "drilling", label: "Drilling", variant: "info" },
    ],
  },
])

/** The table's toolbar, which the action bar replaces while rows are selected. */
function WellsToolbar() {
  const { value, rowCount, clearSelection } = useDataTable<Well>()

  return (
    <div className="grid min-h-11 items-center">
      {value.length > 0 ? (
        <ActionBar
          placement="toolbar"
          aria-label="Selected wells"
          onOpenChange={(open) => {
            if (!open) clearSelection()
          }}
        >
          <ActionBarSelection
            count={value.length}
            total={rowCount}
            onClear={clearSelection}
          />
          <ActionBarActions aria-label="Selection actions">
            <OverflowItem
              value="assign"
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
              value="tag"
              label="Add tag"
              icon={<TagIcon />}
              priority={1}
            >
              <Button variant="outline" size="sm">
                <TagIcon data-icon="inline-start" />
                <OverflowLabel>Add tag</OverflowLabel>
              </Button>
            </OverflowItem>
            <OverflowItem value="export" label="Export" icon={<DownloadIcon />}>
              <Button variant="outline" size="sm">
                <DownloadIcon data-icon="inline-start" />
                <OverflowLabel>Export</OverflowLabel>
              </Button>
            </OverflowItem>
            <OverflowItem
              value="archive"
              label="Archive"
              icon={<ArchiveIcon />}
            >
              <Button variant="outline" size="sm">
                <ArchiveIcon data-icon="inline-start" />
                <OverflowLabel>Archive</OverflowLabel>
              </Button>
            </OverflowItem>
            <OverflowDivider />
            <OverflowItem
              value="delete"
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
        <DataTableToolbar>
          <DataTableSearch
            placeholder="Filter wells"
            aria-label="Filter wells"
          />
          <OverflowSpacer />
          <Button variant="outline" size="sm">
            New well
          </Button>
        </DataTableToolbar>
      )}
    </div>
  )
}

export default function ActionBarDemo() {
  return (
    <DataTable
      items={wells}
      columns={columns}
      selectionMode="multiple"
      defaultValue={["a12", "c7"]}
      filterable
      className="w-full max-w-3xl"
    >
      <WellsToolbar />
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}
