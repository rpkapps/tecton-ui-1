"use client"

import {
  createColumns,
  DataTable,
  DataTableCellSummary,
  DataTableContent,
  DataTableFooter,
} from "@tecton/react/tecton/data-table"

type Reading = {
  id: string
  well: string
  date: Date
  oil: number
  gas: number
  water: number
  pressure: number
}

/** 100,000 daily readings from a seeded generator: the same table on every render. */
const readings: Array<Reading> = Array.from({ length: 100_000 }, (_, i) => {
  const seed = (i * 2654435761) % 2 ** 32
  return {
    id: `r${i}`,
    well: `${30 + (i % 7)}/${1 + (i % 12)}-${String.fromCharCode(65 + (i % 26))}-${(i % 40) + 1}`,
    date: new Date(Date.UTC(2015, 0, 1 + Math.floor(i / 40))),
    oil: 200 + (seed % 2400),
    gas: 20 + ((seed >>> 4) % 260),
    water: (seed >>> 8) % 1500,
    pressure: 150 + ((seed >>> 12) % 90) / 2,
  }
})

const columns = createColumns<Reading>([
  { id: "well", header: "Well" },
  {
    id: "date",
    header: "Date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  { id: "oil", header: "Oil (Sm³)", type: "number" },
  { id: "gas", header: "Gas (kSm³)", type: "number" },
  { id: "water", header: "Water (m³)", type: "number" },
  {
    id: "pressure",
    header: "Wellhead (bar)",
    type: "number",
    format: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  },
])

export default function DataTableCellSelectionVirtual() {
  return (
    <DataTable
      items={readings}
      columns={columns}
      cellSelectionMode="range"
      className="h-96 w-full"
    >
      <DataTableContent aria-label="Daily readings" virtualized />
      <DataTableFooter>
        <DataTableCellSummary />
      </DataTableFooter>
    </DataTable>
  )
}
