"use client"

import {
  createColumns,
  DataTable,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
  DataTablePagination,
  DataTableFooter,
  DataTableSearch,
  DataTableToolbar,
} from "@tecton/react/data-table"

type Well = {
  id: string
  name: string
  field: string
  operator: string
  status: "producing" | "injecting" | "shut-in" | "drilling" | null
  depth: number | null
  spud: Date | null
  subsea: boolean | null
}

const FIELDS = ["Gullfaks", "Snorre", "Valhall", "Åsgard", "Ekofisk", "Oseberg"]
const OPERATORS = ["Equinor", "Aker BP", "ConocoPhillips", "Vår Energi"]
const STATUSES: Array<Well["status"]> = [
  "producing",
  "injecting",
  "producing",
  "shut-in",
  "drilling",
]

/** 120 wells, the same on every render; a few planned ones have no status, TD or spud date. */
const WELLS: Array<Well> = Array.from({ length: 120 }, (_, i) => {
  const planned = i % 13 === 5
  return {
    id: `w${i + 1}`,
    name: `${["34/10", "34/7", "2/8", "6507/11", "2/4", "30/9"][i % 6]}-${String.fromCharCode(65 + (i % 8))}-${Math.floor(i / 8) + 1}`,
    field: FIELDS[(i * 5) % FIELDS.length],
    operator: OPERATORS[(i * 7) % OPERATORS.length],
    status: planned ? null : STATUSES[(i * 3) % STATUSES.length],
    depth: planned || i % 17 === 2 ? null : 1500 + ((i * 457) % 3600),
    spud: planned
      ? null
      : new Date(2010 + (i % 16), (i * 5) % 12, 1 + ((i * 7) % 27)),
    subsea: i % 3 === 0,
  }
})

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  { id: "operator", header: "Operator" },
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
    header: "TD",
    type: "number",
    format: { style: "unit", unit: "meter", maximumFractionDigits: 0 },
  },
  { id: "spud", header: "Spud date", type: "date" },
  { id: "subsea", header: "Subsea", type: "boolean" },
])

export default function DataTablePowerSearch() {
  return (
    <DataTable
      items={WELLS}
      columns={columns}
      filterable
      pagination
      defaultView={{
        filters: {
          status: { type: "options", values: ["producing", "drilling"] },
          depth: { type: "number", min: 3000, minExclusive: true },
        },
      }}
      className="w-full"
    >
      <DataTableToolbar>
        <DataTableSearch syntax="query" />
        <DataTableFilter column="status" />
        <DataTableFilter column="depth" />
        <DataTableFilter column="spud" />
      </DataTableToolbar>
      <DataTableActiveFilters />
      <DataTableContent aria-label="Wells" />
      <DataTableFooter>
        <DataTablePagination />
      </DataTableFooter>
    </DataTable>
  )
}
