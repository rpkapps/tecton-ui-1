"use client"

import * as React from "react"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

type Reading = {
  id: string
  time: Date
  well: string
  pressure: number
  temperature: number
}

const WELLS = ["34/10-A-12", "34/7-D-2", "2/8-C-3"]
const BATCH = 100
const TOTAL = 1000
const START = Date.UTC(2026, 9, 1)

/** One batch of gauge readings after `from`, as a server would page them. */
function readings(from: number): Array<Reading> {
  return Array.from({ length: BATCH }, (_, i) => {
    const n = from + i
    return {
      id: `r${n}`,
      time: new Date(START + n * 15 * 60_000),
      well: WELLS[n % WELLS.length],
      pressure: 182 + ((n * 37) % 41) / 10,
      temperature: 91 + ((n * 13) % 29) / 10,
    }
  })
}

const columns = createColumns<Reading>([
  {
    id: "time",
    header: "Time (UTC)",
    type: "date",
    format: { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" },
  },
  { id: "well", header: "Well" },
  {
    id: "pressure",
    header: "Downhole pressure (bar)",
    type: "number",
    format: { minimumFractionDigits: 1 },
  },
  {
    id: "temperature",
    header: "Temperature (°C)",
    type: "number",
    format: { minimumFractionDigits: 1 },
  },
])

export default function DataTableLoadMore() {
  const [rows, setRows] = React.useState(() => readings(0))
  const [loading, setLoading] = React.useState(false)
  const loadMore = React.useCallback(() => {
    setLoading(true)
    // A request to the server, answered after a moment.
    setTimeout(() => {
      setRows((current) => [...current, ...readings(current.length)])
      setLoading(false)
    }, 600)
  }, [])
  return (
    <DataTable
      items={rows}
      columns={columns}
      sortable={false}
      loading={loading}
      hasMore={rows.length < TOTAL}
      onLoadMore={loadMore}
      className="h-96 w-full"
    >
      <DataTableContent aria-label="Gauge readings" virtualized />
    </DataTable>
  )
}
