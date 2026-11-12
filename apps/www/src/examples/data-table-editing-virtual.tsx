"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableContent,
  type DataTableCellChange,
} from "@tecton/react/tecton/data-table"

type Reading = {
  id: string
  well: string
  date: Date
  choke: "open" | "throttled" | "closed"
  oil: number
  water: number
  tested: boolean
}

/** 100,000 daily readings from a seeded generator. */
const INITIAL: Array<Reading> = Array.from({ length: 100_000 }, (_, i) => {
  const seed = (i * 2654435761) % 2 ** 32
  return {
    id: `r${i}`,
    well: `${30 + (i % 7)}/${1 + (i % 12)}-${String.fromCharCode(65 + (i % 26))}-${(i % 40) + 1}`,
    date: new Date(Date.UTC(2015, 0, 1 + Math.floor(i / 40))),
    choke: (["open", "throttled", "closed"] as const)[seed % 3],
    oil: 200 + (seed % 2400),
    water: (seed >>> 8) % 1500,
    tested: seed % 5 === 0,
  }
})

const columns = createColumns<Reading>([
  { id: "well", header: "Well", editable: false },
  {
    id: "date",
    header: "Date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  {
    id: "choke",
    header: "Choke",
    type: "options",
    options: [
      { value: "open", label: "Open", variant: "success" },
      { value: "throttled", label: "Throttled", variant: "warning" },
      { value: "closed", label: "Closed", variant: "secondary" },
    ],
  },
  { id: "oil", header: "Oil (Sm³)", type: "number" },
  { id: "water", header: "Water (m³)", type: "number" },
  { id: "tested", header: "Tested", type: "boolean" },
])

/** Each change applied to its reading, by index: 100,000 rows copied once per save. */
function apply(
  current: ReadonlyArray<Reading>,
  changes: ReadonlyArray<DataTableCellChange<Reading>>
) {
  const next = [...current]
  for (const change of changes) {
    const index = Number(change.row.slice(1))
    next[index] = { ...next[index], [change.column]: change.value }
  }
  return next
}

export default function DataTableEditingVirtual() {
  const [readings, setReadings] = React.useState(INITIAL)
  return (
    <DataTable
      items={readings}
      columns={columns}
      editable
      cellSelectionMode="range"
      size="sm"
      defaultView={{ columns: { pinned: { start: ["well", "date"] } } }}
      onCellsChange={(changes) =>
        setReadings((current) => apply(current, changes))
      }
      className="h-96 w-full"
    >
      <DataTableContent aria-label="Daily readings" virtualized />
    </DataTable>
  )
}
