"use client"

import * as React from "react"
import { DownloadIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableSearch,
  DataTableToolbar,
  useDataTable,
} from "@tecton/react/tecton/data-table"
import { OverflowSpacer } from "@tecton/react/tecton/overflow"

type Well = {
  id: string
  name: string
  operator: string
  depth: number
  spud: Date
}

const WELLS: Array<Well> = [
  {
    id: "a12",
    name: "34/10-A-12",
    operator: "Equinor",
    depth: 3250,
    spud: new Date(1987, 3, 2),
  },
  {
    id: "d2",
    name: "34/7-D-2",
    operator: "Equinor",
    depth: 2735,
    spud: new Date(1992, 8, 14),
  },
  {
    id: "c3",
    name: "2/8-C-3",
    operator: "Aker BP",
    depth: 2560,
    spud: new Date(1983, 0, 22),
  },
  {
    id: "e4",
    name: "6507/11-E-4",
    operator: "Equinor",
    depth: 4120,
    spud: new Date(2001, 5, 9),
  },
]

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "operator", header: "Operator" },
  { id: "depth", header: "TD (m)", type: "number" },
  { id: "spud", header: "Spud date", type: "date" },
])

/** Downloads the rows the view matches as a CSV file. */
function ExportButton() {
  const { exportCsv } = useDataTable<Well>()
  const [busy, setBusy] = React.useState(false)
  const download = async () => {
    setBusy(true)
    try {
      // A byte order mark, for Excel to read the file as UTF-8.
      const text = await exportCsv({ bom: true })
      const url = URL.createObjectURL(
        new Blob([text], { type: "text/csv;charset=utf-8" })
      )
      const link = document.createElement("a")
      link.href = url
      link.download = "wells.csv"
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={download}>
      <DownloadIcon aria-hidden />
      Export CSV
    </Button>
  )
}

export default function DataTableExport() {
  return (
    <DataTable items={WELLS} columns={columns} filterable className="w-full">
      <DataTableToolbar>
        <DataTableSearch />
        <OverflowSpacer />
        <ExportButton />
      </DataTableToolbar>
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}
