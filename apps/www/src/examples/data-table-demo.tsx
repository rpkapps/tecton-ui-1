"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import {
  createColumns,
  DataTable,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
  DataTableActionBar,
  DataTableFooter,
  DataTablePagination,
  DataTableSearch,
  DataTableToolbar,
  useDataTable,
} from "@tecton/react/tecton/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "injecting" | "shut-in" | "drilling"
  depth: number
  spud: Date
}

const FIELDS = [
  { field: "Gullfaks", block: "34/10" },
  { field: "Snorre", block: "34/7" },
  { field: "Valhall", block: "2/8" },
  { field: "Balder", block: "25/11" },
  { field: "Ekofisk", block: "2/4" },
] as const
const STATUSES: Array<Well["status"]> = [
  "producing",
  "producing",
  "injecting",
  "shut-in",
  "drilling",
]

/** 48 wells, the same on every render. */
const WELLS: Array<Well> = Array.from({ length: 48 }, (_, i) => {
  const { field, block } = FIELDS[i % FIELDS.length]
  return {
    id: `w${i + 1}`,
    name: `${block}-${String.fromCharCode(65 + (i % 4))}-${Math.floor(i / 5) + 1}`,
    field,
    status: STATUSES[(i * 7) % STATUSES.length],
    depth: 1850 + ((i * 433) % 3200),
    spud: new Date(
      Date.UTC(2008 + (i % 15), (i * 5) % 12, 1 + ((i * 11) % 27))
    ),
  }
})

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "injecting", label: "Injecting", variant: "info" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
      { value: "drilling", label: "Drilling", variant: "secondary" },
    ],
  },
  {
    id: "depth",
    header: "TD (m)",
    type: "number",
  },
  {
    id: "spud",
    header: "Spud date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
    hideBelow: "sm",
  },
])

/** An action on the selected rows, then clears the selection. */
function ShutInButton({
  onShutIn,
}: {
  onShutIn: (ids: ReadonlyArray<string>) => void
}) {
  const { value, clearSelection } = useDataTable<Well>()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        onShutIn(value)
        clearSelection()
      }}
    >
      Shut in
    </Button>
  )
}

export default function DataTableDemo() {
  const [wells, setWells] = React.useState(WELLS)

  return (
    <DataTable
      items={wells}
      columns={columns}
      selectionMode="multiple"
      pagination
      filterable
      className="w-full"
    >
      <span id="data-table-demo-title" className="font-medium">
        North Sea wells
      </span>
      <DataTableToolbar>
        <DataTableSearch />
        <DataTableFilter column="status" />
      </DataTableToolbar>
      <DataTableActiveFilters />
      <DataTableActionBar>
        <ShutInButton
          onShutIn={(ids) =>
            setWells((current) =>
              current.map((well) =>
                ids.includes(well.id) ? { ...well, status: "shut-in" } : well
              )
            )
          }
        />
      </DataTableActionBar>
      <DataTableContent aria-labelledby="data-table-demo-title" />
      <DataTableFooter>
        <DataTablePagination pageSizes={[10, 25, 50]} />
      </DataTableFooter>
    </DataTable>
  )
}
