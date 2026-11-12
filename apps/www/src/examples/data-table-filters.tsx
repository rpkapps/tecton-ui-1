"use client"

import {
  createColumns,
  DataTable,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
  DataTableSearch,
  DataTableToolbar,
} from "@tecton/react/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "injecting" | "shut-in" | "drilling" | null
  depth: number | null
  spud: Date | null
  subsea: boolean | null
}

const FIELDS = ["Gullfaks", "Snorre", "Valhall", "Åsgard", "Ekofisk"]
const STATUSES: Array<Well["status"]> = [
  "producing",
  "injecting",
  "producing",
  "shut-in",
  "drilling",
]

/**
 * 30 wells, the same on every render. Some are planned: no status, TD or
 * spud date yet, and one is not yet assigned a subsea flag.
 */
const WELLS: Array<Well> = Array.from({ length: 30 }, (_, i) => {
  const planned = i % 7 === 5
  return {
    id: `w${i + 1}`,
    name: `${["34/10", "34/7", "2/8", "6507/11", "2/4"][i % 5]}-${String.fromCharCode(65 + (i % 6))}-${Math.floor(i / 6) + 1}`,
    field: FIELDS[i % FIELDS.length],
    status: planned ? null : STATUSES[(i * 3) % STATUSES.length],
    depth: planned || i % 11 === 2 ? null : 1900 + ((i * 457) % 3100),
    spud: planned
      ? null
      : new Date(2012 + (i % 12), (i * 5) % 12, 1 + ((i * 7) % 27)),
    subsea: i === 12 ? null : i % 3 === 0,
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
  { id: "depth", header: "TD (m)", type: "number" },
  { id: "spud", header: "Spud date", type: "date" },
  { id: "subsea", header: "Subsea", type: "boolean" },
])

export default function DataTableFilters() {
  return (
    <DataTable
      items={WELLS}
      columns={columns}
      filterable
      defaultView={{
        filters: {
          status: { type: "options", values: ["producing"], empty: true },
        },
      }}
      className="w-full"
    >
      <DataTableToolbar>
        <DataTableSearch />
        <DataTableFilter column="status" />
        <DataTableFilter column="depth" />
        <DataTableFilter column="spud" />
        <DataTableFilter column="subsea" />
      </DataTableToolbar>
      <DataTableActiveFilters />
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}
