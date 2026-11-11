"use client"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFilter,
  DataTableToolbar,
} from "@tecton/react/tecton/data-table"

type Allocation = {
  id: string
  well: string
  field: string
  hours: number
  oil: number
  gas: number
  water: number
  flowing: boolean
}

const WELLS = [
  ["34/10-A-12", "Gullfaks"],
  ["34/10-B-3", "Gullfaks"],
  ["34/10-C-7", "Gullfaks"],
  ["34/7-D-2", "Snorre"],
  ["34/7-P-11", "Snorre"],
  ["2/8-C-3", "Valhall"],
  ["2/8-F-14", "Valhall"],
] as const

const ALLOCATIONS: Array<Allocation> = WELLS.map(([well, field], i) => ({
  id: well,
  well,
  field,
  hours: [24, 18.5, 24, 22, 0, 24, 12][i],
  oil: [1840, 920, 1210, 2310, 0, 1460, 640][i],
  gas: [212, 104, 133, 158, 0, 241, 88][i],
  water: [960, 1210, 430, 640, 0, 180, 520][i],
  flowing: [true, true, true, true, false, true, false][i],
}))

const columns = createColumns<Allocation>([
  { id: "well", header: "Well", width: 140 },
  { id: "field", header: "Field", width: 120 },
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
  {
    id: "flowing",
    header: "Flowing",
    type: "boolean",
    width: 130,
    renderAggregate: (value) => `${String(value)} flowing`,
  },
])

export default function DataTableTotals() {
  return (
    <DataTable
      items={ALLOCATIONS}
      columns={columns}
      filterable
      pinnableColumns
      defaultView={{ columns: { pinned: { start: ["well"] } } }}
      className="w-full"
    >
      <DataTableToolbar>
        <DataTableFilter column="field" />
      </DataTableToolbar>
      <DataTableContent aria-label="Daily allocation" totals />
    </DataTable>
  )
}
