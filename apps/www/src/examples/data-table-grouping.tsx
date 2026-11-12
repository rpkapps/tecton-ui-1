"use client"

import {
  createColumns,
  DataTable,
  DataTableActionBar,
  DataTableContent,
  DataTableGroupBy,
  DataTableToolbar,
} from "@tecton/react/data-table"

type Allocation = {
  id: string
  well: string
  field: string
  installation: string
  status: "producing" | "injecting" | "shut-in"
  hours: number
  oil: number
  gas: number
  water: number
}

const WELLS = [
  ["34/10-A-12", "Gullfaks", "Gullfaks A", "producing"],
  ["34/10-A-17", "Gullfaks", "Gullfaks A", "producing"],
  ["34/10-A-23", "Gullfaks", "Gullfaks A", "injecting"],
  ["34/10-B-3", "Gullfaks", "Gullfaks B", "producing"],
  ["34/10-B-9", "Gullfaks", "Gullfaks B", "shut-in"],
  ["34/10-C-7", "Gullfaks", "Gullfaks C", "producing"],
  ["34/7-D-2", "Snorre", "Snorre A", "producing"],
  ["34/7-D-6", "Snorre", "Snorre A", "injecting"],
  ["34/7-P-11", "Snorre", "Snorre B", "shut-in"],
  ["34/7-P-14", "Snorre", "Snorre B", "producing"],
  ["2/8-C-3", "Valhall", "Valhall PH", "producing"],
  ["2/8-F-14", "Valhall", "Valhall Flank", "producing"],
  ["2/8-F-19", "Valhall", "Valhall Flank", "injecting"],
] as const

const ALLOCATIONS: Array<Allocation> = WELLS.map(
  ([well, field, installation, status], i) => {
    const flowing = status === "producing"
    return {
      id: well,
      well,
      field,
      installation,
      status,
      hours: status === "shut-in" ? 0 : [24, 22.5, 24, 18, 24, 21][i % 6],
      oil: flowing ? 600 + ((i * 787) % 1900) : 0,
      gas: flowing ? 60 + ((i * 53) % 190) : 0,
      water: status === "shut-in" ? 0 : 150 + ((i * 331) % 1100),
    }
  }
)

const columns = createColumns<Allocation>([
  { id: "well", header: "Well", width: 140 },
  { id: "field", header: "Field", width: 120 },
  { id: "installation", header: "Installation", width: 150 },
  {
    id: "status",
    header: "Status",
    type: "options",
    width: 130,
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "injecting", label: "Injecting", variant: "info" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
    ],
  },
  {
    id: "hours",
    header: "On stream (h)",
    type: "number",
    format: { maximumFractionDigits: 1 },
    // Hours do not add up across wells: the mean instead.
    aggregate: "avg",
    width: 140,
  },
  { id: "oil", header: "Oil (Sm³)", type: "number", width: 130 },
  { id: "gas", header: "Gas (kSm³)", type: "number", width: 140 },
  { id: "water", header: "Water (m³)", type: "number", width: 140 },
])

export default function DataTableGrouping() {
  return (
    <DataTable
      items={ALLOCATIONS}
      columns={columns}
      groupable
      selectionMode="multiple"
      pinnableColumns
      defaultView={{
        grouping: ["field"],
        columns: { pinned: { start: ["well"] } },
      }}
      className="w-full"
    >
      <DataTableToolbar>
        <DataTableGroupBy />
      </DataTableToolbar>
      <DataTableActionBar />
      <DataTableContent aria-label="Daily allocation" totals />
    </DataTable>
  )
}
