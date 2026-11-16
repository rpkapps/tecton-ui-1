"use client"

import {
  createColumns,
  DataTable,
  DataTableActionBar,
  DataTableContent,
} from "@tecton/react/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "injecting" | "shut-in" | "drilling"
  depth: number
  spud: Date
}

const FIELDS = [
  "Gullfaks",
  "Statfjord",
  "Snorre",
  "Oseberg",
  "Troll",
  "Heidrun",
]
const STATUSES: Array<Well["status"]> = [
  "producing",
  "injecting",
  "shut-in",
  "drilling",
]

/** 10,000 wells from a seeded generator: the same table on every render. */
const wells: Array<Well> = Array.from({ length: 10_000 }, (_, i) => {
  const seed = (i * 2654435761) % 2 ** 32
  return {
    id: `w${i}`,
    name: `${30 + (i % 7)}/${1 + (i % 12)}-${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
    field: FIELDS[seed % FIELDS.length],
    status: STATUSES[(seed >>> 3) % STATUSES.length],
    depth: 1200 + (seed % 3800),
    spud: new Date(Date.UTC(1980 + (seed % 45), (seed >>> 5) % 12, 1)),
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
  {
    id: "spud",
    header: "Spud",
    type: "date",
    format: { year: "numeric", month: "short", timeZone: "UTC" },
  },
])

export default function DataTableVirtual() {
  return (
    <DataTable
      items={wells}
      columns={columns}
      selectionMode="multiple"
      size="sm"
      striped
      // A bounded height: the table scrolls in the space the footer leaves.
      className="h-96 w-full"
    >
      <DataTableActionBar />
      <DataTableContent aria-label="Wells" virtualized />
    </DataTable>
  )
}
